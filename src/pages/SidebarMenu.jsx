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
      <div
        style={{
          display: isOpen ? 'block' : 'none',
          position: 'fixed', top: 0, left: 0,
          width: '100%', height: '100%',
          backgroundColor: 'rgba(0,0,0,0.4)',
          zIndex: 998
        }}
        onClick={onClose}
      />

      {/* Sidebar */}
      <div
        style={{
          position: 'fixed', top: 0, left: 0,
          width: 260, height: '100%',
          backgroundColor: 'white',
          transform: isOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform 0.3s ease-in-out',
          zIndex: 999,
          boxShadow: '4px 0 12px rgba(0,0,0,0.1)',
          display: 'flex', flexDirection: 'column',
          padding: 16
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24
        }}>
          <h2 style={{ fontSize: 18, fontWeight: 600 }}>Menu</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {menuItems.map(({ icon, label, action }, idx) => (
          <button
            key={idx}
            onClick={action}
            style={{
              display: 'flex', alignItems: 'center',
              padding: '10px 8px', gap: 12,
              fontSize: 15, fontWeight: 500,
              background: 'none', border: 'none',
              textAlign: 'left', cursor: 'pointer',
              color: '#1F2937', width: '100%'
            }}
          >
            {icon} {label}
          </button>
        ))}

        <div style={{ marginTop: 'auto' }}>
          <button
            onClick={() => {}}
            style={{
              display: 'flex', alignItems: 'center',
              padding: '10px 8px', gap: 12,
              fontSize: 15, fontWeight: 500,
              background: 'none', border: 'none',
              textAlign: 'left', cursor: 'pointer',
              color: '#DC2626', width: '100%'
            }}
          >
            <LogOut size={20} /> Log out
          </button>
        </div>
      </div>
    </>
  );
}
