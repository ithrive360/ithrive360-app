import { generateHealthInsight } from './generateHealthInsight';
import { supabase } from '../supabaseClient';

export async function generateAllHealthInsights(user_id) {
  // Fetch health areas dynamically
  const { data: healthAreas, error } = await supabase
    .from('health_area_reference')
    .select('health_area_id');

  if (error) {
    console.error('Failed to fetch health areas:', error.message);
    return [{ success: false, error: error.message }];
  }

  const results = [];

  for (const area of healthAreas) {
    const health_area_id = area.health_area_id;

    try {
      const result = await generateHealthInsight({ user_id, health_area: health_area_id });

      if (!result.success) {
        results.push({ health_area_id, success: false, error: result.error });
        continue;
      }

      const parsed = JSON.parse(result.gpt_response);

      const insertPayload = {
        user_id,
        health_area_id,
        summary: parsed.summary || '',
        findings_json: {
          blood_markers: parsed.blood_markers || [],
          dna_traits: parsed.dna_traits || []
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
        results.push({ health_area_id, success: false, error: insertError.message });
      } else {
        results.push({ health_area_id, success: true });
      }

    } catch (err) {
      results.push({ health_area_id, success: false, error: err.message });
    }
  }

  return results;
}
