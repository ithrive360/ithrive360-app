import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import {
  Heart, AlertCircle, CheckCircle, AlertTriangle,
  ChevronDown, ChevronUp, Utensils, Pill, Dumbbell, Smile,
  ArrowLeft, Droplet, Dna, ListChecks
} from 'lucide-react';
import logo from '../assets/logo.png';

export default function CardiovascularInsightsPage() {
  const [activeTab, setActiveTab] = useState('blood');
  const [expandedSection, setExpandedSection] = useState('');
  const [bloodGroupOpen, setBloodGroupOpen] = useState({ strength: false, warning: false, risk: true });
  const [dnaGroupOpen, setDnaGroupOpen] = useState({ strength: false, warning: false, risk: true });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchInsight = async () => {
      const { data: sessionData, error } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        console.error('User not logged in.');
        return;
      }

      const { data: insightData, error: fetchError } = await supabase
        .from('user_health_insight')
        .select('summary, findings_json, recommendations_json')
        .eq('user_id', user.id)
        .eq('health_area_id', 'HA002')
        .single();

      if (fetchError) {
        console.error('Error fetching insight:', fetchError.message);
      } else {
        setData({
          health_area: 'Cardiovascular Health',
          summary: insightData.summary,
          blood_markers: insightData.findings_json?.blood_markers || [],
          dna_traits: insightData.findings_json?.dna_traits || [],
          recommendations: insightData.recommendations_json || {}
        });
      }

      setLoading(false);
    };

    fetchInsight();
  }, []);

  if (loading) return <p>Loading insights...</p>;
  if (!data) return <p>No insights found for Cardiovascular Health.</p>;

  const bloodStats = {
    strength: data.blood_markers.filter(m => m.category === 'strength').length,
    warning: data.blood_markers.filter(m => m.category === 'warning').length,
    risk: data.blood_markers.filter(m => m.category === 'risk').length,
    total: data.blood_markers.length
  };

  const dnaStats = {
    strength: data.dna_traits.filter(m => m.category === 'strength').length,
    warning: data.dna_traits.filter(m => m.category === 'warning').length,
    risk: data.dna_traits.filter(m => m.category === 'risk').length,
    total: data.dna_traits.length
  };

  const getCategoryIcon = (cat) => {
    const size = 24;
    const style = { width: size, height: size };
    if (cat === 'strength') return <CheckCircle style={{ ...style, color: '#10B981' }} />;
    if (cat === 'warning') return <AlertTriangle style={{ ...style, color: '#F59E0B' }} />;
    if (cat === 'risk') return <AlertCircle style={{ ...style, color: '#EF4444' }} />;
    return null;
  };

  const getCategoryStyle = (cat) => {
    if (cat === 'strength') return { backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' };
    if (cat === 'warning') return { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
    if (cat === 'risk') return { backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' };
    return { backgroundColor: '#F3F4F6', color: '#1F2937', border: '1px solid #E5E7EB' };
  };

  const getStatusStyle = (status, category) => {
    if (category === 'strength') return { color: '#059669' };
    if (category === 'warning') return { color: '#F59E0B' };
    if (category === 'risk') return { color: '#DC2626' };
    return { color: '#4B5563' };
  };

  const getRecIcon = (title) => {
    const icons = {
      Diet: <Utensils style={{ width: 20, height: 20, marginRight: 8, color: '#4B5563' }} />,
      Supplementation: <Pill style={{ width: 20, height: 20, marginRight: 8, color: '#4B5563' }} />,
      Exercise: <Dumbbell style={{ width: 20, height: 20, marginRight: 8, color: '#4B5563' }} />,
      Lifestyle: <Smile style={{ width: 20, height: 20, marginRight: 8, color: '#4B5563' }} />
    };
    return icons[title] || null;
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const toggleBloodGroup = (cat) => {
    setBloodGroupOpen(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleDnaGroup = (cat) => {
    setDnaGroupOpen(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const healthScore = Math.round((bloodStats.strength + dnaStats.strength) / (bloodStats.total + dnaStats.total) * 100);

  return (
    <div className="dashboard" style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', backgroundColor: 'white' }}>
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
          onClick={() => navigate('/dashboard')}
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
          aria-label="Go back to dashboard"
        >
          <ArrowLeft size={28} color="#3ab3a1" />
        </button>
        <img src={logo} alt="iThrive360 Logo" style={{ height: 32 }} />
      </div>

      <div style={{ height: 60 }} />

      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
          <Heart style={{ color: '#EF4444', width: 32, height: 32, marginRight: 8 }} />
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', margin: 0 }}>Cardiovascular Health</h1>
        </div>
        <div style={{ display: 'inline-flex', gap: 8 }}>
          <span style={{ backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', borderRadius: '9999px', padding: '6px 12px', fontWeight: 600, fontSize: 14 }}>
            <CheckCircle style={{ width: 18, height: 18, marginRight: 6 }} />
            {bloodStats.strength + dnaStats.strength}
          </span>
          <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', borderRadius: '9999px', padding: '6px 12px', fontWeight: 600, fontSize: 14 }}>
            <AlertTriangle style={{ width: 18, height: 18, marginRight: 6 }} />
            {bloodStats.warning + dnaStats.warning}
          </span>
          <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', borderRadius: '9999px', padding: '6px 12px', fontWeight: 600, fontSize: 14 }}>
            <AlertCircle style={{ width: 18, height: 18, marginRight: 6 }} />
            {bloodStats.risk + dnaStats.risk}
          </span>
        </div>
      </div>

      <div style={{
        marginBottom: 24,
        padding: 16,
        background: 'linear-gradient(to right, #6366F1, #4F46E5)',
        borderRadius: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white'
      }}>
        <div>
          <h3 style={{ fontWeight: 'bold', fontSize: 18 }}>Cardiovascular Health Score</h3>
          <p style={{ fontSize: 14, marginTop: 4 }}>
            Based on {bloodStats.total} blood markers and {dnaStats.total} genetic traits
          </p>
        </div>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `conic-gradient(#93C5FD ${healthScore}%, #312E81 ${healthScore}%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#FFFFFF',
        }}>
          {healthScore}%
        </div>
      </div>

<div style={{ display: 'flex', width: '100%', maxWidth: '1100px', margin: '0 auto 24px', gap: 0 }}>
  {[
    { key: 'blood', icon: <Droplet size={18} />, label: 'Blood', count: bloodStats.total, color: '#3B82F6' },
    { key: 'dna', icon: <Dna size={18} />, label: 'DNA', count: dnaStats.total, color: '#8B5CF6' },
    { key: 'recommendations', icon: <ListChecks size={18} />, label: 'Action', count: '', color: '#10B981' }
  ].map(tab => (
    <button
      key={tab.key}
      onClick={() => setActiveTab(tab.key)}
      style={{
        flex: 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        padding: '10px 0',
        backgroundColor:
          activeTab === tab.key
            ? (tab.key === 'blood' ? '#EF4444' : tab.key === 'dna' ? '#3B82F6' : '#10B981')
            : '#F3F4F6',
        color: activeTab === tab.key ? '#FFFFFF' : '#374151',
        outline: 'none',
        fontWeight: 600,
        fontSize: 14,
        border: '1px solid #E5E7EB',
        borderLeft: tab.key === 'blood' ? '1px solid #E5E7EB' : 'none',
        borderRight: tab.key === 'recommendations' ? '1px solid #E5E7EB' : 'none',
        cursor: 'pointer',
        borderRadius: tab.key === 'blood'
          ? '8px 0 0 8px'
          : tab.key === 'recommendations'
          ? '0 8px 8px 0'
          : '0'
      }}
    >
      {tab.icon}
      {tab.label} {tab.count !== '' && `(${tab.count})`}
    </button>
  ))}
</div>

      {activeTab === 'blood' && ['strength', 'warning', 'risk'].map(cat => {
        const markers = data.blood_markers.filter(m => m.category === cat);
        if (!markers.length) return null;
        return (
          <div key={cat} style={{ ...getCategoryStyle(cat), borderRadius: 8, marginBottom: 16, width: '100%', minWidth: '300px' }}>
            <div onClick={() => toggleBloodGroup(cat)} style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                {getCategoryIcon(cat)} <span style={{ marginLeft: 8, textTransform: 'capitalize' }}>{cat}s ({markers.length})</span>
              </h3>
              {bloodGroupOpen[cat] ? <ChevronUp style={{ width: 20, height: 20 }} /> : <ChevronDown style={{ width: 20, height: 20 }} />}
            </div>
            {bloodGroupOpen[cat] && (
              <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
                {markers.map((marker, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontWeight: 600, margin: 0 }}>{marker.marker_name}</h4>
                      <span style={{ fontWeight: 600, ...getStatusStyle(marker.status, marker.category) }}>{marker.status}</span>
                    </div>
                    <p style={{ fontSize: 14, marginTop: 4 }}>{marker.insight}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}


      {activeTab === 'dna' && ['strength', 'warning', 'risk'].map(cat => {
        const traits = data.dna_traits.filter(t => t.category === cat);
        if (!traits.length) return null;
        return (
          <div key={cat} style={{ ...getCategoryStyle(cat), borderRadius: 8, marginBottom: 16, width: '100%', minWidth: '300px' }}>
            <div onClick={() => toggleDnaGroup(cat)} style={{ padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center', cursor: 'pointer' }}>
              <h3 style={{ display: 'flex', alignItems: 'center', fontWeight: 600 }}>
                {getCategoryIcon(cat)} <span style={{ marginLeft: 8, textTransform: 'capitalize' }}>{cat}s ({traits.length})</span>
              </h3>
              {dnaGroupOpen[cat] ? <ChevronUp style={{ width: 20, height: 20 }} /> : <ChevronDown style={{ width: 20, height: 20 }} />}
            </div>
            {dnaGroupOpen[cat] && (
              <div style={{ padding: '0 16px 16px 16px', display: 'flex', flexDirection: 'column', gap: 16, textAlign: 'left' }}>
                {traits.map((trait, idx) => (
                  <div key={idx}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <h4 style={{ fontWeight: 600, margin: 0 }}>{trait.trait_name}</h4>
                      <span style={{ fontWeight: 600, ...getStatusStyle(trait.effect, trait.category) }}>{trait.category.charAt(0).toUpperCase() + trait.category.slice(1)}</span>
                    </div>
                    <p style={{ fontSize: 12, color: '#6B7280', margin: '4px 0' }}>RSID: {trait.rsid}</p>
                    <p style={{ fontSize: 14 }}>{trait.insight}</p>
                    <p style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>{trait.effect}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })}

      {activeTab === 'recommendations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, width: '100%', minWidth: '300px' }}>
          {Object.entries(data.recommendations).map(([title, items]) => (
            <div key={title} style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', width: '100%', minWidth: '300px' }}>
              <div onClick={() => toggleSection(title)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', cursor: 'pointer' }}>
                <h3 style={{ display: 'flex', alignItems: 'center', fontWeight: 500, color: '#1F2937' }}>
                  {getRecIcon(title)} {title}
                </h3>
                {expandedSection === title ? <ChevronUp style={{ width: 20, height: 20, color: '#6B7280' }} /> : <ChevronDown style={{ width: 20, height: 20, color: '#6B7280' }} />}
              </div>
              {expandedSection === title && (
                <div style={{ padding: 16, backgroundColor: '#FFFFFF', textAlign: 'left' }}>
                  <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                    {items.map((item, i) => (
                      <li key={i} style={{ margin: '8px 0', color: '#4B5563' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
