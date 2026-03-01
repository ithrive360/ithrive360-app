import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import SidebarMenu from './SidebarMenu';
import { Menu, X, ScanBarcode, Camera, Plus, ChevronRight, X as XIcon } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import LiveBarcodeScanner from '../components/LiveBarcodeScanner';
import logo from '../assets/logo.png';

import { lookupBarcodeProduct } from '../utils/barcodeLookup';
import { analyzeMealImage } from '../utils/photoRecognizer';
import { logMealToSupabase } from '../utils/logMeal';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: '🍳' },
  { id: 'lunch', label: 'Lunch', icon: '🥗' },
  { id: 'dinner', label: 'Dinner', icon: '🍲' },
  { id: 'snack', label: 'Snacks', icon: '🍎' }
];

export default function FoodTracking() {
  const { user, profile, loading: userLoading } = useUserProfile();
  const [menuOpen, setMenuOpen] = useState(false);
  const [logs, setLogs] = useState([]);

  const [sheetOpen, setSheetOpen] = useState(false);
  const [selectedMealType, setSelectedMealType] = useState(null);
  const [loadingType, setLoadingType] = useState(null); // 'barcode' | 'photo' | 'save' | null
  const [feedback, setFeedback] = useState('');
  const [showLiveScanner, setShowLiveScanner] = useState(false);
  const [scannedProduct, setScannedProduct] = useState(null);
  const [editingLogId, setEditingLogId] = useState(null);

  // New State for customizing amount before saving
  const [inputQuantity, setInputQuantity] = useState(100);
  const [inputUnit, setInputUnit] = useState('g');

  const [fitbitStats, setFitbitStats] = useState(null);

  // Swipe to close state
  const [touchStartY, setTouchStartY] = useState(0);
  const [sheetOffset, setSheetOffset] = useState(0);

  // Handle hardware back buttons via hash routing
  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash;
      if (hash === '#scanner') {
        setShowLiveScanner(true);
        setSheetOpen(true);
      } else if (hash === '#sheet') {
        setShowLiveScanner(false);
        setSheetOpen(true);
      } else {
        setShowLiveScanner(false);
        setSheetOpen(false);
      }
    };

    handleHash();
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);

  // Cleanup offset when sheet closes
  useEffect(() => {
    if (!sheetOpen) {
      setTimeout(() => setSheetOffset(0), 300);
    }
  }, [sheetOpen]);

  useEffect(() => {
    if (user) {
      fetchTodayLogs(user.id);
    }
  }, [user]);

  const fetchTodayLogs = async (userId) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // Create a local ISO string that doesn't shift to GMT to prevent timezone "flip flopping" of visible meals
    const tzOffset = startOfDay.getTimezoneOffset() * 60000;
    const localISOTime = (new Date(startOfDay - tzOffset)).toISOString().slice(0, -1);

    // Fetch meal logs
    const { data: logData } = await supabase
      .from('user_meal_log')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', localISOTime);

    // Filter out old legacy test logs that didn't have a specific meal_type assigned
    const validLogs = (logData || []).filter(log => MEAL_TYPES.some(m => m.id === log.meal_type));
    setLogs(validLogs);

    // Fetch Fitbit stats for "Burned" logic
    const todayYYYYMMDD = new Date().toISOString().split('T')[0];
    const { data: fbData } = await supabase
      .from('user_fitbit_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', todayYYYYMMDD)
      .maybeSingle();

    if (fbData) {
      setFitbitStats(fbData);
    }
  };

  const openAddSheet = (mealType) => {
    setSelectedMealType(mealType);
    setScannedProduct(null);
    setEditingLogId(null);
    setFeedback('');
    window.location.hash = 'sheet';
  };

  const openEditSheet = (log) => {
    setSelectedMealType(log.meal_type);
    setScannedProduct({
      name: log.label,
      source: log.source === 'openfoodfacts' ? 'barcode' : 'photo',
      code: log.barcode,
      nutrients_json: log.nutrients_json,
      raw_json: log.raw_json || log.nutrients_json
    });
    setInputQuantity(log.quantity || 1);
    setInputUnit(log.serving_unit || 'g');
    setEditingLogId(log.meal_log_id);
    setFeedback('');
    window.location.hash = 'sheet';
  };

  const handleLiveScanResult = async (scan) => {
    window.location.hash = 'sheet'; // Will turn off the scanner visually via hashchange

    if (!scan.success) {
      setFeedback('No barcode detected');
      return;
    }

    if (navigator.vibrate) navigator.vibrate(50);
    setLoadingType('barcode');
    setFeedback('Looking up product...');

    try {
      const lookup = await lookupBarcodeProduct(scan.code);
      if (!lookup.success) {
        setFeedback(lookup.message);
        setLoadingType(null);
        return;
      }

      setScannedProduct({
        ...lookup.data,
        source: 'barcode'
      });
      setInputQuantity(100);
      setInputUnit('g');
      setFeedback('Product found! Specify quantity.');
    } catch (err) {
      console.error(err);
      setFeedback('Unexpected error during barcode scan');
    } finally {
      setLoadingType(null);
    }
  };

  const handlePhotoFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoadingType('photo');
    setScannedProduct(null);
    setFeedback('Analyzing photo...');

    try {
      const result = await analyzeMealImage(file);
      if (!result.success) {
        setFeedback(`Analysis failed: ${result.message}`);
        setLoadingType(null);
        return;
      }

      setScannedProduct({
        name: result.label,
        image_url: URL.createObjectURL(file),
        nutrients_json: result.nutrients_json,
        raw_json: result.raw_json,
        source: 'photo'
      });
      setInputQuantity(1);
      setInputUnit('serving');
      setFeedback('Meal analyzed! Confirm to log.');
    } catch (err) {
      console.error(err);
      setFeedback('Unexpected error during photo scan');
    } finally {
      setLoadingType(null);
    }
  };

  const handleConfirmLog = async () => {
    try {
      if (!scannedProduct) return;
      setLoadingType('save');
      setFeedback('Saving (Precomputing)...');

      // Calculate scaled nutrients
      let scaledNutrients = { ...scannedProduct.nutrients_json };
      let mult = 1;
      if (scannedProduct.source === 'barcode' && inputUnit === 'g') {
        mult = inputQuantity / 100;
      } else if (scannedProduct.source === 'photo') {
        mult = inputQuantity; // usually 1 serving
      }

      if (mult !== 1 && scaledNutrients) {
        Object.keys(scaledNutrients).forEach(key => {
          if (typeof scaledNutrients[key] === 'number') {
            scaledNutrients[key] = scaledNutrients[key] * mult;
          }
        });
      }

      const payload = {
        user_id: user.id,
        meal_log_id: editingLogId,
        entry_type: scannedProduct.source === 'barcode' ? 'barcode' : 'photo',
        meal_type: selectedMealType,
        label: scannedProduct.name,
        barcode: scannedProduct.code || null,
        quantity: inputQuantity,
        serving_unit: inputUnit,
        nutrients_json: scaledNutrients,
        source: scannedProduct.source === 'barcode' ? 'openfoodfacts' : 'openai-vision',
        raw_json: scannedProduct.raw_json || scannedProduct
      };

      setFeedback('Saving (Uploading)...');

      const log = await logMealToSupabase(payload);

      setLoadingType(null);
      if (log.success) {
        window.location.hash = ''; // Force clear the hash to prevent back-button loops
        setSheetOpen(false); // Force close the UI overlay immediately

        // Optimistically insert into the active UI instantly
        if (log.data) {
          if (editingLogId) {
            setLogs(prev => prev.map(l => l.meal_log_id === editingLogId ? log.data : l));
          } else {
            setLogs(prev => [...prev, log.data]);
          }
        }

        setTimeout(() => fetchTodayLogs(user.id), 1500); // Silent background sync later
      } else {
        setFeedback(`❌ Log error: ${log.message}`);
      }
    } catch (err) {
      console.error('handleConfirmLog crash:', err);
      setLoadingType(null);
      setFeedback(`❌ System Error: ${err.message}`);
    }
  };

  const handleDeleteLog = async (logId) => {
    if (!confirm('Are you sure you want to delete this log?')) return;
    const { error } = await supabase.from('user_meal_log').delete().eq('meal_log_id', logId);
    if (!error) fetchTodayLogs(user.id);
  };

  // Aggregations
  const totalTarget = profile?.daily_calorie_target || 2000;
  const totalEaten = logs.reduce((sum, log) => sum + (log.nutrients_json?.energy_kcal || log.nutrients_json?.calories || 0), 0);
  const totalBurned = fitbitStats?.calories_out ? Math.floor(fitbitStats.calories_out) : 0;
  const caloriesLeft = Math.max(0, totalTarget - totalEaten);

  const totalProtein = logs.reduce((sum, log) => sum + (log.nutrients_json?.protein_g || 0), 0);
  const totalCarbs = logs.reduce((sum, log) => sum + (log.nutrients_json?.carbohydrates_g || log.nutrients_json?.carbs_g || 0), 0);
  const totalFat = logs.reduce((sum, log) => sum + (log.nutrients_json?.fat_g || 0), 0);

  if (!user) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-[#F9FAFB]">
        <img src="/icons/icon-192x192.png" alt="Loading..." className="h-16 w-16 animate-pulse opacity-50" />
      </div>
    );
  }

  return (
    <div className="font-sans min-h-screen bg-[#F9FAFB] text-gray-900 pb-24">
      {/* Header */}
      <div className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md flex items-center justify-center py-3 px-4 z-40 shadow-sm border-b border-gray-100">
        <button onClick={() => setMenuOpen(!menuOpen)} className="absolute left-4 bg-transparent outline-none cursor-pointer border-none p-0">
          {menuOpen ? <X size={28} className="text-emerald-500" /> : <Menu size={28} className="text-emerald-500" />}
        </button>
        <img src={logo} alt="iThrive360 Logo" className="h-8" />
      </div>
      <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} profile={profile} />
      <div className="h-16" />

      {/* Main Dashboard View */}
      <div className="px-4 max-w-md mx-auto">

        {/* Calorie Summary Top Bar */}
        <div className="flex items-center justify-between py-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(totalEaten)}</div>
            <div className="text-xs text-gray-500 font-medium">Eaten</div>
          </div>

          <div className="w-28 h-28 relative">
            <CircularProgressbar
              value={totalEaten}
              maxValue={totalTarget}
              styles={buildStyles({
                pathColor: '#e5e7eb', // The "consumed" path, white/gray
                trailColor: '#3ab3a1', // The "available" trail, green
                strokeLinecap: 'round',
                pathTransitionDuration: 0.5,
              })}
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-2xl font-black text-gray-800">{Math.round(caloriesLeft)}</span>
              <span className="text-xs font-semibold text-gray-400">Cal Left</span>
            </div>
          </div>

          <div className="text-center">
            <div className="text-2xl font-bold">{Math.round(totalBurned)}</div>
            <div className="text-xs text-gray-500 font-medium">Burned</div>
          </div>
        </div>

        {/* Macro Summary */}
        <div className="flex justify-between bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-8">
          <div className="text-center w-1/3 border-r border-gray-100">
            <div className="text-sm font-bold">{Math.round(totalProtein)}g</div>
            <div className="text-xs text-gray-500">Protein</div>
          </div>
          <div className="text-center w-1/3 border-r border-gray-100">
            <div className="text-sm font-bold">{Math.round(totalFat)}g</div>
            <div className="text-xs text-gray-500">Fat</div>
          </div>
          <div className="text-center w-1/3">
            <div className="text-sm font-bold">{Math.round(totalCarbs)}g</div>
            <div className="text-xs text-gray-500">Carbs</div>
          </div>
        </div>

        {/* Meal Categories */}
        <div className="space-y-4">
          {MEAL_TYPES.map((meal) => {
            const rowLogs = logs.filter(l => l.meal_type === meal.id);
            const rowCals = rowLogs.reduce((sum, l) => sum + (l.nutrients_json?.energy_kcal || l.nutrients_json?.calories || 0), 0);

            return (
              <div key={meal.id} className="bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 flex flex-col mb-4">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="text-2xl bg-gray-50 h-12 w-12 rounded-full flex items-center justify-center">
                      {meal.icon}
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900">{meal.label}</h3>
                      <span className="text-xs text-gray-500 font-medium">
                        {rowLogs.length} {rowLogs.length === 1 ? 'item' : 'items'} • {Math.round(rowCals)} Cal
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => openAddSheet(meal.id)}
                    className="h-10 w-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all border-none outline-none cursor-pointer"
                  >
                    <Plus size={20} strokeWidth={2.5} />
                  </button>
                </div>

                {/* Mini list of items logged inside this category */}
                {rowLogs.length > 0 && (
                  <div className="bg-gray-50/50 border-t border-gray-100 px-4 py-2 flex flex-col gap-2">
                    {rowLogs.map((log) => (
                      <div
                        key={log.meal_log_id}
                        className="flex justify-between items-center py-2 border-b border-gray-100 last:border-0 hover:bg-gray-100/50 -mx-2 px-2 rounded-xl transition-colors cursor-pointer"
                        onClick={() => openEditSheet(log)}
                      >
                        <div className="flex-1">
                          <p className="text-sm font-semibold text-gray-800">{log.label}</p>
                          <p className="text-xs text-gray-500">
                            {log.quantity} {log.serving_unit} • {Math.round(log.nutrients_json?.energy_kcal || log.nutrients_json?.calories || 0)} kcal
                          </p>
                        </div>
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDeleteLog(log.meal_log_id); }}
                          className="text-gray-400 hover:text-red-500 transition-colors p-2 bg-transparent border-none cursor-pointer rounded-full ml-2"
                        >
                          <XIcon size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom Sheet Modal */}
      {sheetOpen && (
        <>
          <div className="fixed inset-0 bg-black/40 z-50 transition-opacity" onClick={() => window.location.hash = ''}></div>
          <div
            className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl z-50 p-6 flex flex-col pt-4 animate-slide-up shadow-2xl max-h-[85vh] overflow-y-auto transition-transform"
            style={{ transform: `translateY(${Math.max(0, sheetOffset)}px)` }}
            onTouchStart={(e) => setTouchStartY(e.touches[0].clientY)}
            onTouchMove={(e) => {
              const currentY = e.touches[0].clientY;
              const delta = currentY - touchStartY;
              if (delta > 0) {
                setSheetOffset(delta);
              }
            }}
            onTouchEnd={() => {
              if (sheetOffset > 100) {
                window.location.hash = '';
              } else {
                setSheetOffset(0);
              }
            }}
          >
            {/* Handle bar */}
            <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6"></div>

            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold capitalize">Add to {selectedMealType}</h2>
              <button onClick={() => window.history.back()} className="bg-gray-100 p-2 rounded-full cursor-pointer border-none outline-none">
                <XIcon size={20} className="text-gray-500" />
              </button>
            </div>

            {scannedProduct ? (
              <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-4 text-center">
                {scannedProduct.image_url && <img src={scannedProduct.image_url} alt="" className="h-24 w-24 object-cover rounded-xl mx-auto mb-3" />}
                <h3 className="font-bold text-lg">{scannedProduct.name}</h3>

                <div className="my-4 bg-white p-3 rounded-xl border border-emerald-100/50 flex items-center justify-center gap-2">
                  <label className="text-sm font-semibold text-gray-600">Amount:</label>
                  <input
                    type="number"
                    value={inputQuantity}
                    onChange={(e) => setInputQuantity(Number(e.target.value) || 1)}
                    className="w-20 text-center font-bold text-gray-900 border-b-2 border-emerald-200 focus:border-emerald-500 outline-none p-1 bg-transparent"
                  />
                  <select
                    value={inputUnit}
                    onChange={(e) => setInputUnit(e.target.value)}
                    className="text-sm font-semibold text-gray-600 bg-transparent outline-none border-none cursor-pointer"
                  >
                    {scannedProduct.source === 'barcode' ? (
                      <>
                        <option value="g">grams (g)</option>
                        <option value="ml">ml</option>
                        <option value="serving">servings</option>
                      </>
                    ) : (
                      <>
                        <option value="serving">servings</option>
                        <option value="meal">entire meal</option>
                      </>
                    )}
                  </select>
                </div>

                {feedback && <p className="text-sm text-emerald-600 font-medium mt-2">{feedback}</p>}
                <button
                  onClick={handleConfirmLog}
                  disabled={loadingType === 'save'}
                  className={`mt-4 w-full py-3 rounded-xl font-bold transition-all border-none cursor-pointer ${loadingType === 'save' ? 'bg-emerald-300 text-white cursor-not-allowed' : 'bg-emerald-500 text-white hover:bg-emerald-600'}`}
                >
                  {loadingType === 'save' ? 'Saving...' : 'Log Food'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col gap-3">
                <button
                  onClick={() => window.location.hash = 'scanner'}
                  disabled={loadingType !== null}
                  className={`w-full bg-gray-50 hover:bg-gray-100 border border-gray-100 py-4 px-4 rounded-2xl flex items-center text-left transition-all gap-4 ${loadingType ? 'opacity-50 pointer-events-none' : 'active:scale-[0.98]'}`}
                >
                  <div className="bg-blue-100 text-blue-600 p-3 rounded-xl"><ScanBarcode size={24} /></div>
                  <div className="flex-1">
                    <span className="font-bold block text-[15px]">{loadingType === 'barcode' ? 'Looking up...' : 'Scan Barcode'}</span>
                    <span className="text-xs text-gray-500">Packaged foods & snacks</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </button>

                <label className={`w-full bg-gray-50 hover:bg-gray-100 border border-gray-100 py-4 px-4 rounded-2xl flex items-center text-left transition-all gap-4 cursor-pointer m-0 ${loadingType ? 'opacity-50 pointer-events-none' : 'active:scale-[0.98]'}`}>
                  <div className="bg-purple-100 text-purple-600 p-3 rounded-xl"><Camera size={24} /></div>
                  <div className="flex-1">
                    <span className="font-bold block text-[15px]">{loadingType === 'photo' ? 'Analyzing...' : 'Take Photo'}</span>
                    <span className="text-xs text-gray-500">AI meal analysis</span>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                  <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoFileChange} disabled={loadingType !== null} />
                </label>

                {feedback && <p className="text-center text-sm font-medium text-emerald-600 mt-2">{feedback}</p>}
              </div>
            )}
          </div>
        </>
      )}

      {showLiveScanner && (
        <div className="fixed inset-0 z-[60] bg-black">
          <LiveBarcodeScanner onScan={handleLiveScanResult} onClose={() => window.history.back()} />
        </div>
      )}

    </div>
  );
}
