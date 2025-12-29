"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Maximize2, AlertTriangle, Info, Crosshair, Target, Scan } from 'lucide-react';
import { TechIcon } from './ui/TechIcon';

interface TacticalFix {
    id: string;
    title: string;
    category?: 'SEO' | 'Content' | 'UX' | 'Performance' | 'Accessibility';
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
}

interface TacticalVisionProps {
    url: string;
    fixes?: TacticalFix[];
    isScanning?: boolean;
    domIssues?: {
        lcp?: { rect: { width: number; height: number; top: number; left: number }; snippet?: string };
        cls?: Array<{ rect: { width: number; height: number; top: number; left: number }; snippet?: string }>;
    };
}

export const TacticalVision = ({ url, fixes = [], isScanning = false, domIssues }: TacticalVisionProps) => {
    // Generate placeholder if no real data
    const hasRealData = !!(domIssues?.lcp || domIssues?.cls?.length);

    // Normalize coordinates from Lighthouse (Moto G4 standard LH mobile = 412x823 approx)
    const mapRect = (rect: any) => ({
        top: `${Math.min((rect.top / 800) * 100, 90)}%`,
        left: `${Math.min((rect.left / 412) * 100, 90)}%`,
        width: `${Math.min((rect.width / 412) * 100, 50)}%`,
        height: `${Math.min((rect.height / 800) * 100, 30)}%`
    });

    const [activeZone, setActiveZone] = useState<string | null>(null);

    return (
        <div className="w-full relative group perspective-1000">
            {/* CONTAINER FRAME - MILITARY INDUSTRIAL */}
            <div className="relative border-4 border-[#1E293B] bg-[#0B0F14] rounded-sm overflow-hidden shadow-2xl transition-all duration-500 hover:border-[#38BDF8]/50">

                {/* HUD HEADER */}
                <div className="absolute top-0 left-0 w-full h-8 z-20 bg-[#0F172A]/90 border-b border-[#38BDF8]/20 flex items-center justify-between px-4 backdrop-blur-sm">
                    <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-red-500 animate-pulse rounded-full" />
                        <span className="text-[10px] font-mono text-[#38BDF8] tracking-widest">LIVE_FEED // {url ? new URL(url).hostname.toUpperCase() : 'NO_SIGNAL'}</span>
                    </div>
                    <div className="flex gap-2 text-[10px] font-mono text-[#64748B]">
                        <span>REC_709</span>
                        <span>[AF_LOCKED]</span>
                    </div>
                </div>

                {/* VIEWPORT */}
                <div className="relative aspect-video w-full bg-[#0F172A] overflow-hidden">

                    {/* SCANLINES & GRID OVERLAY */}
                    <div className="absolute inset-0 pointer-events-none z-10 opacity-20 bg-[linear-gradient(rgba(18,16,16,0)_50%,rgba(0,0,0,0.25)_50%),linear-gradient(90deg,rgba(255,0,0,0.06),rgba(0,255,0,0.02),rgba(0,0,255,0.06))] bg-[length:100%_2px,3px_100%] bg-repeat" />
                    <div className="absolute inset-0 pointer-events-none z-10 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20" />
                    <div className="absolute inset-0 z-10 border-[0.5px] border-white/5 bg-[size:50px_50px] [background-image:linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] pointer-events-none" />

                    {/* IFRAME / SCREENSHOT PLACEHOLDER */}
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-700 filter saturate-[0.8] contrast-[1.1]"
                        style={{ backgroundImage: `url('https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url')` }}
                    />

                    {/* Darken overlay for contrast */}
                    <div className="absolute inset-0 bg-black/40 group-hover:bg-black/20 transition-colors duration-500 pointer-events-none" />

                    {/* RETICLE OVERLAY */}
                    <div className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center opacity-30 group-hover:opacity-100 transition-opacity">
                        <div className="w-[80%] h-[80%] border border-white/10 relative">
                            <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-[#38BDF8]" />
                            <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-[#38BDF8]" />
                            <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-[#38BDF8]" />
                            <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-[#38BDF8]" />
                            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 border border-white/30 rounded-full flex items-center justify-center">
                                <div className="w-1 h-1 bg-red-500 rounded-full" />
                            </div>
                        </div>
                    </div>

                    {/* SCANNING EFFECT */}
                    <AnimatePresence>
                        {isScanning && (
                            <motion.div
                                initial={{ top: "0%" }}
                                animate={{ top: "100%" }}
                                transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                                className="absolute left-0 right-0 h-1 bg-[#38BDF8]/50 shadow-[0_0_20px_rgba(56,189,248,0.5)] z-20"
                            />
                        )}
                    </AnimatePresence>

                    {/* REAL DOM FORENSICS LAYER */}
                    <AnimatePresence>
                        {hasRealData && (
                            <div className="absolute inset-0 z-10">
                                {/* LCP - CRITICAL RENDERING PATH (RED) */}
                                {domIssues?.lcp && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1, borderColor: "rgba(239, 68, 68, 0.8)" }}
                                        className="absolute border-2 border-red-500/80 bg-red-500/10 cursor-help"
                                        style={mapRect(domIssues.lcp.rect)}
                                        onMouseEnter={() => setActiveZone('lcp')}
                                        onMouseLeave={() => setActiveZone(null)}
                                    >
                                        <div className="absolute -top-7 left-0 bg-[#0F172A] border border-red-500/50 text-red-50 text-[10px] font-mono px-2 py-1 shadow-lg flex items-center gap-2">
                                            <Crosshair className="w-3 h-3 text-red-400" />
                                            LCP_CANDIDATE
                                        </div>
                                    </motion.div>
                                )}

                                {/* CLS - LAYOUT SHIFTS (YELLOW) */}
                                {domIssues?.cls?.map((cls, i) => (
                                    <motion.div
                                        key={i}
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        transition={{ delay: 0.2 + (i * 0.1) }}
                                        className="absolute border border-amber-400/80 border-dashed bg-amber-400/10 cursor-help"
                                        style={mapRect(cls.rect)}
                                        onMouseEnter={() => setActiveZone(`cls-${i}`)}
                                        onMouseLeave={() => setActiveZone(null)}
                                    >
                                        <div className="absolute -bottom-7 right-0 bg-[#0F172A] border border-amber-400/50 text-amber-50 text-[10px] font-mono px-2 py-1 shadow-lg flex items-center gap-2">
                                            <AlertTriangle className="w-3 h-3 text-amber-400" />
                                            LAYOUT_SHIFT
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
                        )}
                    </AnimatePresence>

                    {/* Scanning Text Overlay */}
                    {isScanning && (
                        <div className="absolute bottom-4 left-4 z-20">
                            <div className="bg-black/60 backdrop-blur border border-white/10 px-3 py-1 text-[10px] font-mono text-[#38BDF8] animate-pulse">
                                SCANNING BUFFER...
                            </div>
                        </div>
                    )}

                </div>

                {/* HUD FOOTER */}
                <div className="h-6 bg-[#0B0F14] border-t border-white/5 flex items-center justify-between px-4">
                    <div className="flex gap-4">
                        <span className="text-[9px] font-mono text-[#64748B]">LATENCY: <span className="text-emerald-400">22ms</span></span>
                        <span className="text-[9px] font-mono text-[#64748B]">PACKET_LOSS: <span className="text-white">0%</span></span>
                    </div>
                </div>
            </div>
        </div>
    );
};
