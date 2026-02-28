import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AuthCallback from './pages/AuthCallback';
import CardiovascularInsightsPage from './pages/CardiovascularInsightsPage';
import Allinsights from './pages/Allinsights'; // ✅ import your new insights page
import UploadPage from './pages/Upload';
import './App.css';
import ProfilePage from './pages/ProfilePage';
import FoodTracking from './pages/FoodTracking';
import SettingsPage from './pages/SettingsPage';
import TrackProgress from './pages/TrackProgress';
import { ErrorBoundary } from './components/ErrorBoundary';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 1. Initial quick check using synchronous local storage to paint the app immediately
    const cachedSessionStr = Object.keys(localStorage).find(key => key.startsWith('sb-') && key.endsWith('-auth-token'));
    if (cachedSessionStr) {
      setLoading(false);
    }

    // 2. Perform the actual network verification in the background
    const verifySession = async () => {
      const { data, error } = await supabase.auth.getSession();

      if (data?.session?.provider_token) {
        localStorage.setItem('iThrive_fitbit_token', data.session.provider_token);
      }

      setUser(data?.session?.user || null);
      setLoading(false); // Failsafe if local storage was empty
    };

    verifySession();

    // 3. Listen for future changes
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.provider_token) {
        localStorage.setItem('iThrive_fitbit_token', session.provider_token);
      }
      setUser(session?.user || null);
      setLoading(false);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        {/* Simple splash placeholder to replace the blank white screen */}
        <img src="/icons/icon-192x192.png" alt="Loading iThrive360..." style={{ width: '80px', height: '80px', animation: 'pulse 2s infinite' }} />
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/dashboard" element={user ? <DashboardPage user={user} /> : <Navigate to="/" replace />} />
        <Route path="/auth/callback" element={<AuthCallback />} />
        <Route path="/insights/cardiovascular" element={<CardiovascularInsightsPage />} />
        <Route path="/insights/all" element={user ? <ErrorBoundary><Allinsights /></ErrorBoundary> : <Navigate to="/" replace />} /> {/* ✅ new route */}
        <Route path="/upload" element={user ? <UploadPage /> : <Navigate to="/" replace />} />
        <Route path="/profile" element={user ? <ProfilePage /> : <Navigate to="/" replace />} />
        <Route path="/food" element={user ? <FoodTracking /> : <Navigate to="/" replace />} />
        <Route path="/track-progress" element={user ? <TrackProgress /> : <Navigate to="/" replace />} />
        <Route path="/settings" element={user ? <SettingsPage /> : <Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
