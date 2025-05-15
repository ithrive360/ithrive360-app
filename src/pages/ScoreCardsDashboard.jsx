import React from 'react';

const scoreCards = [
  {
    score: 84,
    title: 'Health Score',
    description: 'Based on your overall health test, your score is 84 and consider good.',
    color: '#6B46C1',
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
      gap: '1rem',
      padding: '1rem',
      fontFamily: 'Arial, sans-serif',
    }}>
      {scoreCards.map((card, index) => (
        <div key={index} style={{
          backgroundColor: '#FFFFFF',
          borderRadius: '12px',
          padding: '1rem',
          display: 'flex',
          alignItems: 'center',
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          gap: '1rem',
          maxWidth: '300px',
        }}>
          <div style={{
            backgroundColor: card.color,
            clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
            width: '56px',
            height: '56px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#FFFFFF',
            fontWeight: 700,
            fontSize: '20px',
            flexShrink: 0,
          }}>
            {card.score}
          </div>
          <div style={{ flex: 1 }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>{card.title}</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#4B5563' }}>{card.description}</p>
            <a href="#" style={{ marginTop: '6px', display: 'inline-block', fontSize: '14px', color: card.color, fontWeight: 500, textDecoration: 'underline' }}>Read more</a>
          </div>
        </div>
      ))}
    </div>
  );
}