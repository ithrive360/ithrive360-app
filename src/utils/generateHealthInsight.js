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

    // ✅ Fetch and filter blood markers by health area
    const { data: bloodResults } = await supabase
      .from('user_blood_result')
      .select(`
        value,
        marker_id,
        blood_marker_reference:marker_id (
          marker_name,
          reference_range,
          blood_marker_health_area (
            health_area_id
          )
        )
      `)
      .eq('user_id', user_id);

    const filteredBlood = (bloodResults || []).filter(row =>
      row.blood_marker_reference?.blood_marker_health_area?.some(h => h.health_area_id === health_area)
    );

    const parsedBlood = filteredBlood.map(entry => {
      const rawValue = parseFloat(entry.value);
      const range = entry.blood_marker_reference?.reference_range;
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
        marker: entry.blood_marker_reference?.marker_name,
        value: entry.value,
        type: 'blood',
        status,
        reference_range: entry.blood_marker_reference?.reference_range,
      };
    });

    // ✅ Fetch and filter DNA traits by health area
    const { data: dnaResults } = await supabase
      .from('user_dna_result')
      .select(`
        genotype,
        dna_id,
        dna_marker_reference:dna_id (
          trait_name,
          rsid,
          effect,
          dna_marker_health_area (
            health_area_id
          )
        )
      `)
      .eq('user_id', user_id);

    const filteredDNA = (dnaResults || []).filter(row =>
      row.dna_marker_reference?.dna_marker_health_area?.some(h => h.health_area_id === health_area)
    );

    const parsedDNA = filteredDNA.map(m => ({
      rsid: m.dna_marker_reference?.rsid,
      marker: m.dna_marker_reference?.trait_name,
      value: m.genotype,
      type: 'dna',
      effect: m.dna_marker_reference?.effect,
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
    };
  } catch (err) {
    console.error('[generateHealthInsight] GPT call failed:', err);
    return { success: false, error: err.message };
  }
}
