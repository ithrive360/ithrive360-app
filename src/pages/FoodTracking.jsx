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
  }, []);

  // Effect for handling camera start/stop when isCameraOpen changes
  useEffect(() => {
    let currentStream = null; // To hold the stream for cleanup

    const manageCameraStream = async () => {
      if (isCameraOpen) {
        if (!user) {
          setFeedback("You must be logged in to use the camera.");
          setIsCameraOpen(false); // Close modal if user somehow gets here without being logged in
          return;
        }
        setLoadingPhoto(true); // Show loading indicator while camera starts
        setFeedback('Starting camera...');
        try {
          // Ensure videoRef.current is available
          if (videoRef.current) {
            currentStream = await startCamera(videoRef.current);
            if (currentStream) {
              setStream(currentStream);
              setFeedback('Camera started.');
            } else {
              setFeedback('Failed to start camera. Check permissions or device.');
              setIsCameraOpen(false); // Close modal if camera failed
            }
          } else {
             setFeedback('Camera view not ready. Please try again.');
             setIsCameraOpen(false);
          }
        } catch (error) {
          console.error("Error opening camera:", error);
          setFeedback('Error opening camera.');
          setIsCameraOpen(false);
        } finally {
          setLoadingPhoto(false);
        }
      } else {
        // isCameraOpen is false, so stop the stream if it exists
        if (stream) {
          stopCamera(stream, videoRef.current);
          setStream(null);
          setFeedback('Camera closed.');
        }
      }
    };

    manageCameraStream();

    // Cleanup function for this effect
    return () => {
      if (currentStream) { // If a stream was started in this effect's lifecycle
        stopCamera(currentStream, videoRef.current);
      }
      // Also ensure global stream state is cleaned up if component unmounts while modal is open
      if (stream && isCameraOpen) { 
          stopCamera(stream, videoRef.current);
          setStream(null);
      }
    };
  }, [isCameraOpen, user]); // Rerun when isCameraOpen or user changes

  // General cleanup for component unmount (safety net)
  useEffect(() => {
    return () => {
      if (stream) {
        stopCamera(stream, videoRef.current);
      }
    };
  }, [stream]);


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

  const handleOpenCamera = () => {
    if (!user) {
      setFeedback("You must be logged in to use the camera.");
      return;
    }
    setFeedback(''); // Clear any previous feedback
    setCapturedImage(null); // Clear previous image
    setIsCameraOpen(true); // This will trigger the useEffect to start the camera
  };

  const handleTakePhoto = () => {
    if (!user) {
      setFeedback("You must be logged in to take a photo.");
      return;
    }
    if (!videoRef.current) {
      setFeedback("Camera is not ready.");
      return;
    }
    const imageDataUrl = capturePhoto(videoRef.current);
    if (imageDataUrl) {
      setCapturedImage(imageDataUrl);
      setFeedback('Photo captured! Review and log it.');
      setIsCameraOpen(false); // Close modal after taking photo
    } else {
      setFeedback('Failed to capture photo.');
      // Optionally close modal or allow retry
      // setIsCameraOpen(false); 
    }
  };

  const handleCloseCamera = () => {
    setIsCameraOpen(false); // This will trigger the useEffect to stop the camera
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
          
          {/* This button remains to open the modal */}
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

          {/* Captured image display remains in the card, not in the modal */}
          {capturedImage && !isCameraOpen && ( // Only show if camera is closed and image exists
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

      {/* Full-screen Camera Modal */}
      {isCameraOpen && (
        <div 
          className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-4" 
        >
          {/* Close Button (Top Right) */}
          <button 
            onClick={handleCloseCamera} 
            className="absolute top-5 right-5 text-white p-2 rounded-full bg-black/50 hover:bg-white/20 focus:outline-none transition-colors z-10"
            aria-label="Close camera"
          >
            <X size={32} /> {/* Using Lucide X icon */}
          </button>

          {/* Video Feed */}
          <div className="relative w-full h-full flex items-center justify-center">
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-auto h-auto max-w-full max-h-full object-contain"
            />
          </div>

          {/* Take Photo Button (Bottom Center Shutter Style) */}
          {/* This outer div is for positioning the shutter button */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex justify-center items-center">
            <button 
              onClick={handleTakePhoto} 
              className="w-20 h-20 bg-white rounded-full p-1 shadow-lg focus:outline-none ring-4 ring-white/50 ring-offset-2 ring-offset-black/30 hover:bg-gray-200 transition-all duration-200 ease-in-out flex items-center justify-center"
              aria-label="Take photo"
            >
              {/* Inner circle for shutter button appearance */}
              <div className="w-16 h-16 bg-white rounded-full border-2 border-gray-400 group-hover:border-gray-500 transition-all"></div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default FoodTracking;
