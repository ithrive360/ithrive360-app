import { supabase } from '../supabaseClient';

export async function uploadAndParseDNA(file, userId) {
  if (!file || !userId) {
    return { success: false, message: 'Missing file or user ID.' };
  }

  try {
    // Step 1: Get list of valid rsid → dna_id mappings from reference table
    const { data: markerRef, error: refError } = await supabase
      .from('dna_marker_reference')
      .select('rsid, dna_id');

    if (refError) {
      return { success: false, message: `Error fetching reference data: ${refError.message}` };
    }

    const rsidToDnaId = new Map(markerRef.map(({ rsid, dna_id }) => [rsid, dna_id]));

    // Step 2: Read and parse the uploaded file
    const text = await file.text();
    const lines = text
      .split('\n')
      .filter(line => !line.startsWith('#') && line.trim() !== '');

    const entries = lines
      .map(line => {
        const [rsid, , , genotype] = line.split('\t');
        const dna_id = rsidToDnaId.get(rsid);
        if (!dna_id) return null; // Skip unreferenced markers

        return {
          user_id: userId,
          dna_id,
          value: genotype,
          upload_date: new Date().toISOString(),
        };
      })
      .filter(Boolean); // remove nulls

    if (entries.length === 0) {
      return { success: false, message: 'No matching markers found in uploaded file.' };
    }

    // Step 3: Upload to user_dna_result
    const { error: insertError } = await supabase
      .from('user_dna_result')
      .insert(entries);

    if (insertError) {
      return { success: false, message: `Insert error: ${insertError.message}` };
    }

    // Update profile to reflect DNA upload
    await supabase
      .from('user_profile')
      .update({ dna_uploaded: true })
      .eq('user_id', userId);

    return { success: true, message: `Uploaded ${entries.length} valid markers.` };
  } catch (err) {
    return { success: false, message: `Unexpected error: ${err.message}` };
  }
}
