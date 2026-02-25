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
    // Native Interception logic moved to index.html to run before Supabase init

    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession();

      // Globally intercept provider token before Supabase dumps it
      if (data?.session?.provider_token) {
        localStorage.setItem('iThrive_fitbit_token', data.session.provider_token);
      }

      if (error) console.error('Error fetching session:', error.message);
      setUser(data?.session?.user || null);
      setLoading(false);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      // Catch token during live redirect events as well
      if (session?.provider_token) {
        localStorage.setItem('iThrive_fitbit_token', session.provider_token);
      }
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>;

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
