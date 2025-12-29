"use client";

import { motion, AnimatePresence } from 'framer-motion';
import { clsx } from 'clsx';
import { Loader2, Sparkles } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface DeepAnalysisRevealProps {
    status: 'idle' | 'scouting' | 'analyzing_deep' | 'complete';
    children: React.ReactNode;
    className?: string; // Allow custom styling wrapper
}

export const DeepAnalysisReveal = ({ status, children, className }: DeepAnalysisRevealProps) => {
    const isReady = status === 'complete';
    const isProcessing = status === 'analyzing_deep';

    // Internal state for progressive disclosure simulation
    const [progress, setProgress] = useState(0);

    // Reset progress when analysis starts
    useEffect(() => {
        if (status === 'analyzing_deep') {
            setProgress(0);
        }
    }, [status]);

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

                {/* FLUX CORE ANIMATION */}
                <div className="relative z-30 flex flex-col items-center text-center p-8 max-w-md w-full">
                    {/* The Core */}
                    <div className="relative mb-12 h-32 w-32 flex items-center justify-center">

                        {/* 1. Outer Orbit Ring (Slow Rotate) */}
                        <motion.div
                            className="absolute inset-0 border border-blue-500/20 rounded-full"
                            style={{ borderTopColor: 'rgba(59,130,246,0.6)', borderBottomColor: 'transparent' }}
                            animate={{ rotate: 360 }}
                            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                        />

                        {/* 2. Inner Gyro Ring (Fast Rotate Reverse) */}
                        <motion.div
                            className="absolute inset-2 border border-purple-500/30 rounded-full"
                            style={{ borderLeftColor: 'rgba(168,85,247,0.6)', borderRightColor: 'transparent' }}
                            animate={{ rotate: -360 }}
                            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
                        />

                        {/* 3. The Neural Core (Pulse) */}
                        <div className="relative h-16 w-16">
                            {/* Glow Bloom */}
                            <motion.div
                                className="absolute inset-0 bg-blue-500/40 blur-[20px] rounded-full"
                                animate={{ scale: [1, 1.5, 1], opacity: [0.5, 0.8, 0.5] }}
                                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                            />
                            {/* Solid Core */}
                            <div className="absolute inset-0 bg-gradient-to-tr from-blue-600 to-purple-600 rounded-full shadow-inner border border-white/20 backdrop-blur-sm overflow-hidden">
                                <motion.div
                                    className="absolute inset-0 bg-gradient-to-t from-transparent via-white/20 to-transparent"
                                    animate={{ top: ['-100%', '100%'] }}
                                    transition={{ duration: 1.5, repeat: Infinity, ease: "linear", repeatDelay: 0.5 }}
                                />
                            </div>
                        </div>
                    </div>

                    <h3 className="text-2xl font-light text-white mb-8 tracking-tight flex items-center gap-2">
                        <Sparkles className="w-5 h-5 text-blue-400 animate-pulse" />
                        <span className="bg-clip-text text-transparent bg-gradient-to-r from-white via-blue-100 to-white animate-text-shimmer bg-[length:200%_auto]">
                            Synthesizing Intelligence
                        </span>
                    </h3>

                    {/* PROGRESS MILESTONES (Simulated) */}
                    <div className="w-full space-y-3">
                        <ProgressStep label="Crawling page architecture" delay={0} />
                        <ProgressStep label="Measuring Core Web Vitals" delay={1.5} />
                        <ProgressStep label="Evaluating SEO signals" delay={3.0} />
                        <ProgressStep label="Synthesizing strategic recommendations" delay={5.5} />
                    </div>
                </div>
            </div>

            {/* 2. CONTENT LAYER (Always Rendered, but Skeleton/Hidden if inactive) */}
            <div
                className={clsx(
                    "relative z-10 transition-all duration-700",
                    !isReady ? "opacity-40 scale-[0.99] grayscale" : "opacity-100 scale-100 grayscale-0"
                )}
            >
                {/* We render children BUT masks them with skeleton if not ready to avoid layout shift */}
                {children}
            </div>
        </div>
    );
};

// Internal Progress Step Component
const ProgressStep = ({ label, delay }: { label: string, delay: number }) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: delay, duration: 0.5 }}
            className="flex items-center gap-3 text-sm"
        >
            <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: delay, duration: 0.3 }}
            >
                {/* Animated status circle */}
                <div className="w-4 h-4 rounded-full border border-blue-500/30 flex items-center justify-center">
                    <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: delay + 1.5, type: "spring" }} // 'complete' after 1.5s
                        className="w-1.5 h-1.5 bg-blue-400 rounded-full"
                    />
                </div>
            </motion.div>
            <span className="text-white/60 font-medium">{label}</span>
        </motion.div>
    );
};
