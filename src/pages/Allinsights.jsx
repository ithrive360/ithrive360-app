import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import { useAreaInsights } from '../features/insights/hooks/useAreaInsights';

import {
  Heart, AlertCircle, CheckCircle, AlertTriangle,
  ChevronDown, ChevronUp, Utensils, Pill, Dumbbell, Smile,
  Droplet, Dna, ListChecks, Brain, ShieldCheck, Flame, Apple, Moon, Activity, Menu, X
} from 'lucide-react';
import logo from '../assets/logo.png';
import SidebarMenu from './SidebarMenu';
import { ErrorBoundary } from '../components/ErrorBoundary';

const healthIcons = {
  HA001: Apple, HA002: Heart, HA003: Utensils,
  HA004: Pill, HA005: Activity, HA006: Moon,
  HA007: Brain, HA008: ShieldCheck, HA009: Flame
};

export default function Allinsights() {
  const { user, profile, loading: userLoading } = useUserProfile();
  const { healthAreas, preloadedInsights, loading: dataLoading } = useAreaInsights(user?.id);


  const [selectedHA, setSelectedHA] = useState('HA001');
  const [activeTab, setActiveTab] = useState('blood');
  const [expandedSection, setExpandedSection] = useState('');
  const [bloodGroupOpen, setBloodGroupOpen] = useState({ strength: false, warning: false, risk: true });
  const [dnaGroupOpen, setDnaGroupOpen] = useState({ strength: false, warning: false, risk: true });
  const [menuOpen, setMenuOpen] = useState(false);

  const scrollRef = useRef(null);

  useEffect(() => {
    if (!scrollRef.current || !healthAreas.length) return;
    const selected = scrollRef.current.querySelector(`[data-id="${selectedHA}"]`);
    if (selected) {
      const scrollPos = selected.offsetLeft - scrollRef.current.offsetWidth / 2 + selected.offsetWidth / 2;
      // We purposefully don't smooth scroll on mount to avoid triggering handleScroll
      scrollRef.current.scrollTo({ left: scrollPos, behavior: 'auto' });
    }
  }, [healthAreas]); // removed selectedHA to prevent active fighting with the handleScroll function

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

  if (userLoading || dataLoading) {
    return <div className="flex h-screen items-center justify-center p-4">Loading insights...</div>;
  }

  const data = preloadedInsights[selectedHA];
  if (!data) return <div className="flex h-screen items-center justify-center p-4 text-center">No insights found for selected health area. Please generate them from the dashboard.</div>;

  const IconForArea = healthIcons[selectedHA] || Heart;

  const bloodStats = data ? {
    strength: data.blood_markers.filter(m => m.category === 'strength').length,
    warning: data.blood_markers.filter(m => m.category === 'warning').length,
    risk: data.blood_markers.filter(m => m.category === 'risk').length,
    total: data.blood_markers.length
  } : { strength: 0, warning: 0, risk: 0, total: 0 };

  const dnaStats = data ? {
    strength: data.dna_traits.filter(m => m.category === 'strength').length,
    warning: data.dna_traits.filter(m => m.category === 'warning').length,
    risk: data.dna_traits.filter(m => m.category === 'risk').length,
    total: data.dna_traits.length
  } : { strength: 0, warning: 0, risk: 0, total: 0 };

  return (
    <ErrorBoundary>
      <div className="font-sans px-6 py-8 max-w-5xl mx-auto bg-white min-h-screen">
        <div className="fixed top-0 left-0 w-full bg-white flex items-center justify-center py-3 px-4 z-50 shadow-sm">
          <button onClick={() => setMenuOpen(!menuOpen)} className="absolute left-4 bg-transparent outline-none">
            {menuOpen ? <X size={28} className="text-emerald-500" /> : <Menu size={28} className="text-emerald-500" />}
          </button>
          <img src={logo} alt="iThrive360 Logo" className="h-8" />
        </div>

        <div className="h-16" />

        {profile && (
          <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onLogout={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} profile={profile} />
        )}

        {/* HORIZONTAL SCROLLER */}
        <div className="mb-8">
          <div ref={scrollRef} onScroll={handleScroll} className="flex overflow-x-auto snap-x snap-mandatory gap-4 px-3 py-2" style={{ maskImage: 'linear-gradient(to right, transparent 0%, black 10%, black 90%, transparent 100%)', scrollbarWidth: 'none', msOverflowStyle: 'none' }}>
            <div className="flex-none" style={{ width: 'calc(50vw - 40px)' }} />

            {healthAreas.map(area => {
              const Icon = healthIcons[area.health_area_id] || Heart;
              const isActive = selectedHA === area.health_area_id;
              return (
                <div
                  key={area.health_area_id}
                  data-id={area.health_area_id}
                  onClick={() => {
                    setSelectedHA(area.health_area_id);
                    const selected = scrollRef.current.querySelector(`[data-id="${area.health_area_id}"]`);
                    if (selected) {
                      const scrollPos = selected.offsetLeft - scrollRef.current.offsetWidth / 2 + selected.offsetWidth / 2;
                      scrollRef.current.scrollTo({ left: scrollPos, behavior: 'smooth' });
                    }
                  }}
                  className={`flex-none snap-center flex flex-col items-center p-2 pt-3 pb-3 transition-transform cursor-pointer border-b-4 ${isActive ? 'scale-110 text-emerald-500 border-emerald-500' : 'scale-100 text-gray-400 border-transparent'}`}
                >
                  <Icon size={24} />
                  <div className="text-xs mt-1 text-center font-medium max-w-[80px] truncate">{area.health_area_name.split('&')[0].split(' ')[0]}</div>
                </div>
              );
            })}
            <div className="flex-none" style={{ width: 'calc(50vw - 40px)' }} />
          </div>
        </div>

        {data && (
          <>
            {/* Header Info */}
            <div className="mb-4 text-center">
              <div className="flex justify-center items-center mb-2">
                <IconForArea size={28} className="text-gray-800" />
                <h1 className="text-2xl font-bold text-gray-800 ml-2">{data.health_area}</h1>
              </div>
              <div className="inline-flex gap-2">
                <span className="bg-green-100 text-green-800 flex items-center rounded-full px-3 py-1 font-semibold text-sm">
                  <CheckCircle className="w-4 h-4 mr-1.5" />{bloodStats.strength + dnaStats.strength}
                </span>
                <span className="bg-amber-100 text-amber-800 flex items-center rounded-full px-3 py-1 font-semibold text-sm">
                  <AlertTriangle className="w-4 h-4 mr-1.5" />{bloodStats.warning + dnaStats.warning}
                </span>
                <span className="bg-red-100 text-red-800 flex items-center rounded-full px-3 py-1 font-semibold text-sm">
                  <AlertCircle className="w-4 h-4 mr-1.5" />{bloodStats.risk + dnaStats.risk}
                </span>
              </div>
            </div>

            <div className="mb-6 p-4 bg-white border border-gray-200 rounded-xl shadow-sm">
              <div className="flex justify-between mb-2">
                <h3 className="text-base font-semibold text-gray-800 m-0">Health Score</h3>
                <span className="text-base font-bold text-gray-800">{data.healthScore ?? '--'} / 100</span>
              </div>
              <div className="h-2.5 rounded-full bg-gray-200 overflow-hidden mb-2">
                <div
                  className={`h-full transition-all duration-500 ${data.healthScore < 50 ? 'bg-red-500' : data.healthScore < 75 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                  style={{ width: `${data.healthScore ?? 0}%` }}
                />
              </div>
              <p className="text-xs text-gray-500 m-0 text-left">Based on {bloodStats.total} blood markers and {dnaStats.total} genetic traits</p>
              {data.summary && <p className="text-sm text-gray-700 mt-3 text-left leading-relaxed">{data.summary}</p>}
            </div>

            <div className="flex w-full max-w-5xl mx-auto mb-6">
              {[
                { key: 'blood', icon: <Droplet size={18} />, label: 'Blood', count: bloodStats.total },
                { key: 'dna', icon: <Dna size={18} />, label: 'DNA', count: dnaStats.total },
                { key: 'recommendations', icon: <ListChecks size={18} />, label: 'Action', count: '' }
              ].map((tab, idx) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 font-semibold text-sm outline-none transition
                  ${activeTab === tab.key ? (tab.key === 'blood' ? 'bg-red-500 text-white' : tab.key === 'dna' ? 'bg-indigo-500 text-white' : 'bg-emerald-500 text-white') : 'bg-gray-100 text-gray-700 border border-gray-200'}
                  ${idx === 0 ? 'rounded-l-lg' : idx === 2 ? 'rounded-r-lg' : ''}`}
                >
                  {tab.icon} {tab.label} {tab.count !== '' && `(${tab.count})`}
                </button>
              ))}
            </div>

            {activeTab === 'blood' && ['strength', 'warning', 'risk'].map(cat => {
              const markers = data.blood_markers.filter(m => m.category === cat);
              if (!markers.length) return null;
              const colorClasses = cat === 'strength' ? 'bg-green-50 text-green-800 border-green-200' : cat === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-800 border-red-200';
              return (
                <div key={cat} className={`rounded-lg mb-4 w-full border ${colorClasses}`}>
                  <div onClick={() => setBloodGroupOpen(prev => ({ ...prev, [cat]: !prev[cat] }))} className="p-4 flex justify-between items-center cursor-pointer">
                    <h3 className="flex items-center font-semibold m-0 capitalize text-base">
                      {cat === 'strength' ? <CheckCircle className="w-5 h-5 mr-2 text-green-500" /> : cat === 'warning' ? <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" /> : <AlertCircle className="w-5 h-5 mr-2 text-red-500" />}
                      {cat}s ({markers.length})
                    </h3>
                    {bloodGroupOpen[cat] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                  {bloodGroupOpen[cat] && (
                    <div className="px-4 pb-4 flex flex-col gap-4 text-left">
                      {markers.map((marker, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold m-0 text-sm">{marker.marker_name}</h4>
                            <span className={`font-semibold text-xs capitalize ${cat === 'strength' ? 'text-green-600' : cat === 'warning' ? 'text-amber-500' : 'text-red-600'}`}>{marker.status}</span>
                          </div>
                          <p className="text-sm mt-1">{marker.insight}</p>
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
              const colorClasses = cat === 'strength' ? 'bg-green-50 text-green-800 border-green-200' : cat === 'warning' ? 'bg-amber-50 text-amber-800 border-amber-200' : 'bg-red-50 text-red-800 border-red-200';
              return (
                <div key={cat} className={`rounded-lg mb-4 w-full border ${colorClasses}`}>
                  <div onClick={() => setDnaGroupOpen(prev => ({ ...prev, [cat]: !prev[cat] }))} className="p-4 flex justify-between items-center cursor-pointer">
                    <h3 className="flex items-center font-semibold m-0 capitalize text-base">
                      {cat === 'strength' ? <CheckCircle className="w-5 h-5 mr-2 text-green-500" /> : cat === 'warning' ? <AlertTriangle className="w-5 h-5 mr-2 text-amber-500" /> : <AlertCircle className="w-5 h-5 mr-2 text-red-500" />}
                      {cat}s ({traits.length})
                    </h3>
                    {dnaGroupOpen[cat] ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </div>
                  {dnaGroupOpen[cat] && (
                    <div className="px-4 pb-4 flex flex-col gap-4 text-left">
                      {traits.map((trait, idx) => (
                        <div key={idx}>
                          <div className="flex justify-between items-center mb-1">
                            <h4 className="font-semibold m-0 text-sm">{trait.trait_name}</h4>
                            <span className={`font-semibold text-xs capitalize ${cat === 'strength' ? 'text-green-600' : cat === 'warning' ? 'text-amber-500' : 'text-red-600'}`}>{trait.category}</span>
                          </div>
                          <p className="text-xs text-gray-500 my-1">RSID: {trait.rsid}</p>
                          <p className="text-sm my-1">{trait.insight}</p>
                          <p className="text-xs text-gray-600 mt-1">{trait.effect}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}

            {activeTab === 'recommendations' && (
              <div className="flex flex-col gap-4 w-full">
                {['Diet', 'Supplementation', 'Exercise', 'Lifestyle', 'Monitoring'].filter(title => data.recommendations[title]).map(title => {
                  const items = data.recommendations[title];
                  const getRecIcon = (t) => {
                    if (t === 'Diet') return <Utensils className="w-5 h-5 mr-2 text-gray-500" />;
                    if (t === 'Supplementation') return <Pill className="w-5 h-5 mr-2 text-gray-500" />;
                    if (t === 'Exercise') return <Dumbbell className="w-5 h-5 mr-2 text-gray-500" />;
                    if (t === 'Lifestyle') return <Smile className="w-5 h-5 mr-2 text-gray-500" />;
                    return null;
                  };

                  return (
                    <div key={title} className="border border-gray-200 rounded-lg overflow-hidden w-full">
                      <div onClick={() => setExpandedSection(expandedSection === title ? '' : title)} className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer">
                        <h3 className="flex items-center font-medium text-gray-800 m-0 text-base">{getRecIcon(title)} {title}</h3>
                        {expandedSection === title ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
                      </div>
                      {expandedSection === title && (
                        <div className="p-4 bg-white text-left">
                          <ul className="pl-5 mt-2 mb-0 list-disc">
                            {items.map((item, i) => {
                              const text = typeof item === 'string' ? item : item.text;
                              const priority = typeof item === 'object' && item.priority;
                              return (
                                <li key={i} className="my-2 text-gray-600 text-sm">
                                  {text}
                                  {priority && (
                                    <span className={`text-[10px] ml-2 px-1.5 py-0.5 rounded font-semibold ${priority === 'high' ? 'bg-red-100 text-red-800' : priority === 'medium' ? 'bg-amber-100 text-amber-800' : 'bg-blue-100 text-blue-800'}`}>
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
          </>
        )}

      </div>
    </ErrorBoundary >
  );
}
