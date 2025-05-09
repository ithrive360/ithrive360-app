import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AuthCallback from './pages/AuthCallback'; // <-- 1. Import this
import CardiovascularInsightsPage from './pages/CardiovascularInsightsPage';
import './App.css';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true); // ✅ added loading guard

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getSession(); // ✅ use getSession instead of getUser
      if (error) console.error('Error fetching session:', error.message);
      setUser(data?.session?.user || null);
      setLoading(false); // ✅ set loading to false when done
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading) return <div>Loading...</div>; // ✅ prevent premature render

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/dashboard" element={user ? <DashboardPage user={user} /> : <Navigate to="/" replace />} />
        <Route path="/auth/callback" element={<AuthCallback />} /> {/* <-- 2. Add this route */}
        <Route path="/insights/cardiovascular" element={<CardiovascularInsightsPage />} />
      </Routes>
    </Router>
  );
}

export default App;
