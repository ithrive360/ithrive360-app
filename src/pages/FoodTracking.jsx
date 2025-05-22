import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import SidebarMenu from './SidebarMenu';
import Lottie from 'lottie-react';
import { Menu, X } from 'lucide-react';
import logo from '../assets/logo.png';

function FoodTracking() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [greeting, setGreeting] = useState('');
  const [timeAnimation, setTimeAnimation] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [meals, setMeals] = useState({
    breakfast: { description: '', photo: null },
    lunch: { description: '', photo: null },
    dinner: { description: '', photo: null },
  });

  const fetchUserProfile = async () => {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const user = session?.user;
    if (!user) {
      setLoading(false);
      return;
    }
    setUser(user);

    const { data: profileData } = await supabase
      .from('user_profile')
      .select('*')
      .eq('user_id', user.id)
      .single();

    setProfile(profileData || null);

    const hour = new Date().getHours();
    let greetingText = '';
    let iconPath = '';
    if (hour < 12) {
      greetingText = 'Good morning';
      iconPath = '/icons/morning.json';
    } else if (hour < 18) {
      greetingText = 'Good afternoon';
      iconPath = '/icons/afternoon.json';
    } else {
      greetingText = 'Good evening';
      iconPath = '/icons/evening.json';
    }
    setGreeting(greetingText);

    try {
      const res = await fetch(iconPath);
      const anim = await res.json();
      setTimeAnimation(anim);
    } catch {
      setTimeAnimation(null);
    }

    setLoading(false);
  };

  useEffect(() => {
    fetchUserProfile();
  }, []);

  const handleFileChange = (e, meal) => {
    const file = e.target.files[0];
    if (file) {
      setMeals((prev) => ({
        ...prev,
        [meal]: {
          ...prev[meal],
          photo: URL.createObjectURL(file),
        },
      }));
    }
  };

  const handleDescriptionChange = (e, meal) => {
    setMeals((prev) => ({
      ...prev,
      [meal]: {
        ...prev[meal],
        description: e.target.value,
      },
    }));
  };

  if (loading) return <p>Loading...</p>;
  if (!user) return <p>You must be logged in to view this page.</p>;

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

      <SidebarMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} profile={profile} />

      <div style={{ height: 20 }} />

      <div style={{ position: 'relative', textAlign: 'center', marginTop: 30 }}>
        <h3 style={{ display: 'inline-block', fontWeight: 600, margin: 0, position: 'relative' }}>
          {greeting}, {profile?.user_name || 'there'}
          <span
            style={{
              position: 'absolute',
              left: '-72px',
              top: '50%',
              transform: 'translateY(-50%)',
              width: 64,
              height: 64,
            }}
          >
            <Lottie animationData={timeAnimation} loop autoplay />
          </span>
        </h3>
      </div>

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
        <h3 style={{ fontSize: 18, fontWeight: 600, marginBottom: '1.5rem', color: '#1F2937' }}>
          Today's Meals (Upload & Describe)
        </h3>

        {['breakfast', 'lunch', 'dinner'].map((meal) => (
          <div key={meal} style={{ marginBottom: '1.5rem' }}>
            <label style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>
              {meal.charAt(0).toUpperCase() + meal.slice(1)}
            </label>

            {meals[meal].photo ? (
              <img
                src={meals[meal].photo}
                alt={`${meal}`}
                style={{ width: '100%', maxHeight: 200, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }}
              />
            ) : (
              <input type="file" accept="image/*" onChange={(e) => handleFileChange(e, meal)} />
            )}

            <textarea
              placeholder="Describe your meal..."
              value={meals[meal].description}
              onChange={(e) => handleDescriptionChange(e, meal)}
              style={{
                width: '100%',
                padding: 8,
                borderRadius: 8,
                border: '1px solid #ccc',
                marginTop: 8,
              }}
              rows={2}
            />
          </div>
        ))}

        <button
          onClick={() => alert('🔒 Saving logic coming soon')}
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
          Save Meals
        </button>
      </div>
    </div>
  );
}

export default FoodTracking;
