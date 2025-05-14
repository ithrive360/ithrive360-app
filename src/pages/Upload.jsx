import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { uploadAndParseDNA } from '../utils/uploadAndParseDNA';
import { uploadAndParseBlood } from '../utils/uploadAndParseBlood';
import SidebarMenu from './SidebarMenu';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';

export default function UploadPage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [menuOpen, setMenuOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [bloodMessage, setBloodMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;
      setUser(user);

      const { data: profileData } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData || null);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handleDNAUpload = async (e) => {
    if (isProcessing) return;
    const file = e.target.files[0];
    if (!file || !user?.id) {
      setMessage('Missing file or user ID.');
      return;
    }
    const result = await uploadAndParseDNA(file, user.id);
    setMessage(result.message);
  };

  const handleBloodUpload = async (e) => {
    if (isProcessing) return;
    const file = e.target.files[0];
    if (!file || !user?.id) {
      setBloodMessage('Missing file or user ID.');
      return;
    }
    const result = await uploadAndParseBlood(file, user.id);
    setBloodMessage(result.message);
  };

  if (loading) return <p>Loading...</p>;

  return (
    <div className="dashboard">
      <div
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          backgroundColor: '#fff',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '12px 16px',
          zIndex: 1000,
          boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)',
        }}
      >
        <button
          onClick={() => setMenuOpen((prev) => !prev)}
          style={{
            position: 'absolute',
            left: 16,
            background: 'none',
            border: 'none',
            padding: 0,
            cursor: 'pointer',
            lineHeight: 0,
            outline: 'none',
          }}
          aria-label="Toggle menu"
        >
          {menuOpen ? <X size={28} color="#3ab3a1" /> : <Menu size={28} color="#3ab3a1" />}
        </button>
        <img src={logo} alt="iThrive360 Logo" style={{ height: 32 }} />
      </div>

      <SidebarMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={async () => {
          await supabase.auth.signOut();
          window.location.href = '/';
        }}
        profile={profile}
      />

      <div style={{ height: 60 }} />

      <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', justifyContent: 'center', marginTop: '2rem' }}>
        <div className="card">
          <h3>DNA Data</h3>
          <p>Status: {profile?.dna_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}</p>
          <label className="btn btn-primary">
            Upload DNA
            <input type="file" accept=".txt" onChange={handleDNAUpload} style={{ display: 'none' }} disabled={isProcessing} />
          </label>
          {message && <p style={{ marginTop: '0.5rem' }}>{message}</p>}
        </div>

        <div className="card">
          <h3>Blood Test</h3>
          <p>Status: {profile?.blood_uploaded ? '✅ Uploaded' : '❌ Not uploaded'}</p>
          <label className="btn btn-primary">
            Upload Blood
            <input type="file" accept=".csv" onChange={handleBloodUpload} style={{ display: 'none' }} disabled={isProcessing} />
          </label>
          {bloodMessage && <p style={{ marginTop: '0.5rem' }}>{bloodMessage}</p>}
        </div>
      </div>
    </div>
  );
}
