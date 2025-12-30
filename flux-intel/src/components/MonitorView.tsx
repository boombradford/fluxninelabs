"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Plus, Search, MoreVertical,
    ArrowUpRight, ArrowDownRight, Clock,
    ShieldCheck, AlertTriangle, Trash2, Globe
} from 'lucide-react';
import { clsx } from 'clsx';

// --- TYPES ---

export interface MonitoredTarget {
    id: string;
    url: string;
    frequency: 'daily' | 'weekly';
    status: 'healthy' | 'warning' | 'critical';
    lastScan: number;
    strategicIndex: number;
    metrics: {
        lcp: string;
        cls: string;
        seo: number;
    };
    history: {
        timestamp: number;
        score: number;
    }[];
}

// --- MOCK DATA GENERATOR ---
const generateMockHistory = (baseScore: number) => {
    return Array.from({ length: 12 }).map((_, i) => ({
        timestamp: Date.now() - (11 - i) * 86400000,
        score: Math.min(100, Math.max(0, baseScore + (Math.random() * 8 - 4)))
    }));
};

const TrendSparkline = ({ data, color }: { data: { score: number }[], color: string }) => {
    if (!data || data.length < 2) return null;
    const height = 24;
    const width = 80;
    const max = Math.max(...data.map(d => d.score), 100);
    const min = Math.min(...data.map(d => d.score), 0);
    const range = max - min || 1;
    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.score - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible opacity-50">
            <polyline points={points} fill="none" stroke={color} strokeWidth="1" />
        </svg>
    );
};

const SurveillanceRow = ({ target, onDelete }: { target: MonitoredTarget; onDelete: (id: string) => void }) => {
    const isHealthy = target.strategicIndex >= 80;
    const isCritical = target.strategicIndex < 50;
    const color = isHealthy ? '#10b981' : isCritical ? '#f06c5b' : '#f59e0b';

    return (
        <motion.div
            layout
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-6 px-4 py-3 border-b border-[rgba(255,255,255,0.04)] hover:bg-white/[0.02] transition-colors group"
        >
            <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: color }} />

            <div className="flex-1 min-w-0">
                <div className="text-[13px] font-medium text-[#f8fafc] truncate">
                    {target.url.replace(/^https?:\/\//, '')}
                </div>
            </div>

            <div className="hidden md:block">
                <TrendSparkline data={target.history} color={color} />
            </div>

            <div className="w-16 text-right">
                <div className="text-[13px] font-semibold text-[#f8fafc]">{target.strategicIndex}</div>
            </div>

            <div className="w-8 flex justify-end">
                <button
                    onClick={() => onDelete(target.id)}
                    className="opacity-0 group-hover:opacity-100 p-1 text-[#555555] hover:text-[#A85454] transition-all"
                >
                    <Trash2 className="w-3 h-3" />
                </button>
            </div>
        </motion.div>
    );
};

export const MonitorView = () => {
    const [targets, setTargets] = useState<MonitoredTarget[]>([]);

    useEffect(() => {
        const saved = localStorage.getItem('flux_monitor_targets');
        if (saved) {
            setTargets(JSON.parse(saved));
        } else {
            const demoData: MonitoredTarget[] = [
                {
                    id: '1',
                    url: 'stripe.com',
                    frequency: 'daily',
                    status: 'healthy',
                    lastScan: Date.now() - 3600000,
                    strategicIndex: 94,
                    metrics: { lcp: '0.8s', cls: '0.00', seo: 98 },
                    history: generateMockHistory(94)
                },
                {
                    id: '2',
                    url: 'linear.app',
                    frequency: 'daily',
                    status: 'healthy',
                    lastScan: Date.now() - 86400000,
                    strategicIndex: 88,
                    metrics: { lcp: '1.2s', cls: '0.01', seo: 92 },
                    history: generateMockHistory(88)
                }
            ];
            setTargets(demoData);
            localStorage.setItem('flux_monitor_targets', JSON.stringify(demoData));
        }
    }, []);

    const deleteTarget = (id: string) => {
        const updated = targets.filter(t => t.id !== id);
        setTargets(updated);
        localStorage.setItem('flux_monitor_targets', JSON.stringify(updated));
    };

    return (
        <div className="glass-card overflow-hidden">
            <div className="px-6 py-4 border-b border-white/[0.08] bg-white/[0.02] flex justify-between items-center text-[10px] uppercase font-bold tracking-[0.15em] text-white/30">
                <span>Active Monitoring</span>
                <span className="text-[#10b981]">Network Nominal</span>
            </div>
            <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                {targets.map(target => (
                    <SurveillanceRow key={target.id} target={target} onDelete={deleteTarget} />
                ))}
                {targets.length === 0 && (
                    <div className="px-4 py-12 text-center text-[12px] font-medium text-white/20">
                        No active domains identified
                    </div>
                )}
            </div>
        </div>
    );
};
