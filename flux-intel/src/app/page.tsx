"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Loader2, Activity, Settings, Target, LayoutTemplate, Share2, RefreshCw,
    Microscope, ShieldCheck, X, Maximize2, Zap, AlertTriangle, Info
} from 'lucide-react';
import clsx from 'clsx';
import IntelligentTypewriter from '../components/IntelligentTypewriter';
import ThinkingLog, { Milestone } from '../components/ThinkingLog';

// --- TYPES ---
interface PerformanceMetrics {
    lighthouseScore: number;
    lcp: string;
    inp: string;
    cls: string;
    speedIndex: string;
    isEstimate?: boolean; // NEW: Flag to indicate heuristic data
}

interface CoreSignal {
    grade?: string;
    score?: number;
    label?: string;
    summary?: string;
    rationale?: string;
    whyItMatters?: string;
    quickWin?: string;
}

interface TacticalFix {
    id: string;
    title: string;
    category?: 'SEO' | 'Content' | 'UX' | 'Performance' | 'Accessibility';
    problem: string;
    recommendation: string;
    impact: 'High' | 'Medium' | 'Low';
    severity: 'Critical' | 'High' | 'Medium' | 'Low';
    effortHours: number;
    owners: string[];
    expectedOutcome: string;
    validationCriteria?: string;
    evidence?: Array<{ label: string; value: string }>;
}

interface StrategicSection {
    summary: string;
    actions: string[];
}

interface AnalysisReport {
    meta: {
        url: string;
        scanTimestamp: string;
        performance?: PerformanceMetrics;
    };
    scannedPages?: string[];
    coreSignals: {
        vibeScore: CoreSignal;
        headlineSignal: CoreSignal;
        visualArchitecture: CoreSignal;
    };
    tacticalFixes?: TacticalFix[]; // Optional initially in Fast Mode
    strategicIntelligence?: {
        onSiteStrategy: StrategicSection;
        offSiteGrowth: StrategicSection;
        aiOpportunities: StrategicSection;
    };
    clientReadySummary: {
        executiveSummary: string;
        top3WinsThisWeek: string[];
    };
    type?: 'fast' | 'deep'; // Track which stage we are at
}

// --- HELPERS ---
const getGradeColor = (grade: string = 'C') => {
    const g = grade?.toUpperCase().charAt(0) || 'C';
    if (g === 'A') return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    if (g === 'B') return 'text-blue-400 bg-blue-500/10 border-blue-500/20';
    if (g === 'C') return 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    return 'text-red-400 bg-red-500/10 border-red-500/20';
};

const getImpactColor = (impact: string) => {
    switch (impact) {
        case 'High': return 'text-red-300 border-red-500/30 bg-red-500/10';
        case 'Medium': return 'text-amber-300 border-amber-500/30 bg-amber-500/10';
        default: return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
    }
};

const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 50) return 'text-amber-400';
    return 'text-red-400';
};

const calculateTrustSignal = (fixes?: TacticalFix[]) => {
    if (!fixes || fixes.length === 0) return 0;
    const backedByEvidence = fixes.filter(f => f.evidence && f.evidence.length > 0).length;
    return Math.round((backedByEvidence / fixes.length) * 100);
};



