import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { calculateInsightScore } from '../utils/scoreCalculator';

export function useDashboardData(userId) {
    const [overallScores, setOverallScores] = useState({ general: null, longevity: null, performance: null });
    const [recommendationData, setRecommendationData] = useState({});
    const [activeToggles, setActiveToggles] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) return;

        let isMounted = true;

        const fetchDashboardData = async () => {
            setLoading(true);
            try {
                // --- 1. Fetch Insights & Weights ---
                const { data: insights, error: insightsError } = await supabase
                    .from('user_health_insight')
                    .select('health_area_id, findings_json, recommendations_json')
                    .eq('user_id', userId);

                if (insightsError) throw insightsError;

                const { data: bloodWeights } = await supabase.from('blood_marker_health_area').select('blood_marker_id, health_area_id, importance_weight');
                const { data: bloodRefs } = await supabase.from('blood_marker_reference').select('blood_marker_id, marker_name');
                const { data: dnaWeights } = await supabase.from('dna_marker_health_area').select('dna_id, health_area_id, importance_weight');
                const { data: dnaRefs } = await supabase.from('dna_marker_reference').select('dna_id, trait');

                const scores = insights.map(insight => ({
                    health_area_id: insight.health_area_id,
                    score: calculateInsightScore({ insight, bloodWeights, bloodRefs, dnaWeights, dnaRefs }),
                    recommendations: insight.recommendations_json || {}
                }));

                const getGroupAvg = (ids) => {
                    const filtered = scores.filter(s => ids.includes(s.health_area_id));
                    const valid = filtered.filter(s => s.score !== null);
                    return valid.length ? Math.round(valid.reduce((a, b) => a + b.score, 0) / valid.length) : null;
                };

                if (isMounted) {
                    setOverallScores({
                        general: getGroupAvg(['HA001', 'HA002', 'HA003', 'HA004']),
                        performance: getGroupAvg(['HA005', 'HA006']),
                        longevity: getGroupAvg(['HA007', 'HA008', 'HA009']),
                    });
                }

                // --- 2. Fetch User Recommendations ---
                const { data: recData, error: recError } = await supabase
                    .from('user_recommendation')
                    .select('category, recommendation, priority, is_selected');

                if (recError) throw recError;

                const grouped = {};
                const toggles = {};

                for (const rec of recData || []) {
                    const cat = rec.category;
                    if (!grouped[cat]) grouped[cat] = [];
                    grouped[cat].push({ text: rec.recommendation, priority: rec.priority || 'medium' });
                    toggles[rec.recommendation] = rec.is_selected ?? false;
                }

                if (isMounted) {
                    setRecommendationData(grouped);
                    setActiveToggles(toggles);
                }

            } catch (err) {
                console.error('Failed to fetch dashboard data:', err.message);
                if (isMounted) setError(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchDashboardData();

        return () => { isMounted = false; };
    }, [userId]);

    return { overallScores, recommendationData, activeToggles, setActiveToggles, loading, error };
}
