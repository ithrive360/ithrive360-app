import { supabase } from '../lib/supabase';

/**
 * Logs a user meal entry to Supabase.
 * 
 * @param {Object} payload - Meal log details.
 * @param {string} payload.user_id - Supabase user ID
 * @param {string} payload.entry_type - 'barcode' | 'photo' | 'manual'
 * @param {string} [payload.barcode] - Optional barcode
 * @param {string} [payload.label] - Descriptive meal name
 * @param {string} [payload.meal_type] - 'breakfast' | 'lunch' | 'dinner'
 * @param {Object} [payload.nutrients_json] - Nutritional data
 * @param {Object} [payload.raw_json] - Raw API/GPT response
 * @param {string} [payload.source] - e.g. 'openfoodfacts', 'gpt-photo'
 * @param {string} [payload.notes] - Optional user notes
 * @param {string} [payload.food_id] - FK to food_product_reference if known
 * @returns {Promise<{ success: boolean, message: string, data?: object }>}
 */
export async function logMealToSupabase(payload) {
  try {
    if (!payload.user_id || !payload.entry_type) {
      return { success: false, message: 'Missing required fields: user_id or entry_type' };
    }

    const insertPayload = {
      ...(payload.meal_log_id && { meal_log_id: payload.meal_log_id }),
      user_id: payload.user_id,
      entry_type: payload.entry_type,
      barcode: payload.barcode || null,
      label: payload.label || null,
      meal_type: payload.meal_type || null,
      nutrients_json: payload.nutrients_json || null,
      quantity: payload.quantity || 1,
      serving_unit: payload.serving_unit || 'g',
      raw_json: payload.raw_json || null,
      source: payload.source || null,
      notes: payload.notes || null,
      food_id: payload.food_id || null,
    };

    const query = payload.meal_log_id
      ? supabase.from('user_meal_log').upsert(insertPayload).select().single()
      : supabase.from('user_meal_log').insert(insertPayload).select().single();

    const { data, error } = await query;

    if (error) {
      console.error('[logMealToSupabase] Insert failed:', error.message);
      return { success: false, message: error.message };
    }

    return { success: true, message: 'Meal logged successfully', data };
  } catch (err) {
    console.error('[logMealToSupabase] Unexpected error:', err.message);
    return { success: false, message: err.message };
  }
}
