export async function generateHealthInsight(promptText) {
    try {
      const response = await fetch('/functions/v1/generate-insight', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(promptText),
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
  