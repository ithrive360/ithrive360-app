import React from 'react';

const scoreCards = [
  {
    score: 84,
    title: 'General Health',
    description: 'Based on your overall health test, your score is 84 and considered good.',
    color: '#4f46e5',
  },
  {
    score: 76,
    title: 'Longevity',
    description: 'Your score reflects long-term health and risk resilience based on blood and DNA data.',
    color: '#3ab3a1',
  },
  {
    score: 91,
    title: 'Performance & Recovery',
    description: 'Optimised recovery, energy and performance markers place you in an excellent range.',
    color: '#8b5cf6',
  },
];

export default function ScoreCardsDashboard() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      gap: '1.25rem',
      padding: '1rem',
    }}>
      {scoreCards.map((card, index) => (
        <div key={index} style={{
          backgroundColor: '#f9fafb',
          borderRadius: '1rem',
          padding: '1.25rem',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.04)',
          gap: '1rem',
        }}>
          <div style={{
            backgroundColor: card.color,
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: '16px',
            flexShrink: 0,
          }}>
            {card.score}
          </div>

          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '15px', fontWeight: 600, color: '#111827' }}>{card.title}</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#6b7280' }}>{card.description}</p>
            <a href="#" style={{ marginTop: '6px', display: 'inline-block', fontSize: '14px', color: card.color, fontWeight: 500 }}>Read more</a>
          </div>
        </div>
      ))}
    </div>
  );
}
