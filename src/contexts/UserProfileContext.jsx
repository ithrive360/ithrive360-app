import React, { createContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { initUserProfile } from '../utils/initUserProfile';

export const UserProfileContext = createContext({
    user: null,
    profile: null,
    loading: true,
    error: null
});

export function UserProfileProvider({ children }) {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const lastFetchRef = React.useRef(0);

    const fetchUserData = async (currentUser) => {
        const now = Date.now();
        if (now - lastFetchRef.current < 2000) return; // Debounce strict 2 seconds
        lastFetchRef.current = now;

        try {
            setUser(currentUser);
            await initUserProfile(currentUser);

            const { data: profileData, error: profileError } = await supabase
                .from('user_profile')
                .select('*')
                .eq('user_id', currentUser.id)
                .single();

            if (profileError) throw profileError;
            setProfile(profileData || null);
            if (profileData) {
                localStorage.setItem('iThrive_cached_profile', JSON.stringify(profileData));
            }
        } catch (err) {
            console.error('fetchUserData error:', err.message);
            setError(err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        const checkSessionAndFetch = async () => {
            try {
                // Instantly check local storage to decide whether we even need to show a loading screen
                const cachedSessionStr = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
                if (!cachedSessionStr) {
                    setLoading(false); // They aren't logged in. Don't block the UI.
                } else {
                    try {
                        const cachedObj = JSON.parse(localStorage.getItem(cachedSessionStr));
                        if (cachedObj?.user) setUser(cachedObj.user);

                        // We must also try to hydrate the profile from a custom local cache
                        // so we don't return a null profile to the dashboard before the network resolves.
                        const cachedProfile = localStorage.getItem('iThrive_cached_profile');
                        if (cachedProfile) {
                            setProfile(JSON.parse(cachedProfile));
                            setLoading(false); // Safe to unblock instantly, we have both User and Profile
                        }
                    } catch (e) {
                        console.warn("Error parsing cache", e);
                    }
                }

                // Force a strict 3-second timeout so a deadlocked network pool never freezes the PWA forever
                const res = await Promise.race([
                    supabase.auth.getSession(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Auth Timeout')), 3000))
                ]);
                const session = res?.data?.session;

                if (session?.provider_token) {
                    localStorage.setItem('iThrive_fitbit_token', session.provider_token);
                }

                if (session?.user) {
                    await fetchUserData(session.user);
                } else {
                    setLoading(false);
                }
            } catch (err) {
                console.error('Session check error:', err.message);
                setError(err);
                setLoading(false);
            }
        };

        checkSessionAndFetch();

        const { data: authListener } = supabase.auth.onAuthStateChange(
            async (_event, session) => {
                if (session?.provider_token) {
                    localStorage.setItem('iThrive_fitbit_token', session.provider_token);
                }
                if (session?.user) {
                    await fetchUserData(session.user);
                } else {
                    setUser(null);
                    setProfile(null);
                    setLoading(false);
                }
            }
        );

        return () => {
            authListener?.subscription?.unsubscribe();
        };
    }, []);

    return (
        <UserProfileContext.Provider value={{ user, profile, loading, error }}>
            {children}
        </UserProfileContext.Provider>
    );
}
