import { useEffect } from 'react';
import {
  X, LayoutDashboard, UploadCloud, TrendingUp, Settings, User, HelpCircle, LogOut
} from 'lucide-react';

export default function SidebarMenu({ isOpen, onClose }) {
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
            backgroundColor: 'rgba(0,0,0,0.4)',
            zIndex: 998,
          }}
        />
      )}

      {/* Floating Menu Card */}
      <div
        className="sidebar-menu"
        style={{
          position: 'fixed',
          top: '50px',
          left: '20px',
          width: '300px',
          backgroundColor: 'white',
          borderRadius: '20px',
          boxShadow: '0 8px 24px rgba(0, 0, 0, 0.15)',
          transform: isOpen ? 'translateX(0)' : 'translateX(-200%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 1000,
          display: 'flex',
          flexDirection: 'column',
          padding: '24px 16px'
        }}
      >
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 24
          }}
        >
          <h2 style={{ fontSize: 18, fontWeight: 600, margin: 0, marginLeft: 8 }}>Menu</h2>
        </div>

        {menuItems.map(({ icon, label, action }, idx) => (
          <button
            key={idx}
            onClick={action}
            style={{
              display: 'flex',
              alignItems: 'center',
              padding: '10px 8px',
              gap: 12,
              fontSize: 15,
              fontWeight: 500,
              background: 'none',
              border: 'none',
              textAlign: 'left',
              cursor: 'pointer',
              color: '#1F2937',
              width: '100%'
            }}
          >
            {icon} {label}
          </button>
        ))}

        <div style={{ marginTop: 'auto', paddingTop: 16 }}>
          <button
            onClick={() => {}}
            style={{
              width: '100%',
              backgroundColor: '#3ab3a1',
              color: 'white',
              border: 'none',
              borderRadius: '10px',
              padding: '12px 0',
              fontSize: 15,
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8
            }}
          >
            <LogOut size={18} /> Log out
          </button>
        </div>
      </div>
    </>
  );
}
