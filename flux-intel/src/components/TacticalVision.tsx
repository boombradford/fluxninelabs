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
}

export const TacticalVision = ({ url, fixes = [], isScanning = false }: TacticalVisionProps) => {
    // Determine high-severity issues for "Hotzones"
    const criticalIssues = fixes.filter(f => f.severity === 'Critical');

    // Simulate hotzone positions (random for visual effect, ideally mapped to DOM elements)
    // In a real implementation, we'd use the `evidence` field to get selector/coordinates
    const hotzones = criticalIssues.slice(0, 3).map((issue, i) => ({
        id: issue.id,
        top: `${20 + (i * 15)}%`,
        left: `${30 + (i * 20)}%`,
        label: issue.title
    }));

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
                    {/* Note: Using Microlink specific URL for screenshot generation */}
                    <div
                        className="absolute inset-0 bg-cover bg-center opacity-40 grayscale-[50%] group-hover:grayscale-0 transition-all duration-700 brightness-75 group-hover:brightness-100"
                        style={{ backgroundImage: `url('https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url')` }}
                    />

                    {/* SCANNING GRID OVERLAY */}
                    <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-20 pointer-events-none" />

                    {/* SCAN LINE ANIMATION */}
                    <motion.div
                        initial={{ top: "0%" }}
                        animate={{ top: "100%" }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        className="absolute left-0 right-0 h-[2px] bg-[#38BDF8] shadow-[0_0_20px_#38BDF8] z-10 pointer-events-none"
                    />

                    {/* HUD ELEMENTS */}
                    <div className="absolute inset-4 border border-white/5 pointer-events-none flex flex-col justify-between p-4">
                        {/* Corner Reticles */}
                        <div className="absolute top-0 left-0 w-4 h-4 border-l-2 border-t-2 border-[#38BDF8]/50" />
                        <div className="absolute top-0 right-0 w-4 h-4 border-r-2 border-t-2 border-[#38BDF8]/50" />
                        <div className="absolute bottom-0 left-0 w-4 h-4 border-l-2 border-b-2 border-[#38BDF8]/50" />
                        <div className="absolute bottom-0 right-0 w-4 h-4 border-r-2 border-b-2 border-[#38BDF8]/50" />

                        {/* Data Readout */}
                        <div className="font-mono text-[9px] text-[#38BDF8]/70 leading-tight">
                            COORD: {Math.random().toFixed(4)}, {Math.random().toFixed(4)}<br />
                            DOM_NODES: {Math.floor(Math.random() * 2000) + 500}<br />
                            RENDER_TIME: 142ms
                        </div>
                    </div>

                    {/* INTERACTIVE HOTZONES */}
                    {hotzones.map((zone) => (
                        <motion.div
                            key={zone.id}
                            initial={{ scale: 0, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            transition={{ delay: 1 }}
                            style={{ top: zone.top, left: zone.left }}
                            className="absolute z-30"
                            onMouseEnter={() => setActiveZone(zone.id)}
                            onMouseLeave={() => setActiveZone(null)}
                        >
                            {/* Reticle Element */}
                            <div className="relative -translate-x-1/2 -translate-y-1/2 cursor-crosshair group/zone">
                                <div className={clsx(
                                    "w-12 h-12 border-2 rounded-sm transition-all duration-300 flex items-center justify-center relative",
                                    activeZone === zone.id ? "border-red-500 bg-red-500/10 w-48 h-auto p-4" : "border-red-500/50 hover:border-red-500"
                                )}>
                                    {!activeZone && <div className="w-1 h-1 bg-red-500 animate-ping absolute" />}

                                    {/* Expanded Details */}
                                    {activeZone === zone.id && (
                                        <motion.div
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            className="text-left"
                                        >
                                            <div className="text-[10px] font-mono text-red-500 font-bold uppercase mb-1 flex items-center gap-2">
                                                <AlertTriangle className="w-3 h-3" /> CRITICAL_FAILURE
                                            </div>
                                            <div className="text-xs text-white font-mono leading-tight">{zone.label}</div>
                                        </motion.div>
                                    )}
                                </div>
                                {/* Connecting Line to nothing (Visual flair) */}
                                <div className="absolute top-1/2 left-full w-8 h-[1px] bg-red-500/30" />
                                <div className="absolute top-1/2 left-full translate-x-8 -translate-y-[2px] w-1 h-1 bg-red-500/50" />
                            </div>
                        </motion.div>
                    ))}

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
