import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",  // Consider restricting this in production
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req: Request) => {
  // Handle preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Check if the request body is empty
    const text = await req.text();
    if (!text) {
      throw new Error("Request body is empty");
    }

    // Try to parse the JSON
    let requestData;
    try {
      requestData = JSON.parse(text);
    } catch (parseError) {
      console.error("JSON parse error:", parseError.message);
      console.error("Received text:", text);
      throw new Error(`Failed to parse request JSON: ${parseError.message}`);
    }

    // Validate required fields
    const { user_id, health_area, markers = [] } = requestData;
    
    if (!user_id) {
      throw new Error("Missing required field: user_id");
    }
    
    if (!health_area) {
      throw new Error("Missing required field: health_area");
    }

    console.log(`Processing request for user_id=${user_id}, health_area=${health_area}, markers.length=${markers.length}`);

    // If no markers are provided, we need to fetch them from the database
    if (markers.length === 0) {
      console.log("No markers provided in request. You need to fetch them from the database.");
      // Here you would normally fetch the markers data from Supabase
      // For now, returning a meaningful error
      return new Response(
        JSON.stringify({
          success: false,
          error: "No markers provided in request body. The 'markers' array is required.",
        }),
        {
          status: 400,
          headers: {
            ...corsHeaders,
            "Content-Type": "application/json",
          },
        }
      );
    }

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
  "health_area": "${health_area}",
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
    let gpt_response = gptData.choices?.[0]?.message?.content || "";

    // Clean up response - remove code block markdown if present
    gpt_response = gpt_response
      .trim()
      .replace(/^```json\s*\n?/, "")
      .replace(/^```\n?/, "")
      .replace(/```$/, "");

    // Validate the GPT response is valid JSON before returning
    try {
      JSON.parse(gpt_response);
    } catch (jsonError) {
      console.error("Invalid JSON in GPT response:", jsonError.message);
      console.error("Raw GPT response:", gpt_response);
      throw new Error("GPT returned invalid JSON");
    }

    return new Response(
      JSON.stringify({
        success: true,
        input_json: JSON.stringify(input_json),  // Convert to string for consistency
        prompt,
        gpt_response,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Handler error:", error.message);
    // Include more diagnostic information in the response
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message,
        details: "See function logs for more information"
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});