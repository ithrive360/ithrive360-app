import { supabase } from '../supabaseClient';

export async function generateHealthInsight({ user_id, health_area }) {
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

    // ✅ Fetch user blood results with reference data
    const { data: bloodData, error: bloodError } = await supabase
      .from('user_blood_result')
      .select(`
        value,
        unit,
        marker:blood_marker_reference (
          marker_name,
          reference_range,
          health_area
        )
      `)
      .eq('user_id', user_id);

    if (bloodError) {
      console.error('[generateHealthInsight] Error fetching blood markers:', bloodError.message);
      throw new Error('Failed to load blood results.');
    }

    const filteredBlood = (bloodData || []).filter(
      entry => entry.marker?.health_area === health_area
    );

    const parsedBlood = filteredBlood.map(entry => {
      const rawValue = parseFloat(entry.value);
      const range = entry.marker?.reference_range;
      let status = 'Normal';

      if (range && rawValue !== undefined && !isNaN(rawValue)) {
        const [minStr, maxStr] = range.split('-').map(s => s.trim());
        const min = parseFloat(minStr);
        const max = parseFloat(maxStr);

        if (!isNaN(min) && !isNaN(max)) {
          if (rawValue < min) status = 'Low';
          else if (rawValue > max) status = 'High';
        }
      }

      return {
        marker: entry.marker?.marker_name,
        value: entry.value,
        type: 'blood',
        status,
        reference_range: entry.marker?.reference_range,
      };
    });

    // ✅ Fetch user DNA results with rsid added
    const { data: dnaData, error: dnaError } = await supabase
      .from('user_dna_result')
      .select(`
        value,
        marker:dna_marker_reference (
          rsid,
          trait,
          interpretation,
          gpt_instruction,
          health_area
        )
      `)
      .eq('user_id', user_id);

    if (dnaError) {
      console.error('[generateHealthInsight] Error fetching DNA traits:', dnaError.message);
      throw new Error('Failed to load DNA results.');
    }

    const filteredDNA = (dnaData || []).filter(
      entry => entry.marker?.health_area === health_area
    );

    const parsedDNA = filteredDNA.map(m => ({
      rsid: m.marker?.rsid,
      marker: m.marker?.trait,
      value: m.value,
      type: 'dna',
      effect: m.marker?.interpretation,
      gpt_instruction: m.marker?.gpt_instruction,
    }));

    const markers = [...parsedBlood, ...parsedDNA];

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
      gpt_response: result.gpt_response,
      gpt_response_raw: result.gpt_response_raw, // ✅ included
    };
  } catch (err) {
    console.error('[generateHealthInsight] GPT call failed:', err);
    return { success: false, error: err.message };
  }
}
