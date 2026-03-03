import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
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
import { useUserProfile } from './hooks/useUserProfile';

function App() {
  const { user, loading } = useUserProfile();

  // Prevent router trashing before the initial user token is hydrated
  const [routerLock, setRouterLock] = useState(true);

  useEffect(() => {
    // If user resolves to null (logged out) or an object (logged in), unlock.
    if (user !== undefined) {
      setRouterLock(false);
    }
    // Hard fallback: if Context API completely fails to resolve `user` within 10s on WebView, force unlock.
    const lockTimer = setTimeout(() => {
      if (user === undefined) {
        console.warn("App.jsx: user === undefined for 10s. Force-unlocking router.");
        setRouterLock(false);
      }
    }, 10000);

    return () => clearTimeout(lockTimer);
  }, [user]);

  if (loading) {
    return (
      <div style={{ height: '100vh', width: '100vw', display: 'flex', justifyContent: 'center', alignItems: 'center', backgroundColor: '#FAFAFA' }}>
        <img src="/icons/icon-192x192.png" alt="Loading iThrive360..." style={{ width: '80px', height: '80px', animation: 'pulse 2s infinite' }} />
      </div>
    );
  }

  if (routerLock && user === undefined) return null;

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
