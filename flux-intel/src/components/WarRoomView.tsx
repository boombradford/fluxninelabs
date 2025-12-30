import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Shield, Target, Zap, Crosshair, AlertTriangle, CheckCircle, XCircle, Brain, Globe, Search } from 'lucide-react';
import { CountUp } from './CountUp';

interface ReportData {
    coreSignals?: {
        vibeScore?: {
            score?: number;
        };
    };
    meta?: {
        performance?: {
            lcp?: string;
            speedIndex?: string;
        };
    };
}

interface WarRoomViewProps {
    selfReport: ReportData;
    enemyReport: ReportData;
}

export const WarRoomView = ({ selfReport, enemyReport }: WarRoomViewProps) => {
    // Helper to extract score safely
    const getScore = (report: ReportData) => report?.coreSignals?.vibeScore?.score || 0;

    const selfScore = getScore(selfReport);
    const enemyScore = getScore(enemyReport);

    const isWinner = selfScore >= enemyScore;
    const scoreDiff = Math.abs(selfScore - enemyScore);

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-700">

            {/* TACTICAL HEADER */}
            <div className="flex items-center justify-between border-b border-white/[0.08] pb-6">
                <div className="flex items-center gap-4">
                    <div className="w-2.5 h-2.5 bg-[#f06c5b] rounded-full shadow-[0_0_12px_rgba(240,108,91,0.4)]" />
                    <h2 className="text-xl font-bold tracking-tight text-[#f8fafc] uppercase">
                        Strategic Comparison // <span className="text-white/40">Active Synthesis</span>
                    </h2>
                </div>
                <div className="text-[11px] font-bold text-white/30 tracking-widest uppercase">
                    Refined: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </div>
            </div>

            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.8, ease: "circOut" }}
                className={clsx(
                    "w-full py-6 text-center border-y relative overflow-hidden rounded-xl",
                    isWinner
                        ? "bg-[#10b981]/10 border-[#10b981]/30 text-[#10b981]"
                        : "bg-[#f06c5b]/10 border-[#f06c5b]/30 text-[#f06c5b]"
                )}
            >
                <div className="absolute inset-0 bg-flux-glow opacity-10 pointer-events-none" />
                <h3 className="text-2xl md:text-3xl font-bold tracking-tight uppercase relative z-10 flex items-center justify-center gap-6">
                    {isWinner ? (
                        <>
                            <CheckCircle className="w-7 h-7" />
                            Target Outperformed
                            <CheckCircle className="w-7 h-7" />
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="w-7 h-7" />
                            Tactical Variance Detected
                            <AlertTriangle className="w-7 h-7" />
                        </>
                    )}
                </h3>
            </motion.div>

            {/* COMPARISON GRID */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 relative">

                {/* VS BADGE */}
                <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-20 hidden md:flex items-center justify-center w-16 h-16 bg-[#0A0A0A] border-2 border-white/20 rounded-full">
                    <span className="font-black italic text-2xl text-white">VS</span>
                </div>

                {/* LEFT: BLUE TEAM (YOU) */}
                <motion.div
                    initial={{ x: -50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5 }}
                    className="relative group"
                >
                    <div className="absolute -top-3 left-4 bg-[#030712] px-3 py-0.5 text-[10px] font-bold text-[#f06c5b] border border-[#f06c5b]/30 z-10 rounded-full uppercase tracking-widest">
                        Protocol: Primary Domain
                    </div>

                    <div className={clsx(
                        "h-full glass-card p-8 transition-all duration-700 overflow-hidden relative",
                        isWinner ? "border-[#f06c5b]/40 shadow-[0_0_40px_-15px_rgba(240,108,91,0.2)]" : "opacity-80"
                    )}>
                        <div className="relative z-10 flex flex-col items-center text-center space-y-8">
                            <div className="w-24 h-24 rounded-full border-2 border-[#f06c5b]/20 flex items-center justify-center bg-[#f06c5b]/5 shadow-[inset_0_0_20px_rgba(240,108,91,0.1)]">
                                <Shield className="w-10 h-10 text-[#f06c5b]" />
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Vibe Score</h4>
                                <div className="text-6xl font-black text-white tracking-tighter">
                                    <CountUp value={selfScore} />
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-white/30 font-bold tracking-widest">LCP (Load)</div>
                                    <div className="text-2xl font-bold text-white">{selfReport.meta?.performance?.lcp || 'N/A'}s</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-white/30 font-bold tracking-widest">Speed Index</div>
                                    <div className="text-2xl font-bold text-white">{selfReport.meta?.performance?.speedIndex || 'N/A'}s</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>


                {/* RIGHT: RED TEAM (ENEMY) */}
                <motion.div
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="relative group"
                >
                    <div className="absolute -top-3 right-4 bg-[#0A0A0A] px-2 text-xs font-mono text-red-500 border border-red-500/30 z-10">
                        TARGET: ENEMY [RED_TEAM]
                    </div>

                    <div className={clsx(
                        "h-full bg-[#1a0505]/50 border-2 p-6 rounded-xl transition-all duration-500 overflow-hidden relative",
                        !isWinner ? "border-red-500 shadow-[0_0_30px_-10px_rgba(239,68,68,0.3)]" : "border-white/10 opacity-80"
                    )}>
                        {/* SCANLINE BG */}
                        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] bg-repeat" />

                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <div className="w-24 h-24 rounded-full border-4 border-red-500/20 flex items-center justify-center bg-red-500/5">
                                <Crosshair className="w-10 h-10 text-red-500" />
                            </div>

                            <div>
                                <h4 className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em] mb-2">Vibe Score</h4>
                                <div className="text-6xl font-black text-white tracking-tighter">
                                    <CountUp value={enemyScore} />
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4 border-t border-white/5 pt-6">
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-white/30 font-bold tracking-widest">LCP (Load)</div>
                                    <div className="text-2xl font-bold text-white">{enemyReport.meta?.performance?.lcp || 'N/A'}s</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-white/30 font-bold tracking-widest">Speed Index</div>
                                    <div className="text-2xl font-bold text-white">{enemyReport.meta?.performance?.speedIndex || 'N/A'}s</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* STRATEGIC SUMMARY */}
            <div className="glass-card p-10 relative overflow-hidden group">
                <div className="absolute top-0 left-0 w-1.5 h-full bg-[#f06c5b] shadow-[0_0_15px_rgba(240,108,91,0.4)]" />
                <h4 className="text-[12px] font-bold text-[#f06c5b] uppercase tracking-[0.2em] mb-6 flex items-center gap-3">
                    <Brain className="w-4 h-4" /> AI Research Synthesis
                </h4>
                <p className="text-[#f8fafc]/90 leading-relaxed font-medium">
                    {isWinner
                        ? `Findings confirmed. Your domain's digital architecture outperforms the competitor by ${scoreDiff} points. Strategic dominance is established; prioritize maintaining current LCP trajectory while expanding visual resonance.`
                        : `Critical variance identified. The competitor's ecosystem is outperforming your current baseline by ${scoreDiff} points. Immediate optimization of load performance and visual hierarchy is recommended to reclaim parity.`
                    }
                </p>
            </div>

        </div>
    );
};
