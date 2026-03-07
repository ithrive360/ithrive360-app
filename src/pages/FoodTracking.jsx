import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../lib/supabase';
import { useUserProfile } from '../hooks/useUserProfile';
import SidebarMenu from './SidebarMenu';
import { Menu, X, ScanBarcode, Camera, Plus, ChevronRight, ChevronLeft, Calendar, ChevronUp, ChevronDown, X as XIcon, Coffee, Salad, Utensils, Apple } from 'lucide-react';
import { CircularProgressbar, buildStyles } from 'react-circular-progressbar';
import 'react-circular-progressbar/dist/styles.css';
import LiveBarcodeScanner from '../components/LiveBarcodeScanner';
import logo from '../assets/logo.png';

import { lookupBarcodeProduct } from '../utils/barcodeLookup';
import { analyzeMealImage } from '../utils/photoRecognizer';
import { logMealToSupabase } from '../utils/logMeal';

const MEAL_TYPES = [
  { id: 'breakfast', label: 'Breakfast', icon: Coffee, colorClass: 'bg-orange-100 text-orange-600' },
  { id: 'lunch', label: 'Lunch', icon: Salad, colorClass: 'bg-green-100 text-green-600' },
  { id: 'dinner', label: 'Dinner', icon: Utensils, colorClass: 'bg-indigo-100 text-indigo-600' },
  { id: 'snack', label: 'Snacks', icon: Apple, colorClass: 'bg-rose-100 text-rose-600' }
];

