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

    // Manually extract the active token from localStorage to bypass the Supabase SDK mutex locks.
    // The SDK permanently deadlocks on Android if it tries to auto-refresh while the OS camera is open.
    const cachedSessionStr = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    let accessToken = null;
    if (cachedSessionStr) {
      try {
        const session = JSON.parse(localStorage.getItem(cachedSessionStr));
        accessToken = session?.access_token;
      } catch (e) {
        // ignore
      }
    }

    if (!accessToken) {
      return { success: false, message: 'Unauthenticated.' };
    }

    // Direct REST API call bypassing the SDK
    const supabaseUrl = 'https://oqjblzxhfszvluhvfclv.supabase.co';
    const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9xamJsenhoZnN6dmx1aHZmY2x2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDYxMzczMDksImV4cCI6MjA2MTcxMzMwOX0.oKNbUCKXTds68cy2wGPZMJhoQ9mAXUOOQz2oUreh018';

    // Setup UPSERT query params
    const queryParams = new URLSearchParams();
    if (payload.meal_log_id) {
      queryParams.append('on_conflict', 'meal_log_id');
      queryParams.append('select', '*');
    } else {
      queryParams.append('select', '*');
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    let res;
    try {
      res = await fetch(`${supabaseUrl}/rest/v1/user_meal_log?${queryParams.toString()}`, {
        method: 'POST',
        headers: {
          'apikey': supabaseKey,
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
          'Prefer': payload.meal_log_id ? 'resolution=merge-duplicates,return=representation' : 'return=representation'
        },
        body: JSON.stringify(insertPayload),
        signal: controller.signal
      });
    } finally {
      clearTimeout(timeoutId);
    }

    if (!res.ok) {
      const errorText = await res.text();
      throw new Error(`DB Error ${res.status}: ${errorText}`);
    }

    const resData = await res.json();
    const data = Array.isArray(resData) ? resData[0] : resData;

    return { success: true, message: 'Meal logged successfully', data };
  } catch (err) {
    console.error('[logMealToSupabase] Unexpected error:', err.message);
    return { success: false, message: err.message };
  }
}
