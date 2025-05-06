import { serve } from 'https://deno.land/std@0.177.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';
import OpenAI from 'https://esm.sh/openai@4.24.0';

serve(async (req) => {
  const { user_id, health_area, markers } = await req.json();

  if (!user_id || !health_area || !markers) {
    return new Response(
      JSON.stringify({ error: 'Missing required fields' }),
      { status: 400 }
    );
  }

  const openai = new OpenAI({
    apiKey: Deno.env.get('OPENAI_API_KEY'),
  });

  const prompt = `
You are a health assistant. Using the following data, analyze the user's health for the area "${health_area}".
Provide a summary, interpret relevant markers (DNA or blood), and give clear recommendations.

Markers:
${JSON.stringify(markers, null, 2)}

Output the result in a JSON format like:
{
  "summary": "...",
  "insights": [
    {
      "marker": "...",
      "type": "blood" or "dna",
      "effect": "...",
      "insight": "..."
    },
    ...
  ],
  "recommendations": [
    {
      "category": "diet" | "exercise" | "lifestyle" | "supplementation",
      "recommendation": "..."
    },
    ...
  ]
}
`;

  try {
    const chatResponse = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: 'You are a health and genetics expert.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.7
    });

    const reply = chatResponse.choices[0]?.message?.content;

    return new Response(JSON.stringify({ result: reply }), {
      headers: { 'Content-Type': 'application/json' }
    });

  } catch (err) {
    console.error('OpenAI call failed:', err);
    return new Response(JSON.stringify({ error: 'OpenAI call failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
});
