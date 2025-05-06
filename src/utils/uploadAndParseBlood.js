// /utils/uploadAndParseBlood.js
import * as XLSX from 'xlsx';
import { supabase } from '../supabaseClient';

export async function uploadAndParseBlood(file, userId) {
  if (!file || !userId) {
    return { message: 'Missing file or user ID.' };
  }

  try {
    const data = await file.arrayBuffer();
    const workbook = XLSX.read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    const jsonData = XLSX.utils.sheet_to_json(sheet);

    // Fetch reference markers
    const { data: refMarkers, error: refError } = await supabase
      .from('blood_marker_reference')
      .select('marker_id');

    if (refError) {
      console.error('Error fetching blood marker reference:', refError.message);
      return { message: 'Error fetching marker reference.' };
    }

    const validMarkerIds = new Set(refMarkers.map(marker => marker.marker_id));

    // Transform rows
    const entries = jsonData
      .filter(row => validMarkerIds.has(row.marker_id) && row.value !== undefined)
      .map(row => ({
        user_id: userId,
        marker_id: row.marker_id,
        value: String(row.value),
        unit: row.unit || null,
        upload_date: new Date().toISOString(),
      }));

    if (entries.length === 0) {
      return { message: 'No valid blood marker entries found.' };
    }

    // Insert into DB
    const { error: insertError } = await supabase
      .from('user_blood_result')
      .insert(entries);

    if (insertError) {
      console.error('Insert error:', insertError.message);
      return { message: 'Failed to upload blood data.' };
    }

    // Update profile
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
