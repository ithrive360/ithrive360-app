import React, { useState, useRef, useEffect } from 'react';

export default function ScoreCardsDashboard({ scores }) {
    const [visibleInfo, setVisibleInfo] = useState(null);
    const infoRefs = useRef({});

    const getColorClass = (score) => {
        if (score === null || score === '--') return 'bg-gray-300';
        if (score < 50) return 'bg-red-500';
        if (score < 75) return 'bg-amber-500';
        return 'bg-emerald-500';
    };

    const scoreCards = [
        {
            key: 'general',
            score: scores?.general ?? '--',
            title: 'Overall Health',
            description: 'This score reflects your current health status based on a composite of cardiovascular, metabolic, nutritional, and hormonal markers. It combines both DNA traits and blood test results to provide a balanced snapshot of your overall wellbeing.',
        },
        {
            key: 'longevity',
            score: scores?.longevity ?? '--',
            title: 'Longevity',
            description: 'This score captures your long-term health potential by integrating inflammation markers, immune balance, detox efficiency, and DNA traits related to cellular aging and disease resistance.',
        },
        {
            key: 'performance',
            score: scores?.performance ?? '--',
            title: 'Performance & Recovery',
            description: 'This score evaluates your body’s ability to recover from stress and perform at its best, using markers like testosterone, cortisol, vitamin D, and key inflammation indicators — combined with DNA traits linked to muscle recovery and fatigue resistance.',
        },
    ];

    useEffect(() => {
        const handleClickOutside = (e) => {
            if (
                visibleInfo &&
                infoRefs.current[visibleInfo] &&
                !infoRefs.current[visibleInfo].contains(e.target)
            ) {
                setVisibleInfo(null);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [visibleInfo]);

    return (
        <div className="w-full relative z-10 font-sans mb-8">
            <div className="bg-white rounded-[32px] p-6 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative overflow-hidden group hover:shadow-lg transition-all">
                {/* Subtle decorative blob */}
                <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-50 rounded-full blur-3xl -mr-16 -mt-16 opacity-60"></div>

                <div className="relative z-10 flex flex-col gap-6">
                    {scoreCards.map((card) => (
                        <div key={card.key} className="relative">
                            <div className="flex justify-between items-end mb-2">
                                <span className="font-bold text-gray-800 text-lg tracking-tight">{card.title}</span>
                                <div className="flex items-center gap-2">
                                    <span className="text-2xl font-black text-gray-900 tracking-tight">
                                        {card.score}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-400 mb-0.5">/100</span>
                                </div>
                            </div>
                            <div className="h-3.5 rounded-full bg-gray-100/80 shadow-inner overflow-hidden mb-1 relative border border-gray-200/50">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getColorClass(card.score)}`}
                                    style={{ width: typeof card.score === 'number' ? `${card.score}%` : '0%' }}
                                ></div>
                            </div>
                            <div className="text-right">
                                <button
                                    onClick={() => setVisibleInfo(visibleInfo === card.key ? null : card.key)}
                                    className="text-xs bg-gray-50 hover:bg-gray-100 text-gray-500 font-medium px-2.5 py-1 rounded-lg border border-gray-200 transition-colors cursor-pointer relative focus:outline-none"
                                    aria-label="More info"
                                >
                                    Why this score?
                                </button>
                            </div>

                            {visibleInfo === card.key && (
                                <div
                                    ref={(el) => (infoRefs.current[card.key] = el)}
                                    className="absolute top-full right-0 z-50 bg-white p-4 mt-2 border border-gray-200 rounded-lg shadow-lg w-80 text-sm text-gray-700"
                                >
                                    {card.description}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
