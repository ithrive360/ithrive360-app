import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { uploadAndParseDNA } from '../utils/uploadAndParseDNA';
import { uploadAndParseBlood } from '../utils/uploadAndParseBlood';
import { initUserProfile } from '../utils/initUserProfile';
import { generateHealthInsight } from '../utils/generateHealthInsight';
import logo from '../assets/logo.png';

function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [message, setMessage] = useState('');
  const [bloodMessage, setBloodMessage] = useState('');
  const [inputJson, setInputJson] = useState(null);
  const [prompt, setPrompt] = useState('');

  const fetchUserData = async () => {
    try {
      // First check if we have a valid session
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      
      if (sessionError) {
        console.error("Session error:", sessionError.message);
        return;
      }
      
      if (!sessionData?.session) {
        console.log("No active session found");
        window.location.href = '/'; // Redirect to login page
        return;
      }
      
      // Now get the user data with the confirmed session
      const { data: userData, error: userError } = await supabase.auth.getUser();
      
      if (userError) {
        console.error("Auth fetch error:", userError.message);
        return;
      }
      
      if (!userData?.user) {
        console.log("User not found in session");
        return;
      }

      setUser(userData.user);

      // Initialize user profile if needed
      await initUserProfile(userData.user);

      // Fetch user profile data
      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userData.user.id)
        .single();

      if (profileError) console.error('Profile fetch error:', profileError.message);
      setProfile(profileData || null);

      // Set greeting based on time of day
      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');

    } catch (error) {
      console.error("Error in fetchUserData:", error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Immediately invoke an async function
    (async () => {
      try {
        // Check for an existing session first
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session) {
          await fetchUserData();
        } else {
          setLoading(false); // Stop loading if no session
          // Optional: Redirect to login
          // window.location.href = '/';
        }
        
        // Set up auth state change listener
        const { data: authListener } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log("Auth state changed:", event);
            if (event === 'SIGNED_IN' && session) {
              await fetchUserData();
            } else if (event === 'SIGNED_OUT') {
              setUser(null);
              setProfile(null);
              // Optional: Redirect to login
              // window.location.href = '/';
            }
          }
        );
        
        return () => {
          authListener?.subscription?.unsubscribe();
        };
      } catch (error) {
        console.error("Auth setup error:", error.message);
        setLoading(false);
      }
    })();
  }, []);

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error('Logout error:', error.message);
      } else {
        window.location.href = '/';
      }
    } catch (error) {
      console.error("Logout exception:", error.message);
    }
  };

  const handleDNAUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.id) {
      setMessage('Missing file or user ID.');
      return;
    }
    try {
      const result = await uploadAndParseDNA(file, user.id);
      setMessage(result.message);
      if (result.success) await fetchUserData();
    } catch (error) {
      setMessage(`Upload error: ${error.message}`);
    }
  };

  const handleBloodUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.id) {
      setBloodMessage('Missing file or user ID.');
      return;
    }
    try {
      const result = await uploadAndParseBlood(file, user.id);
      setBloodMessage(result.message);
      if (result.message?.startsWith('Uploaded')) await fetchUserData();
    } catch (error) {
      setBloodMessage(`Upload error: ${error.message}`);
    }
  };

  const handleTestGPT = async () => {
    if (!user?.id) {
      alert('User not authenticated. Please log in again.');
      return;
    }

    try {
      const result = await generateHealthInsight({
        user_id: user.id,
        health_area: 'energy',
        markers: [
          { marker: 'vitamin_d', value: 22, type: 'blood' },
          { marker: 'rs12345', value: 'AA', type: 'dna' }
        ]
      });

      console.log("Result from generateHealthInsight:", result);

      if (result.success) {
        setInputJson(result.input_json);
        setPrompt(result.prompt);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (error) {
      console.error("GPT test error:", error.message);
      alert(`Error: ${error.message}`);
    }
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return (
    <div className="auth-redirect">
      <img src={logo} alt="iThrive360 Logo" className="logo" />
      <h2>Please log in to access your dashboard</h2>
      <button onClick={() => window.location.href = '/'} className="btn btn-primary">
        Go to Login
      </button>
    </div>
  );

  return (
    <div className="dashboard">
      <img src={logo} alt="iThrive360 Logo" className="logo" />
      <h1>iThrive360</h1>
      <p>{greeting}, {user.user_metadata?.full_name?.split(' ')[0] || user.email || 'there'}!</p>

      {/* Upload Cards */}
      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2rem' }}>
        <div className="card">
          <h3>DNA Data</h3>
          <p>Status: {profile?.dna_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}</p>
          <label className="btn btn-primary">
            Upload DNA
            <input type="file" accept=".txt" onChange={handleDNAUpload} style={{ display: 'none' }} />
          </label>
          {message && <p style={{ marginTop: '0.5rem' }}>{message}</p>}
        </div>
        <div className="card">
          <h3>Blood Test</h3>
          <p>Status: {profile?.blood_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}</p>
          <label className="btn btn-primary">
            Upload Blood
            <input type="file" accept=".csv" onChange={handleBloodUpload} style={{ display: 'none' }} />
          </label>
          {bloodMessage && <p style={{ marginTop: '0.5rem' }}>{bloodMessage}</p>}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{ marginTop: '3rem' }}>
        <h2>Quick Actions</h2>
        <button className="btn btn-primary">Start New Report</button>
        <button className="btn btn-primary">View Insights</button>
        <button className="btn btn-primary">Recommendations</button>
        <button className="btn btn-primary" onClick={handleTestGPT}>Test GPT</button>
      </div>

      {/* Progress Teaser */}
      {profile?.dna_uploaded && profile?.blood_uploaded && (
        <div style={{ marginTop: '3rem' }}>
          <h3>Progress Tracker</h3>
          <p>3 out of 8 areas improved since your last test 💪</p>
          <div style={{ height: '10px', width: '80%', background: '#eee', margin: '0 auto', borderRadius: '5px' }}>
            <div style={{ width: '37%', height: '100%', background: '#3ab3a1', borderRadius: '5px' }}></div>
          </div>
        </div>
      )}

      {/* Prompt Preview Output */}
      {inputJson && prompt && (
        <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f0f0f0' }}>
          <h3>Preview: Input JSON</h3>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{JSON.stringify(inputJson, null, 2)}</pre>

          <h3 style={{ marginTop: '2rem' }}>Preview: Prompt Sent to GPT</h3>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{prompt}</pre>
        </div>
      )}

      {/* Settings / Sign out */}
      <button onClick={handleLogout} className="btn btn-primary" style={{ marginTop: '2rem' }}>
        Sign Out
      </button>
    </div>
  );
}

export default DashboardPage;