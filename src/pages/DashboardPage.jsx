import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { uploadAndParseDNA } from '../utils/uploadAndParseDNA';
import { uploadAndParseBlood } from '../utils/uploadAndParseBlood';
import { initUserProfile } from '../utils/initUserProfile';
import { generateHealthInsight } from '../utils/generateHealthInsight';
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
        health_area: 'Cardiovascular Health'
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

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>You must be logged in to view this page.</p>;

  return (
    <div className="dashboard">
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
          onClick={() => setMenuOpen(prev => !prev)}
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

      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        {timeAnimation && (
          <div style={{ width: 36, height: 36 }}>
            <Lottie animationData={timeAnimation} loop autoplay />
          </div>
        )}
        <h2>{greeting}, {user.user_metadata?.full_name?.split(' ')[0] || user.email || 'there'}!</h2>
      </div>
    </div>
  );
}

export default DashboardPage;