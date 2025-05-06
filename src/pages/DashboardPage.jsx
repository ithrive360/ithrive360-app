import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { uploadAndParseDNA } from '../utils/uploadAndParseDNA';
import { uploadAndParseBlood } from '../utils/uploadAndParseBlood';
import logo from '../assets/logo.png';

function DashboardPage() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState(null);
  const [greeting, setGreeting] = useState('');
  const [message, setMessage] = useState('');
  const [bloodMessage, setBloodMessage] = useState('');

  useEffect(() => {
    const fetchUserData = async () => {
      const { data: userData } = await supabase.auth.getUser();
      setUser(userData?.user || null);

      if (userData?.user) {
        const { data: profileData, error } = await supabase
          .from('user_profile')
          .select('*')
          .eq('user_id', userData.user.id)
          .single();

        if (error) console.error('Profile fetch error:', error.message);
        setProfile(profileData || null);
      }

      const hour = new Date().getHours();
      if (hour < 12) setGreeting('Good morning');
      else if (hour < 18) setGreeting('Good afternoon');
      else setGreeting('Good evening');

      setLoading(false);
    };

    fetchUserData();
  }, []);

  const handleLogout = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) console.error('Logout error:', error.message);
    else window.location.href = '/';
  };

  const handleDNAUpload = async (e) => {
    const file = e.target.files[0];
    const result = await uploadAndParseDNA(file, user.user_id);
    setMessage(result.message);
  };

  const handleBloodUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || !user?.user_id) {
      setBloodMessage('Missing file or user ID.');
      return;
    }
    const result = await uploadAndParseBlood(file, user.id);
    setBloodMessage(result.message);
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>You must be logged in to view this page.</p>;

  return (
    <div className="dashboard">
      <img src={logo} alt="iThrive360 Logo" className="logo" />
      <h1>iThrive360</h1>
      <p>{greeting}, {user.user_metadata?.full_name?.split(' ')[0] || user.email || 'there'}!</p>

{/* Upload Cards */}
<div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2rem' }}>
  <div className="card">
    <h3>DNA Data</h3>
    <p>Status: {profile?.dna_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}</p>
    <input type="file" accept=".txt" onChange={handleDNAUpload} />
    {message && <p style={{ marginTop: '0.5rem' }}>{message}</p>}
  </div>
  <div className="card">
    <h3>Blood Test</h3>
    <p>Status: {profile?.blood_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}</p>
    <input type="file" accept=".csv" onChange={handleBloodUpload} />
    {bloodMessage && <p style={{ marginTop: '0.5rem' }}>{bloodMessage}</p>}
  </div>
</div>

      {/* Quick Actions */}
      <div style={{ marginTop: '3rem' }}>
        <h2>Quick Actions</h2>
        <button className="btn btn-primary">Start New Report</button>
        <button className="btn btn-primary">View Insights</button>
        <button className="btn btn-primary">Recommendations</button>
      </div>

      {/* Progress Teaser */}
      {profile?.dna_uploaded && profile?.blood_uploaded && (
        <div style={{ marginTop: '3rem' }}>
          <h3>Progress Tracker</h3>
          <p>3 out of 8 areas improved since your last test 💪</p>
          <div style={{ height: '10px', width: '80%', background: '#eee', margin: '0 auto', borderRadius: '5px' }}>
            <div style={{ width: '37%', height: '100%', background: '#3ab3a1', borderRadius: '5px' }}></div>
          </div>
        </div>
      )}

      {/* Settings / Sign out */}
      <button onClick={handleLogout} className="btn btn-primary" style={{ marginTop: '2rem' }}>
        Sign Out
      </button>
    </div>
  );
}

export default DashboardPage;
