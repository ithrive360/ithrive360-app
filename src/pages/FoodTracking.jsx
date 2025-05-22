import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SidebarMenu from './SidebarMenu';
import { Menu, X, ScanBarcode, Camera, Pencil } from 'lucide-react';
import logo from '../assets/logo.png';

function FoodTracking() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [manualEntry, setManualEntry] = useState('');
  const [cameraPhoto, setCameraPhoto] = useState(null);
  const [barcode, setBarcode] = useState('');

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (!user) return;
      setUser(user);

      const { data: profileData } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', user.id)
        .single();

      setProfile(profileData);
    };

    fetchProfile();
  }, []);

  const handleCameraUpload = (e) => {
    const file = e.target.files[0];
    if (file) setCameraPhoto(URL.createObjectURL(file));
  };

  const handleSave = () => {
    alert('🔒 Save functionality coming soon:\n' +
      `Barcode: ${barcode}\n` +
      `Manual Text: ${manualEntry}\n` +
      `Photo: ${cameraPhoto ? 'Yes' : 'No'}`);
  };

  if (!user) return <p>You must be logged in to view this page.</p>;

  return (
    <div className="dashboard">
      {/* Top Bar */}
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

      <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} profile={profile} />

      <div style={{ height: 64 }} />

      {/* Main Card */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: '1.5rem',
          margin: '2rem auto',
          width: '90vw',
          maxWidth: 600,
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          🍽️ Food Tracker
        </h2>

        {/* Barcode Entry */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <ScanBarcode size={18} /> Enter Barcode
          </label>
          <input
            type="text"
            placeholder="e.g. 5059604645433"
            value={barcode}
            onChange={(e) => setBarcode(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #ccc',
            }}
          />
        </div>

        {/* Camera Upload */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Camera size={18} /> Upload Meal Photo
          </label>
          <input
            type="file"
            accept="image/*"
            capture="environment"
            onChange={handleCameraUpload}
          />
          {cameraPhoto && (
            <img
              src={cameraPhoto}
              alt="meal"
              style={{ width: '100%', marginTop: 10, borderRadius: 8, objectFit: 'cover' }}
            />
          )}
        </div>

        {/* Manual Entry */}
        <div style={{ marginBottom: '1.5rem' }}>
          <label style={{ fontWeight: 600, display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
            <Pencil size={18} /> Describe Manually
          </label>
          <textarea
            rows={3}
            placeholder="e.g. Chicken salad with olive oil, avocado and sweet potato"
            value={manualEntry}
            onChange={(e) => setManualEntry(e.target.value)}
            style={{
              width: '100%',
              padding: 10,
              borderRadius: 8,
              border: '1px solid #ccc',
              resize: 'vertical'
            }}
          />
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          style={{
            backgroundColor: '#3ab3a1',
            color: 'white',
            padding: '10px 16px',
            fontSize: 14,
            fontWeight: 600,
            borderRadius: 8,
            border: 'none',
            cursor: 'pointer',
            width: '100%',
          }}
        >
          Save Entry
        </button>
      </div>
    </div>
  );
}

export default FoodTracking;
