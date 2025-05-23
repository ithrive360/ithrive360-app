import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createClient } from '@supabase/supabase-js'; // Import createClient for reinitialization
import { supabase } from '../supabaseClient';
import { uploadAndParseDNA } from '../utils/uploadAndParseDNA';
import { uploadAndParseBlood } from '../utils/uploadAndParseBlood';
import { initUserProfile } from '../utils/initUserProfile';
import { generateHealthInsight } from '../utils/generateHealthInsight';
import { generateAllHealthInsights } from '../utils/generateAllHealthInsights';
import { importUserRecommendations } from '../utils/importRecommendations'; //REMOVE AFTER RECOMMENDATION ARE DONE VIA GPT
import SidebarMenu from './SidebarMenu';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import Lottie from 'lottie-react';
import ScoreCardsDashboard from './ScoreCardsDashboard';
import logo from '../assets/logo.png';

// Add a global unhandled promise rejection handler for debugging
if (typeof window !== 'undefined') {
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection:', event.reason);
  });
}

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
  const [insightStatus, setInsightStatus] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedHealthArea, setSelectedHealthArea] = useState('HA002');
  const [areaScores, setAreaScores] = useState([]); // Holds all per-HA scores
  const [overallScores, setOverallScores] = useState({ general: null, longevity: null, performance: null });
  const [expandedRecCategory, setExpandedRecCategory] = useState(null);
  const [activeToggles, setActiveToggles] = useState({}); // key: rec.text, value: true|false
  const [recommendationData, setRecommendationData] = useState({});
  const navigate = useNavigate();

  // Utility function to wrap a promise with a timeout and abort support
  const withTimeout = (promise, timeoutMs, signal = null) => {
    let timeoutId;
    const timeout = new Promise((_, reject) => {
      timeoutId = setTimeout(() => {
        if (signal) signal.abort(); // Abort the fetch request
        console.log(`[withTimeout] Aborted due to timeout after ${timeoutMs}ms`);
        reject(new Error(`Operation timed out after ${timeoutMs}ms`));
      }, timeoutMs);
    });
    return Promise.race([promise, timeout]).finally(() => clearTimeout(timeoutId));
  };

  // Utility function for retrying a promise with exponential backoff
  const withRetry = async (fn, retries = 3, baseDelayMs = 2000) => {
    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        console.log(`[withRetry] Attempt ${attempt} of ${retries}`);
        return await fn();
      } catch (err) {
        if (attempt === retries) throw err;
        const delay = baseDelayMs * Math.pow(2, attempt - 1); // Exponential backoff: 2s, 4s, 8s
        console.warn(`[withRetry] Attempt ${attempt} failed: ${err.message}. Retrying after ${delay}ms...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
  };

  // Function to reinitialize the Supabase client
  const reinitializeSupabase = () => {
    const { supabaseUrl, supabaseKey } = supabase; // Assuming supabaseClient exports these
    global.supabase = createClient(supabaseUrl, supabaseKey);
    console.log('[reinitializeSupabase] Supabase client reinitialized');
  };

  const fetchUserData = async () => {
    try {
      const { data: sessionData, error } = await supabase.auth.getSession();
      if (error) throw new Error(`Session fetch error: ${error.message}`);

      const user = sessionData?.session?.user;
      if (!user) {
        console.log('No session user found.');
        return;
      }

      setUser(user);
      await initUserProfile(user);

      const { data: profileData, error: profileError } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (profileError) throw new Error(`Profile fetch error: ${profileError.message}`);
      setProfile(profileData || null);

      const hour = new Date().getHours();
      let greetingText = '';
      let iconPath = '';

      if (hour < 12) {
        greetingText = 'Good morning';
        iconPath = '/icons/morning.json';
      } else if (hour < 18) {
        greetingText = 'Good afternoon';
        iconPath = '/icons/afternoon.json';
      } else {
        greetingText = 'Good evening';
        iconPath = '/icons/evening.json';
      }

      setGreeting(greetingText);

      try {
        const res = await fetch(iconPath);
        const anim = await res.json();
        setTimeAnimation(anim);
      } catch (err) {
        console.error('Failed to load time icon:', err);
        setTimeAnimation(null);
      }

    } catch (err) {
      console.error('fetchUserData error:', err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const checkSessionAndFetch = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const user = session?.user;

        if (user) {
          await fetchUserData();
          await fetchAreaScores(user.id);
          await fetchUserRecommendations(user.id);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Session check error:', err.message);
        setLoading(false);
      }
    };

    checkSessionAndFetch();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (_event, session) => {
        try {
          if (session?.user) {
            await fetchUserData();
            await fetchAreaScores(session.user.id);
            await fetchUserRecommendations(session.user.id);
          }
        } catch (err) {
          console.error('Auth state change error:', err.message);
        }
      }
    );

    return () => {
      authListener?.subscription?.unsubscribe();
    };
  }, []);

  const fetchAreaScores = async (userId) => {
    try {
      const { data: insights, error } = await supabase
        .from('user_health_insight')
        .select('health_area_id, findings_json, recommendations_json')
        .eq('user_id', userId);

      if (error) throw error;

      // Pull weights
      const { data: bloodWeights } = await supabase
        .from('blood_marker_health_area')
        .select('blood_marker_id, health_area_id, importance_weight');
      const { data: bloodRefs } = await supabase
        .from('blood_marker_reference')
        .select('blood_marker_id, marker_name');

      const { data: dnaWeights } = await supabase
        .from('dna_marker_health_area')
        .select('dna_id, health_area_id, importance_weight');
      const { data: dnaRefs } = await supabase
        .from('dna_marker_reference')
        .select('dna_id, trait');

      const bloodWeightMap = {};
      for (const ref of bloodRefs) {
        const key = `${ref.marker_name}|${ref.blood_marker_id}`;
        bloodWeightMap[key] = bloodWeights.find(
          w => w.blood_marker_id === ref.blood_marker_id && w.health_area_id
        )?.importance_weight || 1;
      }

      const dnaWeightMap = {};
      for (const ref of dnaRefs) {
        const key = `${ref.trait}|${ref.dna_id}`;
        dnaWeightMap[key] = dnaWeights.find(
          w => w.dna_id === ref.dna_id && w.health_area_id
        )?.importance_weight || 1;
      }

      const scores = insights.map(insight => {
        let totalWeighted = 0;
        let totalWeight = 0;

        for (const m of insight.findings_json.blood_markers || []) {
          const weight = bloodWeights.find(w =>
            bloodRefs.find(r => r.marker_name === m.marker_name && r.blood_marker_id === w.blood_marker_id) &&
            w.health_area_id === insight.health_area_id
          )?.importance_weight || 1;
          const score = m.category === 'strength' ? 1 : m.category === 'warning' ? 0.5 : 0;
          totalWeighted += weight * score;
          totalWeight += weight;
        }

        for (const t of insight.findings_json.dna_traits || []) {
          const weight = dnaWeights.find(w =>
            dnaRefs.find(r => r.trait === t.trait_name && r.dna_id === w.dna_id) &&
            w.health_area_id === insight.health_area_id
          )?.importance_weight || 1;
          const score = t.category === 'strength' ? 1 : t.category === 'warning' ? 0.5 : 0;
          totalWeighted += weight * score;
          totalWeight += weight;
        }

        return {
          health_area_id: insight.health_area_id,
          score: totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) : null,
          recommendations: insight.recommendations_json || {}
        };
      });

      setAreaScores(scores);

      // === Calculate grouped scores ===
      const getGroupAvg = (ids) => {
        const filtered = scores.filter(s => ids.includes(s.health_area_id));
        const valid = filtered.filter(s => s.score !== null);
        const avg = valid.length ? Math.round(valid.reduce((a, b) => a + b.score, 0) / valid.length) : null;
        return avg;
      };

      setOverallScores({
        general: getGroupAvg(['HA001', 'HA002', 'HA003', 'HA004']),
        performance: getGroupAvg(['HA005', 'HA006']),
        longevity: getGroupAvg(['HA007', 'HA008', 'HA009']),
      });
    } catch (e) {
      console.error('❌ Error calculating overall scores:', e);
    }
  };

  const fetchUserRecommendations = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_recommendation')
        .select('category, recommendation, priority, is_selected');

      if (error) throw error;

      const grouped = {};
      const toggles = {};

      for (const rec of data) {
        const cat = rec.category;
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push({
          text: rec.recommendation,
          priority: rec.priority || 'medium',
        });

        toggles[rec.recommendation] = rec.is_selected ?? false;
      }

      setRecommendationData(grouped);
      setActiveToggles(toggles);
    } catch (err) {
      console.error('Failed to load user_recommendation:', err.message);
    }
  };


  const handleLogout = async () => {
    if (isProcessing) return;
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw new Error(`Logout error: ${error.message}`);
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err.message);
    }
  };

    {/* 🔒 TEMPORARILY DISABLING DNA & BLOOD UPLOAD CARDS DURING MIGRATION */}

    /*   const handleDNAUpload = async (e) => {
        if (isProcessing) return;
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
        if (isProcessing) return;
        const file = e.target.files[0];
        if (!file || !user?.id) {
          setBloodMessage('Missing file or user ID.');
          return;
        }
        const result = await uploadAndParseBlood(file, user.id);
        setBloodMessage(result.message);
        if (result.message?.startsWith('Uploaded')) fetchUserData();
      }; */

  const handleTestGPT = async () => {
    if (!user?.id || isProcessing) {
      alert('User not authenticated or processing in progress. Please wait.');
      return;
    }
    setIsProcessing(true);
    try {
      console.log(`🔍 Testing GPT for ${selectedHealthArea}`);
      console.log(`[handleTestGPT] Calling generateHealthInsight with user_id: ${user.id}, health_area: ${selectedHealthArea}`);

      // Wrap generateHealthInsight with a 90-second timeout and retry
      let result;
      try {
        result = await withRetry(() =>
          withTimeout(
            generateHealthInsight({
              user_id: user.id,
              health_area: selectedHealthArea,
            }),
            90000 // 90 seconds
          )
        );
      } catch (genErr) {
        console.error(`[handleTestGPT] generateHealthInsight failed for ${selectedHealthArea}:`, genErr.message, genErr.stack);
        throw new Error(`generateHealthInsight error: ${genErr.message}`);
      }

      console.log(`[handleTestGPT] generateHealthInsight result for ${selectedHealthArea}:`, result);

      if (!result.success) {
        console.error(`[handleTestGPT] generateHealthInsight returned unsuccessful for ${selectedHealthArea}:`, result.error);
        throw new Error(`Error: ${result.error}`);
      }

      setInputJson(result.input_json);
      setPrompt(result.prompt);
      setGptResponse(result.gpt_response);

      let parsed = null;
      let summary = 'Failed to parse GPT response';
      let blood_markers = [];
      let dna_traits = [];
      let recommendations = {};

      if (typeof result.gpt_response === 'string') {
        console.log(`[handleTestGPT] Raw GPT response string:`, result.gpt_response);
        try {
          parsed = JSON.parse(result.gpt_response);
          console.log(`[handleTestGPT] Parsed GPT response:`, parsed);
        } catch (parseErr) {
          console.error(`Failed to parse GPT response for ${selectedHealthArea}:`, parseErr.message);
          summary = `Raw GPT response (unparsed): ${result.gpt_response}`;
        }
      } else if (typeof result.gpt_response === 'object' && result.gpt_response !== null) {
        parsed = result.gpt_response;
        console.log(`[handleTestGPT] GPT response is already an object:`, parsed);
      } else {
        console.error(`Unexpected GPT response format for ${selectedHealthArea}:`, typeof result.gpt_response);
        summary = `Invalid GPT response format: ${result.gpt_response}`;
      }

      if (parsed) {
        summary = parsed.summary || 'No summary provided';
        blood_markers = parsed.blood_markers || [];
        dna_traits = parsed.dna_traits || [];
        recommendations = parsed.recommendations || {};
      }

      // Refresh session before database write
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError || !sessionData?.session) {
        console.error('[handleTestGPT] Session refresh failed:', sessionError?.message);
        throw new Error('Session expired. Please refresh the page.');
      }

      const insertPayload = {
        user_id: user.id,
        health_area_id: selectedHealthArea,
        summary,
        findings_json: {
          blood_markers,
          dna_traits,
        },
        recommendations_json: recommendations,
        gpt_model: 'gpt-4o',
        prompt_version: 'v1', // Fixed: Closed the string and added a comma
        created_at: new Date().toISOString(),
      };

      console.log(`📌 Inserting to DB for ${selectedHealthArea}`, insertPayload);

      const { data: insertResult, error: insertError } = await supabase
        .from('user_health_insight')
        .upsert(insertPayload, {
          onConflict: ['user_id', 'health_area_id'],
        });

      console.log(`[${selectedHealthArea}] Upsert result:`, insertResult, insertError);

      if (insertError) {
        console.error(`[handleTestGPT] DB insert failed for ${selectedHealthArea}:`, insertError.message, insertError.code, insertError.details);
        throw new Error(`Insert error: ${insertError.message} (Code: ${insertError.code})`);
      }
      console.log(`✅ DB insert success for ${selectedHealthArea}`);
      setInsightStatus(`✅ Processed ${selectedHealthArea}`);
    } catch (e) {
      console.error(`Unhandled error in handleTestGPT for ${selectedHealthArea}:`, e.message, e.stack);
      if (e.message.includes('timed out') || e.message.includes('401') || e.message.includes('Session expired')) {
        // Reinitialize Supabase client on timeout or authentication errors
        reinitializeSupabase();
      }
      setInsightStatus(`Error with ${selectedHealthArea}: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  const generateInsightsIndividually = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    const healthAreas = ['HA001', 'HA002', 'HA003', 'HA004', 'HA005', 'HA006', 'HA007', 'HA008', 'HA009'];

    const session = (await supabase.auth.getSession())?.data?.session;
    if (!session) {
      alert('❌ No valid session. Please log in again.');
      setIsProcessing(false);
      return;
    }

    for (const area of healthAreas) {
      setInsightStatus(`Processing ${area}...`);
      console.log(`🔁 Starting ${area}`);

      try {
        const markerResult = await withRetry(() =>
          withTimeout(
            generateHealthInsight({ user_id: user.id, health_area: area }),
            90000
          )
        );
        console.log(`📥 Marker result for ${area}`, markerResult);

        if (!markerResult.success) {
          console.warn(`⚠️ Marker error for ${area}:`, markerResult.error);
          setInsightStatus(`Error with ${area}`);
          continue;
        }

        let parsedResponse;
        if (typeof markerResult.gpt_response === 'string') {
          console.log(`[${area}] Raw GPT response string:`, markerResult.gpt_response);
          try {
            parsedResponse = JSON.parse(markerResult.gpt_response);
            console.log(`[${area}] Parsed string GPT response:`, parsedResponse);
          } catch (err) {
            console.error(`❌ Failed to parse GPT response for ${area}:`, err.message);
            setInsightStatus(`Parse error in ${area}`);
            continue;
          }
        } else if (typeof markerResult.gpt_response === 'object' && markerResult.gpt_response !== null) {
          parsedResponse = markerResult.gpt_response;
          console.log(`[${area}] Parsed object GPT response:`, parsedResponse);
        } else {
          console.error(`❌ Unexpected GPT response format for ${area}:`, typeof markerResult.gpt_response);
          console.log('[RAW GPT RESPONSE]', markerResult.gpt_response);
          setInsightStatus(`Invalid GPT response in ${area}`);
          continue;
        }

        const insertPayload = {
          user_id: user.id,
          health_area_id: area,
          summary: parsedResponse.summary || '',
          findings_json: {
            blood_markers: parsedResponse.blood_markers || [],
            dna_traits: parsedResponse.dna_traits || [],
          },
          recommendations_json: parsedResponse.recommendations || {},
          gpt_model: 'gpt-4o',
          prompt_version: 'v1',
          created_at: new Date().toISOString(),
        };

        console.log(`📌 Inserting to DB for ${area}`, insertPayload);

        const { data: insertResult, error: insertError } = await supabase
          .from('user_health_insight')
          .upsert(insertPayload, {
            onConflict: ['user_id', 'health_area_id'],
          });

        console.log(`[${area}] Upsert result:`, insertResult, insertError);

        if (insertError) {
          console.error(`❌ DB insert failed for ${area}:`, insertError.message);
          setInsightStatus(`DB error for ${area}`);
          continue;
        }

        console.log(`✅ DB insert success for ${area}`);
        setInsightStatus(`✅ Processed ${area}`);
      } catch (err) {
        console.error(`🔥 Unhandled error for ${area}:`, err.message || err);
        if (err.message.includes('timed out')) {
          // Reinitialize Supabase client on timeout to reset network state
          reinitializeSupabase();
        }
        setInsightStatus(`Unhandled error for ${area}`);
        continue;
      }

      await new Promise((r) => setTimeout(r, 5000)); // Increased delay to 5 seconds
    }

    setInsightStatus('✅ All insights processed.');
    setIsProcessing(false);
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
          onClick={() => {
            setMenuOpen((prev) => !prev);
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
          disabled={isProcessing}
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

      <div style={{ height: 20 }} />
      
      <div style={{ position: 'relative', textAlign: 'center', marginTop: 30 }}>
        <h3 style={{ display: 'inline-block', fontWeight: 600, margin: 0, position: 'relative' }}>
          {greeting}, {profile?.user_name || 'there'}
          <span style={{
            position: 'absolute',
            left: '-72px', // 64px width + 8px gap
            top: '50%',
            transform: 'translateY(-50%)',
            width: 64,
            height: 64
          }}>
            <Lottie animationData={timeAnimation} loop autoplay />
          </span>
        </h3>
      </div>

      <ScoreCardsDashboard scores={overallScores} />

      {/* RECOMMENDATIONS CARD*/}

      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: '1.5rem',
          margin: '2rem auto',
          width: '90vw',
          maxWidth: 600,
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: '1rem', color: '#1F2937' }}>
          Consolidated Recommendations
        </h3>

        {['Diet', 'Exercise', 'Lifestyle', 'Supplementation', 'Monitoring'].map((category) => {
          const allRecs = recommendationData[category] || [];

          const deduped = Array.from(new Map(allRecs.map(r => [r.text, r])).values());

          // Sort by priority
          const sorted = deduped.sort((a, b) => {
            const order = { high: 0, medium: 1, low: 2 };
            return order[a.priority] - order[b.priority];
          });

          if (!sorted.length) return null;

          const isOpen = expandedRecCategory === category;

          return (
            <div key={category} style={{ marginBottom: '1.25rem' }} id={`rec-category-${category}`}>
              <div
                onClick={() => {
                  if (expandedRecCategory === category) {
                    // If already open, just close it
                    setExpandedRecCategory(null);
                  } else {
                    // If closed, open it and schedule scrolling
                    setExpandedRecCategory(category);
                    
                    // Use requestAnimationFrame to wait for DOM updates
                    requestAnimationFrame(() => {
                      // Find the target element using the ID we added
                      const targetElement = document.getElementById(`rec-category-${category}`);
                      if (!targetElement) {
                        console.error(`Cannot find element with ID rec-category-${category}`);
                        return;
                      }
                      
                      // Get header height dynamically
                      const header = document.querySelector('div[style*="position: fixed"][style*="top: 0"]');
                      const headerHeight = header ? header.offsetHeight : 60;
                      
                      // Add some padding to avoid butting right against the header
                      const paddingTop = 16;
                      
                      // Calculate the scroll position
                      const elementRect = targetElement.getBoundingClientRect();
                      const absoluteElementTop = elementRect.top + window.pageYOffset;
                      const targetScrollPosition = absoluteElementTop - headerHeight - paddingTop;
                      
                      // Perform the smooth scroll
                      window.scrollTo({
                        top: targetScrollPosition,
                        behavior: 'smooth'
                      });
                    });
                  }
                }}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  cursor: 'pointer',
                  marginBottom: 4,
                }}
              >
                <h4 style={{ fontSize: 16, fontWeight: 600, color: '#111827' }}>{category}</h4>
                {isOpen ? <ChevronUp size={20} /> : <ChevronDown size={20} />}
              </div>

              {isOpen && (
              <div style={{ marginTop: 8 }}>
                {/* Header Row */}
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '1fr 80px 50px', // Match the column widths to the list items
                    gap: 12,
                    alignItems: 'center',
                    paddingBottom: 8,
                  }}
                >
                  <span style={{ fontSize: 10, color: '#6B7280', textAlign: 'left' }}>Action</span>
                  <span style={{ fontSize: 10, color: '#6B7280', textAlign: 'center' }}>Priority</span>
                  <span style={{ fontSize: 10, color: '#6B7280', textAlign: 'center' }}>Add</span>
                </div>

                <ul style={{ paddingLeft: 0, listStyleType: 'none', margin: 0 }}>
                  {sorted.map((rec, i) => (
                    <li
                      key={i}
                      style={{
                        marginBottom: 12,
                        fontSize: 14,
                        display: 'grid',
                        gridTemplateColumns: '1fr 80px 50px', // Match the header column widths
                        gap: 12,
                        alignItems: 'center', // Center vertically
                      }}
                    >
                      {/* Column 1: Action */}
                      <div style={{ textAlign: 'left', color: '#374151' }}>{rec.text}</div>

                      {/* Column 2: Priority label */}
                      <div style={{ textAlign: 'center' }}>
                        <span
                          style={{
                            fontSize: 12,
                            padding: '2px 6px',
                            borderRadius: 4,
                            backgroundColor:
                              rec.priority === 'high' ? '#fee2e2' :
                              rec.priority === 'medium' ? '#fef3c7' :
                              '#e0f2fe',
                            color:
                              rec.priority === 'high' ? '#991b1b' :
                              rec.priority === 'medium' ? '#92400e' :
                              '#1e40af',
                            display: 'inline-block', // Ensure the span takes up the full width
                            minWidth: '50px', // Ensure consistent width for alignment
                            textAlign: 'center',
                          }}
                        >
                          {rec.priority}
                        </span>
                      </div>

                      {/* Column 3: Toggle */}
                      <div style={{ textAlign: 'center' }}>
                        <div
                          onClick={async (e) => {
                          e.stopPropagation(); // Prevent section from toggling open/closed

                          const newState = !activeToggles[rec.text];

                          // 1. Update local UI
                          setActiveToggles(prev => ({
                            ...prev,
                            [rec.text]: newState
                          }));

                          // 2. Persist to Supabase
                          const { error } = await supabase
                            .from('user_recommendation')
                            .update({ is_selected: newState })
                            .eq('user_id', user.id)
                            .eq('recommendation', rec.text)
                            .eq('category', category);

                          if (error) {
                            console.error('Failed to update is_selected:', error.message);
                            alert('Failed to save change. Try again.');
                          }
                        }}

                          style={{
                            width: 36,
                            height: 20,
                            borderRadius: 9999,
                            backgroundColor: activeToggles[rec.text] ? '#10B981' : '#EF4444',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: activeToggles[rec.text] ? 'flex-end' : 'flex-start',
                            padding: 2,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                            margin: '0 auto', // Center the toggle in the column
                          }}
                        >
                          <div
                            style={{
                              width: 16,
                              height: 16,
                              backgroundColor: '#fff',
                              borderRadius: '50%',
                            }}
                          />
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            )}
            </div>
          );
        })}
      </div>

      {/* 🔒 TEMPORARILY DISABLING DNA & BLOOD UPLOAD CARDS DURING MIGRATION */}

      {/*       <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2rem' }}>
              <div className="card">
                <h3>DNA Data</h3>
                <p>Status: {profile?.dna_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}</p>
                <label className="btn btn-primary">
                  Upload DNA
                  <input type="file" accept=".txt" onChange={handleDNAUpload} style={{ display: 'none' }} disabled={isProcessing} />
                </label>
                {message && <p style={{ marginTop: '0.5rem' }}>{message}</p>}
              </div>
              <div className="card">
                <h3>Blood Test</h3>
                <p>Status: {profile?.blood_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}</p>
                <label className="btn btn-primary">
                  Upload Blood
                  <input type="file" accept=".csv" onChange={handleBloodUpload} style={{ display: 'none' }} disabled={isProcessing} />
                </label>
                {bloodMessage && <p style={{ marginTop: '0.5rem' }}>{bloodMessage}</p>}
              </div>
            </div> */}

      <button
        onClick={async () => {
          const result = await importUserRecommendations(user?.id);
          alert(result.success ? `Imported ${result.count} recommendations.` : result.message);
        }}
        style={{
          backgroundColor: '#10B981',
          color: 'white',
          padding: '10px 16px',
          fontSize: 14,
          fontWeight: 600,
          borderRadius: 8,
          marginBottom: 24,
          border: 'none',
          cursor: 'pointer'
        }}
      >
        Import Recommendations from Insights
      </button>

      <div style={{ marginTop: '3rem' }}>
        <h2>Quick Actions</h2>

        {/* COMMENTING OUT LEGACY BUTTONS

        <button className="btn btn-primary" disabled={isProcessing}>
          Start New Report
        </button>
        <button className="btn btn-primary" onClick={() => navigate('/insights/cardiovascular')} disabled={isProcessing}>
          View Cardio Insights
        </button>

        <button
          onClick={generateInsightsIndividually}
          className="btn btn-primary"
          style={{ backgroundColor: '#3ab3a1', marginTop: 12 }}
          disabled={isProcessing}
        >
          Generate All Insights
        </button>

        {insightStatus && <p style={{ marginTop: '1rem', fontWeight: 'bold' }}>{insightStatus}</p>}

        <button className="btn btn-primary" disabled={isProcessing}>
          Recommendations
        </button>
        */}

        <div style={{ marginTop: '1rem' }}>
          <label htmlFor="healthAreaSelect" style={{ marginRight: '0.5rem' }}>
            Select Health Area for Test:
          </label>
          <select
            id="healthAreaSelect"
            value={selectedHealthArea}
            onChange={(e) => setSelectedHealthArea(e.target.value)}
            disabled={isProcessing}
            style={{ marginLeft: '0.5rem' }}
          >
            <option value="HA001">Metabolic Health</option>
            <option value="HA002">Cardiovascular Health</option>
            <option value="HA003">Nutrient & Vitamin Status</option>
            <option value="HA004">Hormonal Balance</option>
            <option value="HA005">Cognitive & Mood</option>
            <option value="HA006">Fitness & Recovery</option>
            <option value="HA007">Immune Function</option>
            <option value="HA008">Liver & Detox</option>
            <option value="HA009">Longevity & Inflammation</option>
          </select>
        </div>

        <button
          className="btn"
          onClick={handleTestGPT}
          style={{ backgroundColor: '#dc3545', color: 'white', border: 'none', marginTop: '0.5rem' }}
          disabled={isProcessing}
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
          <pre style={{ whiteSpace: 'pre-wrap', overflowWrap: 'break-word' }}>
            {typeof gptResponse === 'object' ? JSON.stringify(gptResponse, null, 2) : gptResponse}
          </pre>
        </div>
      )}

      <button onClick={handleLogout} className="btn btn-primary" style={{ marginTop: '2rem' }} disabled={isProcessing}>
        Sign Out
      </button>
    </div>
  );
}

export default DashboardPage;