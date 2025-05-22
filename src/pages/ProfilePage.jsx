import { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { Menu, X, Pencil } from 'lucide-react';
import SidebarMenu from './SidebarMenu';
import logo from '../assets/logo.png';

const avatarFiles = [
  'arab_496405.png',
  'chinese_3011302.png',
  'gamer_4918212.png',
  'indian_496399.png',
  'invisible-man_6740955.png',
  'musician_4213660.png',
  'ninja_6740968.png',
  'old-woman_9308303.png',
  'rapper_1864437.png',
  'sloth_3309246.png',
  'spanish_496424.png',
  'programmer_1413300.png'
];

export default function ProfilePage() {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [menuOpen, setMenuOpen] = useState(false);

  const [isEditingName, setIsEditingName] = useState(false);
  const [isEditingUserName, setIsEditingUserName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [editedUserName, setEditedUserName] = useState('');

  const [avatarUrl, setAvatarUrl] = useState(null);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  useEffect(() => {
    const getSessionAndProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const currentUser = session?.user;
      setUser(currentUser);
      if (!currentUser) return;

      const { data: profileData } = await supabase
        .from('user_profile')
        .select('full_name, user_name, avatar_url')
        .eq('user_id', currentUser.id)
        .single();

      setProfile(profileData || {});
      setAvatarUrl(profileData?.avatar_url || null);
      setEditedName(profileData?.full_name || '');
      setEditedUserName(profileData?.user_name || profileData?.full_name?.split(' ')[0] || '');
    };

    getSessionAndProfile();
  }, []);

  const handleSave = async (field) => {
    const updates = {};

    if (field === 'name') {
      updates.full_name = editedName;
      setIsEditingName(false);
    } else if (field === 'user_name') {
      updates.user_name = editedUserName;
      setIsEditingUserName(false);
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

  const handleAvatarSelect = async (url) => {
    const { error } = await supabase
      .from('user_profile')
      .update({ avatar_url: url })
      .eq('user_id', user.id);

    if (!error) {
      setAvatarUrl(url);
      setShowAvatarPicker(false);
    } else {
      console.error('Failed to update avatar:', error.message);
    }
  };

  const firstInitial = profile?.full_name?.trim()?.[0]?.toUpperCase() || '?';

  if (!user) return <p>Please log in to view your profile.</p>;

  return (
    <div style={{ fontFamily: 'Segoe UI, sans-serif', padding: '32px 24px', maxWidth: 600, margin: '0 auto', backgroundColor: 'white' }}>
      {/* Top Bar */}
      <div style={{
        position: 'fixed', top: 0, left: 0, width: '100%',
        backgroundColor: '#fff', display: 'flex', alignItems: 'center',
        justifyContent: 'center', padding: '12px 16px', zIndex: 1000,
        boxShadow: '0 2px 6px rgba(0, 0, 0, 0.05)'
      }}>
        <button onClick={() => setMenuOpen((prev) => !prev)} style={{
          position: 'absolute', left: 16, background: 'none',
          border: 'none', padding: 0, cursor: 'pointer', lineHeight: 0
        }} aria-label="Toggle menu">
          {menuOpen ? <X size={28} color="#3ab3a1" /> : <Menu size={28} color="#3ab3a1" />}
        </button>
        <img src={logo} alt="iThrive360 Logo" style={{ height: 32 }} />
      </div>

      {/* Sidebar */}
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
          {avatarUrl ? (
            <img
              src={avatarUrl}
              alt="avatar"
              style={{
                width: 96, height: 96, borderRadius: '50%',
                objectFit: 'cover', border: '2px solid #E5E7EB'
              }}
            />
          ) : (
            <div style={{
              width: 96, height: 96, borderRadius: '50%',
              backgroundColor: '#e5e7eb', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
              fontSize: 32, color: '#374151', fontWeight: 600
            }}>
              {firstInitial}
            </div>
          )}
          <button onClick={() => setShowAvatarPicker(true)} style={{
            position: 'absolute', bottom: -8, left: '50%',
            transform: 'translateX(-50%)', backgroundColor: '#3ab3a1',
            border: 'none', color: 'white', borderRadius: 9999,
            padding: '4px 8px', fontSize: 12, cursor: 'pointer'
          }}>
            Edit
          </button>
        </div>

        {/* Name & Username */}
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
              <div style={{ fontSize: 17, fontWeight: 500, marginTop: 4, color: '#374151' }}>
                {profile?.full_name || 'Not set'}
              </div>
            )}
          </div>

          {/* User Name */}
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <strong style={{ fontSize: 16, color: '#6B7280' }}>User Name:</strong>
              {isEditingUserName ? (
                <div style={{ display: 'flex', gap: 8 }}>
                  <button onClick={() => handleSave('user_name')} style={{ fontSize: 12 }}>Save</button>
                  <button onClick={() => { setIsEditingUserName(false); setEditedUserName(profile.user_name || firstInitial); }} style={{ fontSize: 12 }}>Cancel</button>
                </div>
              ) : (
                <Pencil size={16} style={{ color: '#6B7280', cursor: 'pointer' }} onClick={() => setIsEditingUserName(true)} />
              )}
            </div>
            {isEditingUserName ? (
              <input
                type="text"
                value={editedUserName}
                onChange={(e) => setEditedUserName(e.target.value)}
                style={{ fontSize: 16, marginTop: 6, padding: 6, width: '100%', border: '1px solid #D1D5DB', borderRadius: 6 }}
              />
            ) : (
              <div style={{ fontSize: 17, fontWeight: 500, marginTop: 4, color: '#374151' }}>
                {profile?.user_name || firstInitial}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      {showAvatarPicker && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.6)', zIndex: 9999,
          display: 'flex', justifyContent: 'center', alignItems: 'center'
        }}>
          <div style={{
            background: '#fff', padding: 24, borderRadius: 12,
            maxWidth: 500, width: '90%', textAlign: 'center'
          }}>
            <h3 style={{ marginBottom: 16 }}>Pick Your Avatar</h3>
            <div style={{
              display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
              gap: 16, marginBottom: 20
            }}>
              {avatarFiles.map((file) => {
                const isSelected = avatarUrl?.includes(file);
                return (
                  <img
                    key={file}
                    src={`/avatars/${file}`}
                    alt={file}
                    onClick={() => handleAvatarSelect(`/avatars/${file}`)}
                    style={{
                      width: 72, height: 72, borderRadius: '50%',
                      border: isSelected ? '3px solid #3ab3a1' : '2px solid #e5e7eb',
                      cursor: 'pointer', objectFit: 'cover'
                    }}
                  />
                );
              })}
            </div>
            <button onClick={() => setShowAvatarPicker(false)} style={{
              backgroundColor: '#e5e7eb', color: '#111827',
              border: 'none', padding: '8px 14px',
              borderRadius: 6, cursor: 'pointer', fontWeight: 500
            }}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
