import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { uploadAndParseDNA } from '../utils/uploadAndParseDNA';
import { uploadAndParseBlood } from '../utils/uploadAndParseBlood';
import SidebarMenu from './SidebarMenu';
import { Menu, X, UploadCloud, Dna, Droplet, CheckCircle2 } from 'lucide-react';
import logo from '../assets/logo.png';
import { ErrorBoundary } from '../components/ErrorBoundary';

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
    setIsProcessing(true);
    setMessage('');
    const file = e.target.files[0];
    if (!file || !user?.id) {
      setMessage('Missing file or user ID.');
      setIsProcessing(false);
      return;
    }
    const result = await uploadAndParseDNA(file, user.id);
    setMessage(result.message);
    setIsProcessing(false);
  };

  const handleBloodUpload = async (e) => {
    if (isProcessing) return;
    setIsProcessing(true);
    setBloodMessage('');
    const file = e.target.files[0];
    if (!file || !user?.id) {
      setBloodMessage('Missing file or user ID.');
      setIsProcessing(false);
      return;
    }
    const result = await uploadAndParseBlood(file, user.id);
    setBloodMessage(result.message);
    setIsProcessing(false);
  };

  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

  return (
    <ErrorBoundary>
      <div className="font-sans px-4 py-8 max-w-5xl mx-auto bg-[#F9FAFB] min-h-screen">
        {/* Modern Sticky Header */}
        <div className="fixed top-0 left-0 w-full bg-white/80 backdrop-blur-md flex items-center justify-center py-3 px-4 z-50 shadow-sm border-b border-gray-100">
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="absolute left-4 bg-transparent outline-none"
          >
            {menuOpen ? <X size={28} className="text-emerald-500" /> : <Menu size={28} className="text-emerald-500" />}
          </button>
          <img src={logo} alt="iThrive360 Logo" className="h-8" />
        </div>

        <SidebarMenu
          isOpen={menuOpen}
          onClose={() => setMenuOpen(false)}
          profile={profile}
        />

        <div className="h-16" />

        <div className="mb-6 text-center">
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight mb-2">Health Data Sources</h1>
          <p className="text-sm text-gray-500 max-w-sm mx-auto">
            Upload your raw DNA and blood test results to unlock personalized AI insights.
          </p>
        </div>

        <div className="flex flex-col gap-6 max-w-md mx-auto">

          {/* DNA Card */}
          <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute -right-6 -bottom-6 w-32 h-32 bg-gradient-to-br from-purple-100 to-fuchsia-50 rounded-full opacity-60 blur-xl pointer-events-none"></div>

            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="bg-purple-100 p-3.5 rounded-2xl text-purple-600 shadow-inner">
                <Dna size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">DNA Data</h3>
                <p className="text-xs text-gray-500">Raw .txt file (23andMe, Ancestry)</p>
              </div>
            </div>

            <div className="mb-6 relative z-10">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${profile?.dna_uploaded ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                {profile?.dna_uploaded ? <CheckCircle2 size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>}
                {profile?.dna_uploaded ? 'Uploaded' : 'Not uploaded'}
              </div>
            </div>

            <label className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer relative z-10 ${isProcessing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#3ab3a1] text-white hover:opacity-90 shadow-lg shadow-[#3ab3a1]/20'}`}>
              <UploadCloud size={18} />
              {isProcessing ? 'Processing Data...' : 'Upload DNA File'}
              <input type="file" accept=".txt" onChange={handleDNAUpload} className="hidden" disabled={isProcessing} />
            </label>

            {message && (
              <p className="mt-4 text-sm text-center font-medium text-purple-700 bg-purple-50 py-2.5 px-3 rounded-xl relative z-10 border border-purple-100/50">
                {message}
              </p>
            )}
          </div>

          {/* Blood Test Card */}
          <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 flex flex-col relative overflow-hidden">
            {/* Decorative blob */}
            <div className="absolute -left-6 -bottom-6 w-32 h-32 bg-gradient-to-tr from-rose-100 to-red-50 rounded-full opacity-60 blur-xl pointer-events-none"></div>

            <div className="flex items-center gap-4 mb-4 relative z-10">
              <div className="bg-rose-100 p-3.5 rounded-2xl text-rose-600 shadow-inner">
                <Droplet size={24} strokeWidth={2.5} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-gray-900 leading-tight">Blood Biomarkers</h3>
                <p className="text-xs text-gray-500">Standard .csv lab results</p>
              </div>
            </div>

            <div className="mb-6 relative z-10">
              <div className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider ${profile?.blood_uploaded ? 'bg-emerald-50 text-emerald-600' : 'bg-gray-100 text-gray-500'}`}>
                {profile?.blood_uploaded ? <CheckCircle2 size={14} /> : <div className="w-1.5 h-1.5 rounded-full bg-gray-400"></div>}
                {profile?.blood_uploaded ? 'Uploaded' : 'Not uploaded'}
              </div>
            </div>

            <label className={`w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-xl font-bold text-sm transition-all cursor-pointer relative z-10 ${isProcessing ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-[#3ab3a1] text-white hover:opacity-90 shadow-lg shadow-[#3ab3a1]/20'}`}>
              <UploadCloud size={18} />
              {isProcessing ? 'Processing Data...' : 'Upload Blood File'}
              <input type="file" accept=".csv" onChange={handleBloodUpload} className="hidden" disabled={isProcessing} />
            </label>

            {bloodMessage && (
              <p className="mt-4 text-sm text-center font-medium text-rose-700 bg-rose-50 py-2.5 px-3 rounded-xl relative z-10 border border-rose-100/50">
                {bloodMessage}
              </p>
            )}
          </div>

        </div>
      </div>
    </ErrorBoundary>
  );
}
