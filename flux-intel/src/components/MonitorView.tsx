"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Activity, Plus, Search, MoreVertical,
    ArrowUpRight, ArrowDownRight, Clock,
    ShieldCheck, AlertTriangle, Trash2
} from 'lucide-react';
import { clsx } from 'clsx';
import { DeepAnalysisReveal } from './DeepAnalysisReveal';

// --- TYPES ---

export interface MonitoredTarget {
    id: string;
    url: string;
    favicon?: string;
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
        timestamp: Date.now() - (11 - i) * 86400000, // Last 12 days
        score: Math.min(100, Math.max(0, baseScore + (Math.random() * 10 - 5)))
    }));
};

// --- COMPONENTS ---

const TrendSparkline = ({ data, color }: { data: { score: number }[], color: string }) => {
    if (!data || data.length < 2) return null;

    const height = 40;
    const width = 120;
    const max = Math.max(...data.map(d => d.score), 100);
    const min = Math.min(...data.map(d => d.score), 0);
    const range = max - min || 1;

    const points = data.map((d, i) => {
        const x = (i / (data.length - 1)) * width;
        const y = height - ((d.score - min) / range) * height;
        return `${x},${y}`;
    }).join(' ');

    return (
        <svg width={width} height={height} className="overflow-visible">
            <polyline
                points={points}
                fill="none"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-80"
            />
            <circle cx={(data.length - 1) / (data.length - 1) * width} cy={height - ((data[data.length - 1].score - min) / range) * height} r="3" fill={color} />
        </svg>
    );
};

