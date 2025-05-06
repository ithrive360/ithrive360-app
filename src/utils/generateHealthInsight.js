// wherever you initialize your supabase client
import { supabase } from '../lib/supabaseClient';

export async function generateHealthInsight({ user_id, health_area, markers }) {
  try {
    // 1) grab the current user session (contains the real JWT)
    const {
      data: { session },
      error: sessionError
    } = await supabase.auth.getSession();

    if (sessionError) {
      throw sessionError;
    }
    if (!session?.access_token) {
      throw new Error('Not authenticated');
    }

    const token = session.access_token;

    // 2) pick the correct base URL
    const baseUrl =
      process.env.NODE_ENV === 'development'
        ? 'http://localhost:54321/functions/v1'
        : process.env.NEXT_PUBLIC_SUPABASE_FUNCTION_URL;

    // 3) call your edge-function with both apikey and real JWT
    const response = await fetch(`${baseUrl}/generate-insight`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
        Authorization: `Bearer ${token}`
      },
      body: JSON.stringify({ user_id, health_area, markers })
    });

    // 4) ensure we got JSON back
    const contentType = response.headers.get('Content-Type') || '';
    if (!contentType.includes('application/json')) {
      throw new Error('Server did not return JSON');
    }

    const data = await response.json();
    return { success: true, result: data.result };
  } catch (err) {
    console.error('GPT call failed:', err);
    return { success: false, error: err.message };
  }
}
