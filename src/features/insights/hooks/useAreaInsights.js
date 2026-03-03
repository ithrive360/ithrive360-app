import { useState, useEffect } from 'react';
import { supabase } from '../../../lib/supabase';
import { calculateInsightScore } from '../utils/scoreCalculator';

export function useAreaInsights(userId) {
    const [healthAreas, setHealthAreas] = useState([]);
    const [preloadedInsights, setPreloadedInsights] = useState({});
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        if (!userId) {
            setLoading(false);
            return;
        }

        let isMounted = true;

        const fetchAllData = async () => {
            const cacheKey = `iThrive_areainsights_cache_${userId}`;
            const cached = localStorage.getItem(cacheKey);

            if (cached) {
                try {
                    const parsed = JSON.parse(cached);
                    if (isMounted) {
                        setHealthAreas(parsed.healthAreas || []);
                        setPreloadedInsights(parsed.preloadedInsights || {});
                        setLoading(false); // Instantly drop the UI lock!
                    }
                } catch (e) {
                    console.warn("Invalid area insights cache", e);
                    if (isMounted) setLoading(true);
                }
            } else {
                if (isMounted) setLoading(true);
            }

            try {
                // Prevent infinite network locks on mobile with a 15-second race timeout
                await Promise.race([
                    (async () => {
                        const { data: areas, error: areaError } = await supabase.from('health_area_reference').select('health_area_id, health_area_name');
                        if (areaError) throw areaError;

                        if (isMounted) setHealthAreas(areas || []);

                        if (areas && areas.length > 0) {
                            const insightsMap = {};

                            const { data: bloodWeights } = await supabase.from('blood_marker_health_area').select('blood_marker_id, health_area_id, importance_weight');
                            const { data: bloodRefs } = await supabase.from('blood_marker_reference').select('blood_marker_id, marker_name');
                            const { data: dnaWeights } = await supabase.from('dna_marker_health_area').select('dna_id, health_area_id, importance_weight');
                            const { data: dnaRefs } = await supabase.from('dna_marker_reference').select('dna_id, trait');

                            const { data: allInsights, error: fetchError } = await supabase
                                .from('user_health_insight')
                                .select('health_area_id, summary, findings_json, recommendations_json')
                                .eq('user_id', userId)
                                .in('health_area_id', areas.map(area => area.health_area_id));

                            if (fetchError) throw fetchError;

                            if (allInsights) {
                                for (const insight of allInsights) {
                                    const haId = insight.health_area_id;
                                    const name = areas.find(h => h.health_area_id === haId)?.health_area_name || haId;
                                    const blood_markers = insight.findings_json?.blood_markers || [];
                                    const dna_traits = insight.findings_json?.dna_traits || [];

                                    const score = calculateInsightScore({ insight, bloodWeights, bloodRefs, dnaWeights, dnaRefs });

                                    insightsMap[haId] = {
                                        health_area: name,
                                        summary: insight.summary,
                                        blood_markers,
                                        dna_traits,
                                        recommendations: insight.recommendations_json || {},
                                        healthScore: score
                                    };
                                }
                            }
                            if (isMounted) {
                                setPreloadedInsights(insightsMap);
                                localStorage.setItem(cacheKey, JSON.stringify({
                                    healthAreas: areas,
                                    preloadedInsights: insightsMap
                                }));
                            }
                        }
                    })(),
                    new Promise((_, reject) => setTimeout(() => reject(new Error('Insights Fetch Timeout')), 15000))
                ]);
            } catch (err) {
                console.error('Error fetching area insights:', err);
                if (isMounted) setError(err);
            } finally {
                if (isMounted) setLoading(false);
            }
        };

        fetchAllData();

        return () => { isMounted = false; };
    }, [userId]);

    return { healthAreas, preloadedInsights, loading, error };
}