const FakeProgressCircle = () => {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const duration = 5000;
    const interval = 50;
    const steps = duration / interval;
    let currentStep = 0;
    const timer = setInterval(() => {
      currentStep++;
      setProgress(Math.min((currentStep / steps) * 100, 95)); // Max 95% until real response
    }, interval);
    return () => clearInterval(timer);
  }, []);

  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative w-11 h-11 flex flex-shrink-0 items-center justify-center">
      <svg className="transform -rotate-90 w-11 h-11 absolute">
        <circle cx="22" cy="22" r={radius} stroke="currentColor" strokeWidth="2.5" fill="transparent" className="text-gray-200" />
        <circle cx="22" cy="22" r={radius} stroke="currentColor" strokeWidth="2.5" fill="transparent" strokeDasharray={circumference} strokeDashoffset={strokeDashoffset} className="text-purple-500 transition-all duration-75 ease-linear" strokeLinecap="round" />
      </svg>
      <span className="text-[10px] font-bold text-purple-600 tracking-tight">{Math.round(progress)}%</span>
    </div>
  );
};

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
  const [deleteLogId, setDeleteLogId] = useState(null);

  // New State for customizing amount before saving
  const [inputQuantity, setInputQuantity] = useState(100);
  const [inputUnit, setInputUnit] = useState('g');

  const [fitbitStats, setFitbitStats] = useState(null);

  // Date Navigation State
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = new Date();
    const tzOffset = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - tzOffset).toISOString().split('T')[0];
  });
  const [showCalendar, setShowCalendar] = useState(false);

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
    if (user?.id) {
      fetchLogsForDate(user.id, selectedDate);
    }
  }, [user?.id, selectedDate]);

  const fetchLogsForDate = async (userId, targetDateStr) => {
    // Explicitly await the SDK session init before firing queries to prevent unauthenticated 0-row UI wipes
    await supabase.auth.getSession();

    const [year, month, day] = targetDateStr.split('-');
    const startOfDay = new Date(year, month - 1, day);
    const endOfDay = new Date(year, month - 1, day);
    endOfDay.setDate(endOfDay.getDate() + 1);

    // Create a local ISO string that doesn't shift to GMT to prevent timezone "flip flopping" of visible meals
    const tzOffset = startOfDay.getTimezoneOffset() * 60000;
    const localStartISO = (new Date(startOfDay.getTime() - tzOffset)).toISOString().slice(0, -1);
    const localEndISO = (new Date(endOfDay.getTime() - tzOffset)).toISOString().slice(0, -1);

    // Fetch meal logs
    const { data: logData } = await supabase
      .from('user_meal_log')
      .select('*')
      .eq('user_id', userId)
      .gte('timestamp', localStartISO)
      .lt('timestamp', localEndISO);

    // Filter out old legacy test logs that didn't have a specific meal_type assigned
    const validLogs = (logData || []).filter(log => MEAL_TYPES.some(m => m.id === log.meal_type));
    setLogs(validLogs);

    // Fetch Fitbit stats for "Burned" logic
    const { data: fbData } = await supabase
      .from('user_fitbit_stats')
      .select('*')
      .eq('user_id', userId)
      .eq('date', targetDateStr)
      .maybeSingle();

    if (fbData) {
      setFitbitStats(fbData);
    } else {
      setFitbitStats(null);
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

      // Deduplication Logic
      // Check if this exact barcode was already logged in this exact meal category today
      const existingLog = logs.find(l => l.meal_type === selectedMealType && l.barcode === lookup.data.code);

      if (existingLog) {
        // Auto-switch to Edit Mode for the existing log
        setScannedProduct({
          name: existingLog.label,
          source: 'barcode',
          code: existingLog.barcode,
          nutrients_json: existingLog.nutrients_json,
          raw_json: existingLog.raw_json
        });

        // Let's assume the user wants to add 1 more serving/100g of whatever they originally logged
        const baseIncrement = existingLog.serving_unit === 'g' ? 100 : 1;
        setInputQuantity(Number(existingLog.quantity) + baseIncrement);
        setInputUnit(existingLog.serving_unit);
        setEditingLogId(existingLog.meal_log_id);

        setFeedback('Item already logged! Auto-incremented quantity.');
      } else {
        // Brand new entry
        setScannedProduct({
          ...lookup.data,
          source: 'barcode'
        });
        setInputQuantity(100);
        setInputUnit('g');
        setEditingLogId(null);
        setFeedback('Product found! Specify quantity.');
      }
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

        setTimeout(() => fetchLogsForDate(user.id, selectedDate), 1500); // Silent background sync later
      } else {
        setFeedback(`❌ Log error: ${log.message}`);
      }
    } catch (err) {
      console.error('handleConfirmLog crash:', err);
      setLoadingType(null);
      setFeedback(`❌ System Error: ${err.message}`);
    }
  };

  const performDeleteLog = async () => {
    if (!deleteLogId) return;
    const logIdToDel = deleteLogId;
    setDeleteLogId(null); // Optimistically close modal

    const { error } = await supabase.from('user_meal_log').delete().eq('meal_log_id', logIdToDel);
    if (!error) fetchLogsForDate(user.id, selectedDate);
  };

  // Aggregations
  const totalTarget = profile?.daily_calorie_target || 2000;
  const totalEaten = logs.reduce((sum, log) => sum + (log.nutrients_json?.energy_kcal || log.nutrients_json?.calories || 0), 0);
  const totalBurned = fitbitStats?.calories_out ? Math.floor(fitbitStats.calories_out) : 0;

  const isOverBudget = totalEaten > totalTarget;
  const caloriesLeft = Math.abs(totalTarget - totalEaten);
  const progressPercentage = isOverBudget ? Math.min(100, (caloriesLeft / totalTarget) * 100) : (totalEaten / totalTarget) * 100;

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
    <div className="font-sans h-[100dvh] w-full bg-[#F9FAFB] text-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="flex-none h-[64px] w-full bg-white/80 backdrop-blur-md flex items-center justify-center px-4 z-40 border-b border-gray-100 relative shadow-sm">
        <button onClick={() => setMenuOpen(!menuOpen)} className="absolute left-4 bg-transparent outline-none cursor-pointer border-none p-0">
          {menuOpen ? <X size={28} className="text-emerald-500" /> : <Menu size={28} className="text-emerald-500" />}
        </button>
        <img src={logo} alt="iThrive360 Logo" className="h-8" />
      </div>
      <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} profile={profile} />

      {/* Main Dashboard View */}
      <div className="flex flex-col flex-1 w-full max-w-md mx-auto relative overflow-hidden">

        {/* --- FIXED TOP SUMMARY DASHBOARD --- */}
        <div className="flex-none bg-[#F9FAFB] z-20 px-4 pt-4 pb-2 border-b border-gray-200/60 shadow-[0_4px_10px_-10px_rgba(0,0,0,0.05)]">

          {/* Calorie Summary Top Bar */}
          <div className="flex items-center justify-between pb-3">
            <div className="text-center w-1/4">
              <div className="text-xl font-bold">{Math.round(totalEaten)}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Eaten</div>
            </div>

            <div className="w-20 h-20 relative flex-shrink-0">
              <CircularProgressbar
                value={progressPercentage}
                styles={buildStyles({
                  pathColor: isOverBudget ? '#ef4444' : '#3ab3a1',
                  trailColor: '#e5e7eb',
                  strokeLinecap: 'round',
                  pathTransitionDuration: 0.5,
                })}
              />
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className={`text-xl font-black ${isOverBudget ? 'text-red-500' : 'text-gray-800'}`}>
                  {isOverBudget ? '+' : ''}{Math.round(caloriesLeft)}
                </span>
                <span className="text-[9px] font-bold text-gray-400 uppercase tracking-wide">
                  {isOverBudget ? 'Over' : 'Left'}
                </span>
              </div>
            </div>

            <div className="text-center w-1/4">
              <div className="text-xl font-bold">{Math.round(totalBurned)}</div>
              <div className="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Burned</div>
            </div>
          </div>

          {/* Macro Summary (Restored Original Sizing, Reduced Bottom Margin) */}
          <div className="flex justify-between bg-white p-4 rounded-3xl shadow-sm border border-gray-100 mb-2">
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
        </div>

        {/* Meal Categories (SCROLLABLE CONTAINER) */}
        <div className="flex-1 overflow-y-auto w-full relative min-h-[400px]">

          {/* Top Buffer Mask (Hides text scrolling above Breakfast) */}
          <div className="sticky top-0 h-4 bg-[#F9FAFB] w-full z-50"></div>

          <div className="px-4">
            {/* Date Navigator Bar */}
            <div className="flex items-center justify-between bg-white px-2 py-2.5 rounded-2xl shadow-sm border border-gray-100 mb-4 relative z-50">
              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() - 1);
                  setSelectedDate(d.toISOString().split('T')[0]);
                }}
                className="p-1.5 text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors focus:outline-none cursor-pointer"
              >
                <ChevronLeft size={20} />
              </button>

              <div
                className="flex items-center gap-2 cursor-pointer font-bold text-gray-800 text-sm hover:text-emerald-600 transition-colors py-1 px-3 rounded-lg hover:bg-gray-50 bg-white"
                onClick={() => setShowCalendar(!showCalendar)}
              >
                <Calendar size={16} className={showCalendar ? "text-emerald-600" : "text-emerald-500"} />
                <span>
                  {selectedDate === new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]
                    ? 'Today'
                    : new Date(selectedDate.split('-')[0], selectedDate.split('-')[1] - 1, selectedDate.split('-')[2]).toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' })}
                </span>
              </div>

              <button
                onClick={() => {
                  const d = new Date(selectedDate);
                  d.setDate(d.getDate() + 1);
                  const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
                  if (d.toISOString().split('T')[0] <= todayStr) {
                    setSelectedDate(d.toISOString().split('T')[0]);
                  }
                }}
                disabled={selectedDate >= new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0]}
                className={`p-1.5 rounded-lg transition-colors focus:outline-none ${selectedDate >= new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0] ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50 cursor-pointer'}`}
              >
                <ChevronRight size={20} />
              </button>

              {/* Custom Popover Calendar */}
              {showCalendar && (
                <>
                  {/* Backdrop to close when clicking outside */}
                  <div
                    className="fixed inset-0 z-[100]"
                    onClick={() => setShowCalendar(false)}
                  />
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 bg-white rounded-2xl shadow-[0_10px_40px_-10px_rgba(0,0,0,0.15)] border border-gray-100 p-4 z-[101] w-72">
                    <div className="flex justify-between items-center mb-4 px-1">
                      <button
                        onClick={() => {
                          const d = new Date(selectedDate);
                          d.setMonth(d.getMonth() - 1);
                          setSelectedDate(d.toISOString().split('T')[0]);
                        }}
                        className="p-1 text-gray-400 hover:text-emerald-500 rounded-lg hover:bg-emerald-50 transition-colors"
                      >
                        <ChevronLeft size={20} />
                      </button>
                      <span className="font-bold text-gray-800">
                        {new Date(selectedDate.split('-')[0], selectedDate.split('-')[1] - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}
                      </span>
                      <button
                        onClick={() => {
                          const d = new Date(selectedDate);
                          d.setMonth(d.getMonth() + 1);
                          const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];
                          if (d.toISOString().slice(0, 7) <= todayStr.slice(0, 7)) {
                            setSelectedDate(d.toISOString().split('T')[0]);
                          }
                        }}
                        disabled={selectedDate.slice(0, 7) >= new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 7)}
                        className={`p-1 rounded-lg transition-colors ${selectedDate.slice(0, 7) >= new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 7) ? 'text-gray-200 cursor-not-allowed' : 'text-gray-400 hover:text-emerald-500 hover:bg-emerald-50'}`}
                      >
                        <ChevronRight size={20} />
                      </button>
                    </div>

                    <div className="grid grid-cols-7 gap-1 mb-2 text-center">
                      {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map(day => (
                        <div key={day} className="text-[10px] font-bold text-gray-400 uppercase tracking-wide">{day}</div>
                      ))}
                    </div>

                    <div className="grid grid-cols-7 gap-1">
                      {(() => {
                        const year = parseInt(selectedDate.split('-')[0]);
                        const month = parseInt(selectedDate.split('-')[1]) - 1;
                        const firstDay = new Date(year, month, 1).getDay();
                        const daysInMonth = new Date(year, month + 1, 0).getDate();
                        const todayStr = new Date(new Date().getTime() - new Date().getTimezoneOffset() * 60000).toISOString().split('T')[0];

                        const days = [];
                        for (let i = 0; i < firstDay; i++) {
                          days.push(<div key={`empty-${i}`} className="h-8"></div>);
                        }
                        for (let i = 1; i <= daysInMonth; i++) {
                          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(i).padStart(2, '0')}`;
                          const isSelected = dateStr === selectedDate;
                          const isFuture = dateStr > todayStr;
                          const isToday = dateStr === todayStr;

                          days.push(
                            <button
                              key={i}
                              disabled={isFuture}
                              onClick={() => {
                                setSelectedDate(dateStr);
                                setShowCalendar(false); // Instant 1-tap close
                              }}
                              className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-medium transition-colors outline-none
                                ${isSelected ? 'bg-emerald-500 text-white shadow-sm' :
                                  isFuture ? 'text-gray-300 cursor-not-allowed' :
                                    isToday ? 'text-emerald-600 bg-emerald-50 hover:bg-emerald-100' : 'text-gray-700 hover:bg-gray-100'}
                              `}
                            >
                              {i}
                            </button>
                          );
                        }
                        return days;
                      })()}
                    </div>
                  </div>
                </>
              )}
            </div>
            {MEAL_TYPES.map((meal, index) => {
              const rowLogs = logs.filter(l => l.meal_type === meal.id);
              const rowCals = rowLogs.reduce((sum, l) => sum + (l.nutrients_json?.energy_kcal || l.nutrients_json?.calories || 0), 0);

              return (
                <React.Fragment key={meal.id}>
                  {/* STICKY CARD HEADER */}
                  <div
                    className="px-4 flex items-center justify-between sticky bg-white shadow-[0_4px_6px_-2px_rgba(0,0,0,0.05)] w-full h-[90px] border-b border-gray-100"
                    style={{ top: `${(index * 90) + 16}px`, zIndex: 40 - index }}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`h-12 w-12 rounded-xl flex items-center justify-center shrink-0 ${meal.colorClass}`}>
                        <meal.icon size={24} />
                      </div>
                      <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 truncate">{meal.label}</h3>
                        <span className="text-xs text-gray-500 font-medium block truncate">
                          {rowLogs.length} {rowLogs.length === 1 ? 'item' : 'items'} • {Math.round(rowCals)} Cal
                        </span>
                      </div>
                    </div>
                    <button
                      onClick={() => openAddSheet(meal.id)}
                      className="h-10 w-10 shrink-0 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition-all border-none outline-none cursor-pointer"
                    >
                      <Plus size={20} strokeWidth={2.5} />
                    </button>
                  </div>

                  {/* ITEMS LOGGED (Slides perfectly under sticky headers) */}
                  {rowLogs.length > 0 && (
                    <div className="bg-white px-2 py-1 flex flex-col mb-4">
                      {rowLogs.map((log) => (
                        <div
                          key={log.meal_log_id}
                          className="flex justify-between items-center py-3 border-b border-gray-100 last:border-0 hover:bg-gray-50 transition-colors cursor-pointer px-2"
                          onClick={() => openEditSheet(log)}
                        >
                          <div className="flex-1 min-w-0 pr-2">
                            <p className="text-sm font-semibold text-gray-800 truncate">{log.label}</p>
                            <p className="text-xs text-gray-500 truncate">
                              {log.quantity} {log.serving_unit} • {Math.round(log.nutrients_json?.energy_kcal || log.nutrients_json?.calories || 0)} kcal
                            </p>
                          </div>
                          <button
                            onClick={(e) => { e.stopPropagation(); setDeleteLogId(log.meal_log_id); }}
                            className="text-gray-400 hover:text-red-500 transition-colors p-2 shrink-0 bg-transparent border-none cursor-pointer rounded-full ml-1"
                          >
                            <XIcon size={16} />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </React.Fragment>
              );
            })}

            {/* Physical Spacer to extend content-box for sticky tracking on iOS/Safari */}
            <div className="h-[400px] w-full flex-shrink-0 pointer-events-none" aria-hidden="true" />
          </div>
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {deleteLogId && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[60]"
              onClick={() => setDeleteLogId(null)}
            />
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 pointer-events-none">
              <motion.div
                initial={{ scale: 0.95, opacity: 0, y: 10 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 10 }}
                className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl pointer-events-auto"
              >
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                    <XIcon size={32} strokeWidth={2.5} className="text-red-500" />
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Meal</h3>
                  <p className="text-sm text-gray-500 mb-8">
                    Are you sure you want to remove this item from your daily log? This cannot be undone.
                  </p>
                  <div className="flex gap-3 w-full">
                    <button
                      onClick={() => setDeleteLogId(null)}
                      className="flex-1 py-3.5 px-4 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 active:bg-gray-300 transition-colors border-none outline-none cursor-pointer"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={performDeleteLog}
                      className="flex-1 py-3.5 px-4 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 active:bg-red-700 transition-colors shadow-lg shadow-red-500/30 border-none outline-none cursor-pointer"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </motion.div>
            </div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Sheet Modal */}
      <AnimatePresence>
        {sheetOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/40 z-50 touch-action-none"
              onClick={() => window.location.hash = ''}
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              drag="y"
              dragConstraints={{ top: 0 }}
              dragElastic={0.2}
              onDragEnd={(e, info) => {
                if (info.offset.y > 100) {
                  window.location.hash = '';
                }
              }}
              className="fixed bottom-0 left-0 w-full bg-white rounded-t-3xl z-50 p-6 flex flex-col pt-4 shadow-2xl max-h-[85vh] overflow-y-auto touch-action-none overscroll-none"
            >
              {/* Handle bar */}
              <div className="w-12 h-1.5 bg-gray-200 rounded-full mx-auto mb-6 shrink-0" />

              <div className="flex justify-between items-center mb-6 shrink-0">
                <h2 className="text-xl font-bold capitalize">Add to {selectedMealType}</h2>
                <button onClick={() => window.location.hash = ''} className="bg-gray-100 p-2 rounded-full cursor-pointer border-none outline-none">
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

                  <div className="text-sm font-bold text-gray-500 mb-2">
                    {Math.round(
                      (scannedProduct.nutrients_json?.energy_kcal || scannedProduct.nutrients_json?.calories || 0) *
                      (scannedProduct.source === 'barcode' && inputUnit === 'g' ? inputQuantity / 100 : inputQuantity)
                    )} kcal
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

                  <label className={`w-full bg-gray-50 hover:bg-gray-100 border border-gray-100 py-4 px-4 rounded-2xl flex items-center text-left transition-all gap-4 cursor-pointer m-0 ${loadingType === 'photo' ? 'pointer-events-none bg-gray-100/80 shadow-inner' : loadingType ? 'opacity-50 pointer-events-none' : 'active:scale-[0.98]'}`}>
                    <div className="bg-purple-100 text-purple-600 p-3 rounded-xl"><Camera size={24} /></div>
                    <div className="flex-1">
                      <span className="font-bold block text-[15px]">{loadingType === 'photo' ? 'Analyzing...' : 'Take Photo'}</span>
                      <span className="text-xs text-gray-500">AI meal analysis</span>
                    </div>
                    {loadingType === 'photo' ? (
                      <FakeProgressCircle />
                    ) : (
                      <ChevronRight size={20} className="text-gray-400" />
                    )}
                    <input type="file" accept="image/*" capture="environment" className="hidden" onChange={handlePhotoFileChange} disabled={loadingType !== null} />
                  </label>

                  {feedback && <p className="text-center text-sm font-medium text-emerald-600 mt-2">{feedback}</p>}
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {showLiveScanner && (
        <div className="fixed inset-0 z-[60] bg-black">
          <LiveBarcodeScanner onScan={handleLiveScanResult} onClose={() => window.history.back()} />
        </div>
      )}

    </div>
  );
}
