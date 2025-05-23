import { supabase } from '../supabaseClient';

/**
 * Looks up a barcode in Open Food Facts and optionally caches the result.
 * 
 * @param {string} barcode - EAN/UPC code to look up
 * @param {boolean} [cache=true] - Whether to insert into food_product_reference if found
 * @returns {Promise<{ success: boolean, data?: object, message?: string }>}
 */
export async function lookupBarcodeProduct(barcode, cache = true) {
  if (!barcode || typeof barcode !== 'string') {
    return { success: false, message: 'Invalid barcode input.' };
  }

  try {
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 1) {
      return { success: false, message: `Barcode ${barcode} not found. Please try taking a photo of the food label (not barcode) on the packaging.` };
    }

    const product = data.product;

    const normalized = {
      name: product.product_name || 'Unnamed product',
      barcode,
      source: 'openfoodfacts',
      brand: product.brands || null,
      category: product.categories_tags?.[0]?.replace('en:', '') || null,
      ingredients: product.ingredients_text || null,
      nutrients_json: normalizeNutrients(product.nutriments),
      serving_size: product.serving_size || null,
      serving_weight_grams: product.serving_quantity || null,
      tags: product.nova_group ? [`nova-${product.nova_group}`] : [],
      gpt_label: product.product_name || null,
      image_url: product.image_url || null,
      origin_country: product.countries_tags?.[0]?.replace('en:', '') || null,
    };

    // If requested, cache it into Supabase
    if (cache) {
      const { data: existing } = await supabase
        .from('food_product_reference')
        .select('food_id')
        .eq('barcode', barcode)
        .limit(1)
        .maybeSingle();

      if (!existing) {
        await supabase.from('food_product_reference').insert([normalized]);
      }
    }

    return { success: true, data: normalized };
  } catch (err) {
    console.error('[lookupBarcodeProduct] Unexpected error:', err.message);
    return { success: false, message: 'Failed to fetch product data.' };
  }
}

/**
 * Normalizes OFF nutrient keys to clean format.
 */
function normalizeNutrients(n) {
  if (!n) return null;

  return {
    energy_kcal: n['energy-kcal_100g'] ?? null,
    protein_g: n['proteins_100g'] ?? null,
    carbohydrates_g: n['carbohydrates_100g'] ?? null,
    sugar_g: n['sugars_100g'] ?? null,
    fat_g: n['fat_100g'] ?? null,
    saturated_fat_g: n['saturated-fat_100g'] ?? null,
    fiber_g: n['fiber_100g'] ?? null,
    sodium_mg: n['sodium_100g'] ? Math.round(n['sodium_100g'] * 1000) : null,
  };
}
