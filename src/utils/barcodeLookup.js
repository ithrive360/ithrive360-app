import { supabase } from '../lib/supabase';

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
    const url = `https://world.openfoodfacts.org/api/v2/product/${barcode}.json?fields=product_name,product_name_en,brands,ingredients_text,ingredients_text_en,nutriments,serving_size,image_url,allergens,nova_group,nutriscore_grade,nutrient_levels`;
    const res = await fetch(url);
    const data = await res.json();

    if (data.status !== 1) {
      return { success: false, message: `Barcode ${barcode} not found on Open Food Facts.` };
    }

    const product = data.product;

    const normalized = {
      name: product.product_name_en || product.product_name || 'Unnamed product',
      barcode,
      source: 'openfoodfacts',
      brand: product.brands || null,
      ingredients: product.ingredients_text_en || product.ingredients_text || null,
      allergens: product.allergens ? product.allergens.replace(/en:/g, '').replace(/,/g, ', ') : null,
      nutrients_json: normalizeNutrients(product.nutriments),
      nutrient_levels: product.nutrient_levels || null,
      serving_size: product.serving_size || null,
      nova_group: product.nova_group || null,
      nutriscore_grade: product.nutriscore_grade || null,
      image_url: product.image_url || null,
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
