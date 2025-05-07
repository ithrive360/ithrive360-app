export async function generateHealthInsight({ user_id, health_area, markers }) {
    try {
      const baseUrl =
        process.env.NODE_ENV === 'development'
          ? 'http://localhost:54321/functions/v1'
          : 'https://oqjblzxhfszvluhvfclv.functions.supabase.co';
  
      const response = await fetch(`${baseUrl}/generate-insight`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({ user_id, health_area, markers }),
      });
  
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
  