import { supabase } from '../supabaseClient';

export async function generateHealthInsight({ user_id }) {
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

    const health_area = 'cardiovascular';

    // ✅ Corrected blood marker fetch with join on blood_marker_reference
    const { data: bloodData, error: bloodError } = await supabase
      .from('user_blood_result')
      .select(`
        value,
        unit,
        marker:marker_id (
          name,
          status,
          reference_range,
          health_area
        )
      `)
      .eq('user_id', user_id);

    if (bloodError) {
      console.error('[generateHealthInsight] Error fetching blood markers:', bloodError.message);
      throw new Error('Failed to load blood results.');
    }

    // ✅ Filter only markers for this health area
    const filteredBlood = (bloodData || []).filter(entry => entry.marker?.health_area === health_area);

    // ✅ Dynamically fetch DNA traits (this table schema was already correct)
    const { data: dnaData, error: dnaError } = await supabase
      .from('dna_result')
      .select('trait_name, genotype, effect')
      .eq('user_id', user_id)
      .eq('health_area', health_area);

    if (dnaError) {
      console.error('[generateHealthInsight] Error fetching DNA traits:', dnaError.message);
      throw new Error('Failed to load DNA results.');
    }

    const markers = [
      ...(filteredBlood?.map(m => ({
        marker: m.marker?.name,
        value: m.value,
        type: 'blood',
        status: m.marker?.status,
        reference_range: m.marker?.reference_range,
      })) || []),
      ...(dnaData?.map(m => ({
        marker: m.trait_name,
        value: m.genotype,
        type: 'dna',
        effect: m.effect,
      })) || []),
    ];

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