// NEW: Client-Side PSI Fetch Hook
const useClientSidePerformance = (url: string, trigger: boolean) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(false);
    const attemptRef = useRef(0);

    useEffect(() => {
        if (!trigger || !url || metrics || attemptRef.current > 0) return;

        const fetchPSI = async () => {
            setLoading(true);
            attemptRef.current++;
            try {
                // Determine strategy (using public quota to avoid key exposure on client)
                const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile`;
                const res = await fetch(apiUrl);

                if (!res.ok) {
                    const errorData = await res.json().catch(() => null);
                    console.error(`PSI API Error (${res.status}):`, errorData);
                    // Quota exceeded or other API error - fail silently
                    if (res.status === 429) {
                        console.warn('⚠️ PSI API quota exceeded. Performance data unavailable.');
                    }
                    return;
                }

                const data = await res.json();

                if (data.error) {
                    console.error("PSI API Error:", data.error);
                    return; // Fail gracefully without setting metrics
                }

                const score = data.lighthouseResult?.categories?.performance?.score * 100 || 0;
                const aud = data.lighthouseResult?.audits || {};

                setMetrics({
                    lighthouseScore: Math.round(score),
                    lcp: aud['largest-contentful-paint']?.displayValue || 'N/A',
                    inp: aud['interaction-to-next-paint']?.displayValue || 'N/A',
                    cls: aud['cumulative-layout-shift']?.displayValue || 'N/A',
                    speedIndex: aud['speed-index']?.displayValue || 'N/A'
                });
            } catch (e: any) {
                console.warn("Client-side PSI failed:", e?.message || e);
                // Don't throw - just fail silently and show "Data Unavailable" in UI
            } finally {
                setLoading(false);
            }
        };

        fetchPSI();
    }, [url, trigger, metrics]);

    return { metrics, loading };
};

export default function Dashboard() {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<'idle' | 'scouting' | 'analyzing_deep' | 'complete'>('idle');
    const [scanStatusMessage, setScanStatusMessage] = useState('Initializing Flux Engine...');
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'audit' | 'monitor' | 'strategy' | 'settings'>('audit');
    const [selectedSignal, setSelectedSignal] = useState<{ title: string; data: CoreSignal } | null>(null);

    // Client-Side Performance Fetcher (Triggers when report is ready but missing performance)
    const { metrics: clientMetrics, loading: clientMetricsLoading } = useClientSidePerformance(
        report?.meta?.url || '',
        status === 'complete' && !report?.meta?.performance
    );

    // Merge client metrics if available
    const displayPerformance = report?.meta?.performance || clientMetrics;

    // Persistence: Load report from localStorage on mount
    useEffect(() => {
        if (typeof window !== 'undefined') {
            const saved = localStorage.getItem('flux_audit_report');
            if (saved) {
                try {
                    setReport(JSON.parse(saved));
                    setStatus('complete');
                } catch (e) {
                    console.error("Failed to load saved report", e);
                }
            }
            // Clean up any corrupted URL localStorage
            localStorage.removeItem('flux_audit_url');
        }
    }, []);

    const handleSetReport = (newReport: AnalysisReport | null) => {
        setReport(newReport);
        if (typeof window !== 'undefined') {
            if (newReport) localStorage.setItem('flux_audit_report', JSON.stringify(newReport));
            else localStorage.removeItem('flux_audit_report');
        }
    };



    // Loading Sequence Effect
    useEffect(() => {
        if (status !== 'scouting') return;
        const messages = [
            "Initializing Website Scan",
            "Resolving Target Domain...",
            "Extracting **DOM Signals**...",
            "Analyzing **Visual Hierarchy**...",
            "Synthesizing **Final Check**..."
        ];
        let i = 0;
        setScanStatusMessage(messages[0]);
        const interval = setInterval(() => {
            i = (i + 1) % messages.length;
            setScanStatusMessage(messages[i]);
        }, 3500); // 3.5s to allow typewriter to finish
        return () => clearInterval(interval);
    }, [status]);
    const prefetchRef = useRef<Promise<Response> | null>(null);

    // Speculative Prefetch (Hover)
    const prefetchAudit = () => {
        if (!url || status !== 'idle' || prefetchRef.current) return;
        prefetchRef.current = fetch('/api/audit', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ url, mode: 'fast' }),
        });
    };

    const runAudit = async (e?: React.FormEvent, forceRefresh = false) => {
        if (e) e.preventDefault();
        if (!url) return;

        setStatus('scouting');
        setError(null);
        handleSetReport(null);
        setActiveView('audit');

        // Initialize milestones
        setMilestones([
            { id: 'init', message: 'Initializing Flux Engine...', status: 'active', timestamp: Date.now() },
            { id: 'dns', message: 'Resolving domain...', status: 'pending' },
            { id: 'scrape', message: 'Extracting website data...', status: 'pending' },
            { id: 'analyze', message: 'Running AI analysis...', status: 'pending' },
            { id: 'complete', message: 'Generating report...', status: 'pending' }
        ]);

        try {
            // Update: DNS resolved
            setMilestones(m => m.map(mile =>
                mile.id === 'init' ? { ...mile, status: 'complete' } :
                    mile.id === 'dns' ? { ...mile, status: 'active', timestamp: Date.now() } :
                        mile
            ));

            // PHASE 1: FAST PASS (Vibe Check)
            let fastRes;

            // Check for speculative prefetch
            if (prefetchRef.current && !forceRefresh) {
                fastRes = await prefetchRef.current;
                prefetchRef.current = null; // Clear usage
            } else {
                fastRes = await fetch('/api/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url, mode: 'fast', forceRefresh }), // Pass refresh flag
                });
            }

            // Update: Scraped
            setMilestones(m => m.map(mile =>
                mile.id === 'dns' ? { ...mile, status: 'complete' } :
                    mile.id === 'scrape' ? { ...mile, status: 'active', timestamp: Date.now(), detail: 'Parsing HTML, extracting metadata...' } :
                        mile
            ));

            const fastData = await fastRes.json();
            if (!fastRes.ok) throw new Error(fastData.error || 'Initial scan failed');

            // Update: Analyzed
            setMilestones(m => m.map(mile =>
                mile.id === 'scrape' ? { ...mile, status: 'complete' } :
                    mile.id === 'analyze' ? { ...mile, status: 'active', timestamp: Date.now() } :
                        mile
            ));

            // Render Fast Results Immediately
            handleSetReport(fastData);
            setStatus('analyzing_deep');

            // PHASE 2: DEEP PASS (Background Strategy)
            const deepRes = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url, mode: 'deep', forceRefresh }), // Pass refresh flag
            });

            const deepData = await deepRes.json();
            if (!deepRes.ok) throw new Error(deepData.error || 'Deep analysis failed');

            // Update: Complete
            setMilestones(m => m.map(mile =>
                mile.id === 'analyze' ? { ...mile, status: 'complete' } :
                    mile.id === 'complete' ? { ...mile, status: 'complete', timestamp: Date.now() } :
                        mile
            ));

            // Upgrade to Full Report
            handleSetReport(deepData);
            setStatus('complete');

        } catch (err: any) {
            console.error(err);
            setError(err.message || 'An unexpected error occurred');
            setStatus('idle');
        }
    };

    const navItems = [
        { id: 'audit', icon: LayoutTemplate, label: 'Audit' },
        { id: 'monitor', icon: Activity, label: 'Monitor' },
        { id: 'strategy', icon: Target, label: 'Strategy' },
        { id: 'settings', icon: Settings, label: 'Settings' },
    ] as const;

    const trustSignal = calculateTrustSignal(report?.tacticalFixes);

    return (
        <div className="min-h-screen flex bg-[#0B0F14] text-[#E2E8F0] antialiased selection:bg-[#38BDF8]/30">

            {/* SIDEBAR */}
            <aside className="w-64 border-r border-white/[0.06] bg-[#0B0F14] hidden md:flex flex-col sticky top-0 h-screen z-20">
                <div className="p-6 border-b border-white/[0.06]">
                    <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <div className="h-8 w-8 relative rounded-lg overflow-hidden shrink-0 border border-white/10">
                            <Image src="/flux-logo.jpg" alt="Flux Logo" fill className="object-cover" />
                        </div>
                        <div>
                            <div className="font-bold tracking-tight text-sm text-white">FLUX ENGINE</div>
                            <div className="text-[10px] text-[#94A3B8] font-mono tracking-wide">STRATEGY PRO</div>
                        </div>
                    </Link>
                </div>

                <nav className="flex-1 p-4 space-y-1">
                    {navItems.map((item) => (
                        <button
                            key={item.id}
                            onClick={() => setActiveView(item.id)}
                            className={clsx(
                                "w-full flex items-center gap-3 px-3 py-2 text-sm rounded-lg transition-all font-medium",
                                activeView === item.id
                                    ? "bg-white/[0.06] text-white border border-white/[0.05]"
                                    : "text-[#94A3B8] hover:bg-white/[0.03] hover:text-[#CBD5E1]"
                            )}
                        >
                            <item.icon className="w-4 h-4 stroke-[1.5]" />
                            {item.label}
                        </button>
                    ))}
                </nav>
            </aside>

            {/* MAIN CONTENT */}
            <main className="flex-1 flex flex-col min-w-0 bg-[#0B0F14] relative overflow-hidden">
                <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#1E293B]/20 to-transparent pointer-events-none" />

                {/* HEADER */}
                <header className="h-16 border-b border-white/[0.06] px-8 flex items-center justify-between sticky top-0 z-10 bg-[#0B0F14]/80 backdrop-blur-xl">
                    <form onSubmit={runAudit} className="flex-1 max-w-xl">
                        <div className="relative flex items-center group" onMouseEnter={prefetchAudit}>
                            <Search className="absolute left-3 w-4 h-4 text-[#64748B] group-focus-within:text-[#94A3B8] transition-colors" />
                            <input
                                type="url"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Enter domain to analyze..."
                                className="w-full pl-10 pr-3 py-2 bg-[#1A1E26] border border-white/[0.08] rounded-lg text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]/50 focus:ring-1 focus:ring-[#38BDF8]/20 transition-all font-mono"
                            />
                            {status === 'scouting' && <Loader2 className="absolute right-3 w-4 h-4 text-[#64748B] animate-spin" />}
                        </div>
                    </form>

                    {report && (
                        <div className="flex items-center gap-4 ml-4">
                            <button className="text-xs font-medium text-[#94A3B8] hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent hover:bg-white/[0.06] hover:border-white/[0.06] transition-all">
                                <Share2 className="w-3.5 h-3.5" /> Share Report
                            </button>
                            <button onClick={() => runAudit(undefined, true)} className="text-xs font-medium text-[#94A3B8] hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent hover:bg-white/[0.06] hover:border-white/[0.06] transition-all">
                                <RefreshCw className="w-3.5 h-3.5" /> Re-Scan
                            </button>
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-8 lg:p-12">

                    {/* --- AUDIT VIEW --- */}
                    {activeView === 'audit' && (
                        <AnimatePresence mode="wait">

                            {/* ERROR STATE */}
                            {error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="max-w-xl mx-auto mt-10 p-4 border border-red-500/20 bg-red-500/10 rounded-lg flex items-start gap-4">
                                    <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
                                    <div>
                                        <h3 className="text-sm font-semibold text-red-200">Analysis Failed</h3>
                                        <p className="text-sm text-red-300/80 mt-1">{error}</p>
                                    </div>
                                </motion.div>
                            )}

                            {/* IDLE STATE */}
                            {status === 'idle' && !report && !error && (
                                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="h-full flex flex-col items-center justify-center text-center max-w-md mx-auto opacity-60 hover:opacity-100 transition-opacity">
                                    <Target className="w-16 h-16 text-white/10 mb-6" />
                                    <h2 className="text-xl font-bold text-white mb-2">Strategic Domain Analysis</h2>
                                    <p className="text-[#94A3B8] text-sm leading-relaxed">
                                        Enter a URL to generate a comprehensive audit. <br />
                                        <span className="text-[#38BDF8]">New:</span> Generates rapid &quot;Vibe Check&quot; in &lt;3 seconds.
                                    </p>
                                </motion.div>
                            )}



                            {/* LOADING STATE (CINEMATIC) */}
                            {(status === 'scouting' || (status === 'analyzing_deep' && !report)) && (
                                <motion.div
                                    key="loader"
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="h-full flex flex-col items-center justify-center relative"
                                >
                                    <div className="relative mb-8">
                                        <div className="absolute inset-0 bg-[#38BDF8] blur-[40px] opacity-10 animate-pulse" />
                                        <div className="relative z-10 w-20 h-20 rounded-2xl bg-[#0F172A] border border-[#38BDF8]/20 flex items-center justify-center shadow-[0_0_30px_rgba(56,189,248,0.1)]">
                                            <Loader2 className="w-8 h-8 text-[#38BDF8] animate-spin" />
                                        </div>
                                    </div>

                                    <h3 className="text-white text-xl font-bold tracking-tight mb-2">Flux Intelligence Engine</h3>
                                    <div className="text-[#64748B] text-sm mb-6 h-6 flex items-center justify-center">
                                        <IntelligentTypewriter text={scanStatusMessage} isThinking={true} />
                                    </div>

                                    {/* Thinking Stream */}
                                    <ThinkingLog milestones={milestones} showTimestamps={false} />

                                </motion.div>
                            )}

                            {/* REPORT VIEW (Both Fast & Deep) */}
                            {report && report.meta && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-20 max-w-[1600px] mx-auto">

                                    {/* PROGRESS BANNER (ONLY DURING DEEP SCAN) */}
                                    {status === 'analyzing_deep' && (
                                        <div className="bg-[#1A1E26]/80 border border-[#38BDF8]/20 rounded-lg p-3 flex items-center gap-3 animate-pulse">
                                            <Loader2 className="w-4 h-4 text-[#38BDF8] animate-spin" />
                                            <span className="text-xs font-semibold text-[#38BDF8]">
                                                Deep Strategy Analysis in progress... (Crawling sub-pages & Checking Performance)
                                            </span>
                                        </div>
                                    )}

                                    {/* HEADER SECTION */}
                                    <section>
                                        <div className="flex items-center gap-3 mb-4">
                                            <h1 className="text-2xl font-bold tracking-tight text-white">
                                                {new URL(report.meta.url).hostname.toLowerCase()} Analysis
                                            </h1>
                                            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-[#94A3B8] text-xs font-semibold border border-white/[0.06] font-mono">
                                                {new Date().toLocaleDateString()}
                                            </span>
                                            {report.type === 'fast' && <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wide">Fast Pass</span>}
                                        </div>
                                        <p className="text-lg text-[#CBD5E1] leading-relaxed max-w-4xl min-h-[4em]">
                                            {report.clientReadySummary.executiveSummary}
                                        </p>
                                    </section>

                                    <div className="h-px bg-gradient-to-r from-white/[0.1] via-white/[0.05] to-transparent" />

                                    {/* TOP METRICS GRID */}
                                    <section className="grid grid-cols-1 md:grid-cols-4 gap-8">
                                        {/* 1. STRATEGIC INDEX */}
                                        <div className="p-6 rounded-xl bg-[#1A1E26]/50 border border-white/[0.06] relative group">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="text-sm font-medium text-[#94A3B8]">Strategic Index</div>
                                                <div className="relative">
                                                    <Info className="w-4 h-4 text-[#64748B] hover:text-[#94A3B8] cursor-help transition-colors" />
                                                    {/* Tooltip positioned to the left to avoid cutoff */}
                                                    <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 p-4 bg-[#0F1115] border border-white/[0.15] rounded-lg shadow-2xl opacity-0 pointer-events-none group-hover:opacity-100 group-hover:pointer-events-auto transition-opacity z-50">
                                                        <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-4 h-4 bg-[#0F1115] border-r border-b border-white/[0.15] rotate-45"></div>
                                                        <p className="text-xs text-[#CBD5E1] leading-relaxed relative z-10">
                                                            <span className="font-bold text-white block mb-2">What is this?</span>
                                                            Composite score measuring digital presence quality based on brand clarity, message-market fit, visual coherence, and conversion potential.
                                                        </p>
                                                        <div className="mt-3 space-y-1 text-[10px] text-[#94A3B8] relative z-10">
                                                            <div className="flex justify-between"><span>90-100</span><span className="text-emerald-400 font-semibold">Market Leader</span></div>
                                                            <div className="flex justify-between"><span>70-89</span><span className="text-blue-400 font-semibold">Strong Presence</span></div>
                                                            <div className="flex justify-between"><span>50-69</span><span className="text-amber-400 font-semibold">Needs Work</span></div>
                                                            <div className="flex justify-between"><span>&lt;50</span><span className="text-red-400 font-semibold">Critical</span></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-baseline gap-2">
                                                <span className="text-4xl font-bold text-white">{report.coreSignals?.vibeScore?.score || '-'}</span>
                                                <span className="text-sm text-[#64748B]">/100</span>
                                            </div>
                                            <div className="text-xs text-[#64748B] mt-2 font-mono uppercase tracking-widest">{report.coreSignals?.vibeScore?.label}</div>
                                        </div>

                                        <div className="md:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">

                                            {/* 2. HEADLINE STRATEGY */}
                                            <button
                                                onClick={() => setSelectedSignal({ title: 'Headline Strategy', data: report.coreSignals.headlineSignal })}
                                                className="p-6 rounded-xl bg-[#1A1E26]/50 border border-white/[0.06] hover:bg-[#1A1E26] hover:border-white/[0.15] transition-all text-left group w-full relative"
                                            >
                                                <Maximize2 className="absolute top-4 right-4 w-4 h-4 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="text-sm font-medium text-[#94A3B8] mb-1">Headline Strategy</div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-semibold text-white line-clamp-1">{report.coreSignals?.headlineSignal?.summary}</span>
                                                    <span className={clsx("text-xs px-2 py-0.5 rounded font-bold border", getGradeColor(report.coreSignals?.headlineSignal?.grade))}>
                                                        {report.coreSignals?.headlineSignal?.grade}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2 min-h-[2.5em]">
                                                    {report.coreSignals?.headlineSignal?.whyItMatters || 'Analysis pending...'}
                                                </p>
                                            </button>

                                            {/* 3. VISUAL HIERARCHY */}
                                            <button
                                                onClick={() => setSelectedSignal({ title: 'Visual Hierarchy', data: report.coreSignals.visualArchitecture })}
                                                className="p-6 rounded-xl bg-[#1A1E26]/50 border border-white/[0.06] hover:bg-[#1A1E26] hover:border-white/[0.15] transition-all text-left group w-full relative"
                                            >
                                                <Maximize2 className="absolute top-4 right-4 w-4 h-4 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="text-sm font-medium text-[#94A3B8] mb-1">Visual Hierarchy</div>
                                                <div className="flex items-center justify-between mb-3">
                                                    <span className="text-sm font-semibold text-white line-clamp-1">{report.coreSignals?.visualArchitecture?.summary}</span>
                                                    <span className={clsx("text-xs px-2 py-0.5 rounded font-bold border", getGradeColor(report.coreSignals?.visualArchitecture?.grade))}>
                                                        {report.coreSignals?.visualArchitecture?.grade}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-[#94A3B8] leading-relaxed line-clamp-2 min-h-[2.5em]">
                                                    {report.coreSignals?.visualArchitecture?.whyItMatters || 'Analysis pending...'}
                                                </p>
                                            </button>

                                            {/* 4. GOOGLE PERFORMANCE (PROGRESSIVE) */}
                                            <div className="p-6 rounded-xl bg-[#1A1E26]/50 border border-white/[0.06] relative group">
                                                <div className="absolute top-4 right-4 text-[#64748B] opacity-50 group-hover:opacity-100 transition-opacity">
                                                    <Zap className="w-4 h-4" />
                                                </div>
                                                <div className="text-sm font-medium text-[#94A3B8] mb-4">Core Web Vitals</div>

                                                {displayPerformance ? (
                                                    <div className="space-y-4">
                                                        <div className="flex items-end justify-between">
                                                            <div className="flex items-baseline gap-1">
                                                                <span className={clsx(
                                                                    "text-4xl font-light tracking-tighter",
                                                                    displayPerformance.lighthouseScore >= 90 ? "text-emerald-400" :
                                                                        displayPerformance.lighthouseScore >= 50 ? "text-yellow-400" : "text-red-400"
                                                                )}>
                                                                    {displayPerformance.lighthouseScore}
                                                                </span>
                                                                <span className="text-xs text-[#64748B] font-mono">/100</span>
                                                            </div>
                                                            <div className="text-xs font-mono text-[#64748B] bg-white/[0.05] px-2 py-1 rounded">
                                                                Mobile
                                                            </div>
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-2 mt-2">
                                                            <div className="bg-black/20 p-2 rounded border border-white/[0.02]">
                                                                <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">LCP</div>
                                                                <div className="text-sm text-white font-mono">{displayPerformance.lcp}</div>
                                                            </div>
                                                            <div className="bg-black/20 p-2 rounded border border-white/[0.02]">
                                                                <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">INP</div>
                                                                <div className="text-sm text-white font-mono">{displayPerformance.inp}</div>
                                                            </div>
                                                            <div className="bg-black/20 p-2 rounded border border-white/[0.02]">
                                                                <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">CLS</div>
                                                                <div className="text-sm text-white font-mono">{displayPerformance.cls}</div>
                                                            </div>
                                                            <div className="bg-black/20 p-2 rounded border border-white/[0.02]">
                                                                <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-1">Speed Index</div>
                                                                <div className="text-sm text-white font-mono">{displayPerformance.speedIndex}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-32 flex flex-col items-center justify-center text-center opacity-60">
                                                        {clientMetricsLoading ? (
                                                            <>
                                                                <Loader2 className="w-6 h-6 text-[#94A3B8] animate-spin mb-2" />
                                                                <span className="text-xs text-[#94A3B8]">Connecting to Google...</span>
                                                            </>
                                                        ) : (
                                                            status === 'complete' ? (
                                                                <>
                                                                    <Activity className="w-6 h-6 text-[#64748B] mb-2" />
                                                                    <span className="text-xs text-[#64748B]">Data Unavailable</span>
                                                                </>
                                                            ) : (
                                                                <>
                                                                    <Loader2 className="w-6 h-6 text-[#94A3B8] animate-spin mb-2" />
                                                                    <span className="text-xs text-[#94A3B8]">Measuring Speed...</span>
                                                                </>
                                                            )
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                        </div>
                                    </section>

                                    {/* MAIN CONTENT GRID */}
                                    <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">

                                        {/* TACTICAL PLAN (LEFT COL) */}
                                        <div className="xl:col-span-3 space-y-8">
                                            <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
                                                <h3 className="font-bold text-white flex items-center gap-2">
                                                    Tactical Execution Plan
                                                    <span className="text-[#64748B] font-normal text-sm">({report.tacticalFixes?.length || 0} items)</span>
                                                </h3>

                                                <div className="flex items-center gap-2 bg-[#1A1E26]/80 px-3 py-1.5 rounded-full border border-white/[0.06]">
                                                    <div className={clsx("w-2 h-2 rounded-full shadow-[0_0_8px]", trustSignal > 80 ? "bg-emerald-500 shadow-emerald-500/50" : trustSignal > 50 ? "bg-amber-500 shadow-amber-500/50" : "bg-slate-500")} />
                                                    <span className="text-xs font-semibold text-[#CBD5E1]">
                                                        {trustSignal}% Verified by Data
                                                    </span>
                                                </div>
                                            </div>

                                            <div className="space-y-12">
                                                {/* IN FAST MODE, IF NO FIXES YET, SHOW LOADING SKELETON */}
                                                {!report.tacticalFixes && (
                                                    <div className="animate-pulse space-y-8">
                                                        {[1, 2, 3].map(i => (
                                                            <div key={i} className="h-40 bg-[#1A1E26]/50 rounded-lg border border-white/[0.04]" />
                                                        ))}
                                                    </div>
                                                )}

                                                {report.tacticalFixes?.map((fix) => (
                                                    <div key={fix.id} className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-12 group">
                                                        <div className="lg:col-span-7 space-y-5">
                                                            <div className="flex items-start justify-between">
                                                                <div className="space-y-1.5">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className={clsx("text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border", getImpactColor(fix.impact))}>
                                                                            {fix.impact} Priority
                                                                        </span>
                                                                        <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-wider">{fix.category}</span>
                                                                    </div>
                                                                    <h4 className="font-bold text-white text-lg leading-snug">{fix.title}</h4>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-4">
                                                                <div className="bg-[#1A1E26]/30 border-l-2 border-[#475569] pl-4 py-3 rounded-r-lg">
                                                                    <p className="text-sm text-[#E2E8F0] leading-relaxed font-medium">
                                                                        <span className="text-[#64748B] uppercase text-[10px] font-bold block mb-1">Observation</span>
                                                                        {fix.problem}
                                                                    </p>
                                                                </div>
                                                                <div className="pl-4 py-1">
                                                                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                                                                        <span className="text-[#38BDF8] uppercase text-[10px] font-bold block mb-1">Strategic Recommendation</span>
                                                                        {fix.recommendation}
                                                                    </p>
                                                                </div>
                                                                <div className="flex items-center gap-4 text-xs text-[#64748B] font-medium pl-4 pt-2">
                                                                    <span className="flex items-center gap-1.5"><Target className="w-3.5 h-3.5 text-[#475569]" /> {fix.expectedOutcome}</span>
                                                                    <span className="text-[#334155]">|</span>
                                                                    <span>{fix.effortHours}h Effort</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="lg:col-span-5 flex flex-col h-full">
                                                            <div className="bg-[#0B0D11] rounded-lg border border-white/[0.08] overflow-hidden flex-1 flex flex-col shadow-inner">
                                                                <div className="bg-[#151921] px-4 py-2 border-b border-white/[0.06] flex items-center justify-between">
                                                                    <span className="text-[10px] font-bold text-[#64748B] uppercase tracking-widest flex items-center gap-1.5">
                                                                        <Microscope className="w-3 h-3" /> Data Signal
                                                                    </span>
                                                                </div>
                                                                <div className="p-4 space-y-4 flex-1">
                                                                    {fix.evidence && fix.evidence.length > 0 ? (
                                                                        <ul className="space-y-3">
                                                                            {fix.evidence.map((ev, i) => (
                                                                                <li key={i} className="text-xs flex flex-col gap-1.5">
                                                                                    <span className="text-[10px] font-bold text-[#475569] uppercase tracking-wide">{ev.label}</span>
                                                                                    <span className="font-mono text-[#E2E8F0] bg-[#1A1E26] border border-white/[0.05] rounded px-3 py-2 break-all leading-relaxed block">
                                                                                        {ev.value}
                                                                                    </span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <div className="h-full flex flex-col items-center justify-center text-center p-4 opacity-50">
                                                                            <ShieldCheck className="w-8 h-8 text-[#334155] mb-2" />
                                                                            <p className="text-xs text-[#64748B] italic">
                                                                                Pattern-based heuristic finding.<br />No direct DOM signal extracted.
                                                                            </p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                                {fix.validationCriteria && (
                                                                    <div className="bg-[#151921]/50 border-t border-white/[0.06] p-4">
                                                                        <div className="text-[10px] font-bold text-[#38BDF8] uppercase tracking-widest mb-2 flex items-center gap-1.5">
                                                                            <ShieldCheck className="w-3 h-3" /> Validation Criteria
                                                                        </div>
                                                                        <p className="text-xs text-[#94A3B8] leading-relaxed font-medium">
                                                                            {fix.validationCriteria}
                                                                        </p>
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="col-span-1 lg:col-span-12 h-px bg-white/[0.04] w-full mt-4" />
                                                    </div>
                                                ))}
                                            </div>
                                        </div>

                                        {/* STRATEGIC ROADMAP (RIGHT SIDEBAR) */}
                                        <div className="xl:col-span-1 space-y-8 h-fit sticky top-24">
                                            <div className="border-b border-white/[0.06] pb-4">
                                                <h3 className="font-bold text-white">Strategic Roadmap</h3>
                                            </div>

                                            {/* SKELETON FOR FAST MODE */}
                                            {!report.strategicIntelligence && (
                                                <div className="space-y-6 animate-pulse">
                                                    <div className="h-32 bg-[#1A1E26]/50 rounded-lg" />
                                                    <div className="h-32 bg-[#1A1E26]/50 rounded-lg" />
                                                </div>
                                            )}

                                            {report.strategicIntelligence && (
                                                <div className="space-y-8 relative pl-2">
                                                    <div className="absolute left-0 top-2 bottom-2 w-px bg-white/[0.06]" />
                                                    {[
                                                        { title: "On-Site Optimization", data: report.strategicIntelligence.onSiteStrategy, color: "bg-white border-white" },
                                                        { title: "Off-Site Authority", data: report.strategicIntelligence.offSiteGrowth, color: "bg-[#38BDF8] border-[#38BDF8]" },
                                                        { title: "AI & Automation", data: report.strategicIntelligence.aiOpportunities, color: "bg-emerald-500 border-emerald-500" }
                                                    ].map((section, idx) => (
                                                        <div key={idx} className="relative pl-6">
                                                            <div className={clsx("absolute left-[-4px] top-1.5 w-2 h-2 rounded-full border shadow-[0_0_10px_rgba(255,255,255,0.2)]", section.color)} />
                                                            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-2">{section.title}</h4>
                                                            <p className="text-xs text-[#94A3B8] leading-relaxed mb-3 font-medium">
                                                                {section.data?.summary || 'No data available.'}
                                                            </p>
                                                            <ul className="space-y-2">
                                                                {section.data?.actions?.map((action, i) => (
                                                                    <li key={i} className="flex items-start gap-2 text-xs text-[#64748B]">
                                                                        <span className="text-[#334155] mt-[3px]">•</span> {action}
                                                                    </li>
                                                                ))}
                                                            </ul>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    )}

                    {/* DETAIL MODAL (Unchanged) */}
                    <AnimatePresence>
                        {selectedSignal && (
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
                                onClick={() => setSelectedSignal(null)}
                            >
                                <motion.div
                                    initial={{ scale: 0.95, opacity: 0 }}
                                    animate={{ scale: 1, opacity: 1 }}
                                    exit={{ scale: 0.95, opacity: 0 }}
                                    className="bg-[#0F1115] border border-white/[0.1] w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-6 border-b border-white/[0.06] flex items-center justify-between bg-[#151921]">
                                        <div>
                                            <div className="text-xs font-bold text-[#64748B] uppercase tracking-wider mb-1">{selectedSignal.title}</div>
                                            <h3 className="text-xl font-bold text-white max-w-lg leading-tight">{selectedSignal.data.summary}</h3>
                                        </div>
                                        <button onClick={() => setSelectedSignal(null)} className="p-2 hover:bg-white/[0.06] rounded-full transition-colors self-start">
                                            <X className="w-5 h-5 text-[#94A3B8]" />
                                        </button>
                                    </div>
                                    <div className="p-8 space-y-8 max-h-[70vh] overflow-y-auto">
                                        <div className="flex items-center gap-4">
                                            <div className="p-4 bg-[#1A1E26] rounded-xl border border-white/[0.06] text-center min-w-[100px]">
                                                <div className="text-xs font-bold text-[#64748B] uppercase mb-1">Grade</div>
                                                <div className={clsx("text-3xl font-bold", getGradeColor(selectedSignal.data.grade).split(' ')[0])}>
                                                    {selectedSignal.data.grade}
                                                </div>
                                            </div>
                                            <div className="flex-1">
                                                <p className="text-sm text-[#E2E8F0] leading-relaxed font-medium">
                                                    {selectedSignal.data.whyItMatters}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedSignal.data.rationale && (
                                            <div className="space-y-3">
                                                <div className="text-xs font-bold text-[#38BDF8] uppercase tracking-widest flex items-center gap-2">
                                                    <Microscope className="w-3.5 h-3.5" /> Detailed Rationale
                                                </div>
                                                <p className="text-sm text-[#94A3B8] leading-loose whitespace-pre-wrap">
                                                    {selectedSignal.data.rationale}
                                                </p>
                                            </div>
                                        )}
                                        {selectedSignal.data.quickWin && (
                                            <div className="bg-[#1A1E26]/50 border border-emerald-500/20 rounded-xl p-6">
                                                <div className="text-xs font-bold text-emerald-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                                                    <Target className="w-3.5 h-3.5" /> Quick Win Opportunity
                                                </div>
                                                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                                                    {selectedSignal.data.quickWin}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 bg-[#151921] border-t border-white/[0.06] flex justify-end">
                                        <button
                                            onClick={() => setSelectedSignal(null)}
                                            className="px-4 py-2 bg-white text-black text-sm font-bold rounded-lg hover:opacity-90 transition-opacity"
                                        >
                                            Close Analysis
                                        </button>
                                    </div>
                                </motion.div>
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* MONITOR / STRATEGY PLACEHOLDERS */}
                    {(activeView === 'monitor' || activeView === 'strategy' || activeView === 'settings') && (
                        <div className="max-w-4xl mx-auto py-12 text-center text-[#64748B]">
                            <Settings className="w-12 h-12 mx-auto text-[#334155] mb-4" />
                            <h2 className="text-lg font-semibold text-white">System View</h2>
                            <p className="text-sm">This module is currently under development.</p>
                        </div>
                    )}

                </div>
            </main>
        </div>
    );
}
