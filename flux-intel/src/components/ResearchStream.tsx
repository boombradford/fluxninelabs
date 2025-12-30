"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import clsx from "clsx";

// Process-oriented language, not AI theater
const SCAN_STEPS = [
    { id: 'resolve', label: "Resolving target", detail: "DNS lookup complete" },
    { id: 'headers', label: "Reading headers", detail: "Response validated" },
    { id: 'content', label: "Extracting content", detail: "Primary content isolated" },
    { id: 'structure', label: "Mapping structure", detail: "Semantic hierarchy indexed" },
    { id: 'performance', label: "Measuring performance", detail: "Core vitals captured" },
    { id: 'signals', label: "Compiling signals", detail: "Data synthesis in progress" },
];

const DEEP_STEPS = [
    { id: 'expand', label: "Expanding scope", detail: "Sub-pages identified" },
    { id: 'cross-ref', label: "Cross-referencing", detail: "Messaging consistency check" },
    { id: 'benchmark', label: "Benchmarking", detail: "Industry comparisons loaded" },
    { id: 'synthesis', label: "Synthesizing findings", detail: "Strategic analysis underway" },
    { id: 'assembly', label: "Assembling report", detail: "Tactical fixes prioritized" },
];

export default function ReasoningLog({ status, centered = false }: { status: string, centered?: boolean }) {
    const [activeSteps, setActiveSteps] = useState<number[]>([]);
    const steps = status === 'analyzing_deep' ? DEEP_STEPS : SCAN_STEPS;

    useEffect(() => {
        if (status === 'idle') {
            setActiveSteps([]);
            return;
        }

        if (status === 'analyzing_deep') {
            setActiveSteps([0]);
        } else {
            setActiveSteps([]);
        }

        const interval = setInterval(() => {
            setActiveSteps(prev => {
                if (prev.length >= steps.length) return prev;
                return [...prev, prev.length];
            });
        }, status === 'analyzing_deep' ? 2500 : 1200);

        return () => clearInterval(interval);
    }, [status, steps.length]);

    return (
        <div className={clsx(
            "w-full",
            centered ? "max-w-2xl mx-auto" : "max-w-xs"
        )}>
            {/* Contextual Alignment */}
            <div className={clsx(
                "space-y-4",
                centered ? "flex flex-col items-center" : "space-y-1"
            )}>
                <AnimatePresence mode="popLayout">
                    {activeSteps.slice(centered ? -8 : -5).map((stepIdx, i) => {
                        const step = steps[stepIdx];
                        if (!step) return null;
                        const isLast = stepIdx === activeSteps[activeSteps.length - 1];

                        return (
                            <motion.div
                                key={step.id + (status === 'analyzing_deep' ? '-deep' : '')}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{
                                    opacity: isLast ? 1 : 0.3,
                                    y: 0,
                                    scale: isLast ? 1.05 : 1
                                }}
                                transition={{ duration: 0.4 }}
                                className={clsx(
                                    "flex items-center gap-4",
                                    centered && "flex-col text-center"
                                )}
                            >
                                {/* indicator */}
                                <div className={clsx(
                                    "rounded-full transition-all duration-700",
                                    centered ? "w-2 h-2" : "w-1.5 h-1.5",
                                    isLast ? "bg-[#f06c5b] shadow-[0_0_15px_rgba(240,108,91,0.6)]" : "bg-white/10"
                                )} />

                                {/* Typography */}
                                <div className={clsx(
                                    "flex flex-col",
                                    centered ? "items-center" : ""
                                )}>
                                    <span className={clsx(
                                        "font-medium tracking-tight transition-colors duration-700",
                                        centered ? "text-[16px]" : "text-[12px]",
                                        isLast ? "text-[#f8fafc]" : "text-white/20"
                                    )}>
                                        {step.label}
                                    </span>
                                    {centered && isLast && (
                                        <span className="text-[12px] text-white/40 mt-1 uppercase tracking-widest font-semibold">
                                            {step.detail}
                                        </span>
                                    )}
                                </div>
                            </motion.div>
                        );
                    })}
                </AnimatePresence>
            </div>
        </div>
    );
}

export function DeepScanningLine() {
    return null;
}
