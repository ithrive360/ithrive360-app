import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import { Activity, Heart, Moon, Menu, X, User as UserIcon } from 'lucide-react';
import logo from '../assets/logo.png';
import SidebarMenu from './SidebarMenu';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function TrackProgress() {
    const { user, profile, loading: userLoading } = useUserProfile();

    // --- Fitbit Data States ---
    const [fitbitData, setFitbitData] = useState(null);
    const [fitbitLoading, setFitbitLoading] = useState(false);
    const [fitbitError, setFitbitError] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);

    const [timeRange, setTimeRange] = useState('today'); // 'today', 'week', 'month'

    useEffect(() => {
        if (!user) return;

        const fetchLocalStats = async () => {
            try {
                // 1. Determine date range
                const today = new Date();
                const startDate = new Date();
                if (timeRange === 'week') startDate.setDate(today.getDate() - 6);
                if (timeRange === 'month') startDate.setDate(today.getDate() - 29);

                const todayStr = today.toISOString().split('T')[0];
                const startStr = startDate.toISOString().split('T')[0];

                // 2. Fetch from fast local Supabase table
                const { data: stats, error } = await supabase
                    .from('user_fitbit_stats')
                    .select('*')
                    .eq('user_id', user.id)
                    .gte('date', startStr)
                    .lte('date', todayStr)
                    .order('date', { ascending: false });

                if (error) throw error;

                if (!stats || stats.length === 0) {
                    setFitbitData(null);
                    // Force a sync if we have absolutely nothing
                    triggerBackgroundSync();
                    return;
                }

                // 3. Aggregate mapping for the UI
                const activeSummary = {
                    steps: stats.reduce((sum, row) => sum + (row.steps || 0), 0),
                    distances: [{ distance: stats.reduce((sum, row) => sum + parseFloat(row.distance_km || 0), 0) }],
                    caloriesOut: stats.reduce((sum, row) => sum + (row.calories_out || 0), 0),
                    activeZoneMinutes: stats.reduce((sum, row) => sum + (row.active_zone_minutes || 0), 0),
                };

                const validSleeps = stats.filter(r => r.sleep_minutes_asleep > 0);
                const activeSleep = {
                    totalMinutesAsleep: validSleeps.length > 0 ? validSleeps.reduce((sum, r) => sum + r.sleep_minutes_asleep, 0) / validSleeps.length : 0,
                    totalTimeInBed: validSleeps.length > 0 ? validSleeps.reduce((sum, r) => sum + r.sleep_time_in_bed, 0) / validSleeps.length : 0,
                };

                const validHRs = stats.filter(r => r.resting_heart_rate > 0);
                const activeHR = validHRs.length > 0 ? Math.round(validHRs.reduce((sum, r) => sum + r.resting_heart_rate, 0) / validHRs.length) : '--';

                const validHRVs = stats.filter(r => r.hrv > 0);
                const activeHRV = validHRVs.length > 0 ? Math.round(validHRVs.reduce((sum, r) => sum + parseFloat(r.hrv), 0) / validHRVs.length) : '--';

                const validWeights = stats.filter(r => r.weight_kg > 0);
                const activeWeight = validWeights.length > 0 ? parseFloat(validWeights[0].weight_kg).toFixed(1) : '--'; // Get most recent

                setFitbitData({
                    activity: activeSummary,
                    isYesterday: false, // Legacy fallback flag, no longer strictly needed with DB model but kept for UI compat
                    sleep: activeSleep,
                    heartRate: activeHR,
                    hrv: activeHRV,
                    weight: activeWeight,
                    spO2: '--', // Not yet in core schema
                    timeRange: timeRange
                });

                setFitbitError(null);

                // 4. Check staleness to trigger silent background sync
                const mostRecentSync = new Date(stats[0].last_synced_at);
                const hoursSinceSync = (new Date() - mostRecentSync) / (1000 * 60 * 60);

                if (hoursSinceSync > 1) {
                    triggerBackgroundSync();
                }

            } catch (err) {
                console.error("Local DB read error:", err);
                setFitbitError("Failed to load local health data.");
            } finally {
                setFitbitLoading(false); // UI instantly unblocks here!
            }
        };

        const triggerBackgroundSync = async () => {
            const token = localStorage.getItem('iThrive_fitbit_token');
            if (!token || token === 'linked_but_requires_reconnect') {
                if (!fitbitData) setFitbitError("Please connect Fitbit in Settings.");
                return;
            }

            console.log("Background syncing Fitbit metrics to Supabase...");

            try {
                // Fetch the core 1-month metrics from Fitbit APIs
                const [stepsRes, distRes, azmRes, calsRes, sleepRes, hrRes, weightRes, hrvRes] = await Promise.all([
                    supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/activities/steps/date/today/1m.json`, token } }),
                    supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/activities/distance/date/today/1m.json`, token } }),
                    supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/activities/activeZoneMinutes/date/today/1m.json`, token } }),
                    supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/activities/calories/date/today/1m.json`, token } }),
                    supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1.2/user/-/sleep/date/today/1m.json`, token } }),
                    supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/activities/heart/date/today/1m.json`, token } }),
                    supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/body/log/weight/date/today/1m.json`, token } }),
                    supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/hrv/date/today/1m.json`, token } })
                ]);

                if (stepsRes.error || stepsRes.data?.error) {
                    if (stepsRes.data?.error?.includes('expired')) {
                        localStorage.setItem('iThrive_fitbit_token', 'linked_but_requires_reconnect');
                    }
                    throw new Error("Fitbit Token Error");
                }

                // Safe array extraction
                const pSteps = stepsRes.data?.['activities-steps'] || [];
                const pDist = distRes.data?.['activities-distance'] || [];
                const pAzm = azmRes.data?.['activities-activeZoneMinutes'] || [];
                const pCals = calsRes.data?.['activities-calories'] || [];
                const pSleep = sleepRes.data?.sleep || [];
                const pHr = hrRes.data?.['activities-heart'] || [];
                const pWeight = weightRes.data?.weight || [];
                const pHrv = hrvRes.data?.hrv || [];

                // Re-assemble into date-keyed objects
                const dailyRecords = {};

                // Base loop off steps (usually the most reliable daily array)
                pSteps.forEach(d => {
                    dailyRecords[d.dateTime] = {
                        user_id: user.id,
                        date: d.dateTime,
                        steps: parseInt(d.value || 0),
                        last_synced_at: new Date().toISOString()
                    };
                });

                pDist.forEach(d => { if (dailyRecords[d.dateTime]) dailyRecords[d.dateTime].distance_km = parseFloat(d.value || 0); });
                pCals.forEach(d => { if (dailyRecords[d.dateTime]) dailyRecords[d.dateTime].calories_out = parseInt(d.value || 0); });
                pAzm.forEach(d => { if (dailyRecords[d.dateTime]) dailyRecords[d.dateTime].active_zone_minutes = parseInt(d.value?.activeZoneMinutes || 0); });

                // Sleep array is structured slightly differently (dateOfSleep)
                pSleep.forEach(d => {
                    if (dailyRecords[d.dateOfSleep]) {
                        dailyRecords[d.dateOfSleep].sleep_minutes_asleep = parseInt(d.minutesAsleep || 0);
                        dailyRecords[d.dateOfSleep].sleep_time_in_bed = parseInt(d.timeInBed || 0);
                    }
                });

                pHr.forEach(d => { if (dailyRecords[d.dateTime]) dailyRecords[d.dateTime].resting_heart_rate = parseInt(d.value?.restingHeartRate || null); });
                pHrv.forEach(d => { if (dailyRecords[d.dateTime]) dailyRecords[d.dateTime].hrv = parseFloat(d.value?.dailyRmssd || null); });

                // Weight array is just discrete logs, so map them to the closest day
                pWeight.forEach(d => {
                    if (dailyRecords[d.date]) {
                        let w = parseFloat(d.weight || 0);
                        if (w > 130) w = w / 2.20462; // Handle stray lbs logs
                        dailyRecords[d.date].weight_kg = w;
                    }
                });

                // Convert map to Array for Upsert
                const upsertBatch = Object.values(dailyRecords);

                if (upsertBatch.length > 0) {
                    const { error: upsertErr } = await supabase
                        .from('user_fitbit_stats')
                        .upsert(upsertBatch, { onConflict: 'user_id,date' });

                    if (upsertErr) throw upsertErr;
                    console.log("Successfully background synced and upserted Fitbit data.");

                    // Re-run local fetch to softly update the UI with the fresh data
                    fetchLocalStats();
                }

            } catch (err) {
                console.error("Background sync failed:", err);
            }
        };

        setFitbitLoading(true);
        fetchLocalStats();

    }, [timeRange, user]);

    if (userLoading) {
        return <div className="flex h-screen items-center justify-center p-4">Loading dashboard...</div>;
    }

    return (
        <ErrorBoundary>
            {/* Soft off-white background */}
            <div className="font-sans px-4 py-8 max-w-5xl mx-auto bg-[#F9FAFB] min-h-screen">
                <div className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md flex items-center justify-center py-3 px-4 z-50 shadow-sm border-b border-gray-100">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="absolute left-4 bg-transparent outline-none">
                        {menuOpen ? <X size={28} className="text-emerald-500" /> : <Menu size={28} className="text-emerald-500" />}
                    </button>
                    <img src={logo} alt="iThrive360 Logo" className="h-8" />
                </div>

                <div className="h-16" />

                {profile && (
                    <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onLogout={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} profile={profile} />
                )}

                <div className="mb-4 text-center">
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Track Progress</h1>

                    {/* Time Range Selector */}
                    <div className="mt-4 inline-flex bg-gray-100/80 rounded-full p-1 border border-gray-200 shadow-inner">
                        <button
                            onClick={() => setTimeRange('today')}
                            className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${timeRange === 'today' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Today
                        </button>
                        <button
                            onClick={() => setTimeRange('week')}
                            className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${timeRange === 'week' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Week
                        </button>
                        <button
                            onClick={() => setTimeRange('month')}
                            className={`px-6 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${timeRange === 'month' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
                        >
                            Month
                        </button>
                    </div>
                </div>

                <div className="mb-8 space-y-6">
                    {fitbitLoading && (
                        <div className="flex flex-col items-center justify-center py-12 space-y-4">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
                            <span className="text-gray-500 font-medium">Syncing Fitbit telemetry...</span>
                        </div>
                    )}

                    {fitbitError && (
                        <div className="text-center py-8 bg-red-50 rounded-3xl border border-red-100">
                            <p className="text-red-600 font-medium">{fitbitError}</p>
                            <p className="text-sm text-red-500 mt-2">Check your Fitbit connection in the Wearables tab.</p>
                        </div>
                    )}

                    {!fitbitLoading && !fitbitError && fitbitData && (
                        <div className="space-y-6">

                            {/* --- PILLAR 1: ACTIVITY & MOVEMENT --- */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-800 mb-3 px-2 flex items-center gap-2">
                                    <Activity className="text-blue-500" size={20} /> Activity & Movement
                                </h2>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* Steps Glass Card */}
                                    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden flex flex-col justify-between h-[130px]">
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="bg-blue-50/80 p-2 rounded-2xl"><Activity size={18} className="text-blue-500" /></div>
                                            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Steps</span>
                                        </div>
                                        <div className="mt-2 relative z-10">
                                            <span className="text-3xl font-bold tracking-tight text-gray-900">
                                                {fitbitData.activity.steps ? fitbitData.activity.steps.toLocaleString() : '0'}
                                            </span>
                                            <p className="text-xs text-gray-500 mt-0.5">
                                                {timeRange === 'today' ? (fitbitData.isYesterday ? 'Yesterday' : 'Today') : `${timeRange} total`}
                                            </p>
                                        </div>
                                    </div>

                                    {/* AZM Glass Card */}
                                    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden flex flex-col justify-between h-[130px]">
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="bg-orange-50/80 p-2 rounded-2xl"><Heart size={18} className="text-orange-500" /></div>
                                            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Zone Mins</span>
                                        </div>
                                        <div className="mt-2 relative z-10">
                                            <span className="text-3xl font-bold tracking-tight text-gray-900">
                                                {fitbitData.activity.activeZoneMinutes || '0'}
                                            </span>
                                            <span className="text-sm text-gray-500 font-medium ml-1">min</span>
                                        </div>
                                    </div>

                                    {/* Calories Glass Card */}
                                    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden flex flex-col justify-between h-[130px]">
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="bg-rose-50/80 p-2 rounded-2xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-rose-500"><path d="M8.5 14.5A2.5 2.5 0 0 0 11 12c0-1.38-.5-2-1-3-1.072-2.143-.224-4.054 2-6 .5 2.5 2 4.9 4 6.5 2 1.6 3 3.5 3 5.5a7 7 0 1 1-14 0c0-1.153.433-2.294 1-3a2.5 2.5 0 0 0 2.5 2.5z" /></svg>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Calories</span>
                                        </div>
                                        <div className="mt-2 relative z-10">
                                            <span className="text-3xl font-bold tracking-tight text-gray-900">
                                                {fitbitData.activity.caloriesOut ? fitbitData.activity.caloriesOut.toLocaleString() : '0'}
                                            </span>
                                            <span className="text-sm text-gray-500 font-medium ml-1">kcal</span>
                                        </div>
                                    </div>

                                    {/* Distance Glass Card */}
                                    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden flex flex-col justify-between h-[130px]">
                                        <div className="flex justify-between items-start relative z-10">
                                            <div className="bg-emerald-50/80 p-2 rounded-2xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-emerald-500"><path d="M12 22s-8-4.5-8-11.8A8 8 0 0 1 12 2a8 8 0 0 1 8 8.2c0 7.3-8 11.8-8 11.8z" /><circle cx="12" cy="10" r="3" /></svg>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Distance</span>
                                        </div>
                                        <div className="mt-2 text-gray-900 relative z-10">
                                            <span className="text-3xl font-bold tracking-tight">
                                                {fitbitData.activity.distances && fitbitData.activity.distances[0] ? parseFloat(fitbitData.activity.distances[0].distance).toFixed(2) : '0.00'}
                                            </span>
                                            <span className="text-sm text-gray-500 font-medium ml-1">km</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* --- PILLAR 2: REST & RECOVERY --- */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-800 mb-3 px-2 flex items-center gap-2 mt-4">
                                    <Moon className="text-indigo-500" size={20} fill="currentColor" /> Rest & Recovery
                                </h2>

                                <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 w-full mb-3 relative overflow-hidden group hover:shadow-lg transition-all">
                                    <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>
                                    <div className="flex justify-between items-end relative z-10">
                                        <div className="flex flex-col">
                                            <span className="text-xs font-bold text-gray-400 tracking-[0.15em] uppercase mb-1">Time Asleep</span>
                                            <span className="text-4xl font-bold tracking-tight text-gray-900">
                                                {fitbitData.sleep.totalMinutesAsleep ? `${Math.floor(fitbitData.sleep.totalMinutesAsleep / 60)}h ${Math.round(fitbitData.sleep.totalMinutesAsleep % 60)}m` : 'No data'}
                                            </span>
                                            <span className="text-sm font-medium text-gray-400 mt-1">
                                                {fitbitData.sleep.totalTimeInBed ? `${Math.round(fitbitData.sleep.totalTimeInBed)}m in bed` : 'Wear watch to bed'}
                                            </span>
                                        </div>
                                        <div className="bg-indigo-100 text-indigo-600 p-3 rounded-2xl">
                                            <Moon size={24} />
                                        </div>
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {/* RHR Glass Card */}
                                    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-between h-[130px]">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-red-50/80 p-2 rounded-2xl"><Heart size={18} className="text-red-500" fill="currentColor" /></div>
                                            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Resting HR</span>
                                        </div>
                                        <div className="mt-2 text-gray-900 flex items-baseline">
                                            <span className="text-3xl font-bold tracking-tight">{fitbitData.heartRate}</span>
                                            <span className="text-sm text-gray-500 font-medium ml-1">bpm</span>
                                        </div>
                                    </div>

                                    {/* HRV Glass Card */}
                                    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-between h-[130px]">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-purple-50/80 p-2 rounded-2xl">
                                                <Activity size={18} className="text-purple-500" />
                                            </div>
                                            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">HRV</span>
                                        </div>
                                        <div className="mt-2 text-gray-900 flex items-baseline">
                                            <span className="text-3xl font-bold tracking-tight">{fitbitData.hrv}</span>
                                            <span className="text-sm text-gray-500 font-medium ml-1">ms</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                            {/* --- PILLAR 3: BODY & BIOMETRICS --- */}
                            <section>
                                <h2 className="text-lg font-bold text-gray-800 mb-3 px-2 flex items-center gap-2 mt-4">
                                    <UserIcon className="text-teal-500" size={20} /> Body & Biometrics
                                </h2>

                                <div className="grid grid-cols-2 gap-3 mb-10">
                                    {/* Weight Glass Card */}
                                    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-between h-[130px]">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-teal-50/80 p-2 rounded-2xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-teal-500"><rect x="3" y="3" w="18" h="18" rx="2" ry="2"></rect><circle cx="8.5" cy="8.5" r="1.5"></circle><circle cx="15.5" cy="8.5" r="1.5"></circle><path d="M8 14s1.5 2 4 2 4-2 4-2"></path></svg>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Weight</span>
                                        </div>
                                        <div className="mt-2 text-gray-900 flex items-baseline">
                                            <span className="text-3xl font-bold tracking-tight">{fitbitData.weight}</span>
                                            <span className="text-sm text-gray-500 font-medium ml-1">kg</span>
                                        </div>
                                    </div>

                                    {/* SpO2 Glass Card */}
                                    <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col justify-between h-[130px]">
                                        <div className="flex justify-between items-start">
                                            <div className="bg-sky-50/80 p-2 rounded-2xl">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-sky-500"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path></svg>
                                            </div>
                                            <span className="text-xs font-semibold text-gray-400 tracking-wider uppercase">Blood O2</span>
                                        </div>
                                        <div className="mt-2 text-gray-900 flex items-baseline">
                                            <span className="text-3xl font-bold tracking-tight">{fitbitData.spO2}</span>
                                            <span className="text-sm text-gray-500 font-medium ml-1">%</span>
                                        </div>
                                    </div>
                                </div>
                            </section>

                        </div>
                    )}
                </div>
            </div>
        </ErrorBoundary>
    );
}
