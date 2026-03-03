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
                // Wrap the entire fetching block in a strict 6-second timeout to prevent infinite PWA loop locks
                await Promise.race([
                    (async () => {
                        // --- 1. Fetch Insights & Weights & Recommendations in Parallel ---
                        const [
                            { data: insights, error: insightsError },
                            { data: bloodWeights },
                            { data: bloodRefs },
                            { data: dnaWeights },
                            { data: dnaRefs },
                            { data: recData, error: recError }
                        ] = await Promise.all([
                            supabase.from('user_health_insight').select('health_area_id, findings_json, recommendations_json').eq('user_id', userId),
                            supabase.from('blood_marker_health_area').select('blood_marker_id, health_area_id, importance_weight'),
                            supabase.from('blood_marker_reference').select('blood_marker_id, marker_name'),
                            supabase.from('dna_marker_health_area').select('dna_id, health_area_id, importance_weight'),
                            supabase.from('dna_marker_reference').select('dna_id, trait'),
                            supabase.from('user_recommendation').select('category, recommendation, priority, is_selected')
                        ]);

                        if (insightsError) throw insightsError;
                        if (recError) throw recError;

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
                    })(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Dashboard Data Fetch Timeout')), 15000))
                ]);
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
