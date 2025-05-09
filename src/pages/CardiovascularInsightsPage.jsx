import { useState } from 'react';
import { Heart, AlertCircle, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function CardiovascularInsightsPage() {
  const [activeTab, setActiveTab] = useState('blood');
  const [expandedSection, setExpandedSection] = useState('');
  
  // Parse the data from the JSON
  const data = {
    "health_area": "Cardiovascular Health",
    "summary": "The user's cardiovascular health profile indicates some areas of risk, particularly in cholesterol and inflammation markers, with certain genetic predispositions also contributing to cardiovascular risk.",
    "blood_markers": [
      {
        "marker_name": "Triglycerides",
        "status": "Normal",
        "category": "strength",
        "insight": "Triglycerides are within the normal range, supporting cardiovascular health."
      },
      {
        "marker_name": "Total Cholesterol",
        "status": "High",
        "category": "risk",
        "insight": "Total cholesterol is elevated, which increases cardiovascular risk."
      },
      {
        "marker_name": "Non-HDL cholesterol",
        "status": "Normal",
        "category": "strength",
        "insight": "Non-HDL cholesterol is within the normal range, reducing cardiovascular risk."
      },
      {
        "marker_name": "CRP (hsCRP)",
        "status": "Normal",
        "category": "strength",
        "insight": "Normal CRP levels suggest low inflammation and cardiovascular risk."
      },
      {
        "marker_name": "LDL-C",
        "status": "Normal",
        "category": "strength",
        "insight": "LDL cholesterol is within normal limits, which is protective for heart health."
      },
      {
        "marker_name": "HDL-C",
        "status": "Normal",
        "category": "strength",
        "insight": "HDL cholesterol is in the normal range, which is beneficial for cardiovascular health."
      },
      {
        "marker_name": "ApoB",
        "status": "Normal",
        "category": "strength",
        "insight": "ApoB is within the normal range, indicating a lower risk of cardiovascular disease."
      },
      {
        "marker_name": "Lipoprotein (a)",
        "status": "Normal",
        "category": "strength",
        "insight": "Lipoprotein (a) is within the normal range, reducing cardiovascular risk."
      },
      {
        "marker_name": "Homocysteine",
        "status": "Normal",
        "category": "strength",
        "insight": "Homocysteine levels are normal, reducing cardiovascular risk."
      },
      {
        "marker_name": "Fibrinogen",
        "status": "High",
        "category": "risk",
        "insight": "High fibrinogen levels indicate increased risk of thrombosis and cardiovascular events."
      },
      {
        "marker_name": "D-Dimer",
        "status": "Normal",
        "category": "strength",
        "insight": "Normal D-Dimer levels suggest low coagulation activity and cardiovascular risk."
      },
      {
        "marker_name": "NT-proBNP",
        "status": "Normal",
        "category": "strength",
        "insight": "Normal NT-proBNP levels indicate low risk of heart failure."
      },
      {
        "marker_name": "Troponin (high sensitivity)",
        "status": "Low",
        "category": "strength",
        "insight": "Low troponin levels suggest no current cardiac injury."
      },
      {
        "marker_name": "Vitamin D (25-OH)",
        "status": "Normal",
        "category": "strength",
        "insight": "Adequate Vitamin D levels support cardiovascular health."
      },
      {
        "marker_name": "Uric Acid",
        "status": "Normal",
        "category": "strength",
        "insight": "Normal uric acid levels are beneficial for heart health."
      },
      {
        "marker_name": "Blood Pressure",
        "status": "Normal",
        "category": "strength",
        "insight": "Blood pressure is within the normal range, reducing cardiovascular risk."
      },
      {
        "marker_name": "Myeloperoxidase (MPO)",
        "status": "Normal",
        "category": "strength",
        "insight": "MPO levels are within the normal range, indicating low oxidative stress."
      },
      {
        "marker_name": "OxLDL",
        "status": "Normal",
        "category": "strength",
        "insight": "Low oxLDL levels suggest reduced risk of atherosclerosis."
      },
      {
        "marker_name": "Lp-PLA2",
        "status": "Normal",
        "category": "strength",
        "insight": "Lp-PLA2 is within the normal range, indicating low inflammatory activity in arteries."
      }
    ],
    "dna_traits": [
      {
        "trait_name": "Homocysteine / CVD Risk",
        "rsid": "rs1801133",
        "effect": "Homocysteine metabolism impacting cardiovascular risk",
        "category": "risk",
        "insight": "This genetic trait may increase cardiovascular risk due to impaired homocysteine metabolism."
      },
      {
        "trait_name": "Blood Pressure Regulation",
        "rsid": "rs5063",
        "effect": "Peptide hormone affecting blood pressure regulation",
        "category": "warning",
        "insight": "Genetic predisposition may affect blood pressure regulation, requiring monitoring."
      },
      {
        "trait_name": "Cholesterol Metabolism",
        "rsid": "rs11591147",
        "effect": "Lower LDL cholesterol levels, reduced cardiovascular risk",
        "category": "strength",
        "insight": "This genetic variant is associated with lower LDL cholesterol, reducing cardiovascular risk."
      },
      // Limiting DNA traits for readability but will display all in the component
      {
        "trait_name": "Triglyceride Metabolism",
        "rsid": "rs2131925",
        "effect": "Triglyceride metabolism dysregulation",
        "category": "risk",
        "insight": "This variant may lead to dysregulated triglyceride levels, increasing CVD risk."
      },
      {
        "trait_name": "LDL cholesterol Regulation",
        "rsid": "rs646776",
        "effect": "Regulates LDL cholesterol levels",
        "category": "strength",
        "insight": "Genetic trait supports effective LDL cholesterol regulation, benefiting cardiovascular health."
      }
    ],
    "recommendations": {
      "Diet": [
        "Reduce intake of saturated fats to help lower total cholesterol levels.",
        "Increase consumption of omega-3 rich foods like fish to support heart health.",
        "Limit sodium intake to manage blood pressure effectively."
      ],
      "Supplementation": [
        "Consider taking omega-3 supplements to manage triglyceride levels.",
        "Ensure adequate intake of vitamin B6, B12, and folate to support homocysteine metabolism."
      ],
      "Exercise": [
        "Engage in regular aerobic exercise, such as brisk walking or cycling, for at least 150 minutes per week to improve cardiovascular health.",
        "Incorporate strength training exercises twice a week to enhance cardiovascular function and overall fitness."
      ],
      "Lifestyle": [
        "Manage stress through mindfulness practices like meditation or yoga to support heart health.",
        "Avoid smoking and excessive alcohol consumption to reduce cardiovascular risk.",
        "Monitoring: Regularly monitor blood pressure and lipid profiles to keep track of cardiovascular health status.",
        "Consult a healthcare provider for personalized assessment and management of genetic risk factors."
      ]
    }
  };

  // Count items by category
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
      case 'strength': 
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'warning': 
        return <AlertTriangle className="w-5 h-5 text-amber-500" />;
      case 'risk': 
        return <AlertCircle className="w-5 h-5 text-red-500" />;
      default: 
        return null;
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
    if (expandedSection === section) {
      setExpandedSection('');
    } else {
      setExpandedSection(section);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 max-w-4xl mx-auto">
      {/* Header */}
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

      {/* Summary */}
      <div className="bg-blue-50 p-4 rounded-lg mb-6 border border-blue-100">
        <h2 className="text-lg font-semibold text-blue-800 mb-2">Health Summary</h2>
        <p className="text-blue-700">{data.summary}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200 mb-6">
        <button 
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'blood' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('blood')}
        >
          Blood Markers ({bloodStats.total})
        </button>
        <button 
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'dna' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('dna')}
        >
          DNA Traits ({dnaStats.total})
        </button>
        <button 
          className={`py-2 px-4 font-medium text-sm ${activeTab === 'recommendations' ? 'text-blue-600 border-b-2 border-blue-500' : 'text-gray-500 hover:text-gray-700'}`}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>

      {/* Blood Markers Content */}
      {activeTab === 'blood' && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {data.blood_markers.map((marker, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getCategoryColor(marker.category)}`}>
              <div className="flex justify-between items-start">
                <div className="flex items-center">
                  {getCategoryIcon(marker.category)}
                  <h3 className="font-medium ml-2">{marker.marker_name}</h3>
                </div>
                <span className={`font-semibold ${getStatusColor(marker.status)}`}>
                  {marker.status}
                </span>
              </div>
              <p className="mt-2 text-sm">{marker.insight}</p>
            </div>
          ))}
        </div>
      )}

      {/* DNA Traits Content */}
      {activeTab === 'dna' && (
        <div className="space-y-4">
          {data.dna_traits.map((trait, index) => (
            <div key={index} className={`p-4 rounded-lg border ${getCategoryColor(trait.category)}`}>
              <div className="flex justify-between items-start">
                <div>
                  <div className="flex items-center">
                    {getCategoryIcon(trait.category)}
                    <h3 className="font-medium ml-2">{trait.trait_name}</h3>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">RSID: {trait.rsid}</p>
                </div>
              </div>
              <p className="mt-2 text-sm">{trait.insight}</p>
              <p className="mt-1 text-xs text-gray-600">{trait.effect}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations Content */}
      {activeTab === 'recommendations' && (
        <div className="space-y-4">
          {Object.entries(data.recommendations).map(([category, items]) => (
            <div key={category} className="border border-gray-200 rounded-lg overflow-hidden">
              <div 
                className="flex justify-between items-center p-4 bg-gray-50 cursor-pointer"
                onClick={() => toggleSection(category)}
              >
                <h3 className="font-medium text-gray-800">{category}</h3>
                {expandedSection === category ? 
                  <ChevronUp className="w-5 h-5 text-gray-500" /> : 
                  <ChevronDown className="w-5 h-5 text-gray-500" />
                }
              </div>
              {expandedSection === category && (
                <div className="p-4 bg-white">
                  <ul className="list-disc pl-5 space-y-2">
                    {Array.isArray(items) ? items.map((item, i) => (
                      <li key={i} className="text-gray-700">{item}</li>
                    )) : (
                      Object.entries(items).map(([subCategory, subItems], i) => (
                        <div key={i}>
                          <h4 className="font-medium">{subCategory}</h4>
                          <ul className="list-disc pl-5 space-y-1 mt-1">
                            {subItems.map((item, j) => (
                              <li key={j} className="text-gray-700">{item}</li>
                            ))}
                          </ul>
                        </div>
                      ))
                    )}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Health Score Card */}
      <div className="mt-8 p-4 bg-gradient-to-r from-blue-500 to-blue-700 rounded-lg text-white flex justify-between items-center">
        <div>
          <h3 className="font-bold text-lg">Cardiovascular Health Score</h3>
          <p className="text-blue-100">Based on {bloodStats.total} blood markers and {dnaStats.total} genetic traits</p>
        </div>
        <div className="text-center">
          <div className="text-4xl font-bold">
            {Math.round((bloodStats.strength + dnaStats.strength) / (bloodStats.total + dnaStats.total) * 100)}%
          </div>
          <div className="text-sm text-blue-100">Health Score</div>
        </div>
      </div>
    </div>
  );
}