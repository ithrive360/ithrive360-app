import { useState } from 'react';
import { Heart, AlertCircle, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function CardiovascularInsightsPage() {
  const [activeTab, setActiveTab] = useState('blood');
  const [expandedSection, setExpandedSection] = useState('');

  const data = { /* full JSON data from your prompt should go here */ };

  const bloodStats = {
    strength: data.blood_markers.filter(item => item.category === 'strength').length,
    warning: data.blood_markers.filter(item => item.category === 'warning').length,
    risk: data.blood_markers.filter(item => item.category === 'risk').length,
    total: data.blood_markers.length
  };

  const dnaStats = {
    strength: data.dna_traits.filter(item => item.category === 'strength').length,
    warning: data.dna_traits.filter(item => item.category === 'warning').length,
    risk: data.dna_traits.filter(item => item.category === 'risk').length,
    total: data.dna_traits.length
  };

  const getCategoryIcon = (category) => {
    switch (category) {
      case 'strength': return <CheckCircle className="icon green" />;
      case 'warning': return <AlertTriangle className="icon amber" />;
      case 'risk': return <AlertCircle className="icon red" />;
      default: return null;
    }
  };

  const getCategoryClass = (category) => {
    switch (category) {
      case 'strength': return 'marker strength';
      case 'warning': return 'marker warning';
      case 'risk': return 'marker risk';
      default: return 'marker';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'Normal': return 'status green';
      case 'High': return 'status red';
      case 'Low': return 'status blue';
      default: return 'status gray';
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  return (
    <div className="cardio-dashboard">
      <style>{`
        .cardio-dashboard {
          max-width: 900px;
          margin: 2rem auto;
          padding: 1.5rem;
          font-family: Arial, sans-serif;
          background: white;
          border-radius: 12px;
          box-shadow: 0 4px 8px rgba(0,0,0,0.05);
        }
        .header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 1.5rem;
        }
        .badges span {
          display: inline-flex;
          align-items: center;
          font-size: 0.85rem;
          padding: 0.3rem 0.6rem;
          margin-right: 0.5rem;
          border-radius: 999px;
        }
        .badge-green { background: #d1fae5; color: #065f46; }
        .badge-amber { background: #fef3c7; color: #92400e; }
        .badge-red { background: #fee2e2; color: #991b1b; }
        .tabs button {
          padding: 0.5rem 1rem;
          margin-right: 1rem;
          font-weight: bold;
          border: none;
          background: none;
          border-bottom: 2px solid transparent;
          cursor: pointer;
        }
        .tabs button.active {
          color: #2563eb;
          border-color: #2563eb;
        }
        .marker {
          border-radius: 8px;
          padding: 1rem;
          border: 1px solid #e5e7eb;
          margin-bottom: 1rem;
        }
        .marker h3 {
          margin: 0;
          font-weight: bold;
        }
        .strength { background: #f0fdf4; border-color: #bbf7d0; }
        .warning { background: #fff7ed; border-color: #fdba74; }
        .risk { background: #fef2f2; border-color: #fecaca; }
        .icon { width: 1rem; height: 1rem; margin-right: 0.3rem; }
        .green { color: #16a34a; }
        .amber { color: #d97706; }
        .red { color: #dc2626; }
        .status { font-weight: bold; }
        .status.green { color: #16a34a; }
        .status.red { color: #dc2626; }
        .status.blue { color: #2563eb; }
        .status.gray { color: #6b7280; }
      `}</style>

      <div className="header">
        <div className="flex items-center">
          <Heart className="icon red" />
          <h1 style={{ marginLeft: '0.5rem' }}>{data.health_area}</h1>
        </div>
        <div className="badges">
          <span className="badge-green"><CheckCircle className="icon green" /> {bloodStats.strength + dnaStats.strength} Strengths</span>
          <span className="badge-amber"><AlertTriangle className="icon amber" /> {bloodStats.warning + dnaStats.warning} Warnings</span>
          <span className="badge-red"><AlertCircle className="icon red" /> {bloodStats.risk + dnaStats.risk} Risks</span>
        </div>
      </div>

      <div style={{ background: '#eff6ff', padding: '1rem', borderRadius: '8px', marginBottom: '1rem' }}>
        <h2 style={{ marginBottom: '0.5rem', color: '#1d4ed8' }}>Health Summary</h2>
        <p style={{ margin: 0 }}>{data.summary}</p>
      </div>

      <div className="tabs" style={{ marginBottom: '1rem' }}>
        <button className={activeTab === 'blood' ? 'active' : ''} onClick={() => setActiveTab('blood')}>Blood Markers</button>
        <button className={activeTab === 'dna' ? 'active' : ''} onClick={() => setActiveTab('dna')}>DNA Traits</button>
        <button className={activeTab === 'recommendations' ? 'active' : ''} onClick={() => setActiveTab('recommendations')}>Recommendations</button>
      </div>

      {activeTab === 'blood' && data.blood_markers.map((marker, idx) => (
        <div key={idx} className={getCategoryClass(marker.category)}>
          <div className="flex justify-between">
            <div className="flex items-center">{getCategoryIcon(marker.category)} <h3>{marker.marker_name}</h3></div>
            <div className={getStatusColor(marker.status)}>{marker.status}</div>
          </div>
          <p>{marker.insight}</p>
        </div>
      ))}

      {activeTab === 'dna' && data.dna_traits.map((trait, idx) => (
        <div key={idx} className={getCategoryClass(trait.category)}>
          <div className="flex justify-between">
            <div>
              <div className="flex items-center">{getCategoryIcon(trait.category)} <h3>{trait.trait_name}</h3></div>
              <p style={{ fontSize: '0.75rem', color: '#6b7280' }}>RSID: {trait.rsid}</p>
            </div>
          </div>
          <p>{trait.insight}</p>
          <p style={{ fontSize: '0.75rem', color: '#4b5563' }}>{trait.effect}</p>
        </div>
      ))}

      {activeTab === 'recommendations' && Object.entries(data.recommendations).map(([category, recs], idx) => (
        <div key={idx} style={{ border: '1px solid #e5e7eb', borderRadius: '8px', marginBottom: '1rem' }}>
          <div style={{ background: '#f9fafb', padding: '0.75rem 1rem', cursor: 'pointer' }} onClick={() => toggleSection(category)}>
            <div className="flex justify-between">
              <strong>{category}</strong>
              {expandedSection === category ? <ChevronUp className="icon" /> : <ChevronDown className="icon" />}
            </div>
          </div>
          {expandedSection === category && (
            <div style={{ padding: '0.75rem 1rem' }}>
              <ul style={{ paddingLeft: '1.25rem' }}>
                {recs.map((item, i) => <li key={i}>{item}</li>)}
              </ul>
            </div>
          )}
        </div>
      ))}

      <div style={{ marginTop: '2rem', padding: '1rem', background: 'linear-gradient(to right, #3b82f6, #1e40af)', borderRadius: '8px', color: 'white', display: 'flex', justifyContent: 'space-between' }}>
        <div>
          <h3>Cardiovascular Health Score</h3>
          <p>Based on {bloodStats.total} blood markers and {dnaStats.total} genetic traits</p>
        </div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', fontWeight: 'bold' }}>{Math.round((bloodStats.strength + dnaStats.strength) / (bloodStats.total + dnaStats.total) * 100)}%</div>
          <div>Health Score</div>
        </div>
      </div>
    </div>
  );
}
