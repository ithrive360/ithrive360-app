import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SidebarMenu from './SidebarMenu';
import { Menu, X, ScanBarcode, Camera } from 'lucide-react';
import logo from '../assets/logo.png';
//import { launchBarcodeScanner } from '../utils/barcodeScanner';
import { launchPhotoRecognizer } from '../utils/photoRecognizer';

function FoodTracking() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);
  const [scannedBarcode, setScannedBarcode] = useState('');
  const [recognizedMeal, setRecognizedMeal] = useState('');
  const [mealPhotoUrl, setMealPhotoUrl] = useState(null);

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

  {/*
  const handleBarcodeScan = async () => {
    const result = await launchBarcodeScanner();
    if (result?.code) setScannedBarcode(result.code);
  };

  */}
  
  const handleMealPhoto = async () => {
    const result = await launchPhotoRecognizer();
    if (result?.label) setRecognizedMeal(result.label);
    if (result?.imageUrl) setMealPhotoUrl(result.imageUrl);
  };

  const handleSave = () => {
    alert('🔒 Save logic not implemented\n' +
      `Barcode: ${scannedBarcode || '[none]'}\n` +
      `Meal: ${recognizedMeal || '[none]'}`);
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

        {/* Barcode Scan */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={''}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#f3f4f6',
              padding: 12,
              borderRadius: 10,
              width: '100%',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              border: '1px solid #ddd',
            }}
          >
            <ScanBarcode size={20} /> Scan Food Barcode
          </button>
          {scannedBarcode && (
            <div style={{ marginTop: 8, fontSize: 14, color: '#111827' }}>
              Scanned: <strong>{scannedBarcode}</strong>
            </div>
          )}
        </div>

        {/* Meal Photo Recognition */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={handleMealPhoto}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              backgroundColor: '#f3f4f6',
              padding: 12,
              borderRadius: 10,
              width: '100%',
              fontWeight: 600,
              fontSize: 15,
              cursor: 'pointer',
              border: '1px solid #ddd',
            }}
          >
            <Camera size={20} /> Take Meal Photo
          </button>
          {mealPhotoUrl && (
            <img
              src={mealPhotoUrl}
              alt="meal"
              style={{ width: '100%', marginTop: 10, borderRadius: 8, objectFit: 'cover' }}
            />
          )}
          {recognizedMeal && (
            <div style={{ marginTop: 8, fontSize: 14, color: '#111827' }}>
              Detected: <strong>{recognizedMeal}</strong>
            </div>
          )}
        </div>

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
