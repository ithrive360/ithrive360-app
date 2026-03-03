import { supabase } from '../lib/supabase';

export async function initUserProfile(user) {
  if (!user || !user.id) return;

  const { email, user_metadata } = user;

  const { error } = await supabase.from('user_profile').insert({
    user_id: user.id,
    email,
    full_name: user_metadata?.full_name || email
  });

  if (error) {
    console.error("Failed to init profile:", error);
  }
}
