import { useState } from 'react';
import { Heart, AlertCircle, CheckCircle, AlertTriangle, ChevronDown, ChevronUp, Utensils, Capsule, Dumbbell, Smile } from 'lucide-react';

export default function CardiovascularInsightsPage() {
  const [activeTab, setActiveTab] = useState('blood');
  const [expandedSection, setExpandedSection] = useState('risk');

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
  const healthScore = Math.round((
    data.blood_markers.filter(m => m.category === 'strength').length +
    data.dna_traits.filter(t => t.category === 'strength').length
  ) / (
    data.blood_markers.length + data.dna_traits.length
  ) * 100);

  const allMarkers = [...data.blood_markers, ...data.dna_traits.map(trait => ({
    marker_name: trait.trait_name,
    status: '',
    category: trait.category,
    insight: trait.insight,
    rsid: trait.rsid,
    effect: trait.effect
  }))];

  const grouped = {
    strength: allMarkers.filter(m => m.category === 'strength'),
    warning: allMarkers.filter(m => m.category === 'warning'),
    risk: allMarkers.filter(m => m.category === 'risk')
  };

  const getColor = (category) => {
    switch (category) {
      case 'strength': return '#DCFCE7';
      case 'warning': return '#FEF3C7';
      case 'risk': return '#FEE2E2';
    }
  };

  const getStatusStyle = (status) => {
    switch (status) {
      case 'Normal': return { color: '#059669' };
      case 'High': return { color: '#DC2626' };
      case 'Low': return { color: '#2563EB' };
      default: return { color: '#1F2937' };
    }
  };

  const getIcon = (category) => {
    switch (category) {
      case 'strength': return <CheckCircle style={{ color: '#16A34A', width: 16, height: 16, marginRight: 6 }} />;
      case 'warning': return <AlertTriangle style={{ color: '#D97706', width: 16, height: 16, marginRight: 6 }} />;
      case 'risk': return <AlertCircle style={{ color: '#DC2626', width: 16, height: 16, marginRight: 6 }} />;
    }
  };

  const recIcons = {
    Diet: <Utensils style={{ width: 16, height: 16, marginRight: 6 }} />,
    Supplementation: <Capsule style={{ width: 16, height: 16, marginRight: 6 }} />,
    Exercise: <Dumbbell style={{ width: 16, height: 16, marginRight: 6 }} />,
    Lifestyle: <Smile style={{ width: 16, height: 16, marginRight: 6 }} />
  };

  return (
    <div style={{ maxWidth: '900px', margin: '2rem auto', padding: '1rem', background: '#fff', borderRadius: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Heart style={{ color: '#EF4444', width: 28, height: 28, marginRight: 8 }} />
          <h2 style={{ fontSize: 22, fontWeight: 600 }}>Cardiovascular Health</h2>
        </div>
        <div style={{ background: '#3B82F6', color: 'white', padding: '8px 12px', borderRadius: 16, fontWeight: 'bold' }}>{healthScore}%</div>
      </div>

      <div style={{ background: '#EFF6FF', padding: '12px', borderRadius: 6, marginBottom: 16, border: '1px solid #DBEAFE' }}>
        <strong style={{ color: '#1E40AF' }}>Health Summary:</strong>
        <p style={{ color: '#1E3A8A', margin: 0 }}>{data.summary}</p>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        <button onClick={() => setActiveTab('blood')} style={{ padding: '6px 12px', borderRadius: 6, border: activeTab === 'blood' ? '2px solid #2563EB' : '1px solid #D1D5DB', background: activeTab === 'blood' ? '#E0F2FE' : '#F9FAFB' }}>Blood Markers</button>
        <button onClick={() => setActiveTab('dna')} style={{ padding: '6px 12px', borderRadius: 6, border: activeTab === 'dna' ? '2px solid #2563EB' : '1px solid #D1D5DB', background: activeTab === 'dna' ? '#E0F2FE' : '#F9FAFB' }}>DNA Traits</button>
        <button onClick={() => setActiveTab('recommendations')} style={{ padding: '6px 12px', borderRadius: 6, border: activeTab === 'recommendations' ? '2px solid #2563EB' : '1px solid #D1D5DB', background: activeTab === 'recommendations' ? '#E0F2FE' : '#F9FAFB' }}>Recommendations</button>
      </div>

      {(activeTab === 'blood' || activeTab === 'dna') && (
        ['risk', 'warning', 'strength'].map((cat) => (
          <div key={cat} style={{ marginBottom: 16, background: getColor(cat), borderRadius: 6, border: '1px solid #E5E7EB' }}>
            <div onClick={() => setExpandedSection(expandedSection === cat ? '' : cat)} style={{ padding: '12px', fontWeight: 600, cursor: 'pointer', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center' }}>{getIcon(cat)} {cat.charAt(0).toUpperCase() + cat.slice(1)} Markers ({grouped[cat].length})</div>
              {expandedSection === cat ? <ChevronUp /> : <ChevronDown />}
            </div>
            {expandedSection === cat && (
              <div style={{ padding: '0 16px 12px' }}>
                {grouped[cat].map((m, idx) => (
                  <div key={idx} style={{ marginBottom: 12 }}>
                    <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                      <div>{m.marker_name}</div>
                      <div style={{ ...getStatusStyle(m.status) }}>{m.status}</div>
                    </div>
                    <div style={{ fontSize: 14 }}>{m.insight}</div>
                    {m.rsid && <div style={{ fontSize: 12, color: '#6B7280' }}>RSID: {m.rsid}</div>}
                    {m.effect && <div style={{ fontSize: 12, color: '#4B5563' }}>{m.effect}</div>}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))
      )}

      {activeTab === 'recommendations' && Object.entries(data.recommendations).map(([section, list], i) => (
        <div key={i} style={{ border: '1px solid #E5E7EB', borderRadius: 6, marginBottom: 12 }}>
          <div onClick={() => setExpandedSection(expandedSection === section ? '' : section)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px', background: '#F9FAFB', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center' }}>{recIcons[section] || null}<strong>{section}</strong></div>
            {expandedSection === section ? <ChevronUp /> : <ChevronDown />}
          </div>
          {expandedSection === section && (
            <ul style={{ padding: '0 16px 12px 32px', margin: 0 }}>
              {list.map((item, idx) => <li key={idx} style={{ marginBottom: 6 }}>{item}</li>)}
            </ul>
          )}
        </div>
      ))}
    </div>
  );
}
