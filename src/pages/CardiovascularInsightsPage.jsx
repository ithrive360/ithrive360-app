import { useState } from 'react';
import { Heart, AlertCircle, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function CardiovascularInsightsPage() {
  const [activeTab, setActiveTab] = useState('blood');
  const [expandedSection, setExpandedSection] = useState('');

  // (Insert the full JSON data as "data" variable from the user's post above)
  const data = { /* paste full JSON object here */ };

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
    switch(category) {
      case 'strength': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'risk': return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: return null;
    }
  };

  const getCategoryColor = (category) => {
    switch(category) {
      case 'strength': return 'bg-green-100 text-green-800 border-green-200';
      case 'warning': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'risk': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusColor = (status) => {
    switch(status) {
      case 'Normal': return 'text-green-600';
      case 'High': return 'text-red-600';
      case 'Low': return 'text-blue-600';
      default: return 'text-gray-600';
    }
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Heart className="w-8 h-8 text-red-500 mr-3" />
          <h1 className="text-2xl font-bold text-gray-800">{data.health_area}</h1>
        </div>
        <div className="flex space-x-2">
          <span className="px-3 py-1 rounded-full bg-green-100 text-green-800 text-sm font-medium flex items-center">
            <CheckCircle className="w-4 h-4 mr-1" />
            {bloodStats.strength + dnaStats.strength} Strengths
          </span>
          <span className="px-3 py-1 rounded-full bg-amber-100 text-amber-800 text-sm font-medium flex items-center">
            <AlertTriangle className="w-4 h-4 mr-1" />
            {bloodStats.warning + dnaStats.warning} Warnings
          </span>
          <span className="px-3 py-1 rounded-full bg-red-100 text-red-800 text-sm font-medium flex items-center">
            <AlertCircle className="w-4 h-4 mr-1" />
            {bloodStats.risk + dnaStats.risk} Risks
          </span>
        </div>
      </div>

      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Health Summary</h2>
        <p className="text-blue-700">{data.summary}</p>
      </div>

      <div className="flex border-b border-gray-200 mb-6">
        <button className={`py-2 px-4 font-medium text-sm ${activeTab === 'blood' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('blood')}>Blood Markers ({bloodStats.total})</button>
        <button className={`py-2 px-4 font-medium text-sm ${activeTab === 'dna' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('dna')}>DNA Traits ({dnaStats.total})</button>
        <button className={`py-2 px-4 font-medium text-sm ${activeTab === 'recommendations' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`} onClick={() => setActiveTab('recommendations')}>Recommendations</button>
      </div>

      {activeTab === 'blood' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.blood_markers.map((marker, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getCategoryColor(marker.category)}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center">{getCategoryIcon(marker.category)}<h3 className="font-medium ml-2">{marker.marker_name}</h3></div>
                <span className={`font-semibold ${getStatusColor(marker.status)}`}>{marker.status}</span>
              </div>
              <p className="mt-2 text-sm">{marker.insight}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'dna' && (
        <div className="space-y-4">
          {data.dna_traits.map((trait, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getCategoryColor(trait.category)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">{getCategoryIcon(trait.category)}<h3 className="font-medium ml-2">{trait.trait_name}</h3></div>
                  <p className="text-xs text-gray-500 mt-1">RSID: {trait.rsid}</p>
                </div>
              </div>
              <p className="mt-2 text-sm">{trait.insight}</p>
              <p className="mt-1 text-xs text-gray-600">{trait.effect}</p>
            </div>
          ))}
        </div>
      )}

      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {Object.entries(data.recommendations).map(([category, items]) => (
            <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
              <div className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer" onClick={() => toggleSection(category)}>
                <h3 className="font-medium text-gray-800">{category}</h3>
                {expandedSection === category ? <ChevronUp className="w-5 h-5 text-gray-500" /> : <ChevronDown className="w-5 h-5 text-gray-500" />}
              </div>
              {expandedSection === category && (
                <div className="p-4 bg-white">
                  <ul className="list-disc pl-5 space-y-2">
                    {Array.isArray(items) ? items.map((item, i) => (<li key={i} className="text-gray-700">{item}</li>)) :
                      Object.entries(items).map(([subCategory, subItems], i) => (
                        <div key={i}>
                          <h4 className="font-medium">{subCategory}</h4>
                          <ul className="list-disc pl-5 space-y-1 mt-1">
                            {subItems.map((item, j) => (<li key={j} className="text-gray-700">{item}</li>))}
                          </ul>
                        </div>
                      ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      <div className="mt-8 p-4 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg text-white flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">Cardiovascular Health Score</h3>
          <p className="text-blue-100">Based on {bloodStats.total} blood markers and {dnaStats.total} genetic traits</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold">{Math.round((bloodStats.strength + dnaStats.strength) / (bloodStats.total + dnaStats.total) * 100)}%</div>
          <div className="text-sm text-blue-100">Health Score</div>
        </div>
      </div>
    </div>
  );
}
