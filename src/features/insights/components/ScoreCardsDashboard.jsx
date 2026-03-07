import React, { useState } from 'react';
import { Activity, ShieldCheck, Zap, Brain, Info } from 'lucide-react';

export default function ScoreCardsDashboard({ scores }) {
    const [visibleInfo, setVisibleInfo] = useState(null);

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
            icon: <Activity size={18} className="text-emerald-500" />,
            iconBg: 'bg-emerald-50/80',
            description: 'This score reflects your current health status based on a composite of cardiovascular, metabolic, nutritional, and hormonal markers. It combines both DNA traits and blood test results to provide a balanced snapshot of your overall wellbeing.',
        },
        {
            key: 'longevity',
            score: scores?.longevity ?? '--',
            title: 'Longevity',
            icon: <ShieldCheck size={18} className="text-purple-500" />,
            iconBg: 'bg-purple-50/80',
            description: 'This score captures your long-term health potential by integrating inflammation markers, immune balance, detox efficiency, and DNA traits related to cellular aging and disease resistance.',
        },
        {
            key: 'performance',
            score: scores?.performance ?? '--',
            title: 'Performance',
            icon: <Zap size={18} className="text-orange-500" />,
            iconBg: 'bg-orange-50/80',
            description: 'This score evaluates your body’s ability to recover from stress and perform at its best, using markers like testosterone, cortisol, vitamin D, and key inflammation indicators — combined with DNA traits linked to muscle recovery and fatigue resistance.',
        },
        {
            key: 'resilience',
            score: scores?.resilience ?? '--',
            title: 'Mind & Resilience',
            icon: <Brain size={18} className="text-indigo-500" />,
            iconBg: 'bg-indigo-50/80',
            description: 'This score evaluates your mental clarity, cognitive function, and overnight recovery through sleep metrics, providing a measure of your brain\'s health and physical adaptability.',
        }
    ];

    return (
        <div className="w-full relative font-sans mb-8">
            <div className="grid grid-cols-2 gap-3">
                {scoreCards.map((card) => (
                    <div key={card.key} className="bg-white rounded-3xl p-5 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.05)] border border-gray-100 relative flex flex-col justify-between h-[150px]">
                        <div className="flex justify-between items-start relative z-10 w-full">
                            <div className={`${card.iconBg} p-2 rounded-2xl`}>
                                {card.icon}
                            </div>
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setVisibleInfo(visibleInfo === card.key ? null : card.key); }}
                                    className="p-1.5 text-gray-300 hover:text-gray-500 transition-colors rounded-full focus:outline-none"
                                >
                                    <Info size={18} />
                                </button>
                            </div>
                        </div>

                        <div className="mt-auto relative z-10 flex flex-col w-full">
                            <span className="text-xs font-bold text-gray-400 tracking-[0.05em] uppercase mb-1 truncate w-full block">
                                {card.title}
                            </span>
                            <div className="flex items-baseline justify-between w-full">
                                <div className="flex items-baseline gap-1">
                                    <span className="text-3xl font-bold tracking-tight text-gray-900">
                                        {card.score}
                                    </span>
                                    <span className="text-sm font-semibold text-gray-400">/100</span>
                                </div>
                            </div>

                            <div className="h-1.5 w-full rounded-full bg-gray-100 mt-2.5 overflow-hidden">
                                <div
                                    className={`h-full rounded-full transition-all duration-1000 ease-out ${getColorClass(card.score)}`}
                                    style={{ width: typeof card.score === 'number' ? `${card.score}%` : '0%' }}
                                ></div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>

            {/* Modal Overlay for Info */}
            {visibleInfo && (
                <div
                    className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-gray-900/40 backdrop-blur-sm transition-opacity"
                    onClick={() => setVisibleInfo(null)}
                >
                    <div
                        className="bg-white p-6 rounded-3xl shadow-2xl max-w-sm w-full border border-gray-100 transform transition-transform"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {(() => {
                            const activeCard = scoreCards.find(c => c.key === visibleInfo);
                            if (!activeCard) return null;
                            return (
                                <>
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className={`${activeCard.iconBg} p-2 rounded-2xl`}>
                                            {activeCard.icon}
                                        </div>
                                        <h3 className="font-bold text-gray-900 text-lg m-0">{activeCard.title}</h3>
                                    </div>
                                    <p className="text-gray-600 text-sm leading-relaxed m-0">{activeCard.description}</p>
                                    <button
                                        onClick={() => setVisibleInfo(null)}
                                        className="mt-6 w-full bg-gray-100 hover:bg-gray-200 text-gray-800 font-semibold py-3 flex justify-center items-center rounded-xl transition-colors focus:outline-none"
                                    >
                                        Got it
                                    </button>
                                </>
                            );
                        })()}
                    </div>
                </div>
            )}
        </div>
    );
}
