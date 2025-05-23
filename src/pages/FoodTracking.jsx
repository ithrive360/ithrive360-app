import { useEffect, useState, useRef } from 'react';
import { supabase } from '../supabaseClient';
import SidebarMenu from './SidebarMenu';
import { Menu, X, ScanBarcode, Camera, CheckCircle, UploadCloud } from 'lucide-react'; // Added UploadCloud
import logo from '../assets/logo.png';

import { launchBarcodeScanner } from '../utils/barcodeScanner';
import { lookupBarcodeProduct } from '../utils/barcodeLookup';
// Import new camera functions and keep launchPhotoRecognizer for mock analysis
import { startCamera, capturePhoto, stopCamera, launchPhotoRecognizer } from '../utils/photoRecognizer';
import { logMealToSupabase } from '../utils/logMeal';

function FoodTracking() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [loadingBarcode, setLoadingBarcode] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false); // Used for opening camera and logging
  const [feedback, setFeedback] = useState('');

  // New camera states
  const [isCameraOpen, setIsCameraOpen] = useState(false);
  const [stream, setStream] = useState(null);
  const [capturedImage, setCapturedImage] = useState(null);
  const videoRef = useRef(null);

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const userSession = sessionData?.session?.user;
      if (!userSession) {
        // Redirect to login or show message if not logged in
        // For now, just return to prevent further execution
        return;
      }
      setUser(userSession);

      const { data: profileData } = await supabase
        .from('user_profile')
        .select('*')
        .eq('user_id', userSession.id)
        .single();

      setProfile(profileData);
    };

    fetchProfile();

    // Cleanup camera on component unmount
    return () => {
      if (stream) {
        stopCamera(stream, videoRef.current);
      }
    };
  }, [stream]); // Add stream to dependency array for cleanup

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

  const handleOpenCamera = async () => {
    if (!user) {
        setFeedback("You must be logged in to use the camera.");
        return;
    }
    setLoadingPhoto(true);
    setFeedback('');
    setCapturedImage(null); // Clear previous image

    try {
      const currentStream = await startCamera(videoRef.current);
      if (currentStream) {
        setStream(currentStream);
        setIsCameraOpen(true);
      } else {
        setFeedback('Failed to start camera. Check permissions or device.');
      }
    } catch (error) {
      console.error("Error opening camera:", error);
      setFeedback('Error opening camera.');
    } finally {
      setLoadingPhoto(false);
    }
  };

  const handleTakePhoto = () => {
    if (!user) {
        setFeedback("You must be logged in to take a photo.");
        return;
    }
    const imageDataUrl = capturePhoto(videoRef.current);
    if (imageDataUrl) {
      setCapturedImage(imageDataUrl);
      setFeedback('Photo captured! Review and log it.');
      // Keep camera open as per requirement
    } else {
      setFeedback('Failed to capture photo.');
    }
  };

  const handleCloseCamera = () => {
    if (stream) {
      stopCamera(stream, videoRef.current);
    }
    setIsCameraOpen(false);
    setStream(null);
    // setCapturedImage(null); // Decide if you want to clear image on close
    setFeedback('Camera closed.');
  };
  
  const handleLogPhoto = async () => {
    if (!capturedImage || !user) {
      setFeedback('No image to log or user not found.');
      return;
    }
    setLoadingPhoto(true);
    setFeedback('Analyzing and logging photo...');

    try {
      // Simulate analysis with launchPhotoRecognizer structure (using the captured image)
      // In a real scenario, you'd send capturedImage to an analysis backend
      const mockAnalysis = await launchPhotoRecognizer(); // This still returns mock data
                                                        // but we're using it for structure

      if (!mockAnalysis.success) {
        setFeedback('Failed to analyze meal from photo.');
        setLoadingPhoto(false);
        return;
      }

      const log = await logMealToSupabase({
        user_id: user.id,
        entry_type: 'photo',
        label: mockAnalysis.label, // Use label from mock analysis
        nutrients_json: mockAnalysis.nutrients_json, // Use nutrients from mock analysis
        source: 'photo-capture-mock-gpt', // Indicate source
        raw_json: { ...mockAnalysis.raw_json, captured_image_data_url_length: capturedImage.length } // Add some info about the image
      });

      if (log.success) {
        setFeedback(`✅ Logged: ${mockAnalysis.label}`);
        setCapturedImage(null); // Clear image after successful logging
        handleCloseCamera(); // Close camera after logging
      } else {
        setFeedback(`❌ Log error: ${log.message}`);
      }
    } catch (err) {
      console.error(err);
      setFeedback('Unexpected error during photo logging.');
    } finally {
      setLoadingPhoto(false);
    }
  };


  if (!user && !profile) { // Check if user and profile are being fetched
      const session = supabase.auth.getSession();
      if(!session) return <p>You must be logged in to view this page. <a href="/auth">Login</a></p>;
      return <p>Loading user profile...</p>;
  }
  if(!user) {
    // This case might be hit if fetchProfile hasn't completed yet or failed silently earlier.
    // Could redirect to login or show a more specific message.
    return <p>User session not found. Try logging in again. <a href="/auth">Login</a></p>;
  }


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
      <div style={{ height: 64 }} /> {/* Spacer for fixed top bar */}

      {/* Main Card */}
      <div
        style={{
          backgroundColor: '#fff',
          borderRadius: 16,
          padding: '1.5rem',
          margin: '1rem auto', // Reduced margin for more space
          width: '90vw',
          maxWidth: 600,
          boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        }}
      >
        <h2 style={{ fontSize: 22, fontWeight: 700, display: 'flex', alignItems: 'center', gap: 8, marginBottom: '1.5rem' }}>
          🍽️ Food Tracker
        </h2>

        {/* Barcode Scanner Button */}
        <div style={{ marginBottom: '1.5rem' }}>
          <button
            onClick={handleBarcodeScan}
            disabled={loadingBarcode || isCameraOpen} // Disable if camera is open
            style={{
              display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#f3f4f6',
              padding: 12, borderRadius: 10, width: '100%', fontWeight: 600, fontSize: 15,
              cursor: 'pointer', border: '1px solid #ddd', opacity: (loadingBarcode || isCameraOpen) ? 0.6 : 1
            }}
          >
            <ScanBarcode size={20} /> {loadingBarcode ? 'Scanning...' : 'Scan Food Barcode'}
          </button>
        </div>

        {/* Camera Section */}
        <div style={{ marginBottom: '1.5rem', border: '1px solid #eee', padding: '1rem', borderRadius: 10 }}>
          <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: '1rem' }}>Meal Photo</h3>
          
          {!isCameraOpen && (
            <button
              onClick={handleOpenCamera}
              disabled={loadingPhoto || loadingBarcode} // Disable if barcode scanner is active
              style={{
                display: 'flex', alignItems: 'center', gap: 10, backgroundColor: '#e0f2fe', // Light blue
                padding: 12, borderRadius: 10, width: '100%', fontWeight: 600, fontSize: 15,
                cursor: 'pointer', border: '1px solid #bae6fd', color: '#0c4a6e',
                opacity: loadingPhoto || loadingBarcode ? 0.6 : 1
              }}
            >
              <Camera size={20} /> {loadingPhoto ? 'Opening Camera...' : 'Open Camera'}
            </button>
          )}

          {isCameraOpen && (
            <div style={{ marginBottom: '1rem' }}>
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                style={{ width: '100%', maxHeight: '300px', borderRadius: 8, border: '1px solid #ddd', marginBottom: '1rem' }}
              />
              <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem' }}>
                <button
                  onClick={handleTakePhoto}
                  style={{
                    flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: '#22c55e', color: 'white', padding: 10, borderRadius: 8,
                    fontWeight: 500, fontSize: 15, border: 'none', cursor: 'pointer'
                  }}
                >
                  <Camera size={18} /> Take Photo
                </button>
                <button
                  onClick={handleCloseCamera}
                  style={{
                    flexGrow: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    backgroundColor: '#ef4444', color: 'white', padding: 10, borderRadius: 8,
                    fontWeight: 500, fontSize: 15, border: 'none', cursor: 'pointer'
                  }}
                >
                  <X size={18} /> Exit Camera
                </button>
              </div>
            </div>
          )}

          {capturedImage && (
            <div style={{ marginTop: '1rem', borderTop: '1px solid #eee', paddingTop: '1rem' }}>
              <h4 style={{ fontSize: 16, fontWeight: 600, marginBottom: '0.5rem' }}>Captured Image:</h4>
              <img src={capturedImage} alt="Captured meal" style={{ width: '100%', borderRadius: 8, border: '1px solid #ddd', marginBottom: '1rem' }} />
              <button
                onClick={handleLogPhoto}
                disabled={loadingPhoto}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10,
                  backgroundColor: '#10b981', color: 'white', padding: 12, borderRadius: 10,
                  width: '100%', fontWeight: 600, fontSize: 15, cursor: 'pointer', border: 'none',
                  opacity: loadingPhoto ? 0.6 : 1
                }}
              >
                <UploadCloud size={20} /> {loadingPhoto ? 'Logging...' : 'Log This Photo'}
              </button>
            </div>
          )}
        </div>
        
        {/* Feedback Area */}
        {feedback && (
          <div style={{ marginTop: 12, padding: '10px', borderRadius: '8px', backgroundColor: feedback.startsWith('✅') ? '#f0fdf4' : '#fef2f2', color: feedback.startsWith('✅') ? '#15803d' : '#b91c1c', border: `1px solid ${feedback.startsWith('✅') ? '#bbf7d0' : '#fecaca'}` }}>
            {feedback}
          </div>
        )}
      </div>
    </div>
  );
}

export default FoodTracking;
