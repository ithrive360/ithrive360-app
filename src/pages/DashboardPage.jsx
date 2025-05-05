import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import logo from '../assets/logo.png';

function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      const { data, error } = await supabase.auth.getUser();
      if (error) console.error('Error fetching user:', error.message);
      setUser(data?.user || null);
      setLoading(false);
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error('Logout error:', error.message);
    } else {
      window.location.href = '/';
    }
  };

  if (loading) return <p style={{ textAlign: 'center' }}>Loading...</p>;
  if (!user) return <p style={{ textAlign: 'center' }}>You must be logged in to view this page.</p>;

  const firstName = user.user_metadata?.full_name?.split(' ')[0] || user.email || 'there';

  return (
    <div className="dashboard">
      <img src={logo} alt="iThrive360 Logo" className="logo" />
      <h1>iThrive360</h1>
      <p>Welcome, {firstName}!</p>
      <h1>SCREW YOU BOLTON 1 !!!</h1>
      <button onClick={handleLogout} className="btn btn-primary">
        Sign Out
      </button>
    </div>
  );
}

export default DashboardPage;