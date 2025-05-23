import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SidebarMenu from './SidebarMenu';
import { Menu, X, ScanBarcode, Camera, Pencil, CheckCircle } from 'lucide-react';
import logo from '../assets/logo.png';

import { launchBarcodeScanner } from '../utils/barcodeScanner';
import { lookupBarcodeProduct } from '../utils/barcodeLookup';
import { launchPhotoRecognizer } from '../utils/photoRecognizer';
import { logMealToSupabase } from '../utils/logMeal';

function FoodTracking() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [loadingBarcode, setLoadingBarcode] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState('');

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

  const handleBarcodeScan = async () => {
    setLoadingBarcode(true);
    setFeedback('');
    try {
      const scan = await launchBarcodeScanner();
      if (!scan.success) return setFeedback(scan.message);

      const lookup = await lookupBarcodeProduct(scan.code);
      if (!lookup.success) return setFeedback(lookup.message);

      const log = await logMealToSupabase({
        user_id: user.id,
        entry_type: 'barcode',
        barcode: scan.code,
        label: lookup.data.name,
        nutrients_json: lookup.data.nutrients_json,
        source: 'openfoodfacts',
        raw_json: lookup.data
      });

      if (log.success) setFeedback(`✅ Logged: ${lookup.data.name}`);
      else setFeedback(`❌ Log error: ${log.message}`);
    } catch (err) {
      console.error(err);
      setFeedback('Unexpected error during barcode scan');
    } finally {
      setLoadingBarcode(false);
    }
  };

  const handlePhotoScan = async () => {
    setLoadingPhoto(true);
    setFeedback('');
    try {
      const result = await launchPhotoRecognizer();
      if (!result.success) return setFeedback('Failed to recognize meal.');

      const log = await logMealToSupabase({
        user_id: user.id,
        entry_type: 'photo',
        label: result.label,
        nutrients_json: result.nutrients_json,
        source: 'mock-gpt-photo',
        raw_json: result.raw_json
      });

      if (log.success) setFeedback(`✅ Logged: ${result.label}`);
      else setFeedback(`❌ Log error: ${log.message}`);
    } catch (err) {
      console.error(err);
      setFeedback('Unexpected error during photo scan');
    } finally {
      setLoadingPhoto(false);
    }
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

        {/* Barcode Scanner */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={handleBarcodeScan}
            disabled={loadingBarcode}
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
              opacity: loadingBarcode ? 0.6 : 1
            }}
          >
            <ScanBarcode size={20} /> {loadingBarcode ? 'Scanning...' : 'Scan Food Barcode'}
          </button>
        </div>

        {/* Meal Photo */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={handlePhotoScan}
            disabled={loadingPhoto}
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
              opacity: loadingPhoto ? 0.6 : 1
            }}
          >
            <Camera size={20} /> {loadingPhoto ? 'Analyzing...' : 'Take Meal Photo'}
          </button>
        </div>

        {/* Feedback */}
        {feedback && (
          <div style={{ marginTop: 12, color: feedback.startsWith('✅') ? '#10B981' : '#DC2626' }}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}

export default FoodTracking;
