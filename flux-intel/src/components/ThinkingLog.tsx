"use client";

import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, Loader2, XCircle, Clock } from "lucide-react";
import clsx from "clsx";

export type MilestoneStatus = 'pending' | 'active' | 'complete' | 'error';

export interface Milestone {
    id: string;
    message: string;
    status: MilestoneStatus;
    timestamp?: number;
    detail?: string;
}

interface ThinkingLogProps {
    milestones: Milestone[];
    showTimestamps?: boolean;
}

export default function ThinkingLog({ milestones, showTimestamps = false }: ThinkingLogProps) {
    if (milestones.length === 0) return null;

    return (
        <div className="space-y-1 font-mono">
            <AnimatePresence mode="popLayout">
                {milestones.map((milestone, index) => (
                    <motion.div
                        key={milestone.id}
                        initial={{ opacity: 0, x: -4 }}
                        animate={{ opacity: 1, x: 0 }}
                        className="flex items-center gap-3 py-1"
                    >
                        <div className={clsx(
                            "w-1 h-1 rounded-full",
                            milestone.status === 'active' && "bg-[#6B9AC4]",
                            milestone.status === 'complete' && "bg-[#3D8B6E]",
                            milestone.status === 'error' && "bg-[#A85454]",
                            milestone.status === 'pending' && "bg-[#555555]"
                        )} />

                        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
                            <span className={clsx(
                                "text-[11px] tracking-normal",
                                milestone.status === 'active' ? "text-[#E8E8E8]" : "text-[#555555]"
                            )}>
                                {milestone.message}
                            </span>
                            {milestone.detail && (
                                <span className="text-[10px] text-[#555555] lowercase italic">
                                    {milestone.detail}
                                </span>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