const SurveillanceCard = ({ target, onDelete }: { target: MonitoredTarget; onDelete: (id: string) => void }) => {
    const isHealthy = target.strategicIndex >= 80;
    const isCritical = target.strategicIndex < 50;
    const color = isHealthy ? '#10B981' : isCritical ? '#EF4444' : '#F59E0B';
    const statusColor = isHealthy ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20' : isCritical ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20';

    const lastScore = target.history[target.history.length - 2]?.score || target.strategicIndex;
    const delta = target.strategicIndex - lastScore;

    return (
        <motion.div
            layout
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="group bg-[#151921] border border-white/[0.06] rounded-xl p-4 flex items-center gap-6 hover:border-white/[0.1] transition-all"
        >
            {/* 1. IDENTITY */}
            <div className="flex items-center gap-4 flex-1 min-w-[200px]">
                <div className={clsx("w-10 h-10 rounded-lg flex items-center justify-center border", statusColor)}>
                    <Activity className="w-5 h-5" />
                </div>
                <div>
                    <h3 className="font-bold text-white text-sm truncate">{target.url.replace(/^https?:\/\//, '')}</h3>
                    <div className="flex items-center gap-2 text-xs text-[#64748B]">
                        <Clock className="w-3 h-3" />
                        <span>Daily Scan</span>
                        <span className="text-[#334155]">•</span>
                        <span>{new Date(target.lastScan).toLocaleDateString()}</span>
                    </div>
                </div>
            </div>

            {/* 2. TREND VISUALIZATION */}
            <div className="hidden md:block w-32 h-10 relative">
                <TrendSparkline data={target.history} color={color} />
            </div>

            {/* 3. METRICS */}
            <div className="flex items-center gap-8">
                <div className="text-right">
                    <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1">Strat. Index</div>
                    <div className="text-2xl font-bold text-white flex items-center justify-end gap-2">
                        {target.strategicIndex}
                        {delta !== 0 && (
                            <span className={clsx("text-xs font-medium px-1.5 py-0.5 rounded flex items-center", delta > 0 ? "bg-emerald-500/20 text-emerald-400" : "bg-red-500/20 text-red-400")}>
                                {delta > 0 ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                                {Math.abs(Math.round(delta))}
                            </span>
                        )}
                    </div>
                </div>

                <div className="hidden lg:block text-right">
                    <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1">LCP</div>
                    <div className="font-mono text-[#E2E8F0]">{target.metrics.lcp}</div>
                </div>

                <div className="hidden lg:block text-right">
                    <div className="text-[10px] uppercase font-bold text-[#64748B] tracking-wider mb-1">SEO Health</div>
                    <div className="font-mono text-[#E2E8F0]">{target.metrics.seo}%</div>
                </div>
            </div>

            {/* 4. ACTIONS */}
            <button
                onClick={() => onDelete(target.id)}
                className="p-2 text-[#475569] hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
            >
                <Trash2 className="w-4 h-4" />
            </button>
        </motion.div>
    );
};

export const MonitorView = () => {
    const [targets, setTargets] = useState<MonitoredTarget[]>([]);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [newUrl, setNewUrl] = useState('');

    // Load from local storage on mount
    useEffect(() => {
        const saved = localStorage.getItem('flux_monitor_targets');
        if (saved) {
            setTargets(JSON.parse(saved));
        } else {
            // Seed initial demo data
            const demoData: MonitoredTarget[] = [
                {
                    id: '1',
                    url: 'https://example.com',
                    frequency: 'daily',
                    status: 'healthy',
                    lastScan: Date.now() - 3600000,
                    strategicIndex: 92,
                    metrics: { lcp: '1.2s', cls: '0.00', seo: 95 },
                    history: generateMockHistory(92)
                },
                {
                    id: '2',
                    url: 'https://fluxninelabs.com',
                    frequency: 'daily',
                    status: 'warning',
                    lastScan: Date.now() - 86400000,
                    strategicIndex: 65,
                    metrics: { lcp: '3.4s', cls: '0.15', seo: 70 },
                    history: generateMockHistory(65)
                }
            ];
            setTargets(demoData);
            localStorage.setItem('flux_monitor_targets', JSON.stringify(demoData));
        }
    }, []);

    const addTarget = (e: React.FormEvent) => {
        e.preventDefault();

        let targetUrl = newUrl.trim();
        if (targetUrl && !/^https?:\/\//i.test(targetUrl)) {
            targetUrl = `https://${targetUrl}`;
        }

        if (!targetUrl) return;

        // Create new mock target
        const baseScore = Math.floor(Math.random() * 40) + 60; // Random 60-100
        const newTarget: MonitoredTarget = {
            id: Date.now().toString(),
            url: targetUrl,
            frequency: 'daily',
            status: baseScore > 80 ? 'healthy' : baseScore < 50 ? 'critical' : 'warning',
            lastScan: Date.now(),
            strategicIndex: baseScore,
            metrics: {
                lcp: (Math.random() * 3 + 0.5).toFixed(1) + 's',
                cls: (Math.random() * 0.2).toFixed(2),
                seo: Math.floor(Math.random() * 30) + 70
            },
            history: generateMockHistory(baseScore)
        };

        const updated = [newTarget, ...targets];
        setTargets(updated);
        localStorage.setItem('flux_monitor_targets', JSON.stringify(updated));
        setNewUrl('');
        setIsAddModalOpen(false);
    };

    const deleteTarget = (id: string) => {
        const updated = targets.filter(t => t.id !== id);
        setTargets(updated);
        localStorage.setItem('flux_monitor_targets', JSON.stringify(updated));
    };

    return (
        <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500">
            {/* HEADER */}
            <div className="flex items-center justify-between border-b border-white/[0.06] pb-6">
                <div>
                    <h2 className="text-2xl font-bold text-white tracking-tight flex items-center gap-3">
                        <ShieldCheck className="w-6 h-6 text-emerald-400" />
                        Active Surveillance
                    </h2>
                    <p className="text-[#94A3B8] mt-1 text-sm">
                        Monitoring {targets.length} endpoints for performance regression and drift.
                    </p>
                </div>
                <button
                    onClick={() => setIsAddModalOpen(true)}
                    className="flex items-center gap-2 bg-[#38BDF8]/10 text-[#38BDF8] border border-[#38BDF8]/20 px-4 py-2 rounded-lg hover:bg-[#38BDF8]/20 transition-all font-medium text-sm"
                >
                    <Plus className="w-4 h-4" />
                    Deploy Monitor
                </button>
            </div>

            {/* LIST */}
            <div className="space-y-4">
                <AnimatePresence mode="popLayout">
                    {targets.map(target => (
                        <SurveillanceCard key={target.id} target={target} onDelete={deleteTarget} />
                    ))}
                </AnimatePresence>

                {targets.length === 0 && (
                    <div className="text-center py-20 border border-dashed border-white/[0.06] rounded-2xl">
                        <Activity className="w-12 h-12 text-[#334155] mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-white">No Active Monitors</h3>
                        <p className="text-[#64748B] text-sm mt-2">Deploy a new monitor to begin surveillance.</p>
                    </div>
                )}
            </div>

            {/* ADD MODAL */}
            <AnimatePresence>
                {isAddModalOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                        onClick={() => setIsAddModalOpen(false)}
                    >
                        <motion.div
                            initial={{ scale: 0.95, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.95, opacity: 0 }}
                            className="bg-[#0F1115] border border-white/[0.1] w-full max-w-md rounded-xl shadow-2xl overflow-hidden p-6"
                            onClick={e => e.stopPropagation()}
                        >
                            <h3 className="text-lg font-bold text-white mb-4">Deploy New Monitor</h3>
                            <form onSubmit={addTarget} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-[#64748B] uppercase tracking-wider mb-2">Target URL</label>
                                    <input
                                        type="text"
                                        required
                                        placeholder="https://example.com"
                                        value={newUrl}
                                        onChange={e => setNewUrl(e.target.value)}
                                        className="w-full bg-[#1A1E26] border border-white/[0.08] rounded-lg px-4 py-2.5 text-white placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]/50"
                                    />
                                </div>
                                <div className="flex justify-end gap-3 mt-6">
                                    <button
                                        type="button"
                                        onClick={() => setIsAddModalOpen(false)}
                                        className="px-4 py-2 text-sm text-[#94A3B8] hover:text-white transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-4 py-2 bg-[#38BDF8] text-[#0B0F14] text-sm font-bold rounded-lg hover:bg-[#38BDF8]/90 transition-colors"
                                    >
                                        Initialize Scan
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};
