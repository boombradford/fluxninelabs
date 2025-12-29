"use client";

import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import { Target, Scan, Fingerprint, Eye, AlertTriangle, Maximize2, Zap, Layers } from 'lucide-react';
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

    // Normalize coordinates from Lighthouse (often based on 360-412px width) to % if possible.
    // We map 412px (Moto G4 standard LH mobile) to 100%. height 800px.
    const mapRect = (rect: any) => ({
        top: `${Math.min((rect.top / 800) * 100, 90)}%`,
        left: `${Math.min((rect.left / 412) * 100, 90)}%`,
        width: `${Math.min((rect.width / 412) * 100, 50)}%`,
        height: `${Math.min((rect.height / 800) * 100, 30)}%`
    });

    const [activeZone, setActiveZone] = useState<string | null>(null);

    return (
        <div className="w-full relative group perspective-1000">
            {/* CONTAINER FRAME */}
            <div className="relative border border-white/10 bg-[#0B0F14]/80 backdrop-blur-sm rounded-xl overflow-hidden shadow-2xl transition-all duration-500 hover:border-[#38BDF8]/30 hover:shadow-[0_0_50px_rgba(56,189,248,0.1)]">

                {/* HUD HEADER */}
                <div className="h-10 border-b border-white/10 bg-white/5 flex items-center justify-between px-4 z-20 relative">
                    <div className="flex items-center gap-4">
                        <div className="flex gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-500/50" />
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-500/50" />
                        </div>
                        <div className="h-4 w-[1px] bg-white/10" />
                        <span className="font-mono text-[10px] text-[#64748B] uppercase tracking-widest flex items-center gap-2">
                            <Scan className="w-3 h-3" /> Visual_Forensics_Module_v4
                        </span>
                    </div>
                    <div className="font-mono text-[10px] text-[#38BDF8] animate-pulse">
                        {isScanning ? "ACQUIRING_TARGET..." : "TARGET_LOCKED"}
                    </div>
                </div>

                {/* VIEWPORT */}
                <div className="relative aspect-video w-full bg-[#0F172A] overflow-hidden group-hover:scale-[1.005] transition-transform duration-700">

                    {/* IFRAME / SCREENSHOT PLACEHOLDER */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 grayscale-[50%] group-hover:grayscale-0 transition-all duration-700 brightness-75 group-hover:brightness-100"
                        style={{ backgroundImage: `url('https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url')` }}
                    />

                    {/* REAL DOM FORENSICS LAYER */}
                    {hasRealData && (
                        <div className="absolute inset-0 pointer-events-none">
                            {/* LCP - CRITICAL RENDERING PATH (RED) */}
                            {domIssues?.lcp && (
                                <motion.div
                                    initial={{ opacity: 0, scale: 1.1 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute border-2 border-red-500 bg-red-500/10 z-20"
                                    style={mapRect(domIssues.lcp.rect)}
                                >
                                    <div className="absolute -top-6 left-0 bg-red-500 text-black text-[10px] font-mono font-bold px-1 py-0.5">
                                        LCP_FAIL
                                    </div>
                                    {/* Crosshair */}
                                    <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-red-500" />
                                    <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-red-500" />
                                    <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-red-500" />
                                    <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-red-500" />
                                </motion.div>
                            )}

                            {/* CLS - LAYOUT SHIFTS (YELLOW) */}
                            {domIssues?.cls?.map((cls, i) => (
                                <motion.div
                                    key={i}
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    transition={{ delay: 0.2 + (i * 0.1) }}
                                    className="absolute border border-yellow-400 border-dashed bg-yellow-400/5 z-10"
                                    style={mapRect(cls.rect)}
                                >
                                    <div className="absolute -bottom-4 right-0 text-yellow-400 text-[9px] font-mono">
                                        SHIFT_DETECTED
                                    </div>
                                </motion.div>
                            ))}
                        </div>
                    )}

                    {/* FALLBACK: SIMULATED HOTZONES (Only if no real data) */}
                    {!hasRealData && !isScanning && fixes.length > 0 && (
                        <div className="absolute inset-0 pointer-events-none">
                            {/* Simulated LCP */}
                            <div className="absolute top-[20%] left-[10%] w-[80%] h-[30%] border border-red-500/40 bg-red-500/10 animate-pulse opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                                <div className="absolute -top-3 left-0 bg-red-500 text-black text-[9px] font-mono font-bold px-1 py-0.5">
                                    LCP_FAIL (Est)
                                </div>
                            </div>
                        </div>
                    )}

                    {/* SCANNING GRID OVERLAY */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />

                    {/* SCAN LINE ANIMATION */}
                    {isScanning && (
                        <motion.div
                            initial={{ top: "0%" }}
                            animate={{ top: "100%" }}
                            transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                            className="absolute left-0 right-0 h-[2px] bg-[#38BDF8] shadow-[0_0_20px_#38BDF8] z-10 pointer-events-none"
                        />
                    )}

                    {/* HUD ELEMENTS */}
                    <div className="absolute inset-4 border border-white/5 pointer-events-none flex flex-col justify-between p-4">
                        {/* Corner Reticles */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[#38BDF8]/50" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[#38BDF8]/50" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[#38BDF8]/50" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[#38BDF8]/50" />

                        {/* Data Readout */}
                        <div className="font-mono text-[9px] text-[#38BDF8]/70 leading-tight">
                            COORD: {hasRealData ? "LOCKED_PHYSICAL" : "SIMULATION_MODE"}<br />
                            DOM_NODES: {isScanning ? "..." : (Math.floor(Math.random() * 2000) + 500)}<br />
                            RENDER_TIME: 142ms
                        </div>
                    </div>

                    {/* CENTRAL FOCUS RETICLE */}
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20 group-hover:opacity-40 transition-opacity">
                        <div className="w-64 h-64 border border-[#38BDF8]/30 rounded-full flex items-center justify-center">
                            <div className="w-1 h-4 bg-[#38BDF8]/50 absolute top-0" />
                            <div className="w-1 h-4 bg-[#38BDF8]/50 absolute bottom-0" />
                            <div className="w-4 h-1 bg-[#38BDF8]/50 absolute left-0" />
                            <div className="w-4 h-1 bg-[#38BDF8]/50 absolute right-0" />
                            <div className="w-2 h-2 bg-[#38BDF8] rounded-full" />
                        </div>
                    </div>

                </div>

                {/* HUD FOOTER */}
                <div className="h-8 bg-[#0F172A] border-t border-white/10 flex items-center justify-between px-4">
                    <div className="text-[10px] font-mono text-[#64748B] flex items-center gap-4">
                        <span className="flex items-center gap-1.5"><Layers className="w-3 h-3" /> LAYER_1: VISUAL</span>
                        <span className="flex items-center gap-1.5"><Zap className="w-3 h-3" /> LAYER_2: PERFORMANCE</span>
                    </div>
                    <div className="flex gap-2">
                        <TechIcon icon={Maximize2} isActive={false} color="text-white" size={16} />
                    </div>
                </div>
            </div>
        </div>
    );
};
