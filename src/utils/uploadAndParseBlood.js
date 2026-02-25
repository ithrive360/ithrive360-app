import Papa from 'papaparse';
import { supabase } from '../lib/supabase';

function normalizeName(name) {
  return name
    ?.toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[–—]/g, '-')
    .replace(/["'’”“]/g, '')
    .replace(/[(),]/g, '')
    .replace(/\s*-\s*/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function uploadAndParseBlood(file, userId) {
  if (!file || !userId) {
    return { message: 'Missing file or user ID.' };
  }

  try {
    const { data: refMarkers, error: refError } = await supabase.from('blood_marker_reference').select('blood_marker_id, marker_name');
    const { data: areaLinks, error: areaError } = await supabase.from('blood_marker_health_area').select('blood_marker_id, health_area_id');

    if (refError || areaError) {
      console.error('Error fetching reference data:', refError?.message || areaError?.message);
      return { message: 'Error fetching reference data.' };
    }

    const markerMap = new Map();
    for (const m of refMarkers) {
      const norm = normalizeName(m.marker_name);
      if (!markerMap.has(norm)) markerMap.set(norm, []);
      markerMap.get(norm).push(m);
    }

    const areaMap = new Map();
    for (const link of areaLinks) {
      if (!areaMap.has(link.blood_marker_id)) areaMap.set(link.blood_marker_id, []);
      areaMap.get(link.blood_marker_id).push(link.health_area_id);
    }

    return new Promise((resolve, reject) => {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        transformHeader: (header) => header.trim().toLowerCase(),
        complete: async (results) => {
          const rows = results.data;
          const skipped = [];
          const entries = [];

          if (rows.length === 0) {
            resolve({ message: 'CSV is empty or invalid.' });
            return;
          }

          if (!('marker name' in rows[0]) || !('result' in rows[0])) {
            resolve({ message: 'CSV must include Marker Name and Result columns.' });
            return;
          }

          for (const row of rows) {
            const rawName = row['marker name'] || '';
            const normName = normalizeName(rawName);
            const rawValue = row['result']?.trim();

            if (!rawName || !rawValue) continue;

            let matched = markerMap.get(normName);

            if (!matched && /\(.*\)/.test(rawName)) {
              const stripped = normalizeName(rawName.replace(/\(.*?\)/g, ''));
              matched = markerMap.get(stripped);
            }

            if (!matched) {
              skipped.push(rawName.replace(/^["']|["']$/g, '').trim());
              continue;
            }

            for (const marker of matched) {
              const markerId = marker.blood_marker_id;
              const healthAreas = areaMap.get(markerId) || [];

              for (const health_area_id of healthAreas) {
                entries.push({
                  user_id: userId,
                  marker_id: markerId,
                  health_area_id,
                  value: rawValue,
                  unit: row['units']?.trim() || null,
                  upload_date: new Date().toISOString()
                });
              }
            }
          }

          if (entries.length === 0) {
            resolve({ message: 'No valid blood marker entries found.' });
            return;
          }

          const { error: insertError } = await supabase.from('user_blood_result').insert(entries);

          if (insertError) {
            console.error('Insert error:', insertError.message);
            resolve({ message: 'Failed to upload blood data.' });
            return;
          }

          await supabase.from('user_profile').update({ blood_uploaded: true }).eq('user_id', userId);

          const skipMsg = skipped.length > 0 ? ` Skipped ${skipped.length} unmatched markers.` : '';
          resolve({ message: `Uploaded ${entries.length} blood marker results across all linked health areas.` + skipMsg });
        },
        error: (err) => {
          console.error('PapaParse error:', err);
          resolve({ message: 'Failed to parse file.' });
        }
      });
    });
  } catch (err) {
    console.error('Unexpected error:', err);
    return { message: 'Failed to parse file.' };
  }
}
