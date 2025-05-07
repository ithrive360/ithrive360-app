import { supabase } from '../supabaseClient';

export async function generateHealthInsight({ user_id, health_area, markers }) {
  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();

    const accessToken = session?.access_token;
    if (!accessToken) throw new Error('User is not authenticated');

    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:54321/functions/v1'
        : 'https://oqjblzxhfszvluhvfclv.functions.supabase.co';

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

    const data = await response.json();

    return {
      success: true,
      input_json: data.input_json,
      prompt: data.prompt,
    };
  } catch (err) {
    console.error('GPT call failed:', err);
    return { success: false, error: err.message };
  }
}
