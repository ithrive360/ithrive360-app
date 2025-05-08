// /utils/uploadAndParseDNA.js
import { supabase } from '../supabaseClient';

export async function uploadAndParseDNA(file, userId) {
  if (!file || !userId) {
    return { success: false, message: 'Missing file or user ID.' };
  }

  try {
    // Step 1: Get rsid → dna_id reference
    const { data: markerRef, error: refError } = await supabase
      .from('dna_marker_reference')
      .select('rsid, dna_id');

    const { data: areaLinks, error: areaError } = await supabase
      .from('dna_marker_health_area')
      .select('dna_id, health_area_id');

    if (refError || areaError) {
      console.error('Reference fetch error:', refError?.message || areaError?.message);
      return { success: false, message: 'Error fetching reference data.' };
    }

    const rsidMap = new Map(); // rsid → [dna_id]
    for (const m of markerRef) {
      if (!rsidMap.has(m.rsid)) rsidMap.set(m.rsid, []);
      rsidMap.get(m.rsid).push(m.dna_id);
    }

    const areaMap = new Map(); // dna_id → [health_area_id]
    for (const link of areaLinks) {
      if (!areaMap.has(link.dna_id)) {
        areaMap.set(link.dna_id, []);
      }
      areaMap.get(link.dna_id).push(link.health_area_id);
    }

    // Step 2: Parse uploaded file
    const text = await file.text();
    const lines = text
      .split('\n')
      .filter(line => !line.startsWith('#') && line.trim() !== '');

    const skipped = [];
    const entries = [];

    for (const line of lines) {
      const [rsid, , , genotype] = line.split('\t');
      if (!rsid || !genotype) continue;

      const matchedIds = rsidMap.get(rsid);
      if (!matchedIds) {
        skipped.push(rsid);
        continue;
      }

      for (const dna_id of matchedIds) {
        const healthAreas = areaMap.get(dna_id) || [];

        if (healthAreas.length === 0) {
          console.warn(`DNA marker ${rsid} (${dna_id}) has no linked health areas.`);
          continue;
        }

        for (const health_area_id of healthAreas) {
          entries.push({
            user_id: userId,
            dna_id,
            health_area_id,
            value: genotype,
            upload_date: new Date().toISOString(),
          });
        }
      }
    }

    if (skipped.length > 0) {
      alert(`⚠️ Skipped ${skipped.length} unmatched SNPs:\n\n- ${skipped.join('\n- ')}`);
    }

    if (entries.length === 0) {
      return { success: false, message: 'No valid DNA markers matched for any health area.' };
    }

    console.log("🧬 Prepared entries:", entries);

    const { error: insertError } = await supabase
      .from('user_dna_result')
      .insert(entries);

    if (insertError) {
      console.error('Insert error:', insertError.message);
      return { success: false, message: 'Failed to upload DNA data.' };
    }

    await supabase
      .from('user_profile')
      .update({ dna_uploaded: true })
      .eq('user_id', userId);

    console.log(`✅ Inserted ${entries.length} user_dna_result records.`);
    if (skipped.length > 0) {
      console.warn(`⚠️ Skipped ${skipped.length} unrecognized SNPs:`, skipped);
    }

    return {
      success: true,
      message: `Uploaded ${entries.length} DNA results across all linked health areas.` +
        (skipped.length > 0 ? ` Skipped ${skipped.length} unmatched SNPs.` : '')
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, message: `Unexpected error: ${err.message}` };
  }
}
