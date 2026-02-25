import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import { useDashboardData } from '../features/insights/hooks/useDashboardData';
import { generateHealthInsight } from '../utils/generateHealthInsight';
import { importUserRecommendations } from '../utils/importRecommendations';
import SidebarMenu from './SidebarMenu';
import ScoreCardsDashboard from '../features/insights/components/ScoreCardsDashboard';
import { Menu, X, ChevronDown, ChevronUp } from 'lucide-react';
import Lottie from 'lottie-react';
import logo from '../assets/logo.png';

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user, profile, loading: userLoading } = useUserProfile();
  const { overallScores, recommendationData, activeToggles, setActiveToggles, loading: dataLoading } = useDashboardData(user?.id);

  const [menuOpen, setMenuOpen] = useState(false);
  const [timeAnimation, setTimeAnimation] = useState(null);
  const [greeting, setGreeting] = useState(() => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  });

  const [isProcessing, setIsProcessing] = useState(false);
  const [expandedRecCategory, setExpandedRecCategory] = useState(null);

  // Tools for testing (preserved from legacy code)
  const [selectedHealthArea, setSelectedHealthArea] = useState('HA002');
  const [inputJson, setInputJson] = useState(null);
  const [prompt, setPrompt] = useState('');
  const [gptResponse, setGptResponse] = useState('');

  if (userLoading || dataLoading) {
    return <div className="flex justify-center items-center h-screen"><p className="text-gray-600">Loading...</p></div>;
  }

  if (!user) {
    return <div className="flex justify-center items-center h-screen"><p>You must be logged in to view this page.</p></div>;
  }

  const handleLogout = async () => {
    if (isProcessing) return;
    try {
      await supabase.auth.signOut();
      window.location.href = '/';
    } catch (err) {
      console.error('Logout error:', err.message);
    }
  };

  const handleTestGPT = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const result = await generateHealthInsight({ user_id: user.id, health_area: selectedHealthArea });
      if (!result.success) throw new Error(result.error);

      setInputJson(result.input_json);
      setPrompt(result.prompt);
      setGptResponse(result.gpt_response);

      alert(`✅ Processed ${selectedHealthArea}`);
    } catch (e) {
      alert(`Error with ${selectedHealthArea}: ${e.message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="font-sans px-4 py-8 w-full max-w-2xl mx-auto bg-[#FAFAFA] min-h-screen relative overflow-x-hidden">
      {/* Modern Sticky Header */}
      <div className="fixed top-0 left-0 w-full bg-white/60 backdrop-blur-2xl flex items-center justify-center py-3 px-4 z-50 shadow-[0_4px_30px_rgb(0,0,0,0.03)] border-b border-white/60">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute left-4 bg-transparent border-none p-0 cursor-pointer outline-none"
          disabled={isProcessing}
        >
          {menuOpen ? <X size={28} className="text-[#3ab3a1]" /> : <Menu size={28} className="text-[#3ab3a1]" />}
        </button>
        <img src={logo} alt="iThrive360 Logo" className="h-8" />
      </div>

      <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onLogout={handleLogout} profile={profile} />

      <div className="h-16" /> {/* Spacer */}

      <div className="mb-6 text-center mt-4 relative z-10">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">
          {greeting}, {profile?.user_name || 'there'}
        </h1>
        <p className="text-sm font-medium text-gray-500 max-w-sm mx-auto">
          Here is your personal health overview.
        </p>
      </div>

      <ScoreCardsDashboard scores={overallScores} />

      {/* Recommendations Card */}
      <div className="bg-white rounded-[32px] p-6 mx-auto my-6 overflow-hidden relative w-full shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 group hover:shadow-lg transition-all">
        {/* Subtle decorative blob */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>
        <div className="relative z-10">
          <h3 className="text-lg font-bold mb-4 text-gray-800 tracking-tight">Consolidated Recommendations</h3>

          {['Diet', 'Exercise', 'Lifestyle', 'Supplementation', 'Monitoring'].map((category) => {
            const allRecs = recommendationData[category] || [];
            const deduped = Array.from(new Map(allRecs.map(r => [r.text, r])).values());
            const sorted = deduped.sort((a, b) => {
              const order = { high: 0, medium: 1, low: 2 };
              return order[a.priority] - order[b.priority];
            });

            if (!sorted.length) return null;
            const isOpen = expandedRecCategory === category;

            return (
              <div key={category} className="mb-5" id={`rec-category-${category}`}>
                <div
                  onClick={() => {
                    const isOpenTarget = expandedRecCategory !== category;
                    setExpandedRecCategory(isOpenTarget ? category : null);
                    if (isOpenTarget) {
                      setTimeout(() => {
                        document.getElementById(`rec-category-${category}`)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                      }, 100);
                    }
                  }}
                  className="flex justify-between items-center cursor-pointer mb-1 p-2 -mx-2 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <h4 className="text-base font-semibold text-gray-900">{category}</h4>
                  {isOpen ? <ChevronUp size={20} className="text-gray-500" /> : <ChevronDown size={20} className="text-gray-500" />}
                </div>

                {isOpen && (
                  <div className="mt-2">
                    <div className="grid grid-cols-[1fr_80px_50px] gap-3 items-center pb-2 border-b border-gray-100">
                      <span className="text-xs text-gray-500 text-left">Action</span>
                      <span className="text-xs text-gray-500 text-center">Priority</span>
                      <span className="text-xs text-gray-500 text-center">Add</span>
                    </div>

                    <ul className="p-0 list-none m-0 mt-2">
                      {sorted.map((rec, i) => (
                        <li key={i} className="mb-3 text-sm grid grid-cols-[1fr_80px_50px] gap-3 items-center">
                          <div className="text-left text-gray-700">{rec.text}</div>
                          <div className="text-center">
                            <span
                              className={`text-xs px-2 py-0.5 rounded-md inline-block min-w-[50px] text-center font-medium
                              ${rec.priority === 'high' ? 'bg-red-50 text-red-600 border border-red-100' :
                                  rec.priority === 'medium' ? 'bg-amber-50 text-amber-600 border border-amber-100' :
                                    'bg-blue-50 text-blue-600 border border-blue-100'}`}
                            >
                              {rec.priority}
                            </span>
                          </div>
                          <div className="text-center">
                            <div
                              onClick={async (e) => {
                                e.stopPropagation();
                                const newState = !activeToggles[rec.text];
                                setActiveToggles(prev => ({ ...prev, [rec.text]: newState }));
                                await supabase.from('user_recommendation').update({ is_selected: newState })
                                  .eq('user_id', user.id).eq('recommendation', rec.text).eq('category', category);
                              }}
                              className={`w-9 h-5 rounded-full flex items-center px-0.5 cursor-pointer transition-all duration-200 mx-auto
                              ${activeToggles[rec.text] ? 'bg-emerald-500 justify-end' : 'bg-red-500 justify-start'}`}
                            >
                              <div className="w-4 h-4 bg-white rounded-full shadow-sm" />
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
      </div>

      <div className="max-w-xl mx-auto w-full mt-6 flex flex-col gap-4">
        <button
          onClick={async () => {
            const result = await importUserRecommendations(user?.id);
            alert(result.success ? `Imported ${result.count} recommendations.` : result.message);
          }}
          className="bg-emerald-500 text-white py-2.5 px-4 text-sm font-semibold rounded-lg border-none cursor-pointer shadow-sm hover:bg-emerald-600 transition"
        >
          Import Recommendations from Insights
        </button>

        <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
          {/* Decorative blob */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>
          <div className="relative z-10">
            <h2 className="text-lg font-bold mb-4 text-gray-800 tracking-tight">Quick Actions / Developer Testing</h2>

            <div className="mt-4 flex flex-col gap-2">
              <label htmlFor="healthAreaSelect" className="text-sm font-medium text-gray-700">Select Health Area for Test:</label>
              <select
                id="healthAreaSelect"
                value={selectedHealthArea}
                onChange={(e) => setSelectedHealthArea(e.target.value)}
                disabled={isProcessing}
                className="p-2 border border-gray-300 rounded-md bg-white text-sm"
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
              onClick={handleTestGPT}
              disabled={isProcessing}
              className="mt-3 bg-red-500 text-white py-2 px-4 rounded-md text-sm font-medium hover:bg-red-600 transition disabled:opacity-50"
            >
              {isProcessing ? 'Processing...' : 'Test GPT'}
            </button>
          </div>
        </div>
      </div>

      {inputJson && prompt && (
        <div className="mt-8 p-4 bg-gray-200 text-xs w-11/12 max-w-xl mx-auto rounded-lg overflow-auto">
          <h3 className="font-bold mb-2">Preview: Input JSON</h3>
          <pre className="whitespace-pre-wrap break-words">{JSON.stringify(inputJson, null, 2)}</pre>
          <h3 className="font-bold mt-4 mb-2">Preview: Prompt Sent to GPT</h3>
          <pre className="whitespace-pre-wrap break-words">{prompt}</pre>
        </div>
      )}

      {gptResponse && (
        <div className="mt-8 p-4 bg-green-50 text-xs w-11/12 max-w-xl mx-auto rounded-lg overflow-auto border border-green-200">
          <h3 className="font-bold mb-2 text-green-800">Preview: GPT Response</h3>
          <pre className="whitespace-pre-wrap break-words">
            {typeof gptResponse === 'object' ? JSON.stringify(gptResponse, null, 2) : gptResponse}
          </pre>
        </div>
      )}
    </div>
  );
}
