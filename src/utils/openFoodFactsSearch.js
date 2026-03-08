export async function searchOpenFoodFacts(query) {
    try {
        if (!query || query.trim().length === 0) {
            return { success: true, data: [] };
        }

        const response = await fetch(
            `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&search_simple=1&action=process&json=1&page_size=15`,
            {
                headers: {
                    'User-Agent': 'iThrive360 - Android/Web - Version 1.0 (internal tool)',
                    'Accept': 'application/json'
                }
            }
        );

        if (!response.ok) {
            return { success: false, message: 'Failed to search Open Food Facts.' };
        }

        const json = await response.json();

        if (!json.products || json.products.length === 0) {
            return { success: true, data: [] };
        }

        // Map OFF products to our expected internal application schema (similar to barcode lookup)
        const formattedProducts = json.products.map(product => {
            // Fallback nutrition to 0 to prevent NaN bugs
            const nut = product.nutriments || {};

            return {
                source: 'openfoodfacts_text',
                id: product.id || product.code,
                code: product.code,
                name: product.product_name || product.product_name_en || 'Unknown Product',
                brand: product.brands ? product.brands.split(',')[0] : 'Generic',
                image_url: product.image_url || product.image_front_small_url || null,
                quantity: product.quantity || '',

                // Standardize into 100g mapping for easy calculation
                nutrients_json: {
                    energy_kcal: parseFloat(nut['energy-kcal_100g']) || parseFloat(nut['energy_100g']) / 4.184 || 0,
                    protein_g: parseFloat(nut.proteins_100g) || 0,
                    carbohydrates_g: parseFloat(nut.carbohydrates_100g) || 0,
                    fat_g: parseFloat(nut.fat_100g) || 0,
                    fiber_g: parseFloat(nut.fiber_100g) || 0,
                    sugars_g: parseFloat(nut.sugars_100g) || 0,
                    sodium_mg: parseFloat(nut.sodium_100g) * 1000 || 0,
                },
                raw_json: product // Keeping the raw JSON as backup
            };
        });

        return { success: true, data: formattedProducts };

    } catch (error) {
        console.error("OpenFoodFacts search error:", error);
        return { success: false, message: 'Network error analyzing search.' };
    }
}
