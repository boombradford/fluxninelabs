"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Loader2, Sparkles, BrainCircuit } from 'lucide-react';
import React from 'react';

interface DeepAnalysisRevealProps {
    status: 'idle' | 'scouting' | 'analyzing_deep' | 'complete';
    children: React.ReactNode;
    className?: string; // Allow custom styling wrapper
}

export const DeepAnalysisReveal = ({ status, children, className }: DeepAnalysisRevealProps) => {
    const isReady = status === 'complete';
    const isProcessing = status === 'analyzing_deep';

    // SKELETON PLACEHOLDER (Blur Target)
    // We render a fake version of the tactical plan to blur
    const SkeletonPlaceholder = () => (
        <div className="space-y-12 opacity-50 pointer-events-none select-none grayscale">
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                <div className="h-8 w-64 bg-white/10 rounded animate-pulse" />
                <div className="h-8 w-32 bg-white/10 rounded-full animate-pulse" />
            </div>

            <div className="space-y-8">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12">
                        <div className="lg:col-span-7 space-y-5">
                            <div className="h-6 w-3/4 bg-white/10 rounded animate-pulse" />
                            <div className="space-y-2">
                                <div className="h-4 w-full bg-white/5 rounded animate-pulse" />
                                <div className="h-4 w-5/6 bg-white/5 rounded animate-pulse" />
                            </div>
                        </div>
                        <div className="lg:col-span-5">
                            <div className="h-40 bg-white/5 rounded-lg border border-white/5 animate-pulse" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );

    return (
        <div className={clsx("relative min-h-[400px]", className)}>

            {/* 1. BLURRED/PROCESSING OVERLAY */}
            <div
                className={clsx(
                    "absolute inset-0 z-50 flex flex-col items-center justify-center transition-opacity duration-700 ease-in-out",
                    isReady ? "opacity-0 pointer-events-none" : "opacity-100"
                )}
            >
                {/* BLUR LAYER */}
                <div className={clsx(
                    "absolute inset-0 bg-[#0B0F14]/60 backdrop-blur-[8px] transition-all duration-1000",
                    isReady ? "backdrop-blur-none" : "backdrop-blur-[8px]"
                )} />

                {/* SCANNER UI */}
                <div className="relative z-30 flex flex-col items-center text-center p-8">
                    <div className="relative mb-6">
                        <div className="absolute inset-0 bg-blue-500/20 blur-[30px] rounded-full animate-pulse" />
                        <div className="relative h-16 w-16 bg-[#0F172A] border border-blue-500/30 rounded-2xl flex items-center justify-center shadow-2xl">
                            <BrainCircuit className="w-8 h-8 text-blue-400 animate-pulse" />
                        </div>
                        {/* Scanning Line Animation */}
                        <motion.div
                            className="absolute top-0 left-[-20%] right-[-20%] h-[2px] bg-gradient-to-r from-transparent via-blue-400 to-transparent shadow-[0_0_15px_rgba(59,130,246,0.6)]"
                            animate={{ top: ["0%", "100%", "0%"] }}
                            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                        />
                    </div>

                    <h3 className="text-xl font-bold text-white mb-2 tracking-tight">
                        Synthesizing Deep Intelligence
                    </h3>
                    <p className="text-sm text-blue-200/60 font-mono tracking-wide max-w-xs">
                        Calibrating tactical roadmap & strategic vectors...
                    </p>
                </div>

            </div>

            {/* 2. CONTENT LAYER (Always Rendered, but Skeleton if inactive) */}
            <div
                className={clsx(
                    "relative z-10 transition-all duration-700",
                    !isReady ? "opacity-40 scale-[0.99] grayscale" : "opacity-100 scale-100 grayscale-0"
                )}
            >
                {/* We render children BUT masks them with skeleton if not ready to avoid layout shift */}
                {/* Actually for reveal, we want the real content to 'sharpen'. 
                    So we render children but style it. 
                    If children data is missing (undefined tactical fixes), we render Skeleton. 
                */}
                {children}
            </div>
        </div>
    );
};
