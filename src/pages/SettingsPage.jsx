import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import SidebarMenu from './SidebarMenu';
import { Menu, X, Settings as SettingsIcon, Link as LinkIcon, CheckCircle, RefreshCw } from 'lucide-react';
import logo from '../assets/logo.png';
import { ErrorBoundary } from '../components/ErrorBoundary';
import { useUserProfile } from '../hooks/useUserProfile';

export default function SettingsPage() {
    const { user, profile } = useUserProfile();
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [fitbitToken, setFitbitToken] = useState(() => localStorage.getItem('iThrive_fitbit_token'));

    useEffect(() => {
        // Run once on mount to catch the OAuth redirect
        const handleOAuthHash = async () => {
            const hash = window.location.hash.substring(1);
            if (!hash) return;

            const params = new URLSearchParams(hash);
            const hashAccessToken = params.get('access_token');
            const hashUserId = params.get('user_id');

            if (hashAccessToken) {
                console.log("SettingsPage: Successfully scraped Fitbit token from URL hash!");

                // Save it
                localStorage.setItem('iThrive_fitbit_token', hashAccessToken);
                if (hashUserId) localStorage.setItem('iThrive_fitbit_user_id', hashUserId);
                setFitbitToken(hashAccessToken);

                // Clean the URL hash so it doesn't run again on reload
                window.history.replaceState(null, '', window.location.pathname);

                // Clear the TrackProgress optimistic caches so it is forced to redraw
                if (user) {
                    localStorage.removeItem(`iThrive_fitbit_cache_${user.id}_today`);
                    localStorage.removeItem(`iThrive_fitbit_cache_${user.id}_week`);
                    localStorage.removeItem(`iThrive_fitbit_cache_${user.id}_month`);
                }

                setFeedback('Connection successful! Syncing fresh data...');
                setLoading(true);

                // Force a background sync of today's data right now, so the user doesn't wonder why "Today" is empty!
                try {
                    const [stepsRes, distRes, azmRes, calsRes, sleepRes, hrRes, weightRes, hrvRes] = await Promise.all([
                        supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/activities/steps/date/today/1m.json`, token: hashAccessToken } }),
                        supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/activities/distance/date/today/1m.json`, token: hashAccessToken } }),
                        supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/activities/activeZoneMinutes/date/today/1m.json`, token: hashAccessToken } }),
                        supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/activities/calories/date/today/1m.json`, token: hashAccessToken } }),
                        supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1.2/user/-/sleep/date/today/1m.json`, token: hashAccessToken } }),
                        supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/activities/heart/date/today/1m.json`, token: hashAccessToken } }),
                        supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/body/log/weight/date/today/1m.json`, token: hashAccessToken } }),
                        supabase.functions.invoke('fitbit-proxy', { body: { endpoint: `https://api.fitbit.com/1/user/-/hrv/date/today/1m.json`, token: hashAccessToken } })
                    ]);

                    if (stepsRes.error || stepsRes.data?.error) {
                        throw new Error("Fitbit Token Error on Initial Sync");
                    }

                    console.log("----- FITBIT RAW INITIAL SYNC PAYLOADS -----");
                    console.log("Steps:", stepsRes.data);
                    console.log("Distance:", distRes.data);
                    console.log("AZM:", azmRes.data);
                    console.log("Calories:", calsRes.data);
                    console.log("Sleep:", sleepRes.data);
                    console.log("HR:", hrRes.data);
                    console.log("==========================================");

                    const pSteps = stepsRes.data?.['activities-steps'] || [];
                    const pDist = distRes.data?.['activities-distance'] || [];
                    const pAzm = azmRes.data?.['activities-activeZoneMinutes'] || [];
                    const pCals = calsRes.data?.['activities-calories'] || [];
                    const pSleep = sleepRes.data?.sleep || [];
                    const pHr = hrRes.data?.['activities-heart'] || [];
                    const pWeight = weightRes.data?.weight || [];
                    const pHrv = hrvRes.data?.hrv || [];

                    const dailyRecords = {};

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

                    pSleep.forEach(d => {
                        if (dailyRecords[d.dateOfSleep]) {
                            dailyRecords[d.dateOfSleep].sleep_minutes_asleep = parseInt(d.minutesAsleep || 0);
                            dailyRecords[d.dateOfSleep].sleep_time_in_bed = parseInt(d.timeInBed || 0);
                        }
                    });

                    pHr.forEach(d => { if (dailyRecords[d.dateTime]) dailyRecords[d.dateTime].resting_heart_rate = parseInt(d.value?.restingHeartRate || null); });
                    pHrv.forEach(d => { if (dailyRecords[d.dateTime]) dailyRecords[d.dateTime].hrv = parseFloat(d.value?.dailyRmssd || null); });

                    pWeight.forEach(d => {
                        if (dailyRecords[d.date]) {
                            let w = parseFloat(d.weight || 0);
                            if (w > 130) w = w / 2.20462;
                            dailyRecords[d.date].weight_kg = w;
                        }
                    });

                    const upsertBatch = Object.values(dailyRecords);

                    if (upsertBatch.length > 0) {
                        const { error: upsertErr } = await supabase
                            .from('user_fitbit_stats')
                            .upsert(upsertBatch, { onConflict: 'user_id,date' });

                        if (upsertErr) throw upsertErr;
                    }

                    setFeedback('Fitbit data is now fully synced!');
                } catch (e) {
                    console.error("Fresh sync failed:", e);
                    setFeedback('Connected, but initial sync timed out. Data will load soon.');
                }
                setLoading(false);
            }
        };

        if (user) {
            handleOAuthHash();
        }
    }, [user]);

    const handleDisconnect = () => {
        localStorage.removeItem('iThrive_fitbit_token');
        if (user) {
            localStorage.removeItem(`iThrive_fitbit_cache_${user.id}_today`);
            localStorage.removeItem(`iThrive_fitbit_cache_${user.id}_week`);
            localStorage.removeItem(`iThrive_fitbit_cache_${user.id}_month`);
            localStorage.removeItem(`iThrive_dashboard_cache_${user.id}`);
        }
        setFitbitToken(null);
        setFeedback('Fitbit disconnected. Local cache cleared.');
    };

    if (!user) {
        return (
            <div className="flex justify-center flex-col gap-4 items-center h-screen bg-[#F9FAFB]">
                <img src="/icons/icon-192x192.png" alt="Loading iThrive360..." className="w-20 h-20 animate-pulse" />
                <p className="text-gray-500 font-medium">Loading settings...</p>
            </div>
        );
    }

    const clientId = import.meta.env.VITE_FITBIT_CLIENT_ID;
    const redirectUri = encodeURIComponent(`${window.location.origin}/settings`);
    const fitbitAuthUrl = `https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=activity%20heartrate%20weight%20profile%20sleep&expires_in=31536000`;

    return (
        <ErrorBoundary>
            <div className="font-sans px-4 py-8 max-w-5xl mx-auto bg-[#F9FAFB] min-h-screen">
                {/* Header */}
                <div className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md flex items-center justify-center py-3 px-4 z-50 shadow-sm border-b border-gray-100">
                    <button onClick={() => setMenuOpen(!menuOpen)} className="absolute left-4 bg-transparent outline-none">
                        {menuOpen ? <X size={28} className="text-emerald-500" /> : <Menu size={28} className="text-emerald-500" />}
                    </button>
                    <img src={logo} alt="iThrive360 Logo" className="h-8" />
                </div>

                <div className="h-16" />

                {profile && (
                    <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} profile={profile} />
                )}

                <div className="mb-4 flex items-center gap-3">
                    <div className="bg-emerald-100 p-2 rounded-xl text-emerald-600">
                        <SettingsIcon size={24} />
                    </div>
                    <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Settings</h1>
                </div>

                <div className="mb-8 space-y-6">
                    {/* Connected Apps Module */}
                    <section className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100">
                        <h2 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <LinkIcon size={18} className="text-blue-500" /> Connected Apps & Devices
                        </h2>
                        <p className="text-sm text-gray-500 mb-6">
                            Securely link external trackers like Fitbit to automatically sync your health data with iThrive360.
                        </p>

                        <div className="border border-gray-100 rounded-2xl p-5 bg-gray-50/50">
                            <div className="flex items-center justify-between mb-4">
                                <div className="flex items-center gap-3">
                                    <svg width="40" height="40" viewBox="0 0 50 50" fill="none" xmlns="http://www.w3.org/2000/svg">
                                        <circle cx="25" cy="25" r="25" fill="#00B0B9" />
                                        <circle cx="12" cy="25" r="2.5" fill="white" />
                                        <circle cx="18" cy="19" r="2.8" fill="white" />
                                        <circle cx="18" cy="31" r="2.8" fill="white" />
                                        <circle cx="25" cy="12" r="3.2" fill="white" />
                                        <circle cx="25" cy="25" r="3.6" fill="white" />
                                        <circle cx="25" cy="38" r="3.2" fill="white" />
                                        <circle cx="32" cy="19" r="2.8" fill="white" />
                                        <circle cx="32" cy="31" r="2.8" fill="white" />
                                        <circle cx="38" cy="25" r="2.5" fill="white" />
                                    </svg>
                                    <div>
                                        <h3 className="font-semibold text-gray-900">Fitbit Integration</h3>
                                        <p className="text-xs text-gray-500">{fitbitToken ? 'Connected and syncing' : 'Not connected'}</p>
                                    </div>
                                </div>
                                {fitbitToken && <CheckCircle className="text-emerald-500" size={20} />}
                            </div>

                            {fitbitToken ? (
                                <button
                                    onClick={handleDisconnect}
                                    className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors hover:bg-red-50 hover:text-red-700 hover:border-red-200"
                                >
                                    Disconnect Fitbit
                                </button>
                            ) : (
                                <a
                                    href={fitbitAuthUrl}
                                    // Native anchor tag instead of window.location to force Android PWAs to break out properly
                                    className={`w-full block text-center bg-[#00B0B9] text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition-opacity hover:opacity-90`}
                                >
                                    Connect to Fitbit
                                </a>
                            )}

                            {feedback && (
                                <div className="mt-4 flex items-center justify-center gap-2 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-3 rounded-lg border border-emerald-100">
                                    {loading && <RefreshCw className="w-4 h-4 animate-spin" />}
                                    {feedback}
                                </div>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </ErrorBoundary>
    );
}
