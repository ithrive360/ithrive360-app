// /utils/uploadAndParseBlood.js
import { supabase } from '../supabaseClient';

function normalizeName(name) {
  return name?.trim().toLowerCase().replace(/[–—]/g, '-'); // replace typographic dashes
}

export async function uploadAndParseBlood(file, userId) {
  if (!file || !userId) {
    return { message: 'Missing file or user ID.' };
  }

  try {
    const text = await file.text();
    const lines = text.split('\n').filter(line => line.trim() !== '');
    const header = lines[0].split(',').map(h => h.trim().toLowerCase());

    const markerIndex = header.indexOf('marker name');
    const valueIndex = header.indexOf('result');
    const unitIndex = header.indexOf('units');

    if (markerIndex === -1 || valueIndex === -1) {
      return { message: 'CSV must include Marker Name and Result columns.' };
    }

    // Fetch reference markers and their health areas
    const { data: refMarkers, error: refError } = await supabase
      .from('blood_marker_reference')
      .select('blood_marker_id, marker_name');

    const { data: areaLinks, error: areaError } = await supabase
      .from('blood_marker_health_area')
      .select('blood_marker_id, health_area_id');

    if (refError || areaError) {
      console.error('Error fetching reference data:', refError?.message || areaError?.message);
      return { message: 'Error fetching reference data.' };
    }

    const markerMap = new Map(
      refMarkers.map(m => [normalizeName(m.marker_name), m.blood_marker_id])
    );

    const areaMap = new Map(); // blood_marker_id => [health_area_id]
    for (const link of areaLinks) {
      if (!areaMap.has(link.blood_marker_id)) {
        areaMap.set(link.blood_marker_id, []);
      }
      areaMap.get(link.blood_marker_id).push(link.health_area_id);
    }

    const skipped = [];
    const entries = [];

    for (const line of lines.slice(1)) {
      const cols = line.split(',');
      const rawName = cols[markerIndex];
      const normName = normalizeName(rawName);
      const rawValue = cols[valueIndex]?.trim();

      if (!markerMap.has(normName)) {
        skipped.push(rawName);
        continue;
      }

      const markerId = markerMap.get(normName);
      const healthAreas = areaMap.get(markerId) || [];

      if (healthAreas.length === 0) {
        console.warn(`Marker ${rawName} has no health area links`);
        continue;
      }

      for (const health_area_id of healthAreas) {
        entries.push({
          user_id: userId,
          marker_id: markerId,
          health_area_id,
          value: rawValue,
          unit: unitIndex !== -1 ? cols[unitIndex]?.trim() || null : null,
          upload_date: new Date().toISOString()
        });
      }
    }

    // ✅ Add popup summary of marker-to-area counts
    const summary = new Map();
    for (const entry of entries) {
      const key = `${entry.marker_id}`;
      summary.set(key, (summary.get(key) || 0) + 1);
    }

    const linesSummary = [];
    for (const [markerId, count] of summary.entries()) {
      linesSummary.push(`Marker ID ${markerId} → ${count} health area(s)`);
    }

    alert(`🧪 Prepared BM/HA permutations:\n\n${linesSummary.join('\n')}`);

    if (entries.length === 0) {
      return { message: 'No valid blood marker entries found.' };
    }

    console.log("🧪 Prepared entries:", entries);

    const { error: insertError } = await supabase
      .from('user_blood_result')
      .insert(entries);

    if (insertError) {
      console.error('Insert error:', insertError.message);
      return { message: 'Failed to upload blood data.' };
    }

    await supabase
      .from('user_profile')
      .update({ blood_uploaded: true })
      .eq('user_id', userId);

    console.log(`✅ Inserted ${entries.length} user_blood_result records.`);
    if (skipped.length > 0) {
      console.warn(`⚠️ Skipped ${skipped.length} unrecognized markers:`, skipped);
    }

    return {
      message: `Uploaded ${entries.length} blood marker results across all linked health areas.` +
        (skipped.length > 0 ? ` Skipped ${skipped.length} unmatched markers.` : '')
    };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { message: 'Failed to parse file.' };
  }
}
