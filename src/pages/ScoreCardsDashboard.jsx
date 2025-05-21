import React, { useState, useRef, useEffect } from 'react';

export default function ScoreCardsDashboard({ scores }) {
  const [visibleInfo, setVisibleInfo] = useState(null);
  const infoRefs = useRef({});

  const getColor = (score) => {
    if (score === null || score === '--') return '#d1d5db';
    if (score < 50) return '#ef4444';
    if (score < 75) return '#f59e0b';
    return '#10b981';
  };

  const scoreCards = [
    {
      key: 'general',
      score: scores?.general ?? '--',
      title: 'Overall Health',
      description: 'Your health score is calculated based on your DNA, blood tests, and integrated fitness data. Keep up the great work!',
    },
    {
      key: 'longevity',
      score: scores?.longevity ?? '--',
      title: 'Longevity',
      description: 'This score reflects long-term health and resilience based on aging, immunity, and inflammation markers.',
    },
    {
      key: 'performance',
      score: scores?.performance ?? '--',
      title: 'Performance & Recovery',
      description: 'How well your body recovers from stress and performs under demand. Informed by hormones, recovery markers, and more.',
    },
  ];

  // Close popup on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (
        visibleInfo &&
        infoRefs.current[visibleInfo] &&
        !infoRefs.current[visibleInfo].contains(e.target)
      ) {
        setVisibleInfo(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [visibleInfo]);

  return (
    <div
      style={{
        backgroundColor: '#fff',
        borderRadius: 16,
        padding: '1.5rem',
        margin: '1rem auto',
        width: '90vw',
        maxWidth: 600,
        boxShadow: '0 2px 10px rgba(0,0,0,0.08)',
        fontFamily: 'Arial, sans-serif',
        position: 'relative',
      }}
    >
      {scoreCards.map((card) => (
        <div key={card.key} style={{ marginBottom: '1.5rem', position: 'relative' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{card.title}</span>
            <span style={{ fontWeight: 700 }}>{card.score}/100</span>
          </div>
          <div
            style={{
              height: 10,
              borderRadius: 8,
              backgroundColor: '#e5e7eb',
              overflow: 'hidden',
              marginBottom: 4,
            }}
          >
            <div
              style={{
                width: typeof card.score === 'number' ? `${card.score}%` : '0%',
                height: '100%',
                backgroundColor: getColor(card.score),
                transition: 'width 0.5s ease',
              }}
            ></div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <button
              onClick={() => setVisibleInfo(visibleInfo === card.key ? null : card.key)}
              style={{
                fontSize: '0.8rem',
                background: 'none',
                border: 'none',
                color: '#6b7280',
                cursor: 'pointer',
                position: 'relative',
              }}
              aria-label="More info"
            >
              ℹ️
            </button>
          </div>

          {visibleInfo === card.key && (
            <div
              ref={(el) => (infoRefs.current[card.key] = el)}
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                zIndex: 100,
                backgroundColor: '#fff',
                padding: '1rem',
                marginTop: '0.5rem',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                width: '250px',
                fontSize: '0.9rem',
                color: '#374151',
              }}
            >
              {card.description}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
