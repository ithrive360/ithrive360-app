import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

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
    const { user_id, health_area, markers } = await req.json();

    // Separate blood and dna markers
    const blood_results = markers
      .filter((m: any) => m.type === "blood")
      .map((m: any) => ({
        marker_name: m.marker,
        value: m.value,
        reference_range: m.reference_range || null,
      }));

    const dna_results = markers
      .filter((m: any) => m.type === "dna")
      .map((m: any) => ({
        trait_name: m.marker,
        rsid: m.rsid || null,
        genotype: m.value,
        effect: m.effect || null,
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

dna_results: key DNA traits related to the health area, including their rsID identifiers

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
    { 
      "trait_name": "...", 
      "rsid": "...",
      "effect": "...", 
      "insight": "..." 
    }
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
