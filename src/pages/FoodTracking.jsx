import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import SidebarMenu from './SidebarMenu';
import { Menu, X, ScanBarcode, Camera, Pencil, CheckCircle, Utensils } from 'lucide-react';
import LiveBarcodeScanner from '../components/LiveBarcodeScanner';
import logo from '../assets/logo.png';

import { decodeBarcodeFromImage } from '../utils/barcodeScanner';
import { lookupBarcodeProduct } from '../utils/barcodeLookup';
import { analyzeMealImage } from '../utils/photoRecognizer';
import { logMealToSupabase } from '../utils/logMeal';

function FoodTracking() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [loadingBarcode, setLoadingBarcode] = useState(false);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [feedback, setFeedback] = useState('');
  const [scannedProduct, setScannedProduct] = useState(null);
  const [showLiveScanner, setShowLiveScanner] = useState(false);

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

  const [barcodeImagePreview, setBarcodeImagePreview] = useState(null);

  const handleLiveScanResult = async (scan) => {
    setShowLiveScanner(false);

    // Provide a brief haptic feedback if supported by the device
    if (navigator.vibrate) {
      navigator.vibrate(50);
    }

    setScannedProduct(null);
    setLoadingBarcode(true);
    setFeedback('Analyzing barcode...');

    try {
      if (!scan.success) {
        setFeedback(scan.message || 'No barcode detected');
        setLoadingBarcode(false);
        return;
      }

      setFeedback('Barcode detected! Looking up product...');
      const lookup = await lookupBarcodeProduct(scan.code);
      if (!lookup.success) {
        setFeedback(lookup.message);
        return;
      }

      setScannedProduct(lookup.data);
      setBarcodeImagePreview(null); // Clear the image of the barcode once results load

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

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingPhoto(true);
    setScannedProduct(null);
    setFeedback('Uploading and analyzing meal...');

    try {
      const result = await analyzeMealImage(file);
      if (!result.success) return setFeedback(`Analysis failed: ${result.message}`);

      // Render the result as a card
      setScannedProduct({
        name: result.label,
        nutrients_json: result.nutrients_json,
        image_url: URL.createObjectURL(file)
      });

      setFeedback('Saving to your daily log...');

      const log = await logMealToSupabase({
        user_id: user.id,
        entry_type: 'photo',
        label: result.label,
        nutrients_json: result.nutrients_json,
        source: 'openai-vision',
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
    <div className="font-sans px-4 py-8 max-w-5xl mx-auto bg-[#F9FAFB] min-h-screen">
      {/* Modern Sticky Header */}
      <div className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md flex items-center justify-center py-3 px-4 z-50 shadow-sm border-b border-gray-100">
        <button
          onClick={() => setMenuOpen(!menuOpen)}
          className="absolute left-4 bg-transparent outline-none cursor-pointer border-none p-0"
        >
          {menuOpen ? <X size={28} className="text-emerald-500" /> : <Menu size={28} className="text-emerald-500" />}
        </button>
        <img src={logo} alt="iThrive360 Logo" className="h-8" />
      </div>

      <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} profile={profile} />

      <div className="h-16" /> {/* Spacer */}

      <div className="mb-6 text-center mt-2">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Food Tracker</h1>
        <p className="text-sm text-gray-500 max-w-sm mx-auto">
          Log your meals instantly using barcode scanning or AI photo analysis.
        </p>
      </div>

      {/* Main Container */}
      <div className="flex flex-col gap-6 max-w-md mx-auto">

        {/* Upload Buttons Card */}
        <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col relative overflow-hidden group hover:shadow-lg transition-all">
          {/* Decorative blob */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60 pointer-events-none z-0"></div>

          <div className="relative z-10">
            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="bg-emerald-100 p-3.5 rounded-2xl text-emerald-600 shadow-inner">
                <Utensils size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">Meal Entry</h3>
                <p className="text-xs text-gray-500">Log your food via barcode or photo</p>
              </div>
            </div>

            <div className="flex flex-col gap-4">
              <button
                onClick={() => setShowLiveScanner(true)}
                disabled={loadingBarcode}
                className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer border border-transparent shadow-sm ${loadingBarcode
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border-none shadow-sm shadow-emerald-100/50'
                  }`}
              >
                <ScanBarcode size={20} className={loadingBarcode ? "" : "text-emerald-500"} />
                {loadingBarcode ? 'Looking up product...' : 'Scan Food Barcode'}
              </button>

              {/* Image Preview for Barcode */}
              {barcodeImagePreview && (
                <div className="text-center mt-2">
                  <img
                    src={barcodeImagePreview}
                    alt="Barcode Preview"
                    className="max-w-full max-h-[300px] rounded-lg shadow-sm"
                  />
                </div>
              )}

              <label className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer shadow-sm outline-none border-none m-0 ${loadingPhoto
                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'bg-[#3ab3a1] text-white hover:opacity-90 shadow-lg shadow-[#3ab3a1]/20'
                }`}>
                <Camera size={20} />
                {loadingPhoto ? 'Analyzing Photo...' : 'Take Meal Photo'}
                <input
                  type="file"
                  accept="image/*"
                  capture="environment"
                  className="hidden"
                  onChange={handlePhotoFileChange}
                  disabled={loadingPhoto}
                />
              </label>
            </div>
          </div>
        </div>

        {/* Feedback / Status Text */}
        {feedback && !scannedProduct && (
          <p className="mt-2 text-sm text-center font-medium text-emerald-700 bg-emerald-50 py-2.5 px-3 rounded-xl border border-emerald-100 w-full animate-fade-in shadow-sm">
            {feedback}
          </p>
        )}

        {scannedProduct && (
          <div className="space-y-6 animate-fade-in w-full pb-10">

            {/* Header Card */}
            <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col items-center text-center gap-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60 pointer-events-none z-0"></div>
              <div className="relative z-10 w-full flex flex-col items-center">
                {scannedProduct.image_url && (
                  <img
                    src={scannedProduct.image_url}
                    alt={scannedProduct.name}
                    className="w-32 h-32 object-cover rounded-2xl shadow-sm border border-gray-100 mb-2"
                  />
                )}
                <div>
                  <h3 className="text-xl font-bold text-gray-900 leading-tight block">{scannedProduct.name}</h3>
                  {scannedProduct.brand && <span className="text-sm font-medium text-gray-500 mt-1 block">{scannedProduct.brand.split(',')[0]}</span>}
                </div>
              </div>
            </div>

            {/* Health Scores Grid */}
            <div className="grid grid-cols-2 gap-4">
              {scannedProduct.nutriscore_grade && (
                <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Nutri-Score</span>
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl font-black text-white shadow-inner ${scannedProduct.nutriscore_grade === 'a' ? 'bg-emerald-500' :
                    scannedProduct.nutriscore_grade === 'b' ? 'bg-emerald-400' :
                      scannedProduct.nutriscore_grade === 'c' ? 'bg-yellow-400' :
                        scannedProduct.nutriscore_grade === 'd' ? 'bg-orange-400' : 'bg-rose-500'
                    }`}>
                    {scannedProduct.nutriscore_grade.toUpperCase()}
                  </div>
                </div>
              )}

              {scannedProduct.nova_group && (
                <div className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col items-center justify-between text-center min-h-[140px]">
                  <span className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">NOVA Process</span>
                  <div className={`px-4 py-2 rounded-lg font-bold text-white text-sm whitespace-nowrap ${scannedProduct.nova_group === 1 ? 'bg-emerald-500' :
                    scannedProduct.nova_group === 2 ? 'bg-yellow-400' :
                      scannedProduct.nova_group === 3 ? 'bg-orange-400' : 'bg-rose-500'
                    }`}>
                    Group {scannedProduct.nova_group}
                  </div>
                  <span className="text-[10px] text-gray-400 mt-2 leading-tight">
                    {scannedProduct.nova_group === 1 ? 'Unprocessed / Minimally processed' :
                      scannedProduct.nova_group === 2 ? 'Processed culinary ingredients' :
                        scannedProduct.nova_group === 3 ? 'Processed foods' : 'Ultra-processed food and drink products'}
                  </span>
                </div>
              )}
            </div>

            {/* Nutrition Facts */}
            {scannedProduct.nutrients_json && (
              <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
                <div className="absolute top-0 right-0 w-32 h-32 bg-amber-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60 pointer-events-none z-0"></div>
                <div className="relative z-10 w-full">
                  <h4 className="text-sm font-bold text-emerald-600 mb-4 pb-2 flex justify-between items-end border-b border-gray-100/50">
                    Nutrition Facts
                    <span className="text-xs font-normal text-gray-400">{scannedProduct.serving_size ? `per ${scannedProduct.serving_size}` : 'per 100g'}</span>
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-sm">
                      <span className="font-semibold text-gray-700">Calories</span>
                      <span className="font-bold text-gray-900">{scannedProduct.nutrients_json.energy_kcal} kcal</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Protein</span>
                      <span className="font-medium text-gray-800">{scannedProduct.nutrients_json.protein_g}g</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Carbs</span>
                      <span className="font-medium text-gray-800">{scannedProduct.nutrients_json.carbohydrates_g}g</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pl-4 border-l-2 border-gray-100">
                      <span className="text-gray-500 text-xs">of which sugars</span>
                      <span className="text-gray-600 text-xs">{scannedProduct.nutrients_json.sugar_g}g</span>
                    </div>
                    <div className="flex justify-between items-center text-sm">
                      <span className="text-gray-600">Fat</span>
                      <span className="font-medium text-gray-800">{scannedProduct.nutrients_json.fat_g}g</span>
                    </div>
                    <div className="flex justify-between items-center text-sm pl-4 border-l-2 border-gray-100">
                      <span className="text-gray-500 text-xs">saturated</span>
                      <span className="text-gray-600 text-xs">{scannedProduct.nutrients_json.saturated_fat_g}g</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Ingredients & Allergens */}
            <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60 pointer-events-none z-0"></div>
              <div className="relative z-10 w-full">
                <h4 className="text-sm font-bold text-emerald-600 mb-3 border-b border-gray-100/50 pb-2">Ingredients</h4>
                <p className="text-xs text-gray-500 leading-relaxed font-medium">
                  {scannedProduct.ingredients || "No ingredient list available."}
                </p>

                {scannedProduct.allergens && (
                  <div className="mt-4 pt-3 border-t border-gray-50">
                    <h5 className="text-[10px] font-bold text-gray-400 mb-2 uppercase tracking-widest">Contains Allergens</h5>
                    <div className="flex flex-wrap gap-2">
                      {scannedProduct.allergens.split(', ').map((allergen, idx) => (
                        <span key={idx} className="bg-rose-50 text-rose-500 text-[10px] font-bold px-2 py-1 rounded-md capitalize border border-rose-100">
                          {allergen}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Live Scanner Overlay */}
      {
        showLiveScanner && (
          <LiveBarcodeScanner
            onScan={handleLiveScanResult}
            onClose={() => setShowLiveScanner(false)}
          />
        )
      }

    </div >
  );
}

export default FoodTracking;
