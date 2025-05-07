import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const finalizeLogin = async () => {
      const { data: { session }, error } = await supabase.auth.refreshSession();
      const user = session?.user;

      if (error || !user) {
        console.error('Error retrieving session after redirect:', error?.message);
        navigate('/');
        return;
      }

      // Optional: check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profile')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!profile && !profileError) {
        await supabase.from('user_profile').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata?.full_name || '',
          dna_uploaded: false,
          blood_uploaded: false
        });
      }

      navigate('/dashboard');
    };

    finalizeLogin();
  }, [navigate]);

  return (
    <div className="app-container">
      <div className="auth-box">
        <p>Signing you in...</p>
      </div>
    </div>
  );
}

export default AuthCallback;
