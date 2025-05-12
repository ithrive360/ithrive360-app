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

    // ✅ Step 1: Fetch relevant blood marker IDs for this health area
    const { data: bloodMarkerLinks, error: bloodLinkError } = await supabase
      .from('blood_marker_health_area')
      .select('blood_marker_id')
      .eq('health_area_id', health_area);

    if (bloodLinkError) throw new Error('Failed to fetch blood marker links');

    const relevantBloodIds = bloodMarkerLinks.map(r => r.blood_marker_id);

    // ✅ Step 2: Fetch user blood results for those marker IDs
    let bloodResults = [];
    if (relevantBloodIds.length > 0) {
      const { data: bloodData } = await supabase
        .from('user_blood_result')
        .select(`
          value,
          marker_id,
          blood_marker_reference:marker_id (
            marker_name,
            reference_range
          )
        `)
        .eq('user_id', user_id)
        .in('marker_id', relevantBloodIds);

      bloodResults = bloodData || [];
    }

    const parsedBlood = bloodResults.map(entry => {
      const rawValue = parseFloat(entry.value);
      const range = entry.blood_marker_reference?.reference_range;
      let status = 'Normal';

      if (range && !isNaN(rawValue)) {
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

    // ✅ Step 3: Fetch relevant DNA marker IDs for this health area
    const { data: dnaMarkerLinks, error: dnaLinkError } = await supabase
      .from('dna_marker_health_area')
      .select('dna_id')
      .eq('health_area_id', health_area);

    if (dnaLinkError) throw new Error('Failed to fetch DNA marker links');

    const relevantDNAIds = dnaMarkerLinks.map(r => r.dna_id);

    // ✅ Step 4: Fetch user DNA results in batches (chunked .in() query)
    const dnaBatchSize = 50;
    let dnaResults = [];

    for (let i = 0; i < relevantDNAIds.length; i += dnaBatchSize) {
      const batch = relevantDNAIds.slice(i, i + dnaBatchSize);
      const { data: dnaData, error: batchError } = await supabase
        .from('user_dna_result')
        .select(`
          value,
          dna_id,
          dna_marker_reference:dna_id (
            trait,
            rsid,
            effect
          )
        `)
        .eq('user_id', user_id)
        .in('dna_id', batch);

      if (batchError) {
        console.error(`Failed to fetch DNA batch ${i / dnaBatchSize + 1}:`, batchError.message);
        continue;
      }

      dnaResults = dnaResults.concat(dnaData || []);
    }

    const parsedDNA = dnaResults.map(m => ({
      rsid: m.dna_marker_reference?.rsid,
      marker: m.dna_marker_reference?.trait,
      value: m.value,
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

    if (!result?.gpt_response || typeof result.gpt_response !== 'string') {
      throw new Error('Invalid or empty GPT response');
    }

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
