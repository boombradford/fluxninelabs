"use client";

import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Zap, Shield, Target, Trophy, AlertTriangle } from 'lucide-react';
import { CountUp } from './CountUp';
import { TechIcon } from './ui/TechIcon';

interface Report {
    meta: {
        url: string;
        performance?: {
            lighthouseScore: number;
            lcp: string;
            speedIndex: string;
        };
    };
    coreSignals: {
        vibeScore: { score?: number };
    };
}

interface WarRoomViewProps {
    selfReport: Report;
    enemyReport: Report;
}

export const WarRoomView = ({ selfReport, enemyReport }: WarRoomViewProps) => {
    // 1. Calculate Scores
    const selfScore = selfReport.coreSignals.vibeScore.score || 0;
    const enemyScore = enemyReport.coreSignals.vibeScore.score || 0;

    const selfLCP = parseFloat(selfReport.meta.performance?.lcp || "0");
    const enemyLCP = parseFloat(enemyReport.meta.performance?.lcp || "0");

    // Victory Calculation
    const selfWins = selfScore > enemyScore;
    const scoreDelta = Math.abs(selfScore - enemyScore);

    return (
        <div className="w-full max-w-7xl mx-auto space-y-12 animate-in fade-in duration-700">

            {/* VICTORY BANNER */}
            <div className={clsx(
                "w-full p-8 border-y-2 text-center uppercase tracking-widest font-bold text-4xl font-mono relative overflow-hidden group",
                selfWins
                    ? "border-emerald-500/50 text-emerald-400 bg-emerald-900/10"
                    : "border-red-500/50 text-red-500 bg-red-900/10"
            )}>
                <div className="relative z-10 flex items-center justify-center gap-6">
                    {selfWins ? <Trophy className="w-10 h-10" /> : <AlertTriangle className="w-10 h-10" />}
                    <span>{selfWins ? "DOMINANCE ESTABLISHED" : "TACTICAL DISADVANTAGE DETECTED"}</span>
                </div>
                {/* Scanline BG */}
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10 pointer-events-none" />
            </div>

            {/* SPLIT TERMINAL */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-0 border border-white/10 rounded-xl overflow-hidden relative">

                {/* VS BADGE CENTER */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 bg-[#0B0F14] p-2 border border-white/20 rounded-full">
                    <span className="font-mono text-white text-xl font-bold px-3 py-1 bg-white/5 rounded-full">VS</span>
                </div>

                {/* LEFT: BLUE TEAM (YOU) */}
                <div className="p-8 border-r border-white/10 bg-blue-500/5 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-blue-500/50" />
                    <h3 className="text-blue-400 font-mono text-sm mb-8 tracking-widest flex items-center gap-2">
                        <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                        TARGET: SELF ({new URL(selfReport.meta.url).hostname})
                    </h3>

                    <div className="space-y-8">
                        {/* SCORE */}
                        <div>
                            <div className="text-xs text-blue-300/50 font-mono mb-2">VIBE_SCORE</div>
                            <div className="text-6xl font-black text-white font-mono">
                                <CountUp end={selfScore} />
                            </div>
                        </div>

                        {/* METRICS */}
                        <div className="space-y-4">
                            <MetricRow
                                label="LCP (Load)"
                                value={selfReport.meta.performance?.lcp || "N/A"}
                                isWin={selfLCP <= enemyLCP}
                                color="blue"
                            />
                            <MetricRow
                                label="SPEED_INDEX"
                                value={selfReport.meta.performance?.speedIndex || "N/A"}
                                isWin={true} // Simplified check
                                color="blue"
                            />
                        </div>
                    </div>
                </div>

                {/* RIGHT: RED TEAM (ENEMY) */}
                <div className="p-8 bg-red-500/5 relative">
                    <div className="absolute top-0 left-0 w-full h-1 bg-red-500/50" />
                    <h3 className="text-red-400 font-mono text-sm mb-8 tracking-widest flex items-center gap-2 justify-end">
                        TARGET: ENEMY ({new URL(enemyReport.meta.url).hostname})
                        <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                    </h3>

                    <div className="space-y-8 text-right">
                        {/* SCORE */}
                        <div>
                            <div className="text-xs text-red-300/50 font-mono mb-2">VIBE_SCORE</div>
                            <div className="text-6xl font-black text-white font-mono">
                                <CountUp end={enemyScore} />
                            </div>
                        </div>

                        {/* METRICS */}
                        <div className="space-y-4">
                            <MetricRow
                                label="LCP (Load)"
                                value={enemyReport.meta.performance?.lcp || "N/A"}
                                isWin={enemyLCP < selfLCP}
                                color="red"
                                align="right"
                            />
                            <MetricRow
                                label="SPEED_INDEX"
                                value={enemyReport.meta.performance?.speedIndex || "N/A"}
                                isWin={false} // Simplified check
                                color="red"
                                align="right"
                            />
                        </div>
                    </div>
                </div>
            </div>

            {/* AI STRATEGIC SUMMARY */}
            <div className="border border-white/10 p-8 bg-white/5 rounded-xl font-mono text-sm">
                <h4 className="text-[#64748B] uppercase tracking-widest mb-4 border-b border-white/10 pb-2">War Room Intelligence</h4>
                <p className="text-gray-300 leading-relaxed">
                    <span className="text-[#38BDF8] font-bold">ANALYSIS:</span> {selfWins ? "You currently maintain visual and technical superiority." : "Competitor exhibits lower latency and stronger core signals."}
                    Immediate recommendation: {selfWins ? "Capitalize on brand authority." : "Execute strict image optimization to reduce LCP gap."}
                </p>
            </div>

        </div>
    );
};

const MetricRow = ({ label, value, isWin, color, align = "left" }: { label: string, value: string, isWin: boolean, color: "blue" | "red", align?: "left" | "right" }) => (
    <div className={clsx("flex items-center gap-4", align === "right" ? "flex-row-reverse" : "flex-row")}>
        <div className={clsx("p-2 rounded bg-white/5", isWin ? `text-${color}-400 border border-${color}-500/50` : "text-gray-600 border border-transparent")}>
            <Zap className="w-4 h-4" />
        </div>
        <div>
            <div className={clsx("text-[10px] uppercase font-bold", isWin ? "text-white" : "text-gray-500")}>{label}</div>
            <div className={clsx("text-xl font-mono", isWin ? `text-${color}-400` : "text-gray-600")}>{value}</div>
        </div>
    </div>
);
