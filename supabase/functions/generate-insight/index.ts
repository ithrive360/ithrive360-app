import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const supabase = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
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

    // Fetch all blood markers relevant to this health area
    const { data: blood, error: bloodError } = await supabase
      .from("user_blood_result")
      .select(`
        marker_id,
        value,
        blood_marker_reference (
          marker_name,
          reference_range
        )
      `)
      .eq("user_id", user_id)
      .in("marker_id",
        supabase
          .from("blood_marker_health_area")
          .select("blood_marker_id")
          .eq("health_area_id", health_area)
      );

    if (bloodError) throw new Error("Failed to load blood results.");

    const blood_results = blood.map((b) => ({
      marker_name: b.blood_marker_reference.marker_name,
      value: b.value,
      status: "Normal", // placeholder; add real logic later
      reference_range: b.blood_marker_reference.reference_range,
    }));

    // Fetch all DNA markers relevant to this health area
    const { data: dna, error: dnaError } = await supabase
      .from("user_dna_result")
      .select(`
        value,
        dna_marker_reference (
          trait,
          rsid
        )
      `)
      .eq("user_id", user_id)
      .in("dna_id",
        supabase
          .from("dna_marker_health_area")
          .select("dna_id")
          .eq("health_area_id", health_area)
      );

    if (dnaError) throw new Error("Failed to load DNA results.");

    const dna_results = dna.map((d) => ({
      trait_name: d.dna_marker_reference.rsid || d.dna_marker_reference.trait,
      genotype: d.value,
      effect: null,
    }));

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
      JSON.stringify({ success: true, input_json, prompt }),
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
