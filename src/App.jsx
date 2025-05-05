import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { supabase } from './supabaseClient';
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import AuthCallback from './pages/AuthCallback'; // <-- 1. Import this
import './App.css';

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const getSession = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error('Error fetching user:', error.message);
      setUser(data?.user || null);
    };

    getSession();

    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  return (
    <Router>
      <Routes>
        <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <AuthPage />} />
        <Route path="/dashboard" element={user ? <DashboardPage user={user} /> : <Navigate to="/" replace />} />
        <Route path="/auth/callback" element={<AuthCallback />} /> {/* <-- 2. Add this route */}
      </Routes>
    </Router>
  );
}

export default App;
