import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId;

    const finalizeLogin = async () => {
      // getSession() automatically parses the URL hash from the redirect natively and synchronously
      const { data: { session }, error } = await supabase.auth.getSession();
      const user = session?.user;

      if (error || !user) {
        console.warn('OAuth Error or No Session found during callback:', error?.message);
        // Fallback to home page rather than hanging
        navigate('/');
        return;
      }

      // Optional: check if user profile exists
      const { data: profile, error: profileError } = await supabase
        .from('user_profile')
        .select('user_id')
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
    // Add a strict boundary to prevent an infinite hang if the SDK locks up
    timeoutId = setTimeout(() => {
      console.warn('AuthCallback timed out. Redirecting to home...');
      navigate('/');
    }, 4000);

    finalizeLogin();

    return () => clearTimeout(timeoutId);
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
