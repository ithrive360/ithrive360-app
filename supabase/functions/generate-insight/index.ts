import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_ANON_KEY")!
);

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: {
        "Access-Control-Allow-Origin": "https://ithrive360-app.vercel.app",
        "Access-Control-Allow-Methods": "POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization, apikey",
      },
    });
  }

  try {
    const { user_id, health_area } = await req.json();

    // Step 1: Get health_area_id for the given health_area name
    const { data: healthAreaData, error: healthAreaError } = await supabase
      .from("health_area_reference")
      .select("health_area_id")
      .eq("health_area_name", health_area)
      .single();

    if (healthAreaError || !healthAreaData) {
      throw new Error("Invalid health area provided.");
    }

    const health_area_id = healthAreaData.health_area_id;

    // Step 2: Get relevant blood marker IDs
    const { data: bloodLinks } = await supabase
      .from("blood_marker_health_area")
      .select("blood_marker_id")
      .eq("health_area_id", health_area_id);

    const relevantBloodIds = bloodLinks.map((row) => row.blood_marker_id);

    // Step 3: Get relevant DNA marker IDs
    const { data: dnaLinks } = await supabase
      .from("dna_marker_health_area")
      .select("dna_id")
      .eq("health_area_id", health_area_id);

    const relevantDnaIds = dnaLinks.map((row) => row.dna_id);

    // Step 4: Fetch user blood results
    const { data: bloodResults } = await supabase
      .from("user_blood_result")
      .select("marker_id, value")
      .eq("user_id", user_id)
      .in("marker_id", relevantBloodIds);

    const blood_results = bloodResults.map((row) => ({
      marker_name: row.marker_id,
      value: row.value,
      status: "Normal", // Optional: you can replace with real logic
      reference_range: null,
    }));

    // Step 5: Fetch user DNA results
    const { data: dnaResults } = await supabase
      .from("user_dna_result")
      .select("dna_id, value")
      .eq("user_id", user_id)
      .in("dna_id", relevantDnaIds);

    const dna_results = dnaResults.map((row) => ({
      trait_name: row.dna_id,
      genotype: row.value,
      effect: null,
    }));

    // Step 6: Format input JSON
    const input_json = {
      user_id,
      health_area,
      timestamp: new Date().toISOString(),
      blood_results,
      dna_results,
    };

    const prompt = `
You are a health data assistant analyzing user health reports.

Below is a JSON object representing one health area. The object contains two sections:

blood_results: recent blood marker values and their reference ranges

dna_results: key DNA traits related to the health area

Analyze the information and produce structured insights.

Rules:
- Only reason based on the provided data. Do not invent any markers, traits, or effects.
- Keep each insight short and to the point (2–3 sentences max).
- Focus on identifying risks, strengths, or areas to monitor.
- Suggest specific lifestyle or supplement actions where relevant.
- If a blood result is "High" or "Low", it must be mentioned explicitly.
- If a DNA trait increases risk for a condition, mention it, but don't overstate.

Return format (strict):

{
  "health_area": "{Health Area Name}",
  "summary": "{Short overview}",
  "blood_markers": [
    { "marker_name": "...", "status": "Normal/High/Low", "insight": "..." }
  ],
  "dna_traits": [
    { "trait_name": "...", "effect": "...", "insight": "..." }
  ],
  "recommendations": [
    "..."
  ]
}

JSON to analyze:
${JSON.stringify(input_json, null, 2)}
    `.trim();

    return new Response(
      JSON.stringify({
        success: true,
        input_json,
        prompt,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://ithrive360-app.vercel.app",
        },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://ithrive360-app.vercel.app",
      },
    });
  }
});
