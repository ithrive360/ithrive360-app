import { useEffect } from 'react';
import {
  X, LayoutDashboard, UploadCloud, TrendingUp, Settings, User, HelpCircle, LogOut
} from 'lucide-react';

export default function SidebarMenu({ isOpen, onClose }) {
  console.log('SidebarMenu component mounted');

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden';
    else document.body.style.overflow = 'auto';
    return () => { document.body.style.overflow = 'auto'; };
  }, [isOpen]);

  const menuItems = [
    { icon: <LayoutDashboard size={20} />, label: 'Dashboard', action: () => {} },
    { icon: <UploadCloud size={20} />, label: 'Upload Results', action: () => {} },
    { icon: <TrendingUp size={20} />, label: 'Track Progress', action: () => {} },
    { icon: <Settings size={20} />, label: 'Settings', action: () => {} },
    { icon: <User size={20} />, label: 'My Profile', action: () => {} },
    { icon: <HelpCircle size={20} />, label: 'Help Center', action: () => {} },
  ];

  console.log('Sidebar rendering. isOpen:', isOpen);

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            backgroundColor: 'rgba(0,0,0,0.3)',
            backdropFilter: 'blur(2px)',
            zIndex: 998,
          }}
        />
      )}

      {/* Floating menu card */}
      {isOpen && (
        <div
          style={{
            position: 'fixed',
            top: '10%',
            left: '50%',
            transform: 'translateX(-50%)',
            width: '90%',
            maxWidth: '320px',
            background: '#fff',
            borderRadius: '20px',
            padding: '1.5rem',
            zIndex: 999,
            boxShadow: '0 12px 40px rgba(0, 0, 0, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            gap: '1rem'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontSize: 18, fontWeight: 600 }}>Menu</h2>
            <button
              onClick={onClose}
              style={{
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                padding: 0
              }}
            >
              <X size={24} color="#3ab3a1" />
            </button>
          </div>

          {menuItems.map(({ icon, label, action }, idx) => (
            <button
              key={idx}
              onClick={action}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                fontSize: 15,
                fontWeight: 500,
                background: 'none',
                border: 'none',
                color: '#1F2937',
                textAlign: 'left',
                cursor: 'pointer',
                padding: '0.5rem 0'
              }}
            >
              {icon} {label}
            </button>
          ))}

          <button
            onClick={() => {}}
            style={{
              marginTop: '1rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontSize: 15,
              fontWeight: 600,
              backgroundColor: '#3ab3a1',
              color: '#fff',
              border: 'none',
              padding: '0.75rem',
              borderRadius: '12px',
              cursor: 'pointer'
            }}
          >
            <LogOut size={20} /> Log out
          </button>
        </div>
      )}
    </>
  );
}
