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
        return <CheckCircle style={{ width: '20px', height: '20px', color: '#10B981' }} />;
      case 'warning': 
        return <AlertTriangle style={{ width: '20px', height: '20px', color: '#F59E0B' }} />;
      case 'risk': 
        return <AlertCircle style={{ width: '20px', height: '20px', color: '#EF4444' }} />;
      default: 
        return null;
    }
  };
  
  const getCategoryStyle = (category) => {
    switch(category) {
      case 'strength': 
        return { 
          backgroundColor: '#DCFCE7', 
          color: '#166534', 
          border: '1px solid #BBF7D0' 
        };
      case 'warning': 
        return { 
          backgroundColor: '#FEF3C7', 
          color: '#92400E', 
          border: '1px solid #FDE68A' 
        };
      case 'risk': 
        return { 
          backgroundColor: '#FEE2E2', 
          color: '#991B1B', 
          border: '1px solid #FECACA' 
        };
      default: 
        return { 
          backgroundColor: '#F3F4F6', 
          color: '#1F2937', 
          border: '1px solid #E5E7EB' 
        };
    }
  };

  const getStatusStyle = (status) => {
    switch(status) {
      case 'Normal': return { color: '#059669' };
      case 'High': return { color: '#DC2626' };
      case 'Low': return { color: '#2563EB' };
      default: return { color: '#4B5563' };
    }
  };

  const toggleSection = (section) => {
    if (expandedSection === section) {
      setExpandedSection('');
    } else {
      setExpandedSection(section);
    }
  };

  const styles = {
    container: {
      backgroundColor: 'white',
      borderRadius: '8px',
      boxShadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
      padding: '24px',
      maxWidth: '900px',
      margin: '0 auto'
    },
    header: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      marginBottom: '24px'
    },
    titleContainer: {
      display: 'flex',
      alignItems: 'center'
    },
    heartIcon: {
      width: '32px',
      height: '32px',
      color: '#EF4444',
      marginRight: '12px'
    },
    title: {
      fontSize: '24px',
      fontWeight: 'bold',
      color: '#1F2937'
    },
    statsContainer: {
      display: 'flex',
      gap: '8px'
    },
    statBadge: {
      display: 'flex',
      alignItems: 'center',
      padding: '4px 12px',
      borderRadius: '9999px',
      fontSize: '14px',
      fontWeight: '500'
    },
    statIcon: {
      width: '16px',
      height: '16px',
      marginRight: '4px'
    },
    summary: {
      backgroundColor: '#EFF6FF',
      padding: '16px',
      borderRadius: '8px',
      marginBottom: '24px',
      border: '1px solid #DBEAFE'
    },
    summaryTitle: {
      fontSize: '18px',
      fontWeight: '600',
      color: '#1E40AF',
      marginBottom: '8px'
    },
    summaryText: {
      color: '#1E3A8A'
    },
    tabs: {
      display: 'flex',
      borderBottom: '1px solid #E5E7EB',
      marginBottom: '24px'
    },
    tab: {
      padding: '8px 16px',
      fontSize: '14px',
      fontWeight: '500',
      cursor: 'pointer',
      color: '#6B7280'
    },
    activeTab: {
      color: '#2563EB',
      borderBottom: '2px solid #2563EB'
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: '16px'
    },
    card: {
      padding: '16px',
      borderRadius: '8px'
    },
    cardHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start'
    },
    markerTitle: {
      display: 'flex',
      alignItems: 'center'
    },
    markerName: {
      fontWeight: '500',
      marginLeft: '8px'
    },
    insight: {
      marginTop: '8px',
      fontSize: '14px'
    },
    rsid: {
      fontSize: '12px',
      color: '#6B7280',
      marginTop: '4px'
    },
    effect: {
      fontSize: '12px',
      color: '#4B5563',
      marginTop: '4px'
    },
    recommendationSection: {
      border: '1px solid #E5E7EB',
      borderRadius: '8px',
      overflow: 'hidden',
      marginBottom: '16px'
    },
    recommendationHeader: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '16px',
      backgroundColor: '#F9FAFB',
      cursor: 'pointer'
    },
    recommendationTitle: {
      fontWeight: '500',
      color: '#1F2937'
    },
    recommendationContent: {
      padding: '16px',
      backgroundColor: 'white'
    },
    list: {
      paddingLeft: '20px',
      marginTop: '8px'
    },
    listItem: {
      margin: '8px 0',
      color: '#4B5563'
    },
    scoreCard: {
      marginTop: '32px',
      padding: '16px',
      background: 'linear-gradient(to right, #3B82F6, #1D4ED8)',
      borderRadius: '8px',
      color: 'white',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    scoreInfo: {
      fontSize: '14px',
      color: '#BFDBFE'
    },
    scoreDisplay: {
      textAlign: 'center'
    },
    scoreNumber: {
      fontSize: '36px',
      fontWeight: 'bold'
    },
    scoreLabel: {
      fontSize: '14px',
      color: '#BFDBFE'
    }
  };

  // Calculate the correct health score
  const healthScore = Math.round((bloodStats.strength + dnaStats.strength) / (bloodStats.total + dnaStats.total) * 100);

  return (
    <div style={styles.container}>
      {/* Header */}
      <div style={styles.header}>
        <div style={styles.titleContainer}>
          <Heart style={styles.heartIcon} />
          <h1 style={styles.title}>{data.health_area}</h1>
        </div>
        <div style={styles.statsContainer}>
          <span style={{
            ...styles.statBadge,
            backgroundColor: '#DCFCE7',
            color: '#166534'
          }}>
            <CheckCircle style={styles.statIcon} />
            {bloodStats.strength + dnaStats.strength} Strengths
          </span>
          <span style={{
            ...styles.statBadge,
            backgroundColor: '#FEF3C7',
            color: '#92400E'
          }}>
            <AlertTriangle style={styles.statIcon} />
            {bloodStats.warning + dnaStats.warning} Warnings
          </span>
          <span style={{
            ...styles.statBadge,
            backgroundColor: '#FEE2E2',
            color: '#991B1B'
          }}>
            <AlertCircle style={styles.statIcon} />
            {bloodStats.risk + dnaStats.risk} Risks
          </span>
        </div>
      </div>

      {/* Summary */}
      <div style={styles.summary}>
        <h2 style={styles.summaryTitle}>Health Summary</h2>
        <p style={styles.summaryText}>{data.summary}</p>
      </div>

      {/* Tabs */}
      <div style={styles.tabs}>
        <button 
          style={{
            ...styles.tab,
            ...(activeTab === 'blood' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('blood')}
        >
          Blood Markers ({bloodStats.total})
        </button>
        <button 
          style={{
            ...styles.tab,
            ...(activeTab === 'dna' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('dna')}
        >
          DNA Traits ({dnaStats.total})
        </button>
        <button 
          style={{
            ...styles.tab,
            ...(activeTab === 'recommendations' ? styles.activeTab : {})
          }}
          onClick={() => setActiveTab('recommendations')}
        >
          Recommendations
        </button>
      </div>

      {/* Blood Markers Content */}
      {activeTab === 'blood' && (
        <div style={styles.grid}>
          {data.blood_markers.map((marker, index) => (
            <div key={index} style={{
              ...styles.card,
              ...getCategoryStyle(marker.category)
            }}>
              <div style={styles.cardHeader}>
                <div style={styles.markerTitle}>
                  {getCategoryIcon(marker.category)}
                  <h3 style={styles.markerName}>{marker.marker_name}</h3>
                </div>
                <span style={{
                  fontWeight: '600',
                  ...getStatusStyle(marker.status)
                }}>
                  {marker.status}
                </span>
              </div>
              <p style={styles.insight}>{marker.insight}</p>
            </div>
          ))}
        </div>
      )}

      {/* DNA Traits Content */}
      {activeTab === 'dna' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {data.dna_traits.map((trait, index) => (
            <div key={index} style={{
              ...styles.card,
              ...getCategoryStyle(trait.category)
            }}>
              <div style={styles.cardHeader}>
                <div>
                  <div style={styles.markerTitle}>
                    {getCategoryIcon(trait.category)}
                    <h3 style={styles.markerName}>{trait.trait_name}</h3>
                  </div>
                  <p style={styles.rsid}>RSID: {trait.rsid}</p>
                </div>
              </div>
              <p style={styles.insight}>{trait.insight}</p>
              <p style={styles.effect}>{trait.effect}</p>
            </div>
          ))}
        </div>
      )}

      {/* Recommendations Content */}
      {activeTab === 'recommendations' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {Object.entries(data.recommendations).map(([category, items]) => (
            <div key={category} style={styles.recommendationSection}>
              <div 
                style={styles.recommendationHeader}
                onClick={() => toggleSection(category)}
              >
                <h3 style={styles.recommendationTitle}>{category}</h3>
                {expandedSection === category ? 
                  <ChevronUp style={{ width: '20px', height: '20px', color: '#6B7280' }} /> : 
                  <ChevronDown style={{ width: '20px', height: '20px', color: '#6B7280' }} />
                }
              </div>
              {expandedSection === category && (
                <div style={styles.recommendationContent}>
                  <ul style={styles.list}>
                    {Array.isArray(items) ? items.map((item, i) => (
                      <li key={i} style={styles.listItem}>{item}</li>
                    )) : (
                      Object.entries(items).map(([subCategory, subItems], i) => (
                        <div key={i}>
                          <h4 style={{ fontWeight: '500' }}>{subCategory}</h4>
                          <ul style={styles.list}>
                            {subItems.map((item, j) => (
                              <li key={j} style={styles.listItem}>{item}</li>
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

      {/* Health Score Card with correct calculation */}
      <div style={styles.scoreCard}>
        <div>
          <h3 style={{ fontWeight: 'bold', fontSize: '18px' }}>Cardiovascular Health Score</h3>
          <p style={styles.scoreInfo}>Based on {bloodStats.total} blood markers and {dnaStats.total} genetic traits</p>
        </div>
        <div style={styles.scoreDisplay}>
          <div style={styles.scoreNumber}>
            {healthScore}%
          </div>
          <div style={styles.scoreLabel}>Health Score</div>
        </div>
      </div>
    </div>
  );
}