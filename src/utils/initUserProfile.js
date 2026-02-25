import { supabase } from '../lib/supabase';

export async function initUserProfile(user) {
  if (!user || !user.id) return;

  const { data: existing, error: fetchError } = await supabase
    .from('user_profile')
    .select('user_id')
    .eq('user_id', user.id)
    .maybeSingle();

  if (!existing && !fetchError) {
    const { email, user_metadata } = user;

    await supabase.from('user_profile').insert({
      user_id: user.id,
      email,
      full_name: user_metadata?.full_name || email
    });
  }
}
