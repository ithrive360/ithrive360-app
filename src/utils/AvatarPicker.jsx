import React from 'react';

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
  'sloth_3309426.png',
  'spanish_4964248.png',
  'programmer_1413300.png'
];

export default function AvatarPicker({ currentAvatar, onSelect, onClose }) {
  return (
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.6)',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}
    >
      <div
        style={{
          background: '#fff',
          padding: 24,
          borderRadius: 12,
          maxWidth: 500,
          width: '90%',
          textAlign: 'center'
        }}
      >
        <h3 style={{ marginBottom: 16 }}>Pick Your Avatar</h3>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(72px, 1fr))',
            gap: 16,
            marginBottom: 20
          }}
        >
          {avatarFiles.map((file) => {
            const isSelected = currentAvatar?.includes(file);
            return (
              <img
                key={file}
                src={`/avatars/${file}`}
                alt={file}
                onClick={() => onSelect(`/avatars/${file}`)}
                style={{
                  width: 72,
                  height: 72,
                  borderRadius: '50%',
                  border: isSelected ? '3px solid #3ab3a1' : '2px solid #e5e7eb',
                  cursor: 'pointer',
                  objectFit: 'cover'
                }}
              />
            );
          })}
        </div>

        <button
          onClick={onClose}
          style={{
            backgroundColor: '#e5e7eb',
            color: '#111827',
            border: 'none',
            padding: '8px 14px',
            borderRadius: 6,
            cursor: 'pointer',
            fontWeight: 500
          }}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
