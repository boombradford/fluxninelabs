import React from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Shield, Target, Zap, Crosshair, AlertTriangle, CheckCircle, XCircle, Brain, Globe, Search } from 'lucide-react';
import { CountUp } from './CountUp';

interface WarRoomViewProps {
    selfReport: any;
    enemyReport: any;
}

export const WarRoomView = ({ selfReport, enemyReport }: WarRoomViewProps) => {
    // Helper to extract score safely
    const getScore = (report: any) => report?.coreSignals?.vibeScore?.score || 0;

    const selfScore = getScore(selfReport);
    const enemyScore = getScore(enemyReport);

    const isWinner = selfScore >= enemyScore;
    const scoreDiff = Math.abs(selfScore - enemyScore);

    return (
        <div className="w-full space-y-8 animate-in fade-in duration-700">

            {/* TACTICAL HEADER */}
            <div className="flex items-center justify-between border-b border-white/[0.1] pb-4">
                <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-red-500 animate-pulse rounded-full box-shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                    <h2 className="text-xl font-mono font-bold tracking-[0.2em] text-red-500 uppercase">
                        WAR ROOM ACTIVE // <span className="text-white">INTERCEPTION_MODE</span>
                    </h2>
                </div>
                <div className="text-xs font-mono text-[#64748B]">
                    SYS.TIME: {new Date().toLocaleTimeString()}
                </div>
            </div>

            {/* VICTORY/DEFEAT BANNER */}
            <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className={clsx(
                    "w-full py-4 text-center border-y-2 relative overflow-hidden",
                    isWinner
                        ? "bg-emerald-900/20 border-emerald-500/50 text-emerald-400"
                        : "bg-red-900/20 border-red-500/50 text-red-400"
                )}
            >
                <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20" />
                <h3 className="text-2xl md:text-3xl font-black font-display tracking-widest uppercase relative z-10 flex items-center justify-center gap-4">
                    {isWinner ? (
                        <>
                            <CheckCircle className="w-8 h-8" />
                            DOMINANCE ESTABLISHED
                            <CheckCircle className="w-8 h-8" />
                        </>
                    ) : (
                        <>
                            <AlertTriangle className="w-8 h-8" />
                            TACTICAL DISADVANTAGE DETECTED
                            <AlertTriangle className="w-8 h-8" />
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
                    <div className="absolute -top-3 left-4 bg-[#0A0A0A] px-2 text-xs font-mono text-[#38BDF8] border border-[#38BDF8]/30 z-10">
                        TARGET: SELF [BLUE_TEAM]
                    </div>

                    <div className={clsx(
                        "h-full bg-[#0F172A]/50 border-2 p-6 rounded-xl transition-all duration-500 overflow-hidden relative",
                        isWinner ? "border-[#38BDF8] shadow-[0_0_30px_-10px_rgba(56,189,248,0.3)]" : "border-white/10 opacity-80"
                    )}>
                        {/* SCANLINE BG */}
                        <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] z-0 bg-[length:100%_2px,3px_100%] bg-repeat" />

                        <div className="relative z-10 flex flex-col items-center text-center space-y-6">
                            <div className="w-24 h-24 rounded-full border-4 border-[#38BDF8]/20 flex items-center justify-center bg-[#38BDF8]/5">
                                <Shield className="w-10 h-10 text-[#38BDF8]" />
                            </div>

                            <div>
                                <h4 className="text-sm font-mono text-[#94A3B8] uppercase tracking-widest mb-2">VIBE_SCORE</h4>
                                <div className="text-6xl font-black text-white tracking-tighter">
                                    <CountUp value={selfScore} />
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-[#64748B] font-mono">LCP (Load)</div>
                                    <div className="text-xl font-bold text-white">{selfReport.meta?.performance?.lcp || 'N/A'}s</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-[#64748B] font-mono">SPEED_INDEX</div>
                                    <div className="text-xl font-bold text-white">{selfReport.meta?.performance?.speedIndex || 'N/A'}s</div>
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
                                <h4 className="text-sm font-mono text-[#94A3B8] uppercase tracking-widest mb-2">VIBE_SCORE</h4>
                                <div className="text-6xl font-black text-white tracking-tighter">
                                    <CountUp value={enemyScore} />
                                </div>
                            </div>

                            <div className="w-full grid grid-cols-2 gap-4 border-t border-white/10 pt-6">
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-[#64748B] font-mono">LCP (Load)</div>
                                    <div className="text-xl font-bold text-white">{enemyReport.meta?.performance?.lcp || 'N/A'}s</div>
                                </div>
                                <div className="space-y-1">
                                    <div className="text-[10px] uppercase text-[#64748B] font-mono">SPEED_INDEX</div>
                                    <div className="text-xl font-bold text-white">{enemyReport.meta?.performance?.speedIndex || 'N/A'}s</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </motion.div>

            </div>

            {/* STRATEGIC SUMMARY */}
            <div className="border border-white/10 bg-white/5 p-6 rounded-lg relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-gradient-to-b from-[#38BDF8] to-transparent" />
                <h4 className="text-sm font-mono text-[#38BDF8] uppercase tracking-widest mb-4 flex items-center gap-2">
                    <Brain className="w-4 h-4" /> AI STRATEGIC SUMMARY
                </h4>
                <p className="text-gray-300 leading-relaxed font-light">
                    {isWinner
                        ? `Superiority confirmed. Your digital footprint outperforms the target by ${scoreDiff} points. Maintain current trajectory but monitor enemy movement on mobile LCP.`
                        : `CRITICAL ALERT. Target is outperforming you by ${scoreDiff} points. Immediate tactical pivots required in speed index and visual hierarchy to regain market dominance.`
                    }
                </p>
            </div>

        </div>
    );
};
