"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import clsx from 'clsx';
import { Terminal, ShieldCheck, Microscope, Zap, Database, Globe, Search, Lock, Cpu, Target, AlertTriangle, FileText, CheckCircle2, Accessibility } from 'lucide-react';

interface ThinkingLogProps {
    status: 'idle' | 'scouting' | 'analyzing_deep' | 'complete';
}

const SCOUTING_LOGS = [
    { text: "Initializing Flux Engine v2.4...", icon: Terminal },
    { text: "Resolving target host DNS...", icon: Globe },
    { text: "Establishing secure handshake...", icon: Lock },
    { text: "Bypassing edge cache...", icon: Zap },
    { text: "Downloading raw HTML document...", icon: Database },
    { text: "Parsing DOM tree structure...", icon: Search },
    { text: "Extracting meta tags and schema...", icon: Microscope },
    { text: "Identifying primary content blocks...", icon: Cpu },
    { text: "Detecting navigation architecture...", icon: Search },
    { text: "Analyzing header hierarchy (H1-H6)...", icon: Search },
    { text: "Isolating conversion elements (CTA)...", icon: Target },
];

const DEEP_ANALYSIS_LOGS = [
    { text: "Injecting strategic analysis agents...", icon: ShieldCheck },
    { text: "Querying Google PageSpeed Insights API...", icon: Zap },
    { text: "Simulating mobile 4G network latency...", icon: Globe },
    { text: "Measuring Largest Contentful Paint (LCP)...", icon: Zap },
    { text: "Calculating Cumulative Layout Shift (CLS)...", icon: Zap },
    { text: "Evaluating visual hierarchy balance...", icon: Microscope },
    { text: "Detecting semantic disconnects...", icon: AlertTriangle },
    { text: "Cross-referencing SEO best practices...", icon: Search },
    { text: "Analyzing accessibility tokens...", icon: Accessibility },
    { text: "Synthesizing tactical execution plan...", icon: Cpu },
    { text: "Formatting final evidence report...", icon: FileText },
    { text: "Finalizing strategic roadmap...", icon: CheckCircle2 },
];

const ThinkingLog: React.FC<ThinkingLogProps> = ({ status }) => {
    const [logs, setLogs] = useState<typeof SCOUTING_LOGS>([]);
    const [currentPool, setCurrentPool] = useState<typeof SCOUTING_LOGS>([]);

    // Reset when status changes
    useEffect(() => {
        if (status === 'scouting') {
            setLogs([]);
            setCurrentPool(SCOUTING_LOGS);
        } else if (status === 'analyzing_deep') {
            setCurrentPool(DEEP_ANALYSIS_LOGS);
        }
    }, [status]);

    // Stream logs
    useEffect(() => {
        if (status === 'idle' || status === 'complete') return;

        let index = 0;
        const interval = setInterval(() => {
            if (index < currentPool.length) {
                setLogs(prev => {
                    const newLogs = [...prev, currentPool[index]];
                    // Keep only last 4 logs to prevent overflow/clutter
                    if (newLogs.length > 5) return newLogs.slice(newLogs.length - 5);
                    return newLogs;
                });
                index++;
            }
        }, 800); // Add a new log every 800ms

        return () => clearInterval(interval);
    }, [currentPool, status]);

    return (
        <div className="w-full max-w-md mx-auto mt-8 font-mono text-sm h-[160px] relative overflow-hidden mask-linear-gradient-to-t">
            {/* Fade out top */}
            <div className="absolute top-0 left-0 right-0 h-12 bg-gradient-to-b from-[#0B0F14] to-transparent z-10 pointer-events-none" />

            <div className="flex flex-col justify-end h-full pb-2 space-y-2">
                <AnimatePresence mode='popLayout'>
                    {logs.map((log, i) => {
                        const Icon = log.icon;
                        const isLast = i === logs.length - 1;

                        return (
                            <motion.div
                                key={`${log.text}-${i}`}
                                initial={{ opacity: 0, x: -20, height: 0 }}
                                animate={{
                                    opacity: isLast ? 1 : 0.4, // Dim older logs
                                    x: 0,
                                    height: 'auto',
                                    scale: isLast ? 1 : 0.98
                                }}
                                exit={{ opacity: 0, height: 0 }}
                                transition={{ duration: 0.3 }}
                                className={clsx(
                                    "flex items-center gap-3 px-4 py-1.5 rounded-full border w-fit mx-auto transition-colors duration-500",
                                    isLast
                                        ? "bg-[#1A1E26] border-emerald-500/30 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                                        : "bg-transparent border-transparent text-[#64748B]"
                                )}
                            >
                                <Icon className={clsx("w-3.5 h-3.5", isLast ? "animate-pulse" : "opacity-50")} />
                                <span className="tracking-tight">{log.text}</span>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ThinkingLog;
