import { supabase } from '../lib/supabase';
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

      // ✅ Fix: Safely parse input_json whether string or object
      let parsedInput;
      try {
        parsedInput = typeof result.input_json === 'string'
          ? JSON.parse(result.input_json)
          : result.input_json;
      } catch (err) {
        console.error(`❌ Failed to parse marker JSON for ${area_id}:`, err.message);
        console.log('[RAW marker input_json]', result.input_json);
        continue;
      }

      const markers = [
        ...(parsedInput.blood_results || []).map(b => ({
          marker: b.marker_name,
          value: b.value,
          reference_range: b.reference_range,
          type: 'blood',
        })),
        ...(parsedInput.dna_results || []).map(d => ({
          marker: d.trait_name,
          rsid: d.rsid,
          value: d.genotype,
          effect: d.effect,
          type: 'dna',
        })),
      ];
      console.log(`✅ Parsed ${markers.length} markers for ${area_id}`);

      // ✅ Parse GPT response
      let parsed;
      if (typeof result.gpt_response === 'string') {
        try {
          parsed = JSON.parse(result.gpt_response);
          console.log(`[${area_id}] Parsed string GPT response`);
        } catch (err) {
          console.error(`❌ Failed to parse GPT response for ${area_id}:`, err.message);
          console.log('[RAW GPT RESPONSE]', result.gpt_response);
          continue;
        }
      } else if (typeof result.gpt_response === 'object' && result.gpt_response !== null) {
        parsed = result.gpt_response;
        console.log(`[${area_id}] Parsed object GPT response`);
      } else {
        console.error(`❌ Unexpected GPT response format for ${area_id}:`, typeof result.gpt_response);
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
