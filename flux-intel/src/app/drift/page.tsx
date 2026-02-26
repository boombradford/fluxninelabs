"use client";

import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import clsx from 'clsx';
import { Activity, AlertTriangle, Database, Globe, RefreshCw } from 'lucide-react';

type Severity = 'High' | 'Medium' | 'Low';

interface DriftSnapshot {
    url: string;
    domain: string;
    timestamp: string;
    psi?: {
        lighthouseScore: number;
        lcp: string;
        inp: string;
        cls: string;
        fcp?: string;
        tti?: string;
        speedIndex: string;
        seoScore?: number;
        accessibilityScore?: number;
        bestPracticesScore?: number;
    };
    crux?: {
        lcp?: string;
        inp?: string;
        cls?: string;
        dataSource?: string;
        collectionPeriod?: { firstDate: string; lastDate: string };
    };
    onPage?: {
        title?: string;
        metaDescription?: string;
        canonical?: string;
        metaRobots?: string;
        xRobotsTag?: string;
        h1?: string[];
        h2Count?: number;
        wordCount?: number;
        topKeywords?: Array<{ term: string; count: number }>;
        ctas?: Array<{ text: string; link: string }>;
    };
    diagnostics?: {
        robotsTxt?: { status: number; sitemapUrls?: string[]; error?: string };
    };
}

interface DriftDelta {
    id: string;
    label: string;
    severity: Severity;
    before: string;
    after: string;
    note?: string;
}

interface DriftAction {
    id: string;
    title: string;
    severity: Severity;
    evidence: string[];
}

interface DriftResponse {
    domain: string;
    status: 'baseline' | 'ok';
    latest: DriftSnapshot;
    previous?: DriftSnapshot;
    deltas: DriftDelta[];
    actions: DriftAction[];
    error?: string;
}

const getSeverityColor = (severity: Severity) => {
    switch (severity) {
        case 'High': return 'text-red-300 border-red-500/30 bg-red-500/10';
        case 'Medium': return 'text-orange-300 border-orange-500/30 bg-orange-500/10';
        default: return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
    }
};

