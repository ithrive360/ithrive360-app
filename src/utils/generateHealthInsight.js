import { supabase } from '../supabaseClient';

export async function generateHealthInsight({ user_id, health_area, markers }) {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error || !data?.session) {
      console.error('[generateHealthInsight] No active session found:', error?.message);
      throw new Error('Auth session missing. Please log in again.');
    }

    const accessToken = data.session.access_token;
    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:54321/functions/v1'
        : 'https://oqjblzxhfszvluhvfclv.functions.supabase.co';

    console.log('[generateHealthInsight] Input payload:', {
      user_id,
      health_area,
      markers,
    });

    const response = await fetch(`${baseUrl}/generate-insight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({ user_id, health_area, markers }),
    });

    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Server did not return JSON');
    }

    const result = await response.json();
    console.log('[generateHealthInsight] Raw response data:', result);

    return {
      success: true,
      input_json: result.input_json,
      prompt: result.prompt,
    };
  } catch (err) {
    console.error('[generateHealthInsight] GPT call failed:', err);
    return { success: false, error: err.message };
  }
}
