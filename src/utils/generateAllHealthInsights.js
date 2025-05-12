import { supabase } from '../supabaseClient';
import { generateHealthInsight } from './generateHealthInsight';

export async function generateAllHealthInsights(user_id) {
  try {
    // Get all health areas
    const { data: areas, error: areasError } = await supabase
      .from('health_area_reference')
      .select('id');

    if (areasError) {
      console.error('[generateAllHealthInsights] Failed to fetch health areas:', areasError.message);
      return;
    }

    for (const area of areas) {
      const area_id = area.id;
      console.log(`▶ Generating insight for ${area_id}...`);

      const result = await generateHealthInsight({ user_id, health_area: area_id });

      if (!result.success) {
        console.error(`❌ Failed for ${area_id}:`, result.error);
        continue;
      }

      const parsed = JSON.parse(result.gpt_response || '{}');

      const insertPayload = {
        user_id,
        health_area_id: area_id,
        summary: parsed.summary || '',
        findings_json: {
          blood_markers: parsed.blood_markers || [],
          dna_traits: parsed.dna_traits || [],
        },
        recommendations_json: parsed.recommendations || {},
        gpt_model: 'gpt-4o',
        prompt_version: 'v1',
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('user_health_insight')
        .upsert(insertPayload, { onConflict: ['user_id', 'health_area_id'] });

      if (insertError) {
        console.error(`❌ Failed to save ${area_id}:`, insertError.message);
      } else {
        console.log(`✅ Saved ${area_id} insight to DB.`);
      }
    }

    return true;
  } catch (err) {
    console.error('[generateAllHealthInsights] Unexpected error:', err);
    return false;
  }
}
