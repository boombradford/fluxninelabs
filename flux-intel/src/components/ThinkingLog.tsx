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
    detail?: string; // Optional additional info
}

interface ThinkingLogProps {
    milestones: Milestone[];
    showTimestamps?: boolean;
}

const StatusIcon = ({ status }: { status: MilestoneStatus }) => {
    switch (status) {
        case 'pending':
            return <Clock className="w-4 h-4 text-gray-500" />;
        case 'active':
            return (
                <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                >
                    <Loader2 className="w-4 h-4 text-blue-500" />
                </motion.div>
            );
        case 'complete':
            return <CheckCircle2 className="w-4 h-4 text-green-500" />;
        case 'error':
            return <XCircle className="w-4 h-4 text-red-500" />;
    }
};

const formatTimestamp = (timestamp?: number) => {
    if (!timestamp) return '';
    const seconds = Math.floor((Date.now() - timestamp) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    return `${Math.floor(seconds / 60)}m ago`;
};

export default function ThinkingLog({ milestones, showTimestamps = false }: ThinkingLogProps) {
    if (milestones.length === 0) return null;

    return (
        <div className="space-y-3">
            <AnimatePresence mode="popLayout">
                {milestones.map((milestone, index) => (
                    <motion.div
                        key={milestone.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3, delay: index * 0.05 }}
                        className={clsx(
                            "flex items-start gap-3 p-4 rounded-lg border transition-all",
                            milestone.status === 'active' && "bg-blue-500/5 border-blue-500/20",
                            milestone.status === 'complete' && "bg-green-500/5 border-green-500/20",
                            milestone.status === 'error' && "bg-red-500/5 border-red-500/20",
                            milestone.status === 'pending' && "bg-gray-500/5 border-gray-500/10"
                        )}
                    >
                        <div className="flex items-center justify-center w-4 h-4 mt-0.5">
                            <StatusIcon status={milestone.status} />
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-2">
                                <p className={clsx(
                                    "text-sm font-medium",
                                    milestone.status === 'active' && "text-blue-400",
                                    milestone.status === 'complete' && "text-green-400",
                                    milestone.status === 'error' && "text-red-400",
                                    milestone.status === 'pending' && "text-gray-500"
                                )}>
                                    {milestone.message}
                                </p>
                                {showTimestamps && milestone.timestamp && (
                                    <span className="text-xs text-gray-500 font-mono whitespace-nowrap">
                                        {formatTimestamp(milestone.timestamp)}
                                    </span>
                                )}
                            </div>
                            {milestone.detail && (
                                <p className="text-xs text-gray-400 mt-1">
                                    {milestone.detail}
                                </p>
                            )}
                        </div>
                    </motion.div>
                ))}
            </AnimatePresence>
        </div>
    );
}
