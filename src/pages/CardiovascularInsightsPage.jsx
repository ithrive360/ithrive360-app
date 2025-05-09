import { useState } from 'react';
import {
  Heart, AlertCircle, CheckCircle, AlertTriangle,
  ChevronDown, ChevronUp, Utensils, Pill, Dumbbell, Smile
} from 'lucide-react';

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
      },
      {
        "trait_name": "Inflammation / CVD Risk",
        "rsid": "rs1205",
        "effect": "Inflammatory marker linked to CVD events",
        "category": "risk",
        "insight": "This genetic makeup is associated with increased inflammation and cardiovascular risk."
      },
      {
        "trait_name": "Blood Pressure Regulation",
        "rsid": "rs699",
        "effect": "Regulation of angiotensinogen pathway and hypertension",
        "category": "risk",
        "insight": "Genetic predisposition increases risk of hypertension through angiotensinogen pathway."
      },
      {
        "trait_name": "Cholesterol Metabolism",
        "rsid": "rs693",
        "effect": "Associated with lipid metabolism and LDL cholesterol levels",
        "category": "warning",
        "insight": "This variant may slightly alter cholesterol metabolism, warranting monitoring."
      },
      {
        "trait_name": "Salt Sensitivity",
        "rsid": "rs4961",
        "effect": "Sodium retention leading to blood pressure elevation",
        "category": "risk",
        "insight": "Genetic trait increases risk of hypertension due to salt sensitivity."
      },
      {
        "trait_name": "Statin Response / Cholesterol Synthesis",
        "rsid": "rs17238540",
        "effect": "Influences statin response and cholesterol biosynthesis",
        "category": "warning",
        "insight": "This trait may affect response to statins, requiring personalized treatment."
      },
      {
        "trait_name": "Vascular Response",
        "rsid": "rs1042713",
        "effect": "Regulates vascular tone and blood pressure response",
        "category": "warning",
        "insight": "Genetic variant may impact vascular tone, influencing blood pressure regulation."
      },
      {
        "trait_name": "Inflammation / Atherosclerosis",
        "rsid": "rs1800629",
        "effect": "Inflammation and atherosclerosis risk elevation",
        "category": "risk",
        "insight": "Increased risk of inflammation and atherosclerosis due to genetic predisposition."
      },
      {
        "trait_name": "Atherosclerosis Risk",
        "rsid": "rs1051931",
        "effect": "Inflammatory mediator affecting atherosclerosis risk",
        "category": "risk",
        "insight": "Genetic variant increases the risk of atherosclerosis through inflammation."
      },
      {
        "trait_name": "Lp(a) / CVD Risk",
        "rsid": "rs10455872",
        "effect": "Elevated Lp(a) associated with cardiovascular disease risk",
        "category": "risk",
        "insight": "Elevated Lp(a) due to genetic trait increases cardiovascular disease risk."
      },
      {
        "trait_name": "Inflammation / CVD Risk",
        "rsid": "rs1800795",
        "effect": "Elevated inflammatory cytokine increasing CVD risk",
        "category": "risk",
        "insight": "Genetic predisposition to higher inflammation levels elevates CVD risk."
      },
      {
        "trait_name": "Triglyceride Metabolism",
        "rsid": "rs328",
        "effect": "Associated with triglyceride metabolism and lipid transport",
        "category": "warning",
        "insight": "Potential for altered triglyceride metabolism requiring monitoring."
      },
      {
        "trait_name": "Aldosterone Regulation",
        "rsid": "rs1799998",
        "effect": "Aldosterone synthesis and salt retention regulation",
        "category": "risk",
        "insight": "Genetic predisposition affects aldosterone regulation, influencing blood pressure."
      },
      {
        "trait_name": "Heart Disease Risk (Chromosome 9p21)",
        "rsid": "rs4977574",
        "effect": "Strongly associated with coronary heart disease",
        "category": "risk",
        "insight": "Strong genetic association with increased risk of coronary heart disease."
      },
      {
        "trait_name": "Myocardial Infarction Risk",
        "rsid": "rs1746048",
        "effect": "Associated with myocardial infarction susceptibility",
        "category": "risk",
        "insight": "Increased susceptibility to myocardial infarction due to genetic variant."
      },
      {
        "trait_name": "Vascular Smooth Muscle / Atherosclerosis",
        "rsid": "rs974819",
        "effect": "Involved in vascular remodeling and atherosclerosis",
        "category": "risk",
        "insight": "Genetic variant is linked to increased risk of atherosclerosis."
      },
      {
        "trait_name": "Triglyceride Metabolism",
        "rsid": "rs662799",
        "effect": "Higher triglyceride levels and CVD risk",
        "category": "risk",
        "insight": "Genetic variant is associated with higher triglyceride levels, increasing CVD risk."
      },
      {
        "trait_name": "Hypertension Risk",
        "rsid": "rs5443",
        "effect": "Increased risk of hypertension via G protein signaling",
        "category": "risk",
        "insight": "Genetic predisposition increases risk of hypertension through G protein signaling."
      },
      {
        "trait_name": "Blood Pressure & Heart Disease",
        "rsid": "rs3184504",
        "effect": "Blood pressure regulation and cardiovascular risk",
        "category": "warning",
        "insight": "Potential impact on blood pressure regulation, requiring monitoring."
      },
      {
        "trait_name": "HDL Clearance",
        "rsid": "rs5888",
        "effect": "Reduced HDL clearance efficiency",
        "category": "warning",
        "insight": "Genetic trait may affect HDL clearance, impacting cardiovascular health."
      },
      {
        "trait_name": "Hypertension",
        "rsid": "rs2895811",
        "effect": "Associated with blood pressure and hypertension",
        "category": "risk",
        "insight": "Increased risk of hypertension due to genetic predisposition."
      },
      {
        "trait_name": "HDL Metabolism",
        "rsid": "rs1800588",
        "effect": "Altered HDL metabolism impacting cardiovascular risk",
        "category": "risk",
        "insight": "Genetic variant may negatively impact HDL metabolism, increasing cardiovascular risk."
      },
      {
        "trait_name": "Nicotine Response / Heart Risk",
        "rsid": "rs1051730",
        "effect": "Nicotine dependence and heart disease risk",
        "category": "risk",
        "insight": "Increased risk of heart disease due to nicotine dependence trait."
      },
      {
        "trait_name": "HDL Regulation",
        "rsid": "rs708272",
        "effect": "Reduced HDL cholesterol concentrations",
        "category": "risk",
        "insight": "Genetic predisposition to lower HDL cholesterol levels, increasing cardiovascular risk."
      },
      {
        "trait_name": "Cholesterol Metabolism",
        "rsid": "rs688",
        "effect": "Impaired cholesterol uptake and increased LDL-C",
        "category": "risk",
        "insight": "This genetic variant is associated with impaired cholesterol uptake, increasing LDL-C levels."
      },
      {
        "trait_name": "Cholesterol Transport",
        "rsid": "rs429358",
        "effect": "Cholesterol transport and APOE4-associated Alzheimer's risk",
        "category": "risk",
        "insight": "Genetic trait affects cholesterol transport, linked with APOE4 and cardiovascular risk."
      },
      {
        "trait_name": "Cholesterol Transport",
        "rsid": "rs7412",
        "effect": "Cholesterol transport; protective effect with E2 variant",
        "category": "strength",
        "insight": "This variant provides a protective effect in cholesterol transport, reducing cardiovascular risk."
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

  const bloodStats = {
    strength: data.blood_markers.filter(m => m.category === 'strength').length,
    warning: data.blood_markers.filter(m => m.category === 'warning').length,
    risk: data.blood_markers.filter(m => m.category === 'risk').length,
    total: data.blood_markers.length
  };

  const dnaStats = {
    strength: data.dna_traits.filter(m => m.category === 'strength').length,
    warning: data.dna_traits.filter(m => m.category === 'warning').length,
    risk: data.dna_traits.filter(m => m.category === 'risk').length,
    total: data.dna_traits.length
  };

  const sorted = (arr) => [...arr].sort((a, b) =>
    ['risk', 'warning', 'strength'].indexOf(a.category) -
    ['risk', 'warning', 'strength'].indexOf(b.category)
  );

  const getCategoryIcon = (cat) => {
    const size = 24;
    const style = { width: size, height: size };
    if (cat === 'strength') return <CheckCircle style={{ ...style, color: '#10B981' }} />;
    if (cat === 'warning') return <AlertTriangle style={{ ...style, color: '#F59E0B' }} />;
    if (cat === 'risk') return <AlertCircle style={{ ...style, color: '#EF4444' }} />;
    return null;
  };

  const getCategoryStyle = (cat) => {
    if (cat === 'strength') return { backgroundColor: '#DCFCE7', color: '#166534', border: '1px solid #BBF7D0' };
    if (cat === 'warning') return { backgroundColor: '#FEF3C7', color: '#92400E', border: '1px solid #FDE68A' };
    if (cat === 'risk') return { backgroundColor: '#FEE2E2', color: '#991B1B', border: '1px solid #FECACA' };
    return { backgroundColor: '#F3F4F6', color: '#1F2937', border: '1px solid #E5E7EB' };
  };

  // ✅ Updated to reflect category instead of raw status
  const getStatusStyle = (status, category) => {
    if (category === 'strength') return { color: '#059669' }; // green
    if (category === 'warning') return { color: '#F59E0B' };  // amber
    if (category === 'risk') return { color: '#DC2626' };     // red
    return { color: '#4B5563' };
  };

  const getRecIcon = (title) => {
    const icons = {
      Diet: <Utensils style={{ width: 20, height: 20, marginRight: 8, color: '#4B5563' }} />,
      Supplementation: <Pill style={{ width: 20, height: 20, marginRight: 8, color: '#4B5563' }} />,
      Exercise: <Dumbbell style={{ width: 20, height: 20, marginRight: 8, color: '#4B5563' }} />,
      Lifestyle: <Smile style={{ width: 20, height: 20, marginRight: 8, color: '#4B5563' }} />
    };
    return icons[title] || null;
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? '' : section);
  };

  const healthScore = Math.round((bloodStats.strength + dnaStats.strength) / (bloodStats.total + dnaStats.total) * 100);

  return (
    <div style={{ fontFamily: "'Segoe UI', Tahoma, sans-serif", padding: '32px 24px', maxWidth: '1100px', margin: '0 auto', backgroundColor: 'white' }}>
      {/* HEADER */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ display: 'flex', alignItems: 'center', marginBottom: 12 }}>
          <Heart style={{ color: '#EF4444', width: 32, height: 32, marginRight: 12 }} />
          <h1 style={{ fontSize: 24, fontWeight: 'bold', color: '#1F2937' }}>Cardiovascular Health</h1>
        </div>
        <div style={{ display: 'flex', gap: 8, marginLeft: 44 }}>
          <span style={{ backgroundColor: '#DCFCE7', color: '#166534', display: 'flex', alignItems: 'center', borderRadius: '9999px', padding: '6px 12px', fontWeight: 600, fontSize: 14 }}>
            <CheckCircle style={{ width: 18, height: 18, marginRight: 6 }} />
            {bloodStats.strength + dnaStats.strength}
          </span>
          <span style={{ backgroundColor: '#FEF3C7', color: '#92400E', display: 'flex', alignItems: 'center', borderRadius: '9999px', padding: '6px 12px', fontWeight: 600, fontSize: 14 }}>
            <AlertTriangle style={{ width: 18, height: 18, marginRight: 6 }} />
            {bloodStats.warning + dnaStats.warning}
          </span>
          <span style={{ backgroundColor: '#FEE2E2', color: '#991B1B', display: 'flex', alignItems: 'center', borderRadius: '9999px', padding: '6px 12px', fontWeight: 600, fontSize: 14 }}>
            <AlertCircle style={{ width: 18, height: 18, marginRight: 6 }} />
            {bloodStats.risk + dnaStats.risk}
          </span>
        </div>
      </div>

      {/* SCORE */}
      <div style={{
        marginBottom: 24,
        padding: 16,
        background: 'linear-gradient(to right, #6366F1, #4F46E5)',
        borderRadius: 12,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        color: 'white'
      }}>
        <div>
          <h3 style={{ fontWeight: 'bold', fontSize: 18 }}>Cardiovascular Health Score</h3>
          <p style={{ fontSize: 14, marginTop: 4 }}>
            Based on {bloodStats.total} blood markers and {dnaStats.total} genetic traits
          </p>
        </div>
        <div style={{
          width: 80,
          height: 80,
          borderRadius: '50%',
          background: `conic-gradient(#93C5FD ${healthScore}%, #312E81 ${healthScore}%)`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: 22,
          fontWeight: 'bold',
          color: '#FFFFFF',
        }}>
          {healthScore}%
        </div>
      </div>

      {/* SUMMARY */}
      <div style={{ backgroundColor: '#EFF6FF', padding: 16, borderRadius: 8, border: '1px solid #DBEAFE', marginBottom: 24 }}>
        <h2 style={{ fontSize: 18, fontWeight: 600, color: '#1E40AF', marginBottom: 8 }}>Health Summary</h2>
        <p style={{ color: '#1E3A8A' }}>{data.summary}</p>
      </div>

      {/* TABS */}
      <div style={{ display: 'flex', marginBottom: 24 }}>
        {['blood', 'dna', 'recommendations'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              padding: '10px 16px',
              fontSize: 14,
              fontWeight: 500,
              cursor: 'pointer',
              border: 'none',
              borderRadius: '8px 8px 0 0',
              backgroundColor: activeTab === tab ? '#2563EB' : '#F3F4F6',
              color: activeTab === tab ? '#FFFFFF' : '#4B5563',
              marginRight: 8
            }}
          >
            {tab === 'blood' && `Blood Markers (${bloodStats.total})`}
            {tab === 'dna' && `DNA Traits (${dnaStats.total})`}
            {tab === 'recommendations' && 'Recommendations'}
          </button>
        ))}
      </div>

      {/* BLOOD MARKERS */}
      {activeTab === 'blood' && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 24 }}>
          {sorted(data.blood_markers).map((marker, idx) => (
            <div key={idx} style={{ ...getCategoryStyle(marker.category), padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center' }}>
                  {getCategoryIcon(marker.category)}
                  <h3 style={{ fontWeight: 600, fontSize: 16, marginLeft: 8 }}>{marker.marker_name}</h3>
                </div>
                {/* ✅ status style based on category */}
                <span style={{ fontWeight: 600, ...getStatusStyle(marker.status, marker.category) }}>
                  {marker.status}
                </span>
              </div>
              <p style={{ fontSize: 14, marginTop: 8 }}>{marker.insight}</p>
            </div>
          ))}
        </div>
      )}

      {/* DNA TRAITS */}
      {activeTab === 'dna' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {sorted(data.dna_traits).map((trait, idx) => (
            <div key={idx} style={{ ...getCategoryStyle(trait.category), padding: 16, borderRadius: 8 }}>
              <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
                {getCategoryIcon(trait.category)}
                <h3 style={{ fontWeight: 600, fontSize: 16, marginLeft: 8 }}>{trait.trait_name}</h3>
              </div>
              <p style={{ fontSize: 12, color: '#6B7280' }}>RSID: {trait.rsid}</p>
              <p style={{ fontSize: 14, marginTop: 8 }}>{trait.insight}</p>
              <p style={{ fontSize: 12, color: '#4B5563', marginTop: 4 }}>{trait.effect}</p>
            </div>
          ))}
        </div>
      )}

      {/* RECOMMENDATIONS */}
      {activeTab === 'recommendations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {Object.entries(data.recommendations).map(([title, items]) => (
            <div key={title} style={{ border: '1px solid #E5E7EB', borderRadius: 8, overflow: 'hidden' }}>
              <div onClick={() => toggleSection(title)} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: 16, backgroundColor: '#F9FAFB', cursor: 'pointer' }}>
              <h3 style={{display: 'flex',alignItems: 'center',fontWeight: 500,color: '#1F2937'}} >
                  {getRecIcon(title)} {title}
                </h3>
                {expandedSection === title ? <ChevronUp style={{ width: 20, height: 20, color: '#6B7280' }} /> : <ChevronDown style={{ width: 20, height: 20, color: '#6B7280' }} />}
              </div>
              {expandedSection === title && (
                <div style={{ padding: 16, backgroundColor: '#FFFFFF' }}>
                  <ul style={{ paddingLeft: 20, marginTop: 8 }}>
                    {items.map((item, i) => (
                      <li key={i} style={{ margin: '8px 0', color: '#4B5563' }}>{item}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
