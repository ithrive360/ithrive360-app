import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';

function AuthCallback() {
  const navigate = useNavigate();
  const [isSlow, setIsSlow] = useState(false);

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
    // Notify the user if the network is throttling the OAuth exchange
    timeoutId = setTimeout(() => {
      console.warn('AuthCallback is taking longer than expected due to network throttle.');
      setIsSlow(true);
    }, 4000);

    finalizeLogin();

    return () => clearTimeout(timeoutId);
  }, [navigate]);

  return (
    <div className="flex flex-col justify-center items-center h-screen bg-[#FAFAFA] px-4">
      <div className="animate-pulse">
        <img src="/icons/icon-192x192.png" alt="Loading" className="w-20 h-20 mb-6" />
      </div>
      <p className="text-gray-900 font-semibold text-lg">Signing you in...</p>

      {isSlow && (
        <p className="mt-4 text-sm text-gray-500 max-w-xs text-center">
          The network response is slower than usual on mobile. Please keep the app open, securely verifying your keys...
        </p>
      )}
    </div>
  );
}

export default AuthCallback;
