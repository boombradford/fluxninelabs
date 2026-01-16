"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

interface TacticalVisionProps {
    url: string;
    isScanning?: boolean;
    domIssues?: {
        lcp?: { rect: { width: number; height: number; top: number; left: number }; snippet?: string };
        cls?: Array<{ rect: { width: number; height: number; top: number; left: number }; snippet?: string }>;
    };
}

export const TacticalVision = ({ url, isScanning = false, domIssues }: TacticalVisionProps) => {
    const hasRealData = !!(domIssues?.lcp || domIssues?.cls?.length);

    const mapRect = (rect: { top: number; left: number; width: number; height: number }) => ({
        top: `${Math.min((rect.top / 800) * 100, 90)}%`,
        left: `${Math.min((rect.left / 412) * 100, 90)}%`,
        width: `${Math.min((rect.width / 412) * 100, 50)}%`,
        height: `${Math.min((rect.height / 800) * 100, 30)}%`
    });

    return (
        <div className="w-full relative group">
            <div className="relative border border-[rgba(255,255,255,0.06)] bg-[#0B0F14] overflow-hidden">

                {/* HUD HEADER */}
                <div className="absolute top-0 left-0 w-full h-7 z-20 bg-[#0B0F14]/80 border-b border-[rgba(255,255,255,0.04)] flex items-center justify-between px-3">
                        <div className="flex items-center gap-2">
                            <div className="w-1.5 h-1.5 bg-[#6B9AC4]/60 rounded-full" />
                            <span className="text-[10px] font-mono text-[#8B8B8B] tracking-normal uppercase">
                            Preview_{url ? new URL(url).hostname.replace('www.', '').split('.')[0].toUpperCase() : 'UNKNOWN'}
                            </span>
                        </div>
                    <div className="flex gap-4 text-[9px] font-mono text-[#555555]">
                        <span>LIVE</span>
                        <span>[PREVIEW]</span>
                    </div>
                </div>

                {/* VIEWPORT */}
                <div className="relative aspect-video w-full bg-[#0D1117] overflow-hidden">
                    <div
                        className="absolute inset-0 bg-cover bg-center transition-all duration-700 filter saturate-[0.7] contrast-[1.05]"
                        style={{ backgroundImage: `url('https://api.microlink.io?url=${encodeURIComponent(url)}&screenshot=true&meta=false&embed=screenshot.url')` }}
                    />
                    <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors pointer-events-none" />

                    {/* SCANNING EFFECT */}
                    <AnimatePresence>
                        {isScanning && (
                            <motion.div
                                initial={{ top: "0%" }}
                                animate={{ top: "100%" }}
                                transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                                className="absolute left-0 right-0 h-px bg-[#6B9AC4]/30 shadow-[0_0_10px_rgba(107,154,196,0.3)] z-20"
                            />
                        )}
                    </AnimatePresence>

                    {/* DOM FORENSICS LAYER */}
                    <AnimatePresence>
                        {hasRealData && (
                            <div className="absolute inset-0 z-10">
                                {domIssues?.lcp && (
                                    <div
                                        className="absolute border border-[#A85454]/60 bg-[#A85454]/5"
                                        style={mapRect(domIssues.lcp.rect)}
                                    >
                                        <div className="absolute -top-5 left-0 text-[9px] font-mono text-[#A85454] uppercase bg-[#0B0F14] px-1 border border-[#A85454]/20">
                                            LCP candidate
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </div>

                {/* HUD FOOTER */}
                <div className="h-6 bg-[#0B0F14] border-t border-[rgba(255,255,255,0.04)] flex items-center justify-between px-3">
                    <div className="flex gap-4">
                        <span className="text-[9px] font-mono text-[#555555]">Status: <span className="text-[#3D8B6E]">Live</span></span>
                        <span className="text-[9px] font-mono text-[#555555]">Protocol: <span className="text-[#E8E8E8]">HTTPS</span></span>
                    </div>
                </div>
            </div>
        </div>
    );
};
