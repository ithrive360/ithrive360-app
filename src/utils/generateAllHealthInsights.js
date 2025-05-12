import { supabase } from '../supabaseClient';
import { generateHealthInsight } from './generateHealthInsight';

export async function generateAllHealthInsights(user_id) {
  try {
    const { data: areas, error: areasError } = await supabase
      .from('health_area_reference')
      .select('health_area_id');

    if (areasError || !areas) {
      console.error('[generateAllHealthInsights] Failed to fetch health areas:', areasError?.message);
      return false;
    }

    let successCount = 0;

    for (const area of areas) {
      const area_id = area.health_area_id;
      console.log(`▶ Generating insight for ${area_id}...`);

      const result = await generateHealthInsight({ user_id, health_area: area_id });

      if (!result.success) {
        console.error(`❌ GPT generation failed for ${area_id}:`, result.error);
        continue;
      }

      let parsed;
      try {
        parsed = JSON.parse(result.gpt_response || '{}');
      } catch (err) {
        console.error(`❌ Failed to parse GPT response for ${area_id}:`, err.message);
        console.log('[RAW GPT RESPONSE]', result.gpt_response);
        continue;
      }

      console.log(`[${area_id}] Parsed summary:`, parsed.summary);
      console.log(`[${area_id}] Blood markers:`, parsed.blood_markers?.length ?? 0);
      console.log(`[${area_id}] DNA traits:`, parsed.dna_traits?.length ?? 0);

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

      console.log(`[${area_id}] Insert payload:`, insertPayload);

      const { error: insertError } = await supabase
        .from('user_health_insight')
        .upsert(insertPayload, {
          onConflict: ['user_id', 'health_area_id'],
          returning: 'minimal'
        });

      if (insertError) {
        console.error(`❌ DB insert failed for ${area_id}:`, insertError.message);
      } else {
        console.log(`✅ Insight saved for ${area_id}`);
        successCount++;
      }
    }

    console.log(`🎯 Total insights generated: ${successCount}`);
    return true;

  } catch (err) {
    console.error('[generateAllHealthInsights] Uncaught error:', err.message);
    return false;
  }
}
