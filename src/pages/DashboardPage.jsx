import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { uploadAndParseDNA } from '../utils/uploadAndParseDNA';
import { uploadAndParseBlood } from '../utils/uploadAndParseBlood';
import { initUserProfile } from '../utils/initUserProfile';
import { generateHealthInsight } from '../utils/generateHealthInsight';
import SidebarMenu from './SidebarMenu';
import { Menu, X } from 'lucide-react';
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
  const [gptResponse, setGptResponse] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);

  const navigate = useNavigate();

  const fetchUserData = async () => {
    const { data: sessionData, error } = await supabase.auth.getSession();
    if (error) {
      console.error("Session fetch error:", error.message);
      return;
    }

    const user = sessionData?.session?.user;
    if (!user) {
      console.log("No session user found.");
      return;
    }

    setUser(user);

    await initUserProfile(user);

    const { data: profileData, error: profileError } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (profileError) console.error('Profile fetch error:', profileError.message);
    setProfile(profileData || null);

    const hour = new Date().getHours();
    if (hour < 12) setGreeting('Good morning');
    else if (hour < 18) setGreeting('Good afternoon');
    else setGreeting('Good evening');

    setLoading(false);
  };

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        await fetchUserData();
      } else {
        setLoading(false);
      }
    };

    checkSessionAndFetch();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        if (session?.user) {
          await fetchUserData();
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error.message);
    else window.location.href = '/';
  };

  const handleDNAUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.id) {
      setMessage('Missing file or user ID.');
      return;
    }
    const result = await uploadAndParseDNA(file, user.id);
    setMessage(result.message);
    if (result.success) fetchUserData();
  };

  const handleBloodUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.id) {
      setBloodMessage('Missing file or user ID.');
      return;
    }
    const result = await uploadAndParseBlood(file, user.id);
    setBloodMessage(result.message);
    if (result.message?.startsWith('Uploaded')) fetchUserData();
  };

  const handleTestGPT = async () => {
    if (!user?.id) {
      alert('User not authenticated. Please log in again.');
      return;
    }

    try {
      const result = await generateHealthInsight({
        user_id: user.id,
        health_area: 'Cardiovascular Health'
      });

      if (result.success) {
        setInputJson(result.input_json);
        setPrompt(result.prompt);
        setGptResponse(result.gpt_response);
      } else {
        alert(`Error: ${result.error}`);
      }
    } catch (e) {
      console.error("Unhandled error in handleTestGPT:", e);
      alert("Unexpected error. See console.");
    }
  };

  console.log('Menu open?', menuOpen);

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>You must be logged in to view this page.</p>;

  return (
    <div className="dashboard">

<button
  onClick={() => {
    setMenuOpen(prev => !prev);
    console.log('Burger clicked, toggling menu');
  }}
  style={{
    position: 'fixed',
    top: 16,
    left: 16,
    zIndex: 10000,
    background: 'none',
    border: 'none',
    padding: 0,
    cursor: 'pointer',
    lineHeight: 0,
    outline: 'none' // ✅ prevents black border
  }}
  aria-label="Toggle menu"
>
  {menuOpen ? <X size={28} color="#3ab3a1" /> : <Menu size={28} color="#3ab3a1" />}
</button>

      <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />

      <img src={logo} alt="iThrive360 Logo" className="logo" />
      <h2><p>{greeting}, {user.user_metadata?.full_name?.split(' ')[0] || user.email || 'there'}!</p></h2>

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

      <div style={{ marginTop: '3rem' }}>
        <h2>Quick Actions</h2>
        <button className="btn btn-primary">Start New Report</button>
        <button className="btn btn-primary" onClick={() => navigate('/insights/cardiovascular')}>View Insights</button>
        <button className="btn btn-primary">Recommendations</button>
        <button
          className="btn"
          onClick={handleTestGPT}
          style={{ backgroundColor: '#dc3545', color: 'white', border: 'none' }}
        >
          Test GPT
        </button>
      </div>

      {profile?.dna_uploaded && profile?.blood_uploaded && (
        <div style={{ marginTop: '3rem' }}>
          <h3>Progress Tracker</h3>
          <p>3 out of 8 areas improved since your last test 💪</p>
          <div style={{ height: '10px', width: '80%', background: '#eee', margin: '0 auto', borderRadius: '5px' }}>
            <div style={{ width: '37%', height: '100%', background: '#3ab3a1', borderRadius: '5px' }}></div>
          </div>
        </div>
      )}

      {inputJson && prompt && (
        <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#f0f0f0' }}>
          <h3>Preview: Input JSON</h3>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{JSON.stringify(inputJson, null, 2)}</pre>

          <h3 style={{ marginTop: '2rem' }}>Preview: Prompt Sent to GPT</h3>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{prompt}</pre>
        </div>
      )}

      {gptResponse && (
        <div style={{ marginTop: '3rem', padding: '1rem', backgroundColor: '#e8f5e9' }}>
          <h3>Preview: GPT Response</h3>
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>{gptResponse}</pre>
        </div>
      )}

      <button onClick={handleLogout} className="btn btn-primary" style={{ marginTop: '2rem' }}>
        Sign Out
      </button>
    </div>
  );
}

export default DashboardPage;
