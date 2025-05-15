import React from 'react';

const scoreCards = [
  {
    score: 84,
    title: 'Health Score',
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
          alignItems: 'flex-start', // changed from center
          boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
          gap: '1.25rem', // slightly increased spacing
          maxWidth: '400px',
        }}>
          <div style={{ width: 64, height: 64, flexShrink: 0 }}>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              width="64"
              height="64"
              fill={card.color}
              stroke="none"
            >
              <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" />
              <text
                x="12"
                y="16"
                textAnchor="middle"
                fontSize="10"
                fontWeight="bold"
                fill="#fff"
              >
                {card.score}
              </text>
            </svg>
          </div>

          <div style={{ flex: 1, textAlign: 'left' }}>
            <h4 style={{ margin: 0, fontSize: '16px', fontWeight: 600, color: '#1F2937' }}>{card.title}</h4>
            <p style={{ margin: '4px 0 0 0', fontSize: '14px', color: '#4B5563' }}>{card.description}</p>
            <a href="#" style={{ marginTop: '6px', display: 'inline-block', fontSize: '14px', color: card.color, fontWeight: 500, textDecoration: 'underline' }}>Read more</a>
          </div>
        </div>
      ))}
    </div>
  );
}
