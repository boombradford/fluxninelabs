"use client";

import { motion } from 'framer-motion';
import { clsx } from 'clsx';
import React, { useEffect } from 'react';
import ResearchStream from './ResearchStream';

interface DeepAnalysisRevealProps {
    status: 'idle' | 'scouting' | 'analyzing' | 'analyzing_deep' | 'complete';
    children: React.ReactNode;
    className?: string;
}

export const DeepAnalysisReveal = ({ status, children, className }: DeepAnalysisRevealProps) => {
    const isReady = status === 'complete';

    useEffect(() => {
        console.log('[Flux] DeepAnalysisReveal:', status);
    }, [status]);

    return (
        <div className={clsx("relative min-h-[400px]", className)}>

            {/* PROCESSING OVERLAY - Instrumented Panel, not floating orb */}
            <div
                className={clsx(
                    "absolute inset-0 z-50 flex items-start justify-start transition-opacity duration-700",
                    isReady ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
            >
                {/* Background - near-black, no blur blob */}
                <div className={clsx(
                    "absolute inset-0 bg-[#0B0F14]/95 transition-all duration-700",
                    isReady ? "opacity-0" : "opacity-100"
                )} />

                {/* LEFT-ALIGNED INSTRUMENT PANEL */}
                <div className="relative z-30 p-8 md:p-12 w-full max-w-lg">

                    {/* Panel Frame */}
                    <div className="border border-[rgba(255,255,255,0.06)] bg-[#0E1218]">

                        {/* Panel Header */}
                        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgba(255,255,255,0.04)]">
                            <span className="text-[12px] font-mono text-[#8B8B8B] tracking-normal">
                                Analysis in progress
                            </span>
                            <motion.div
                                className="w-1.5 h-1.5 rounded-full bg-[#6B9AC4]"
                                animate={{ opacity: [0.4, 1, 0.4] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                        </div>

                        {/* Panel Content */}
                        <div className="px-4 py-6">
                            <ResearchStream status={status} />
                        </div>

                        {/* Panel Footer */}
                        <div className="px-4 py-2 border-t border-[rgba(255,255,255,0.04)]">
                            <span className="text-[10px] font-mono text-[#5A5A5A]">
                                This may take a moment
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* CONTENT LAYER */}
            <div
                className={clsx(
                    "relative z-10 transition-all duration-700",
                    !isReady ? "opacity-20" : "opacity-100"
                )}
            >
                {children}
            </div>
        </div>
    );
};
