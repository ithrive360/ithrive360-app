import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { uploadAndParseDNA } from '../utils/uploadAndParseDNA';
import { uploadAndParseBlood } from '../utils/uploadAndParseBlood';
import { initUserProfile } from '../utils/initUserProfile';
import { generateHealthInsight } from '../utils/generateHealthInsight';
import { generateAllHealthInsights } from '../utils/generateAllHealthInsights';
import SidebarMenu from './SidebarMenu';
import { Menu, X } from 'lucide-react';
import Lottie from 'lottie-react';
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
  const [timeAnimation, setTimeAnimation] = useState(null);
  const [insightStatus, setInsightStatus] = useState(''); // Added new state for insight status

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
    let iconPath = '';

    if (hour < 12) {
      setGreeting('Good morning');
      iconPath = '/icons/morning.json';
    } else if (hour < 18) {
      setGreeting('Good afternoon');
      iconPath = '/icons/afternoon.json';
    } else {
      setGreeting('Good evening');
      iconPath = '/icons/evening.json';
    }

    try {
      const res = await fetch(iconPath);
      const anim = await res.json();
      setTimeAnimation(anim);
    } catch (err) {
      console.error('Failed to load time icon:', err);
    }

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
        health_area: 'HA002'
      });

      if (!result.success) {
        alert(`Error: ${result.error}`);
        return;
      }

      setInputJson(result.input_json);
      setPrompt(result.prompt);
      setGptResponse(result.gpt_response);

      let parsed;
      try {
        parsed = JSON.parse(result.gpt_response);
      } catch (parseErr) {
        console.error('Failed to parse GPT response:', parseErr);
        alert('GPT response was not valid JSON.');
        return;
      }

      const insertPayload = {
        user_id: user.id,
        health_area_id: 'HA002',
        summary: parsed.summary || '',
        findings_json: {
          blood_markers: parsed.blood_markers || [],
          dna_traits: parsed.dna_traits || []
        },
        recommendations_json: parsed.recommendations || {},
        gpt_model: 'gpt-4o',
        prompt_version: 'v1',
        created_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase.from('user_health_insight').upsert(insertPayload, {
        onConflict: ['user_id', 'health_area_id']
      });

      if (insertError) {
        console.error('Insert error:', insertError);
        alert('Failed to save insight to DB.');
      } else {
        console.log('Insight saved to DB.');
      }
    } catch (e) {
      console.error("Unhandled error in handleTestGPT:", e);
      alert("Unexpected error. See console.");
    }
  };

  
    const generateInsightsIndividually = async () => {
      const healthAreas = ['HA001', 'HA002', 'HA003', 'HA004', 'HA005', 'HA006', 'HA007', 'HA008', 'HA009'];

      const session = (await supabase.auth.getSession())?.data?.session;
      if (!session) {
        alert('❌ No valid session. Please log in again.');
        return;
      }

      for (const area of healthAreas) {
        setInsightStatus(`Processing ${area}...`);

        try {
          const localResult = await generateHealthInsight({ user_id: user.id, health_area: area });

          if (!localResult.success) {
            console.error(`❌ Failed to prepare input for ${area}:`, localResult.error);
            continue;
          }

          const payload = {
            user_id: user.id,
            health_area: area,
            markers: [...(localResult.input_json?.blood_results || []), ...(localResult.input_json?.dna_results || [])]
          };

          console.log(`[Frontend] Calling edge function for ${area}`, payload);

          const { error } = await supabase.functions.invoke('generate-insight', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${session.access_token}`
            },
            body: JSON.stringify(payload)
          });

          if (error) {
            console.error(`❌ Error invoking ${area}:`, error.message);
          }
        } catch (err) {
          console.error(`❌ Network error for ${area}:`, err.message || err);
        }

        await new Promise(r => setTimeout(r, 250)); // slight delay between requests
      }

      setInsightStatus('✅ All insights processed.');
    };




  if (loading) return <p>Loading...</p>;
  if (!user) return <p>You must be logged in to view this page.</p>;

  return (
    <div className="dashboard">
      {/* Fixed top bar */}
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 16px',
          zIndex: 1000,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
        }}
      >
        <button
          onClick={() => {
            setMenuOpen(prev => !prev);
            console.log('Burger clicked, toggling menu');
          }}
          style={{
            position: 'absolute',
            left: 16,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            lineHeight: 0,
            outline: 'none',
          }}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={28} color="#3ab3a1" /> : <Menu size={28} color="#3ab3a1" />}
        </button>

        <img src={logo} alt="iThrive360 Logo" style={{ height: 32 }} />
      </div>

      <SidebarMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={handleLogout}
        profile={profile}
      />

      <div style={{ height: 60 }} />

      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 8 }}>
        {timeAnimation && (
          <div style={{ width: 48, height: 48 }}>
            <Lottie animationData={timeAnimation} loop autoplay />
          </div>
        )}
        <h2 style={{ margin: 0 }}>{greeting}, {user.user_metadata?.full_name?.split(' ')[0] || user.email || 'there'}!</h2>
      </div>

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
        <button className="btn btn-primary" onClick={() => navigate('/insights/cardiovascular')}>View Cardio Insights</button>

        <button
          onClick={generateInsightsIndividually}
          className="btn btn-primary"
          style={{ backgroundColor: '#3ab3a1', marginTop: 12 }}
        >
          Generate All Insights
        </button>

        {insightStatus && <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{insightStatus}</p>}

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