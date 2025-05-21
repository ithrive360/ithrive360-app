import React, { useState } from 'react';

export default function ScoreCardsDashboard({ scores }) {
  const [visibleInfo, setVisibleInfo] = useState(null);

  const getColor = (score) => {
    if (score === null || score === '--') return '#d1d5db'; // gray
    if (score < 60) return '#ef4444'; // red
    if (score < 80) return '#f59e0b'; // amber
    return '#10b981'; // green
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
      }}
    >
      {scoreCards.map((card) => (
        <div key={card.key} style={{ marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
            <span style={{ fontWeight: 600 }}>{card.title}</span>
            <span style={{ fontWeight: 700 }}>{card.score ?? '--'}/100</span>
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
              }}
            >
              ℹ️
            </button>
          </div>
          {visibleInfo === card.key && (
            <div
              style={{
                fontSize: '0.85rem',
                marginTop: 4,
                backgroundColor: '#f9fafb',
                padding: '0.75rem',
                borderRadius: 8,
                border: '1px solid #e5e7eb',
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
