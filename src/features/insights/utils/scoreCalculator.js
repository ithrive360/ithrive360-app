export function calculateInsightScore({ insight, bloodWeights, bloodRefs, dnaWeights, dnaRefs }) {
    let totalWeighted = 0;
    let totalWeight = 0;

    for (const m of insight.findings_json.blood_markers || []) {
        const weight = bloodWeights.find(w =>
            bloodRefs.find(r => r.marker_name === m.marker_name && r.blood_marker_id === w.blood_marker_id) &&
            w.health_area_id === insight.health_area_id
        )?.importance_weight || 1;

        // strength = 100%, warning = 50%, risk = 0%
        const score = m.category === 'strength' ? 1 : m.category === 'warning' ? 0.5 : 0;
        totalWeighted += weight * score;
        totalWeight += weight;
    }

    for (const t of insight.findings_json.dna_traits || []) {
        const weight = dnaWeights.find(w =>
            dnaRefs.find(r => r.trait === t.trait_name && r.dna_id === w.dna_id) &&
            w.health_area_id === insight.health_area_id
        )?.importance_weight || 1;

        const score = t.category === 'strength' ? 1 : t.category === 'warning' ? 0.5 : 0;
        totalWeighted += weight * score;
        totalWeight += weight;
    }

    return totalWeight > 0 ? Math.round((totalWeighted / totalWeight) * 100) : null;
}
