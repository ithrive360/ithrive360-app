import { useState } from 'react';
import { Heart, AlertCircle, CheckCircle, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react';

export default function CardiovascularInsightsPage() {
  const [activeTab, setActiveTab] = useState('blood');
  const [expandedSection, setExpandedSection] = useState('');

  const data = { 
    "health_area":"Cardiovascular Health",
    "summary":"The user's cardiovascular health profile indicates some areas of risk, particularly in cholesterol and inflammation markers, with certain genetic predispositions also contributing to cardiovascular risk.",
    "blood_markers":[
       {
          "marker_name":"Triglycerides",
          "status":"Normal",
          "category":"strength",
          "insight":"Triglycerides are within the normal range, supporting cardiovascular health."
       },
       {
          "marker_name":"Total Cholesterol",
          "status":"High",
          "category":"risk",
          "insight":"Total cholesterol is elevated, which increases cardiovascular risk."
       },
       {
          "marker_name":"Non-HDL cholesterol",
          "status":"Normal",
          "category":"strength",
          "insight":"Non-HDL cholesterol is within the normal range, reducing cardiovascular risk."
       },
       {
          "marker_name":"CRP (hsCRP)",
          "status":"Normal",
          "category":"strength",
          "insight":"Normal CRP levels suggest low inflammation and cardiovascular risk."
       },
       {
          "marker_name":"LDL-C",
          "status":"Normal",
          "category":"strength",
          "insight":"LDL cholesterol is within normal limits, which is protective for heart health."
       },
       {
          "marker_name":"HDL-C",
          "status":"Normal",
          "category":"strength",
          "insight":"HDL cholesterol is in the normal range, which is beneficial for cardiovascular health."
       },
       {
          "marker_name":"ApoB",
          "status":"Normal",
          "category":"strength",
          "insight":"ApoB is within the normal range, indicating a lower risk of cardiovascular disease."
       },
       {
          "marker_name":"Lipoprotein (a)",
          "status":"Normal",
          "category":"strength",
          "insight":"Lipoprotein (a) is within the normal range, reducing cardiovascular risk."
       },
       {
          "marker_name":"Homocysteine",
          "status":"Normal",
          "category":"strength",
          "insight":"Homocysteine levels are normal, reducing cardiovascular risk."
       },
       {
          "marker_name":"Fibrinogen",
          "status":"High",
          "category":"risk",
          "insight":"High fibrinogen levels indicate increased risk of thrombosis and cardiovascular events."
       },
       {
          "marker_name":"D-Dimer",
          "status":"Normal",
          "category":"strength",
          "insight":"Normal D-Dimer levels suggest low coagulation activity and cardiovascular risk."
       },
       {
          "marker_name":"NT-proBNP",
          "status":"Normal",
          "category":"strength",
          "insight":"Normal NT-proBNP levels indicate low risk of heart failure."
       },
       {
          "marker_name":"Troponin (high sensitivity)",
          "status":"Low",
          "category":"strength",
          "insight":"Low troponin levels suggest no current cardiac injury."
       },
       {
          "marker_name":"Vitamin D (25-OH)",
          "status":"Normal",
          "category":"strength",
          "insight":"Adequate Vitamin D levels support cardiovascular health."
       },
       {
          "marker_name":"Uric Acid",
          "status":"Normal",
          "category":"strength",
          "insight":"Normal uric acid levels are beneficial for heart health."
       },
       {
          "marker_name":"Blood Pressure",
          "status":"Normal",
          "category":"strength",
          "insight":"Blood pressure is within the normal range, reducing cardiovascular risk."
       },
       {
          "marker_name":"Myeloperoxidase (MPO)",
          "status":"Normal",
          "category":"strength",
          "insight":"MPO levels are within the normal range, indicating low oxidative stress."
       },
       {
          "marker_name":"OxLDL",
          "status":"Normal",
          "category":"strength",
          "insight":"Low oxLDL levels suggest reduced risk of atherosclerosis."
       },
       {
          "marker_name":"Lp-PLA2",
          "status":"Normal",
          "category":"strength",
          "insight":"Lp-PLA2 is within the normal range, indicating low inflammatory activity in arteries."
       }
    ],
    "dna_traits":[
       {
          "trait_name":"Homocysteine / CVD Risk",
          "rsid":"rs1801133",
          "effect":"Homocysteine metabolism impacting cardiovascular risk",
          "category":"risk",
          "insight":"This genetic trait may increase cardiovascular risk due to impaired homocysteine metabolism."
       },
       {
          "trait_name":"Blood Pressure Regulation",
          "rsid":"rs5063",
          "effect":"Peptide hormone affecting blood pressure regulation",
          "category":"warning",
          "insight":"Genetic predisposition may affect blood pressure regulation, requiring monitoring."
       },
       {
          "trait_name":"Cholesterol Metabolism",
          "rsid":"rs11591147",
          "effect":"Lower LDL cholesterol levels, reduced cardiovascular risk",
          "category":"strength",
          "insight":"This genetic variant is associated with lower LDL cholesterol, reducing cardiovascular risk."
       },
       {
          "trait_name":"Triglyceride Metabolism",
          "rsid":"rs2131925",
          "effect":"Triglyceride metabolism dysregulation",
          "category":"risk",
          "insight":"This variant may lead to dysregulated triglyceride levels, increasing CVD risk."
       },
       {
          "trait_name":"LDL cholesterol Regulation",
          "rsid":"rs646776",
          "effect":"Regulates LDL cholesterol levels",
          "category":"strength",
          "insight":"Genetic trait supports effective LDL cholesterol regulation, benefiting cardiovascular health."
       },
       {
          "trait_name":"Inflammation / CVD Risk",
          "rsid":"rs1205",
          "effect":"Inflammatory marker linked to CVD events",
          "category":"risk",
          "insight":"This genetic makeup is associated with increased inflammation and cardiovascular risk."
       },
       {
          "trait_name":"Blood Pressure Regulation",
          "rsid":"rs699",
          "effect":"Regulation of angiotensinogen pathway and hypertension",
          "category":"risk",
          "insight":"Genetic predisposition increases risk of hypertension through angiotensinogen pathway."
       },
       {
          "trait_name":"Cholesterol Metabolism",
          "rsid":"rs693",
          "effect":"Associated with lipid metabolism and LDL cholesterol levels",
          "category":"warning",
          "insight":"This variant may slightly alter cholesterol metabolism, warranting monitoring."
       },
       {
          "trait_name":"Salt Sensitivity",
          "rsid":"rs4961",
          "effect":"Sodium retention leading to blood pressure elevation",
          "category":"risk",
          "insight":"Genetic trait increases risk of hypertension due to salt sensitivity."
       },
       {
          "trait_name":"Statin Response / Cholesterol Synthesis",
          "rsid":"rs17238540",
          "effect":"Influences statin response and cholesterol biosynthesis",
          "category":"warning",
          "insight":"This trait may affect response to statins, requiring personalized treatment."
       },
       {
          "trait_name":"Vascular Response",
          "rsid":"rs1042713",
          "effect":"Regulates vascular tone and blood pressure response",
          "category":"warning",
          "insight":"Genetic variant may impact vascular tone, influencing blood pressure regulation."
       },
       {
          "trait_name":"Inflammation / Atherosclerosis",
          "rsid":"rs1800629",
          "effect":"Inflammation and atherosclerosis risk elevation",
          "category":"risk",
          "insight":"Increased risk of inflammation and atherosclerosis due to genetic predisposition."
       },
       {
          "trait_name":"Atherosclerosis Risk",
          "rsid":"rs1051931",
          "effect":"Inflammatory mediator affecting atherosclerosis risk",
          "category":"risk",
          "insight":"Genetic variant increases the risk of atherosclerosis through inflammation."
       },
       {
          "trait_name":"Lp(a) / CVD Risk",
          "rsid":"rs10455872",
          "effect":"Elevated Lp(a) associated with cardiovascular disease risk",
          "category":"risk",
          "insight":"Elevated Lp(a) due to genetic trait increases cardiovascular disease risk."
       },
       {
          "trait_name":"Inflammation / CVD Risk",
          "rsid":"rs1800795",
          "effect":"Elevated inflammatory cytokine increasing CVD risk",
          "category":"risk",
          "insight":"Genetic predisposition to higher inflammation levels elevates CVD risk."
       },
       {
          "trait_name":"Triglyceride Metabolism",
          "rsid":"rs328",
          "effect":"Associated with triglyceride metabolism and lipid transport",
          "category":"warning",
          "insight":"Potential for altered triglyceride metabolism requiring monitoring."
       },
       {
          "trait_name":"Aldosterone Regulation",
          "rsid":"rs1799998",
          "effect":"Aldosterone synthesis and salt retention regulation",
          "category":"risk",
          "insight":"Genetic predisposition affects aldosterone regulation, influencing blood pressure."
       },
       {
          "trait_name":"Heart Disease Risk (Chromosome 9p21)",
          "rsid":"rs4977574",
          "effect":"Strongly associated with coronary heart disease",
          "category":"risk",
          "insight":"Strong genetic association with increased risk of coronary heart disease."
       },
       {
          "trait_name":"Myocardial Infarction Risk",
          "rsid":"rs1746048",
          "effect":"Associated with myocardial infarction susceptibility",
          "category":"risk",
          "insight":"Increased susceptibility to myocardial infarction due to genetic variant."
       },
       {
          "trait_name":"Vascular Smooth Muscle / Atherosclerosis",
          "rsid":"rs974819",
          "effect":"Involved in vascular remodeling and atherosclerosis",
          "category":"risk",
          "insight":"Genetic variant is linked to increased risk of atherosclerosis."
       },
       {
          "trait_name":"Triglyceride Metabolism",
          "rsid":"rs662799",
          "effect":"Higher triglyceride levels and CVD risk",
          "category":"risk",
          "insight":"Genetic variant is associated with higher triglyceride levels, increasing CVD risk."
       },
       {
          "trait_name":"Hypertension Risk",
          "rsid":"rs5443",
          "effect":"Increased risk of hypertension via G protein signaling",
          "category":"risk",
          "insight":"Genetic predisposition increases risk of hypertension through G protein signaling."
       },
       {
          "trait_name":"Blood Pressure & Heart Disease",
          "rsid":"rs3184504",
          "effect":"Blood pressure regulation and cardiovascular risk",
          "category":"warning",
          "insight":"Potential impact on blood pressure regulation, requiring monitoring."
       },
       {
          "trait_name":"HDL Clearance",
          "rsid":"rs5888",
          "effect":"Reduced HDL clearance efficiency",
          "category":"warning",
          "insight":"Genetic trait may affect HDL clearance, impacting cardiovascular health."
       },
       {
          "trait_name":"Hypertension",
          "rsid":"rs2895811",
          "effect":"Associated with blood pressure and hypertension",
          "category":"risk",
          "insight":"Increased risk of hypertension due to genetic predisposition."
       },
       {
          "trait_name":"HDL Metabolism",
          "rsid":"rs1800588",
          "effect":"Altered HDL metabolism impacting cardiovascular risk",
          "category":"risk",
          "insight":"Genetic variant may negatively impact HDL metabolism, increasing cardiovascular risk."
       },
       {
          "trait_name":"Nicotine Response / Heart Risk",
          "rsid":"rs1051730",
          "effect":"Nicotine dependence and heart disease risk",
          "category":"risk",
          "insight":"Increased risk of heart disease due to nicotine dependence trait."
       },
       {
          "trait_name":"HDL Regulation",
          "rsid":"rs708272",
          "effect":"Reduced HDL cholesterol concentrations",
          "category":"risk",
          "insight":"Genetic predisposition to lower HDL cholesterol levels, increasing cardiovascular risk."
       },
       {
          "trait_name":"Cholesterol Metabolism",
          "rsid":"rs688",
          "effect":"Impaired cholesterol uptake and increased LDL-C",
          "category":"risk",
          "insight":"This genetic variant is associated with impaired cholesterol uptake, increasing LDL-C levels."
       },
       {
          "trait_name":"Cholesterol Transport",
          "rsid":"rs429358",
          "effect":"Cholesterol transport and APOE4-associated Alzheimer's risk",
          "category":"risk",
          "insight":"Genetic trait affects cholesterol transport, linked with APOE4 and cardiovascular risk."
       },
       {
          "trait_name":"Cholesterol Transport",
          "rsid":"rs7412",
          "effect":"Cholesterol transport; protective effect with E2 variant",
          "category":"strength",
          "insight":"This variant provides a protective effect in cholesterol transport, reducing cardiovascular risk."
       }
    ],
    "recommendations":{
       "Diet":[
          "Reduce intake of saturated fats to help lower total cholesterol levels.",
          "Increase consumption of omega-3 rich foods like fish to support heart health.",
          "Limit sodium intake to manage blood pressure effectively."
       ],
       "Supplementation":[
          "Consider taking omega-3 supplements to manage triglyceride levels.",
          "Ensure adequate intake of vitamin B6, B12, and folate to support homocysteine metabolism."
       ],
       "Exercise":[
          "Engage in regular aerobic exercise, such as brisk walking or cycling, for at least 150 minutes per week to improve cardiovascular health.",
          "Incorporate strength training exercises twice a week to enhance cardiovascular function and overall fitness."
       ],
       "Lifestyle":[
          "Manage stress through mindfulness practices like meditation or yoga to support heart health.",
          "Avoid smoking and excessive alcohol consumption to reduce cardiovascular risk.",
          "Monitoring"
       ]
          [
             "Regularly monitor blood pressure and lipid profiles to keep track of cardiovascular health status.",
             "Consult a healthcare provider for personalized assessment and management of genetic risk factors."
          ]
       }
 };

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
