import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { initUserProfile } from '../utils/initUserProfile';

export function useUserProfile() {
    const [user, setUser] = useState(null);
    const [profile, setProfile] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchUserData = async (currentUser) => {
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
                    } catch (e) {
                        console.warn("Error parsing cache", e);
                    }
                }

                const { data: { session } } = await supabase.auth.getSession();
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

    return { user, profile, loading, error };
}
