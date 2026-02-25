import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

export async function uploadAndParseDNA(file, userId) {
  if (!file || !userId) {
    return { success: false, message: 'Missing file or user ID.' };
  }

  try {
    const { data: markerRef, error: refError } = await supabase.from('dna_marker_reference').select('rsid, dna_id');
    const { data: areaLinks, error: areaError } = await supabase.from('dna_marker_health_area').select('dna_id, health_area_id');

    if (refError || areaError) {
      console.error('Reference fetch error:', refError?.message || areaError?.message);
      return { success: false, message: 'Error fetching reference data.' };
    }

    const rsidMap = new Map();
    for (const m of markerRef) {
      if (!rsidMap.has(m.rsid)) rsidMap.set(m.rsid, []);
      rsidMap.get(m.rsid).push(m.dna_id);
    }

    const areaMap = new Map();
    for (const link of areaLinks) {
      if (!areaMap.has(link.dna_id)) areaMap.set(link.dna_id, []);
      areaMap.get(link.dna_id).push(link.health_area_id);
    }

    return new Promise((resolve) => {
      Papa.parse(file, {
        delimiter: '\t',
        comments: '#',
        skipEmptyLines: true,
        complete: async (results) => {
          const rows = results.data;
          const skipped = [];
          const entries = [];

          for (const row of rows) {
            // Typical 23andMe format: [RSID, chromosome, position, genotype]
            const rsid = row[0]?.trim();
            const genotype = row[3]?.trim();

            if (!rsid || !genotype) continue;

            const matchedIds = rsidMap.get(rsid);
            if (!matchedIds) {
              skipped.push(rsid);
              continue;
            }

            for (const dna_id of matchedIds) {
              const healthAreas = areaMap.get(dna_id) || [];
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

          if (entries.length === 0) {
            resolve({ success: false, message: 'No valid DNA markers matched for any health area.' });
            return;
          }

          const { error: insertError } = await supabase.from('user_dna_result').insert(entries);

          if (insertError) {
            console.error('Insert error:', insertError.message);
            resolve({ success: false, message: 'Failed to upload DNA data.' });
            return;
          }

          await supabase.from('user_profile').update({ dna_uploaded: true }).eq('user_id', userId);

          resolve({
            success: true,
            message: `Uploaded ${entries.length} DNA results across all linked health areas.` +
              (skipped.length > 0 ? ` Skipped ${skipped.length} unmatched SNPs.` : '')
          });
        },
        error: (err) => {
          console.error('PapaParse error:', err);
          resolve({ success: false, message: `Unexpected parsing error: ${err.message}` });
        }
      });
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return { success: false, message: `Unexpected error: ${err.message}` };
  }
}