export default function DriftPage() {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<'idle' | 'running' | 'complete'>('idle');
    const [error, setError] = useState<string | null>(null);
    const [data, setData] = useState<DriftResponse | null>(null);

    const runDrift = async () => {
        const trimmed = url.trim();
        if (!trimmed) {
            setError('Please enter a website domain to run Drift.');
            return;
        }

        setStatus('running');
        setError(null);
        setData(null);

        try {
            const res = await fetch('/api/drift/run', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: trimmed })
            });
            const payload = await res.json();
            if (!res.ok) throw new Error(payload.error || 'Drift run failed');
            setData(payload);
            setStatus('complete');
        } catch (err) {
            const message = err instanceof Error ? err.message : 'Drift run failed';
            setError(message);
            setStatus('idle');
        }
    };

    const latest = data?.latest;
    const previous = data?.previous;

    return (
        <div className="min-h-screen bg-[#030712] text-white">
            <header className="h-14 border-b border-[rgba(255,255,255,0.06)] bg-[#0B0F14] px-6 flex items-center justify-between">
                <div className="flex items-center gap-3.5">
                    <img src="/brand/logo.jpg" alt="Flux Nine Labs" className="w-6 h-6 object-contain" />
                    <span className="text-[14px] font-semibold text-[#f8fafc] tracking-tight">Project Drift</span>
                </div>
                <div className="text-[10px] font-mono text-white/40 uppercase tracking-[0.2em]">Manual Run</div>
            </header>

            <main className="max-w-6xl mx-auto px-6 py-10 space-y-10">
                <section className="space-y-6">
                    <div className="flex items-center gap-3">
                        <div className="w-2 h-2 rounded-full bg-[#f06c5b] shadow-[0_0_10px_rgba(240,108,91,0.4)]" />
                        <span className="text-[12px] font-bold text-white/40 uppercase tracking-[0.25em]">Change Monitor</span>
                    </div>
                    <h1 className="text-4xl font-bold tracking-tight text-[#f8fafc]">Drift Report</h1>
                    <p className="text-[15px] text-[#94a3b8] max-w-2xl">
                        Track week-over-week changes across PSI, CrUX, on-page SEO, and CTA clarity. Every callout is grounded in real data.
                    </p>

                    <div className="flex flex-col md:flex-row gap-3">
                        <input
                            type="text"
                            value={url}
                            onChange={(e) => {
                                if (error) setError(null);
                                setUrl(e.target.value);
                            }}
                            placeholder="domain.com"
                            className="flex-1 px-4 py-3 bg-white/[0.03] border border-white/[0.1] rounded-xl text-white focus:outline-none"
                            aria-label="Website domain"
                        />
                        <button
                            onClick={runDrift}
                            className="px-6 py-3 bg-[#f06c5b] text-white font-bold text-[12px] tracking-widest uppercase rounded-xl hover:bg-[#ff7d6d] transition-all"
                        >
                            Run Drift
                        </button>
                    </div>
                    {error && (
                        <div className="p-4 border border-red-500/20 bg-red-500/10 rounded-lg flex items-start gap-3">
                            <AlertTriangle className="w-4 h-4 text-red-400" />
                            <span className="text-sm text-red-200">{error}</span>
                        </div>
                    )}
                </section>

                {status === 'running' && (
                    <div className="flex items-center gap-3 text-white/60 text-sm">
                        <RefreshCw className="w-4 h-4 animate-spin" />
                        Running Drift scan...
                    </div>
                )}

                <AnimatePresence>
                    {data && (
                        <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="space-y-10"
                        >
                            <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                <div className="glass-card p-5 space-y-2">
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Domain</div>
                                    <div className="text-white font-semibold">{data.domain}</div>
                                </div>
                                <div className="glass-card p-5 space-y-2">
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Latest Run</div>
                                    <div className="text-white/80">{latest?.timestamp ? new Date(latest.timestamp).toLocaleString() : 'N/A'}</div>
                                </div>
                                <div className="glass-card p-5 space-y-2">
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Previous Run</div>
                                    <div className="text-white/80">{previous?.timestamp ? new Date(previous.timestamp).toLocaleString() : 'Baseline (first run)'}</div>
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Activity className="w-4 h-4 text-[#f06c5b]" />
                                    <h2 className="text-lg font-semibold text-[#E8E8E8] tracking-tight">Top Drift Signals</h2>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {data.deltas.length === 0 && (
                                        <div className="glass-card p-5 text-white/60">No significant deltas detected yet.</div>
                                    )}
                                    {data.deltas.map(delta => (
                                        <div key={delta.id} className="glass-card p-5 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className={clsx("text-[10px] font-bold uppercase tracking-[0.15em]", getSeverityColor(delta.severity))}>{delta.severity}</span>
                                                <span className="text-white/70 text-sm font-semibold">{delta.label}</span>
                                            </div>
                                            <div className="text-xs text-white/50">Before: {delta.before}</div>
                                            <div className="text-xs text-white/50">After: {delta.after}</div>
                                            {delta.note && <div className="text-xs text-white/40">{delta.note}</div>}
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="space-y-4">
                                <div className="flex items-center gap-3">
                                    <Database className="w-4 h-4 text-[#f06c5b]" />
                                    <h2 className="text-lg font-semibold text-[#E8E8E8] tracking-tight">Actionable Next Steps</h2>
                                </div>
                                <div className="space-y-4">
                                    {data.actions.length === 0 && (
                                        <div className="glass-card p-5 text-white/60">No actions generated yet.</div>
                                    )}
                                    {data.actions.map(action => (
                                        <div key={action.id} className="glass-card p-5 space-y-3">
                                            <div className="flex items-center gap-3">
                                                <span className={clsx("text-[10px] font-bold uppercase tracking-[0.15em]", getSeverityColor(action.severity))}>{action.severity}</span>
                                                <span className="text-white font-semibold">{action.title}</span>
                                            </div>
                                            <div className="grid grid-cols-1 gap-2 text-[11px] text-white/60">
                                                {action.evidence.map((item, idx) => (
                                                    <div key={`${action.id}-ev-${idx}`}>{item}</div>
                                                ))}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </section>

                            <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="glass-card p-5 space-y-3">
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Performance (Latest)</div>
                                    <div className="text-sm text-white/70">PSI Score: {latest?.psi?.lighthouseScore ?? 'N/A'}</div>
                                    <div className="text-sm text-white/70">LCP: {latest?.psi?.lcp || 'N/A'}</div>
                                    <div className="text-sm text-white/70">INP: {latest?.psi?.inp || 'N/A'}</div>
                                    <div className="text-sm text-white/70">CLS: {latest?.psi?.cls || 'N/A'}</div>
                                </div>
                                <div className="glass-card p-5 space-y-3">
                                    <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">On-Page (Latest)</div>
                                    <div className="text-sm text-white/70">Title: {latest?.onPage?.title || 'N/A'}</div>
                                    <div className="text-sm text-white/70">H1: {latest?.onPage?.h1?.join(' | ') || 'N/A'}</div>
                                    <div className="text-sm text-white/70">CTAs: {latest?.onPage?.ctas?.map(c => c.text).join(' | ') || 'N/A'}</div>
                                </div>
                            </section>

                            <section className="glass-card p-5 space-y-3">
                                <div className="flex items-center gap-3 text-white/60 text-sm">
                                    <Globe className="w-4 h-4 text-[#f06c5b]" />
                                    Latest URL: {latest?.url || 'N/A'}
                                </div>
                            </section>
                        </motion.div>
                    )}
                </AnimatePresence>
            </main>
        </div>
    );
}
