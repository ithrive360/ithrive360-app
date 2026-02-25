import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import SidebarMenu from './SidebarMenu';
import { Menu, X, Settings as SettingsIcon, Link as LinkIcon, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';
import { ErrorBoundary } from '../components/ErrorBoundary';

export default function SettingsPage() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [menuOpen, setMenuOpen] = useState(false);
    const [loading, setLoading] = useState(false);
    const [feedback, setFeedback] = useState('');
    const [fitbitToken, setFitbitToken] = useState(null);

    useEffect(() => {
        const fetchProfile = async () => {
            const { data: sessionData } = await supabase.auth.getSession();
            const currentUser = sessionData?.session?.user;
            if (!currentUser) return;
            setUser(currentUser);

            // Manual URL Scrape for OAuth redirect callback
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            const hashAccessToken = params.get('access_token');
            const hashUserId = params.get('user_id');

            if (hashAccessToken) {
                console.log("Successfully scraped Fitbit token from URL hash!");
                localStorage.setItem('iThrive_fitbit_token', hashAccessToken);
                if (hashUserId) {
                    localStorage.setItem('iThrive_fitbit_user_id', hashUserId);
                }
                setFitbitToken(hashAccessToken);
                window.history.replaceState(null, '', window.location.pathname);
            } else {
                const savedToken = localStorage.getItem('iThrive_fitbit_token');
                if (savedToken) {
                    setFitbitToken(savedToken);
                }
            }

            const { data: profileData } = await supabase
                .from('user_profile')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();
            setProfile(profileData);
        };

        fetchProfile();
    }, []);

    const handleFitbitConnect = async () => {
        setLoading(true);
        setFeedback('Routing to Fitbit securely...');

        try {
            const clientId = import.meta.env.VITE_FITBIT_CLIENT_ID;
            if (!clientId) {
                throw new Error("Missing Fitbit Client ID in environment variables");
            }

            const redirectUri = encodeURIComponent(`${window.location.origin}/settings`);
            const fitbitAuthUrl = `https://www.fitbit.com/oauth2/authorize?response_type=token&client_id=${clientId}&redirect_uri=${redirectUri}&scope=activity%20heartrate%20weight%20profile%20sleep&expires_in=31536000`;
            window.location.href = fitbitAuthUrl;
        } catch (err) {
            console.error('Error initiating Fitbit Auth:', err.message);
            setFeedback('Failed to connect: ' + err.message);
            setLoading(false);
        }
    };

    const handleDisconnect = () => {
        localStorage.removeItem('iThrive_fitbit_token');
        setFitbitToken(null);
        setFeedback('Fitbit disconnected successfully.');
    };

    if (!user) return <div className="flex justify-center items-center h-screen"><p>You must be logged in to view this page.</p></div>;

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
                    <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} onLogout={async () => { await supabase.auth.signOut(); window.location.href = '/'; }} profile={profile} />
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
                            Securely link external trackers like Fitbit and Eufy scales to automatically sync your health data with iThrive360.
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
                                    className="w-full bg-white border border-gray-200 text-gray-700 py-2.5 px-4 rounded-xl font-semibold text-sm transition-colors hover:bg-gray-50"
                                >
                                    Disconnect Fitbit
                                </button>
                            ) : (
                                <button
                                    onClick={handleFitbitConnect}
                                    disabled={loading}
                                    className={`w-full bg-[#00B0B9] text-white py-2.5 px-4 rounded-xl font-semibold text-sm transition-opacity ${loading ? 'opacity-70' : 'hover:opacity-90'}`}
                                >
                                    {loading ? 'Routing securely...' : 'Connect to Fitbit'}
                                </button>
                            )}

                            {feedback && (
                                <p className="mt-4 text-xs font-medium text-emerald-600 bg-emerald-50 px-3 py-2 rounded-lg text-center">
                                    {feedback}
                                </p>
                            )}
                        </div>
                    </section>
                </div>
            </div>
        </ErrorBoundary>
    );
}
