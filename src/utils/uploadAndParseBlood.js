// /utils/uploadAndParseBlood.js
import { supabase } from '../supabaseClient';

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

    // Fetch reference markers with name and ID
    const { data: refMarkers, error: refError } = await supabase
      .from('blood_marker_reference')
      .select('marker_name, blood_marker_id');

    if (refError) {
      console.error('Error fetching blood marker reference:', refError.message);
      return { message: 'Error fetching marker reference.' };
    }

    const markerMap = new Map(
      refMarkers.map(m => [m.marker_name.trim().toLowerCase(), m.blood_marker_id])
    );

    const entries = lines.slice(1).map(line => line.split(',')).filter(cols => {
      const markerName = cols[markerIndex]?.trim().toLowerCase();
      return markerMap.has(markerName) && cols[valueIndex]?.trim();
    }).map(cols => ({
      user_id: userId,
      marker_id: markerMap.get(cols[markerIndex].trim().toLowerCase()),
      value: cols[valueIndex].trim(),
      unit: unitIndex !== -1 ? cols[unitIndex]?.trim() || null : null,
      upload_date: new Date().toISOString()
    }));

    if (entries.length === 0) {
      return { message: 'No valid blood marker entries found.' };
    }

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

    return { message: `Uploaded ${entries.length} valid markers.` };
  } catch (err) {
    console.error('Unexpected error:', err);
    return { message: 'Failed to parse file.' };
  }
}
