import { motion } from 'framer-motion';
import React from 'react';

interface ScanPanelProps {
    text?: string;
    progress?: number;
    large?: boolean;
}

export const CyberLoader = ({ text = "Scanning", progress = 0, large = false }: ScanPanelProps) => {
    return (
        <div className="w-full">
            {/* Instrumented Panel Frame */}
            <div className={clsx(
                "glass-card overflow-hidden",
                large ? "ring-1 ring-white/10" : ""
            )}>
                {/* Panel Header */}
                <div className={clsx(
                    "flex items-center justify-between border-b border-white/[0.04]",
                    large ? "px-6 py-4" : "px-4 py-2"
                )}>
                    <span className={clsx(
                        "uppercase font-semibold text-white/30 tracking-[0.2em]",
                        large ? "text-[12px]" : "text-[10px]"
                    )}>
                        Process Engine
                    </span>
                    <div className="flex items-center gap-3">
                        <span className={clsx(
                            "uppercase font-semibold text-[#f06c5b] tracking-widest",
                            large ? "text-[12px]" : "text-[10px]"
                        )}>
                            Active
                        </span>
                        <motion.div
                            className="w-2 h-2 rounded-full bg-[#f06c5b] shadow-[0_0_10px_rgba(240,108,91,0.5)]"
                            animate={{ opacity: [0.4, 1, 0.4] }}
                            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                        />
                    </div>
                </div>

                {/* Panel Content */}
                <div className={clsx(
                    large ? "px-10 py-12" : "px-6 py-8"
                )}>
                    {/* Status Line */}
                    <div className={clsx(
                        "flex items-baseline gap-2",
                        large ? "mb-10" : "mb-6"
                    )}>
                        <span className={clsx(
                            "text-[#E8E8E8] font-medium tracking-tight",
                            large ? "text-[24px]" : "text-[14px]"
                        )}>
                            {text}
                        </span>
                        <motion.span
                            className={clsx(
                                "text-white/20 font-medium",
                                large ? "text-[24px]" : "text-[14px]"
                            )}
                            animate={{ opacity: [0, 1, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                        >
                            ...
                        </motion.span>
                    </div>

                    {/* Progress Track */}
                    <div className={clsx(
                        "bg-white/[0.04] relative overflow-hidden rounded-full",
                        large ? "h-[4px]" : "h-[2px]"
                    )}>
                        <motion.div
                            className="absolute left-0 top-0 h-full bg-[#f06c5b]"
                            initial={{ width: "0%" }}
                            animate={{ width: ["0%", "60%", "30%", "80%", "45%", "90%", "75%"] }}
                            transition={{
                                duration: 8,
                                repeat: Infinity,
                                ease: "easeInOut"
                            }}
                        />
                    </div>
                </div>

                {/* Panel Footer - Metrics */}
                <div className={clsx(
                    "flex items-center justify-between border-t border-white/[0.04] bg-white/[0.01]",
                    large ? "px-6 py-4" : "px-4 py-2"
                )}>
                    <span className="text-[10px] uppercase font-semibold text-white/20 tracking-wider">
                        Latency: <span className="text-white/40 font-mono">12ms</span>
                    </span>
                    <span className="text-[10px] uppercase font-semibold text-white/20 tracking-wider">
                        Streams: <span className="text-white/40 font-mono">7/12</span>
                    </span>
                </div>
            </div>
        </div>
    );
};
