import "@supabase/functions-js/edge-runtime.d.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // 1. Handle CORS Preflight Requests from the browser
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Extract frontend parameters
    const { endpoint, token } = await req.json()

    if (!endpoint || !token) {
      return new Response(JSON.stringify({ error: 'Missing endpoint or token' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 3. Make Server-to-Server API Call to Fitbit
    const fitbitResponse = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept-Language': 'en_US'
      }
    });

    // 4. Handle Fitbit 401 Unauthorized Tokens
    if (fitbitResponse.status === 401) {
      return new Response(JSON.stringify({ error: 'fitbit_token_expired', fitbitStatus: 401 }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 5. Pass true response back to frontend
    const data = await fitbitResponse.json();
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });

  } catch (error) {
    console.error("Proxy Error:", error.message);
    return new Response(JSON.stringify({ error: error.message, proxyError: true }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
})
