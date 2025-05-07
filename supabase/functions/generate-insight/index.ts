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

    // Your GPT logic or placeholder
    const result = `Generated insights for ${health_area} (${markers.length} markers)`;

    return new Response(JSON.stringify({ result }), {
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "https://ithrive360-app.vercel.app",
      },
    });
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
