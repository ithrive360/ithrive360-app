import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Menu, X, Pencil } from 'lucide-react';
import SidebarMenu from './SidebarMenu';
import logo from '../assets/logo.png';

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState({ full_name: '' }); // Default to empty string
  const [menuOpen, setMenuOpen] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingHandle, setIsEditingHandle] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedHandle, setEditedHandle] = useState('');

  useEffect(() => {
    const getSessionAndProfile = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();

        const currentUser = session?.user;
        setUser(currentUser);

        if (!currentUser) {
          console.warn('No user session found');
          return;
        }

        // Check if a profile exists; if not, create one
        let { data, error } = await supabase
          .from('user_profile')
          .select('full_name')
          .eq('user_id', currentUser.id)
          .single();

        if (error && error.code === 'PGRST116') {
          // No row found, insert a new profile
          console.log('No profile found, creating a new one...');
          const { error: insertError } = await supabase
            .from('user_profile')
            .insert({ user_id: currentUser.id, full_name: '', email: currentUser.email });

          if (insertError) {
            console.error('Failed to create user_profile:', insertError.message);
            setProfile({ full_name: '' });
            return;
          }

          // Fetch the newly created profile
          const { data: newData, error: fetchError } = await supabase
            .from('user_profile')
            .select('full_name')
            .eq('user_id', currentUser.id)
            .single();

          if (fetchError) {
            console.error('Failed to fetch new user_profile:', fetchError.message);
            setProfile({ full_name: '' });
            return;
          }

          data = newData;
        } else if (error) {
          console.error('Failed to fetch user_profile:', error.message);
          setProfile({ full_name: '' });
          return;
        }

        setProfile(data || { full_name: '' });
        setEditedName(data?.full_name || '');
        setEditedHandle(data?.full_name?.split(' ')[0] || '');
      } catch (err) {
        console.error('Error in getSessionAndProfile:', err.message);
        setProfile({ full_name: '' });
      }
    };

    getSessionAndProfile();
  }, []);

  const handleSave = async (field) => {
    const updates = {};
    if (field === 'name') {
      updates.full_name = editedName;
      setIsEditingName(false);
    } else if (field === 'handle') {
      // Optionally update full_name to start with editedHandle if you want consistency
      updates.full_name = editedHandle + (editedName.includes(' ') ? editedName.split(' ').slice(1).join(' ') : '');
      setIsEditingHandle(false);
    }

    const { error } = await supabase
      .from('user_profile')
      .update(updates)
      .eq('user_id', user.id);

    if (!error) {
      setProfile((prev) => ({ ...prev, ...updates }));
    } else {
      console.error('Failed to save updates:', error.message);
    }
  };

  if (!user) return <p>Please log in to view your profile.</p>;

  const firstInitial =
    (isEditingName ? editedName : profile.full_name)?.trim()[0]?.toUpperCase() || '?';

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '32px 24px', maxWidth: 600, margin: '0 auto', backgroundColor: 'white' }}>
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

      {/* Sidebar Menu */}
      <SidebarMenu
        isOpen={menuOpen}
        onClose={() => setMenuOpen(false)}
        onLogout={async () => {
          await supabase.auth.signOut();
          window.location.href = '/';
        }}
        profile={profile}
      />

      {/* Main Content */}
      <div style={{ marginTop: 80 }}>
        {/* Avatar */}
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

        {/* Editable Fields */}
        <div style={{ marginTop: 32 }}>
          {/* Full Name */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 16, color: '#6B7280' }}>Full Name:</strong>
              {isEditingName ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleSave('name')} style={{ fontSize: 12 }}>Save</button>
                  <button onClick={() => { setIsEditingName(false); setEditedName(profile.full_name); }} style={{ fontSize: 12 }}>Cancel</button>
                </div>
              ) : (
                <Pencil size={16} style={{ color: '#6B7280', cursor: 'pointer' }} onClick={() => setIsEditingName(true)} />
              )}
            </div>
            {isEditingName ? (
              <input
                type="text"
                value={editedName}
                onChange={(e) => setEditedName(e.target.value)}
                style={{ fontSize: 16, marginTop: 6, padding: 6, width: '100%', border: '1px solid #D1D5DB', borderRadius: 6 }}
              />
            ) : (
              <div style={{ fontSize: 17, fontWeight: 500, marginTop: 4, color: '#374151' }}>{profile?.full_name || 'Not set'}</div>
            )}
          </div>

          {/* User Name (First Name) */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 16, color: '#6B7280' }}>User Name:</strong>
              {isEditingHandle ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleSave('handle')} style={{ fontSize: 12 }}>Save</button>
                  <button onClick={() => { setIsEditingHandle(false); setEditedHandle(profile.full_name?.split(' ')[0] || ''); }} style={{ fontSize: 12 }}>Cancel</button>
                </div>
              ) : (
                <Pencil size={16} style={{ color: '#6B7280', cursor: 'pointer' }} onClick={() => setIsEditingHandle(true)} />
              )}
            </div>
            {isEditingHandle ? (
              <input
                type="text"
                value={editedHandle}
                onChange={(e) => setEditedHandle(e.target.value)}
                style={{ fontSize: 16, marginTop: 6, padding: 6, width: '100%', border: '1px solid #D1D5DB', borderRadius: 6 }}
              />
            ) : (
              <div style={{ fontSize: 17, fontWeight: 500, marginTop: 4, color: '#374151' }}>{profile.full_name?.split(' ')[0] || 'Not set'}</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}