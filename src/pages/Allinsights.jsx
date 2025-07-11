import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import {
  Heart, AlertCircle, CheckCircle, AlertTriangle,
  ChevronDown, ChevronUp, Utensils, Pill, Dumbbell, Smile,
  Droplet, Dna, ListChecks, Brain, ShieldCheck, Flame, Apple, Moon, Activity
} from 'lucide-react';
import logo from '../assets/logo.png';
import SidebarMenu from './SidebarMenu';
import { Menu, X } from 'lucide-react';
import { useRef } from 'react'; //HORIZONTAL SCROLLER

const healthIcons = {
  HA001: Apple,
  HA002: Heart,
  HA003: Utensils,
  HA004: Pill,
  HA005: Activity,
  HA006: Moon,
  HA007: Brain,
  HA008: ShieldCheck,
  HA009: Flame
};

export default function CardiovascularInsightsPage() {
  const [activeTab, setActiveTab] = useState('blood');
  const [expandedSection, setExpandedSection] = useState('');
  const [bloodGroupOpen, setBloodGroupOpen] = useState({ strength: false, warning: false, risk: true });
  const [dnaGroupOpen, setDnaGroupOpen] = useState({ strength: false, warning: false, risk: true });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedHA, setSelectedHA] = useState('HA001');
  const [healthAreas, setHealthAreas] = useState([]);
  const [healthScore, setHealthScore] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [preloadedInsights, setPreloadedInsights] = useState({}); // New state to store preloaded data

  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) {
        console.error('User not logged in.');
        setLoading(false);
        return;
      }
      setUser(user);

      const { data: profileData } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      console.log('Fetched profile data:', profileData);
      setProfile(profileData || null);

      // Fetch health areas
      const { data: areas } = await supabase.from('health_area_reference').select('health_area_id, health_area_name');
      setHealthAreas(areas || []);

      // Fetch insights for all health areas
      if (areas && areas.length > 0) {
        const insightsMap = {};

        // Fetch weights and references once for all health areas
        const { data: bloodWeights } = await supabase.from('blood_marker_health_area').select('blood_marker_id, health_area_id, importance_weight');
        const { data: bloodRefs } = await supabase.from('blood_marker_reference').select('blood_marker_id, marker_name');
        const { data: dnaWeights } = await supabase.from('dna_marker_health_area').select('dna_id, health_area_id, importance_weight');
        const { data: dnaRefs } = await supabase.from('dna_marker_reference').select('dna_id, trait');

        // Fetch insights for all health areas at once
        const { data: allInsights, error: fetchError } = await supabase
          .from('user_health_insight')
          .select('health_area_id, summary, findings_json, recommendations_json')
          .eq('user_id', user.id)
          .in('health_area_id', areas.map(area => area.health_area_id));

        if (fetchError || !allInsights) {
          console.error('Error fetching insights:', fetchError?.message || 'No data');
        } else {
          for (const insight of allInsights) {
            const haId = insight.health_area_id;
            const name = areas.find(h => h.health_area_id === haId)?.health_area_name || haId;
            const blood_markers = insight.findings_json?.blood_markers || [];
            const dna_traits = insight.findings_json?.dna_traits || [];

            // Precompute weight maps for this health area
            const bloodWeightMap = {};
            for (const ref of bloodRefs) {
              const match = bloodWeights.find(w => w.blood_marker_id === ref.blood_marker_id && w.health_area_id === haId);
              if (match) bloodWeightMap[ref.marker_name] = match.importance_weight;
            }

            const dnaWeightMap = {};
            for (const ref of dnaRefs) {
              const match = dnaWeights.find(w => w.dna_id === ref.dna_id && w.health_area_id === haId);
              if (match) dnaWeightMap[ref.trait] = match.importance_weight;
            }

            let totalWeighted = 0;
            let totalWeight = 0;

            for (const m of blood_markers) {
              const w = bloodWeightMap[m.marker_name] || 1;
              const score = m.category === 'strength' ? 1 : m.category === 'warning' ? 0.5 : 0;
              totalWeighted += w * score;
              totalWeight += w;
            }

            for (const t of dna_traits) {
              const w = dnaWeightMap[t.trait_name] || 1;
              const score = t.category === 'strength' ? 1 : t.category === 'warning' ? 0.5 : 0;
              totalWeighted += w * score;
              totalWeight += w;
            }

            const score = totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) : null;

            insightsMap[haId] = {
              health_area: name,
              summary: insight.summary,
              blood_markers,
              dna_traits,
              recommendations: insight.recommendations_json || {},
              healthScore: score
            };
          }
        }

        setPreloadedInsights(insightsMap);

        // Set initial data for the default selected health area (HA001)
        if (insightsMap['HA001']) {
          setData(insightsMap['HA001']);
          setHealthScore(insightsMap['HA001'].healthScore);
        } else {
          setData(null);
          setHealthScore(null);
        }
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  // Update data and healthScore when selectedHA changes
  useEffect(() => {
    if (preloadedInsights[selectedHA]) {
      setData(preloadedInsights[selectedHA]);
      setHealthScore(preloadedInsights[selectedHA].healthScore);
    } else {
      setData(null);
      setHealthScore(null);
    }
  }, [selectedHA, preloadedInsights]);

  const IconForArea = ({ id }) => {
    const Icon = healthIcons[id] || Heart;
    return <Icon size={24} />;
  };

  const bloodStats = {
    strength: data?.blood_markers?.filter(m => m.category === 'strength').length || 0,
    warning: data?.blood_markers?.filter(m => m.category === 'warning').length || 0,
    risk: data?.blood_markers?.filter(m => m.category === 'risk').length || 0,
    total: data?.blood_markers?.length || 0
  };

  const dnaStats = {
    strength: data?.dna_traits?.filter(m => m.category === 'strength').length || 0,
    warning: data?.dna_traits?.filter(m => m.category === 'warning').length || 0,
    risk: data?.dna_traits?.filter(m => m.category === 'risk').length || 0,
    total: data?.dna_traits?.length || 0
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

    //HORIZONTAL SCROLLER

    const scrollRef = useRef(null);
    useEffect(() => {
      if (!scrollRef.current || !healthAreas.length) return;

      const selected = scrollRef.current.querySelector(`[data-id="${selectedHA}"]`);
      if (selected) {
        const container = scrollRef.current;
        const scrollPos = selected.offsetLeft - container.offsetWidth / 2 + selected.offsetWidth / 2;
        container.scrollTo({ left: scrollPos, behavior: 'smooth' });
      }
    }, [healthAreas]); // Runs once when healthAreas load

    const handleScroll = () => {
      if (!scrollRef.current) return;
      const children = Array.from(scrollRef.current.children);
      const center = scrollRef.current.offsetWidth / 2;

      let closest = null;
      let closestDist = Infinity;

      children.forEach((child) => {
        const box = child.getBoundingClientRect();
        const dist = Math.abs(box.left + box.width / 2 - center);
        if (dist < closestDist) {
          closestDist = dist;
          closest = child;
        }
      });

      if (closest) {
        const id = closest.getAttribute('data-id');
        if (id && id !== selectedHA) setSelectedHA(id);
      }
    };

    //END OF HORIZONTAL SCROLLER

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const toggleBloodGroup = (cat) => {
    setBloodGroupOpen(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  const toggleDnaGroup = (cat) => {
    setDnaGroupOpen(prev => ({ ...prev, [cat]: !prev[cat] }));
  };

  if (loading) return <p>Loading insights...</p>;
  if (!data) return <p>No insights found for selected health area.</p>;

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', backgroundColor: 'white' }}>
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
          onClick={() => setMenuOpen((prev) => !prev)}
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

      <div style={{ height: 60 }} />

      {profile && (
        <SidebarMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          onLogout={async () => {
            await supabase.auth.signOut();
            window.location.href = '/';
          }}
          profile={profile}
        />
      )}

      {/* HORIZONTAL SCROLLER */}

      <div style={{ marginBottom: 32 }}>
      <div
          ref={scrollRef}
          onScroll={handleScroll}
          style={{
            display: 'flex',
            overflowX: 'auto',
            scrollSnapType: 'x mandatory',
            gap: 16,
            padding: '8px 12px',
            WebkitOverflowScrolling: 'touch',
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
            maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)'
          }}
          className="scroll-strip"
        >
          {/* LEFT SPACER */}
          <div style={{ flex: '0 0 auto', width: 'calc(50vw - 40px)' }} />

          {healthAreas.map(area => {
            const Icon = healthIcons[area.health_area_id] || Heart;
            const isActive = selectedHA === area.health_area_id;
            return (
              <div
                key={area.health_area_id}
                data-id={area.health_area_id}
                onClick={(e) => {
                  setSelectedHA(area.health_area_id);

                  const container = scrollRef.current;
                  const item = e.currentTarget;

                  if (container && item) {
                    const scrollPos = item.offsetLeft - container.offsetWidth / 2 + item.offsetWidth / 2;
                    container.scrollTo({ left: scrollPos, behavior: 'smooth' });
                  }
                }}
                
                style={{
                  flex: '0 0 auto',
                  scrollSnapAlign: 'center',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  padding: '6px 8px',
                  transition: 'transform 0.2s',
                  transform: isActive ? 'scale(1.2)' : 'scale(1)',
                  color: isActive ? '#3ab3a1' : '#9CA3AF',
                  borderBottom: isActive ? '3px solid #3ab3a1' : '3px solid transparent'
                }}
              >
                <>
                  <Icon size={24} />
                  <div style={{ fontSize: 12, marginTop: 4 }}>
                    {area.health_area_name.split('&')[0].split(' ')[0]}
                  </div>
                </>
              </div>
            );
          })}

          {/* RIGHT SPACER */}
          <div style={{ flex: '0 0 auto', width: 'calc(50vw - 40px)' }} />
        </div>
        </div>

      {/* END OF HORIZONTAL SCROLLER */}


      {/* DELETE - OLD GRID SELECTOR - KEPT FOR TEMPORARY REFERENCE
      <div style={{
        display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px',
        margin: '12px auto 28px', maxWidth: 320
      }}>
        {healthAreas.map(area => {
          const Icon = healthIcons[area.health_area_id] || Heart;
          return (
            <button key={area.health_area_id} onClick={() => setSelectedHA(area.health_area_id)}
              style={{
                backgroundColor: selectedHA === area.health_area_id ? '#3ab3a1' : '#F3F4F6',
                borderRadius: 8, border: '1px solid #E5E7EB', padding: '16px 8px',
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                fontWeight: 600, fontSize: 13, color: selectedHA === area.health_area_id ? '#fff' : '#1F2937'
              }}>
              <Icon size={24} style={{ marginBottom: 6 }} />
              {area.health_area_name.split('&')[0].split(' ')[0]}
            </button>
          );
        })}
      </div>
      */}

      <div style={{ marginBottom: 12, textAlign: 'center' }}>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', marginBottom: 6 }}>
          <IconForArea id={selectedHA} />
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937', margin: 0, marginLeft: 8 }}>{data.health_area}</h1>
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

      <div
        style={{
          marginBottom: 24,
          padding: 16,
          backgroundColor: '#FFFFFF',
          border: '1px solid #E5E7EB',
          borderRadius: 12,
          boxShadow: '0 1px 4px rgba(0, 0, 0, 0.05)',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
          <h3 style={{ fontSize: 16, fontWeight: 600, color: '#1F2937', margin: 0 }}>Health Score</h3>
          <span style={{ fontSize: 16, fontWeight: 700, color: '#1F2937' }}>
            {healthScore ?? '--'} / 100
          </span>
        </div>

        <div
          style={{
            height: 10,
            borderRadius: 8,
            backgroundColor: '#E5E7EB',
            overflow: 'hidden',
            marginBottom: 8,
          }}
        >
          <div
            style={{
              width: `${healthScore ?? 0}%`,
              height: '100%',
              backgroundColor:
                healthScore < 50
                  ? '#EF4444'
                  : healthScore < 75
                  ? '#F59E0B'
                  : '#10B981',
              transition: 'width 0.5s ease',
            }}
          />
        </div>

        <p style={{ fontSize: 13, color: '#6B7280', margin: 0 }}>
          Based on {bloodStats.total} blood markers and {dnaStats.total} genetic traits
        </p>

        {data?.summary && (
          <p style={{ fontSize: 14, color: '#374151', marginTop: 12 }}>
            {data.summary}
          </p>
        )}
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
          {['Diet', 'Supplementation', 'Exercise', 'Lifestyle', 'Monitoring']
            .filter(title => data.recommendations[title])
            .map(title => {
              const items = data.recommendations[title];
              return (
                <div key={title} style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden', width: '100%', minWidth: '300px' }}>
                  <div onClick={() => toggleSection(title)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', cursor: 'pointer' }}>
                    <h3 style={{ display: 'flex', alignItems: 'center', fontWeight: 500, color: '#1F2937' }}>
                      {getRecIcon(title)} {title}
                    </h3>
                    {expandedSection === title ? (
                      <ChevronUp style={{ width: 20, height: 20, color: '#6B7280' }} />
                    ) : (
                      <ChevronDown style={{ width: 20, height: 20, color: '#6B7280' }} />
                    )}
                  </div>
                  {expandedSection === title && (
                    <div style={{ padding: 16, backgroundColor: '#FFFFFF', textAlign: 'left' }}>
                      <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                        {items.map((item, i) => {
                          const text = typeof item === 'string' ? item : item.text;
                          const priority = typeof item === 'object' && item.priority;

                          return (
                            <li key={i} style={{ margin: '8px 0', color: '#4B5563' }}>
                              {text}
                              {priority && (
                                <span
                                  style={{
                                    fontSize: '0.75rem',
                                    marginLeft: 8,
                                    padding: '2px 6px',
                                    borderRadius: 4,
                                    backgroundColor:
                                      priority === 'high'
                                        ? '#fee2e2'
                                        : priority === 'medium'
                                        ? '#fef3c7'
                                        : '#e0f2fe',
                                    color:
                                      priority === 'high'
                                        ? '#991b1b'
                                        : priority === 'medium'
                                        ? '#92400e'
                                        : '#1e40af',
                                  }}
                                >
                                  {priority}
                                </span>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                    </div>
                  )}
                </div>
              );
            })}
        </div>
      )}
    </div>
  );
}