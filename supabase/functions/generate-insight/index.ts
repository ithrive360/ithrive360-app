import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    // 🔄 Fetch blood markers for this health area
    const { data: bloodData, error: bloodError } = await supabase
      .from("user_blood_result")
      .select(`
        value,
        unit,
        marker:marker_id (
          blood_marker_id,
          name,
          status,
          reference_range,
          health_area
        )
      `)
      .eq("user_id", user_id);

    if (bloodError) {
      console.error("[generateHealthInsight] Error fetching blood markers:", bloodError.message);
      throw new Error("Failed to load blood results.");
    }

    const filteredBlood = bloodData
      .filter((entry: any) => entry.marker?.health_area === health_area)
      .map((entry: any) => ({
        marker_name: entry.marker?.name,
        value: entry.value,
        status: entry.marker?.status || "Normal",
        reference_range: entry.marker?.reference_range || null,
      }));

    // 🧬 Dummy DNA data
    const dna_results = [
      {
        trait_name: "rs12345",
        genotype: "AA",
        effect: null,
      }
    ];

    const input_json = {
      user_id,
      health_area,
      timestamp: new Date().toISOString(),
      blood_results: filteredBlood,
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
