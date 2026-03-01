import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    let timeoutId;

    const finalizeLogin = async () => {
      // Create a promise that strictly waits for the SDK to announce it has parsed the URL
      const waitForSession = new Promise((resolve) => {
        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
          if (session) {
            subscription.unsubscribe();
            resolve(session);
          }
        });

        // Fallback: If it's already parsed, grab it instantly
        supabase.auth.getSession().then(({ data }) => {
          if (data.session) {
            subscription.unsubscribe();
            resolve(data.session);
          }
        });
      });

      try {
        const session = await waitForSession;
        const user = session?.user;

        if (!user) throw new Error("No user found in resolved session");

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
      } catch (err) {
        console.warn('OAuth Parse Error:', err.message);
        navigate('/');
      }
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
