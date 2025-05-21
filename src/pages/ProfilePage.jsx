import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Menu, X, Pencil } from 'lucide-react';
import SidebarMenu from './SidebarMenu';
import logo from '../assets/logo.png';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user || null);

      if (session?.user) {
        const { data } = await supabase
          .from('user_profile')
          .select('full_name')
          .eq('user_id', session.user.id)
          .single();

        setProfile(data || {});
      }
    };

    fetchUser();
  }, []);

  if (!user) return <p>Please log in to view your profile.</p>;

  const firstInitial = profile?.full_name ? profile.full_name.split(' ')[0][0].toUpperCase() : '?';
  const firstName = profile?.full_name ? profile.full_name.split(' ')[0] : '';

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '32px 24px', maxWidth: 600, margin: '0 auto', backgroundColor: 'white' }}>
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

      <SidebarMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={async () => {
          await supabase.auth.signOut();
          window.location.href = '/';
        }}
        profile={profile}
      />

      <div style={{ marginTop: 80 }}>
        <div style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}>
          <div
            style={{
              width: 96,
              height: 96,
              borderRadius: '50%',
              backgroundColor: '#e5e7eb',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 32,
              color: '#374151',
              fontWeight: 600,
            }}
          >
            {firstInitial}
          </div>
          <button
            style={{
              position: 'absolute',
              bottom: -8,
              left: '50%',
              transform: 'translateX(-50%)',
              backgroundColor: '#3ab3a1',
              border: 'none',
              color: 'white',
              borderRadius: 9999,
              padding: '4px 8px',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Edit
          </button>
        </div>

        <div style={{ marginTop: 32 }}>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 16, color: '#6B7280' }}>Full Name:</strong>
              <Pencil size={16} style={{ color: '#6B7280', cursor: 'pointer' }} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, marginTop: 4, color: '#6B7280' }}>{profile?.full_name || 'Not set'}</div>
          </div>

          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 16, color: '#6B7280' }}>User name:</strong>
              <Pencil size={16} style={{ color: '#6B7280', cursor: 'pointer' }} />
            </div>
            <div style={{ fontSize: 17, fontWeight: 500, marginTop: 4, color: '#6B7280' }}>{firstName || 'Not set'}</div>
          </div>
        </div>
      </div>
    </div>
  );
}