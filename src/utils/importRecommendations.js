// utils/importRecommendations.js
import { supabase } from '../lib/supabase';

export async function importUserRecommendations(user_id) {
  if (!user_id) return { success: false, message: 'No user_id provided.' };

  // 1. Fetch all insight rows for user
  const { data: insights, error } = await supabase
    .from('user_health_insight')
    .select('health_area_id, recommendations_json')
    .eq('user_id', user_id);

  if (error || !insights?.length) {
    return { success: false, message: 'No insights found or error loading.' };
  }

  const inserts = [];

  for (const row of insights) {
    const { health_area_id, recommendations_json } = row;

    if (!recommendations_json) continue;

    for (const category of Object.keys(recommendations_json)) {
      const items = recommendations_json[category];

      for (const item of items) {
        inserts.push({
          user_id,
          health_area_id,
          category,
          recommendation: item.text,
          priority: item.priority || 'medium',
          quantity: null, // placeholder — you can parse later
          frequency: null,
          source: 'parsed', // mark this batch
          is_selected: item.priority === 'high', // auto-enable high priority
        });
      }
    }
  }

  if (!inserts.length) return { success: false, message: 'No recommendations to insert.' };

  const { error: insertError } = await supabase.from('user_recommendation').insert(inserts);

  if (insertError) {
    return { success: false, message: 'Insert failed.', error: insertError };
  }

  return { success: true, count: inserts.length };
}
