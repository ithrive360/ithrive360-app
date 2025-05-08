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
- For each blood marker or DNA trait, assign it a category: "strength", "warning", or "risk".
  - "strength" = clearly beneficial or optimal result/genetic trait
  - "warning" = borderline, mild elevation, or requires monitoring
  - "risk" = clearly suboptimal value or trait with significant health impact
- Add a new field called "category" to each insight object with one of these three values.
- Provide 1–3 specific, practical recommendations for each of the following categories:
  - Diet
  - Supplementation
  - Exercise
  - Lifestyle
  - Monitoring (if applicable)
- Keep recommendations short and actionable.
- If a category has no relevant advice, omit it from the output.
- Only respond with the JSON output. No explanation or text outside the JSON block.

Return format (strict):

{
  "health_area": "{Health Area Name}",
  "summary": "{Short overview}",
  "blood_markers": [
    { "marker_name": "...", "status": "Normal/High/Low", "category": "strength/warning/risk", "insight": "..." }
  ],
  "dna_traits": [
    { 
      "trait_name": "...", 
      "rsid": "...",
      "effect": "...", 
      "category": "strength/warning/risk",
      "insight": "..." 
    }
  ],
  "recommendations": {
    "Diet": ["..."],
    "Supplementation": ["..."],
    "Exercise": ["..."],
    "Lifestyle": ["..."],
    "Monitoring": ["..."]
  }
}

JSON to analyze:
${JSON.stringify(input_json, null, 2)}
    `.trim();

    // 🔥 Call GPT-4o with the prompt
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${Deno.env.get("OPENAI_API_KEY")}`,
      },
      body: JSON.stringify({
        model: "gpt-4o",
        temperature: 0.7,
        messages: [
          { role: "system", content: "You are a helpful health assistant." },
          { role: "user", content: prompt },
        ],
      }),
    });

    if (!openaiResponse.ok) {
      const errText = await openaiResponse.text();
      throw new Error(`OpenAI API error: ${errText}`);
    }

    const gptData = await openaiResponse.json();
    console.log("GPT raw response:", JSON.stringify(gptData, null, 2)); // ✅ log raw response

    const gpt_response = gptData.choices?.[0]?.message?.content || "";
    console.log("Parsed GPT content:", gpt_response); // ✅ log parsed content

    return new Response(
      JSON.stringify({
        success: true,
        input_json,
        prompt,
        gpt_response,
      }),
      {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "https://ithrive360-app.vercel.app",
        },
      }
    );
  } catch (error) {
    console.error("Handler error:", error); // ✅ log full error if caught
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://ithrive360-app.vercel.app",
      },
    });
  }
});
