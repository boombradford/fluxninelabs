"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion, AnimatePresence } from 'framer-motion';
import {
    Search, Loader2, Activity, Settings, Target, LayoutTemplate, Share2, RefreshCw,
    Microscope, ShieldCheck, X, Maximize2, Zap, AlertTriangle, Info, Globe, Printer,
    TrendingUp, CheckCircle2, Sparkles
} from 'lucide-react';
import clsx from 'clsx';
import IntelligentTypewriter from '../components/IntelligentTypewriter';
import ThinkingLog, { Milestone } from '../components/ThinkingLog';
import { DeepAnalysisReveal } from '../components/DeepAnalysisReveal';

import { MonitorView } from '../components/MonitorView';
import { CountUp } from '../components/CountUp';

// --- TYPES ---
interface PerformanceMetrics {
    lighthouseScore: number;
    lcp: string;
    inp: string;
    cls: string;
    speedIndex: string;
    fcp?: string;
    fid?: string;
    tti?: string;
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



// Client-Side PSI Fetch Hook - DISABLED
// Reason: Cannot securely pass API key to client without exposing it.
// The server-side /api/audit route already fetches PSI data with the API key in deep mode.
// Client-Side PSI Fetch Hook
const useClientSidePerformance = (url: string, trigger: boolean) => {
    const [metrics, setMetrics] = useState<PerformanceMetrics | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!trigger || !url) return;

        const fetchMetrics = async () => {
            setLoading(true);
            try {
                // Use internal proxy to leverage server-side API key
                const res = await fetch(`/api/performance?url=${encodeURIComponent(url)}`);
                const data = await res.json();

                if (data.error) throw new Error(data.error);

                setMetrics(data); // API returns exact structure expected
            } catch (err) {
                console.warn("[Flux Client Fallback] Failed to fetch PSI", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [url, trigger]);

    return { metrics, loading };
};

const useSafetyCheck = (url: string, trigger: boolean) => {
    const [safety, setSafety] = useState<{ isSafe: boolean; threats: string[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!trigger || !url) {
            // Reset state if not triggering
            setSafety(null);
            setError(null);
            return;
        }
        const checkSafety = async () => {
            console.log("[Flux Safety] Triggering check for:", url);
            setLoading(true);
            setError(null);
            setSafety(null); // Clear previous result before new fetch
            try {
                const res = await fetch('/api/safety', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url })
                });
                const data = await res.json();
                if (data.error) throw new Error(data.error);
                console.log("[Flux Safety] Success:", data);
                setSafety(data);
            } catch (err: any) {
                console.warn("[Flux Safety] Failed", err);
                setError(err.message || "Unknown error");
            } finally {
                setLoading(false);
            }
        };
        checkSafety();
    }, [url, trigger]);
    return { safety, loading, error };
};

// REMOVED: Brand Authority feature (Knowledge Graph data kept private)
// const useBrandAuthority = (url: string, trigger: boolean) => {
//     const [authority, setAuthority] = useState<{ found: boolean; entity?: any } | null>(null);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);

//     useEffect(() => {
//         if (!trigger || !url) {
//             setAuthority(null);
//             setError(null);
//             return;
//         }

//         const checkAuthority = async () => {
//             setLoading(true);
//             setError(null);
//             setAuthority(null);
//             try {
//                 // Extract hostname as query (e.g. "Nike" from "nike.com" or just send domain)
//                 // For better results, let's try sending the hostname.
//                 let query = url;
//                 try {
//                     const u = new URL(url.startsWith('http') ? url : `https://${url}`);
//                     query = u.hostname.replace('www.', '').split('.')[0];
//                 } catch (e) {
//                     query = url;
//                 }

//                 console.log("[Flux Authority] Querying for:", query);

//                 const res = await fetch('/api/authority', {
//                     method: 'POST',
//                     headers: { 'Content-Type': 'application/json' },
//                     body: JSON.stringify({ query })
//                 });
//                 const data = await res.json();
//                 if (data.error) throw new Error(data.error);
//                 setAuthority(data);
//             } catch (err: any) {
//                 console.warn("[Flux Authority] Failed", err);
//                 setError(err.message || "Unknown error");
//             } finally {
//                 setLoading(false);
//             }
//         };
//         checkAuthority();
//     }, [url, trigger]);
//     return { authority, loading, error };
// };

export default function Dashboard() {
    const [url, setUrl] = useState('');
    const [status, setStatus] = useState<'idle' | 'scouting' | 'analyzing_deep' | 'complete'>('idle');
    const [scanStatusMessage, setScanStatusMessage] = useState('Initializing Flux Engine...');
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'audit' | 'monitor' | 'strategy' | 'settings'>('audit');
    const [selectedSignal, setSelectedSignal] = useState<{
        title: string;
        data: CoreSignal;
        grade?: string;
        summary?: string;
        rationale?: string;
        whyItMatters?: string;
    } | null>(null);

    // Client-Side Performance Fetcher (Triggers when report is ready but missing performance)
    const { metrics: clientMetrics, loading: clientMetricsLoading } = useClientSidePerformance(
        report?.meta?.url || '',
        status === 'complete' && !report?.meta?.performance
    );

    const { safety, loading: safetyLoading, error: safetyError } = useSafetyCheck(
        url,
        status !== 'idle'
    );

    // REMOVED: Brand Authority (keeping KG data private)
    // const { authority, loading: authorityLoading, error: authorityError } = useBrandAuthority(url, status !== 'idle');

    // Merge client metrics if available
    const displayPerformance = report?.meta?.performance || clientMetrics;

    // Persistence: Clean up legacy URL storage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('flux_audit_url');
        }
    }, []);

    const handleSetReport = (newReport: AnalysisReport | null) => {
        setReport(newReport);
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

        // Normalize URL (User convenience: allow "example.com")
        let targetUrl = url.trim();
        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = `https://${targetUrl}`;
            setUrl(targetUrl); // Update UI
        }

        if (!targetUrl) return;

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
                    body: JSON.stringify({ url: targetUrl, mode: 'fast', forceRefresh }), // Pass refresh flag
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
            // Force a minimum animation time for "cinematic" feel
            const [deepRes] = await Promise.all([
                fetch('/api/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: targetUrl, mode: 'deep', forceRefresh }),
                }),
                new Promise(resolve => setTimeout(resolve, 4000)) // 4s cinematic delay
            ]);

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

    // Report Generation Function - Triggers Print Dialog for PDF Export
    const generateReport = () => {
        window.print();
    };

    return (
        <div className="min-h-screen flex bg-[#0B0F14] text-[#E2E8F0] antialiased selection:bg-[#38BDF8]/30">

            {/* Skip to main content - for keyboard users */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#38BDF8] focus:text-white focus:rounded-lg focus:shadow-lg"
            >
                Skip to main content
            </a>

            {/* MAIN CONTENT */}
            <main
                className="flex-1 flex flex-col min-w-0 bg-[#0B0F14] relative overflow-hidden"
                role="main"
                aria-label="Analysis dashboard"
            >
                <div className="absolute top-0 inset-x-0 h-96 bg-gradient-to-b from-[#1E293B]/20 to-transparent pointer-events-none" aria-hidden="true" />

                {/* HEADER */}
                <header
                    className="h-16 border-b border-white/[0.06] px-4 md:px-8 flex items-center justify-between sticky top-0 z-10 bg-[#0B0F14]/80 backdrop-blur-xl"
                    role="banner"
                >
                    {/* Logo & Branding */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-2 hover:opacity-80 transition-opacity focus:outline-none focus:ring-2 focus:ring-[#38BDF8] rounded-lg"
                            aria-label="Refresh Flux Engine"
                        >
                            <div className="h-6 w-6 relative rounded overflow-hidden shrink-0 border border-white/10">
                                <Image src="/flux-logo.jpg" alt="Flux Intelligence Engine logo" fill className="object-cover" />
                            </div>
                            <div className="hidden sm:block">
                                <div className="text-sm font-bold text-white tracking-tight">FLUX ENGINE</div>
                            </div>
                        </button>
                    </div>

                    <form onSubmit={runAudit} className="flex-1 max-w-xl mx-4" role="search" aria-label="Website analysis search">
                        <div className="relative flex items-center group" onMouseEnter={prefetchAudit}>
                            <Search className="absolute left-3 w-4 h-4 text-[#64748B] group-focus-within:text-[#94A3B8] transition-colors" aria-hidden="true" />
                            <input
                                type="text"
                                value={url}
                                onChange={(e) => setUrl(e.target.value)}
                                placeholder="Enter domain to analyze..."
                                className="w-full pl-10 pr-3 py-2 bg-[#1A1E26] border border-white/[0.08] rounded-lg text-sm text-white placeholder-[#64748B] focus:outline-none focus:border-[#38BDF8]/50 focus:ring-2 focus:ring-[#38BDF8]/40 transition-all font-mono"
                                aria-label="Website URL to analyze"
                                aria-required="true"
                                aria-describedby="url-hint"
                            />
                            <span id="url-hint" className="sr-only">Enter a website URL to generate a comprehensive analysis report</span>
                            {status === 'scouting' && <Loader2 className="absolute right-3 w-4 h-4 text-[#64748B] animate-spin" aria-label="Loading" role="status" />}
                        </div>
                    </form>

                    {report && status === 'complete' && safety && displayPerformance && (
                        <div className="flex items-center gap-4 ml-4" role="toolbar" aria-label="Report actions">
                            <button
                                onClick={generateReport}
                                className="text-xs font-medium text-[#94A3B8] hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent hover:bg-white/[0.06] hover:border-white/[0.06] transition-all focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                                aria-label="Download report as PDF"
                            >
                                <Share2 className="w-3.5 h-3.5" aria-hidden="true" /> Download Report
                            </button>
                            <button
                                onClick={() => runAudit(undefined, true)}
                                className="text-xs font-medium text-[#94A3B8] hover:text-white flex items-center gap-2 px-3 py-1.5 rounded-lg border border-transparent hover:bg-white/[0.06] hover:border-white/[0.06] transition-all focus:outline-none focus:ring-2 focus:ring-[#38BDF8]"
                                aria-label="Re-scan website to refresh analysis"
                            >
                                <RefreshCw className="w-3.5 h-3.5" aria-hidden="true" /> Re-Scan
                            </button>
                        </div>
                    )}
                </header>

                <div className="flex-1 overflow-y-auto p-8 lg:p-12" id="main-content">

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
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-12 pb-20 max-w-[1600px] mx-auto report-content">

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

                                    {/* STRATEGIC INTELLIGENCE - ELEVATED & ENHANCED */}
                                    {report.strategicIntelligence && (
                                        <motion.section
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            className="py-10 border-b border-white/[0.06]"
                                        >
                                            <div className="flex items-center gap-4 mb-8">
                                                <Target className="w-6 h-6 text-[#38BDF8]" />
                                                <h2 className="text-3xl font-light text-white tracking-tight">Strategic Intelligence</h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
                                                {/* On-Site Optimization */}
                                                <div className="space-y-4">
                                                    <h3 className="text-lg font-medium text-[#EDEEF2] border-l-2 border-[#38BDF8] pl-3">On-Site Optimization</h3>
                                                    <p className="text-[14px] text-[#9AA0AE] leading-relaxed">
                                                        {report.strategicIntelligence.onSiteStrategy?.summary || 'Technical SEO, content architecture, and conversion optimization strategies.'}
                                                    </p>
                                                    <ul className="space-y-2.5 mt-4">
                                                        {report.strategicIntelligence.onSiteStrategy?.actions?.map((action, i) => (
                                                            <li key={i} className="text-[14px] text-[#EDEEF2] leading-relaxed flex items-start gap-2.5">
                                                                <span className="text-[#6B7280] mt-1.5 w-1 h-1 rounded-full bg-[#38BDF8] shrink-0"></span>
                                                                <span>{action}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Off-Site Growth */}
                                                <div className="space-y-4">
                                                    <h3 className="text-lg font-medium text-[#EDEEF2] border-l-2 border-[#A855F7] pl-3">Off-Site Growth</h3>
                                                    <p className="text-[14px] text-[#9AA0AE] leading-relaxed">
                                                        {report.strategicIntelligence.offSiteGrowth?.summary || 'Link building, brand mentions, and strategic partnerships.'}
                                                    </p>
                                                    <ul className="space-y-2.5 mt-4">
                                                        {report.strategicIntelligence.offSiteGrowth?.actions?.map((action, i) => (
                                                            <li key={i} className="text-[14px] text-[#EDEEF2] leading-relaxed flex items-start gap-2.5">
                                                                <span className="text-[#6B7280] mt-1.5 w-1 h-1 rounded-full bg-[#A855F7] shrink-0"></span>
                                                                <span>{action}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* AI & Automation */}
                                                <div className="space-y-4">
                                                    <h3 className="text-lg font-medium text-[#EDEEF2] border-l-2 border-[#10B981] pl-3">AI & Automation</h3>
                                                    <p className="text-[14px] text-[#9AA0AE] leading-relaxed">
                                                        {report.strategicIntelligence.aiOpportunities?.summary || 'Schema markup, AI search optimization, process automation.'}
                                                    </p>
                                                    <ul className="space-y-2.5 mt-4">
                                                        {report.strategicIntelligence.aiOpportunities?.actions?.map((action, i) => (
                                                            <li key={i} className="text-[14px] text-[#EDEEF2] leading-relaxed flex items-start gap-2.5">
                                                                <span className="text-[#6B7280] mt-1.5 w-1 h-1 rounded-full bg-[#10B981] shrink-0"></span>
                                                                <span>{action}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </motion.section>
                                    )}


                                    {/* STRATEGIC INDEX - Compact */}
                                    <div className="flex items-center justify-between py-4 px-4 mb-6 rounded-lg bg-[#12141A] border border-white/[0.06]">
                                        <div>
                                            <div className="text-[11px] font-medium text-[#9AA0AE] uppercase tracking-[0.05em] mb-1">
                                                Strategic Index
                                            </div>
                                            <p className="text-[13px] text-[#9AA0AE] leading-tight max-w-md">
                                                {report.coreSignals?.vibeScore?.summary || 'Digital presence quality'}
                                            </p>
                                        </div>
                                        <div className="flex items-baseline gap-1 shrink-0 ml-4">
                                            <span className="text-[32px] font-light text-[#EDEEF2] leading-none tracking-tight">
                                                {report.coreSignals?.vibeScore?.score ? (
                                                    <CountUp value={report.coreSignals.vibeScore.score} />
                                                ) : '-'}
                                            </span>
                                            <span className="text-[14px] text-[#6B7280] font-medium">/100</span>
                                        </div>
                                    </div>

                                    {/* CORE METRICS - Compact Cards */}
                                    <section className="space-y-4 sm:space-y-6 mb-8">
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">{/* Mobile-first grid */}

                                            {/* Headline Signal */}
                                            <div className="p-4 rounded-lg bg-[#12141A] border border-white/[0.06]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[11px] sm:text-[12px] font-medium text-[#9AA0AE] uppercase tracking-[0.05em]">
                                                        Headline Signal
                                                    </span>
                                                    <span className={clsx("text-[16px] sm:text-[18px] font-medium", getGradeColor(report.coreSignals?.headlineSignal?.grade))}>
                                                        {report.coreSignals?.headlineSignal?.grade}
                                                    </span>
                                                </div>
                                                <p className="text-[13px] sm:text-[14px] text-[#EDEEF2] leading-relaxed">
                                                    {report.coreSignals?.headlineSignal?.summary}
                                                </p>
                                            </div>

                                            {/* Visual Architecture */}
                                            <div className="p-4 rounded-lg bg-[#12141A] border border-white/[0.06]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[11px] sm:text-[12px] font-medium text-[#9AA0AE] uppercase tracking-[0.05em]">
                                                        Visual Architecture
                                                    </span>
                                                    <span className={clsx("text-[16px] sm:text-[18px] font-medium", getGradeColor(report.coreSignals?.visualArchitecture?.grade))}>
                                                        {report.coreSignals?.visualArchitecture?.grade}
                                                    </span>
                                                </div>
                                                <p className="text-[13px] sm:text-[14px] text-[#EDEEF2] leading-relaxed">
                                                    {report.coreSignals?.visualArchitecture?.summary}
                                                </p>
                                            </div>

                                            {/* Domain Integrity */}
                                            <div className="p-4 rounded-lg bg-[#12141A] border border-white/[0.06]">
                                                <div className="flex items-center justify-between mb-2">
                                                    <span className="text-[11px] sm:text-[12px] font-medium text-[#9AA0AE] uppercase tracking-[0.05em]">
                                                        Domain Integrity
                                                    </span>
                                                    {safety && (
                                                        <span className={clsx("text-[16px] sm:text-[18px] font-medium", safety.isSafe ? "text-[#EDEEF2]" : "text-red-400")}>
                                                            {safety.isSafe ? "PASS" : "FAIL"}
                                                        </span>
                                                    )}
                                                </div>
                                                {safety ? (
                                                    <p className="text-[13px] sm:text-[14px] text-[#EDEEF2] leading-relaxed">
                                                        {safety.isSafe
                                                            ? "No threats detected"
                                                            : `${safety.threats.length} threat(s) detected`
                                                        }
                                                    </p>
                                                ) : (
                                                    <p className="text-[13px] sm:text-[14px] text-[#9AA0AE]">Pending</p>
                                                )}
                                            </div>
                                        </div>

                                        {/* Core Web Vitals */}
                                        <div className="p-4 rounded-lg bg-[#12141A] border border-white/[0.06]">{/* Compact CWV */}
                                            {/* 4. CORE WEB VITALS */}
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
                                                                    <CountUp value={displayPerformance.lighthouseScore} />
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

                                            {/* 5. DOMAIN INTEGRITY (SAFE BROWSING) */}
                                            <button
                                                onClick={() => safety && setSelectedSignal({
                                                    title: 'Domain Integrity Protocol',
                                                    data: {
                                                        summary: safety.isSafe ? 'Google Safe Browsing: Verified' : 'Threats Detected',
                                                        grade: safety.isSafe ? 'PASS' : 'FAIL',
                                                        whyItMatters: "Search engines allow 'Zero Tolerance' for malware. If Google detects a threat, the site is immediately de-indexed or flagged with a full-screen warning, killing organic traffic instantly.",
                                                        rationale: safety.isSafe
                                                            ? "We queried the Google Safe Browsing API against your domain. No matches were found in the Malware, Social Engineering, or Unwanted Software threat lists."
                                                            : `Threats detected: ${safety.threats.join(', ')}. Immediate action required to restore domain reputation.`,
                                                        quickWin: safety.isSafe ? "Continue monitoring monthly. Attacks can happen via compromised plugins." : "Request a review in Google Search Console immediately after cleaning the site."
                                                    }
                                                })}
                                                disabled={!safety}
                                                className="p-6 rounded-xl bg-[#1A1E26]/50 border border-white/[0.06] relative group text-left hover:bg-[#1A1E26] hover:border-white/[0.15] transition-all w-full"
                                            >
                                                <Maximize2 className="absolute top-4 right-4 w-4 h-4 text-[#94A3B8] opacity-0 group-hover:opacity-100 transition-opacity" />
                                                <div className="text-sm font-medium text-[#94A3B8] mb-4">Domain Integrity</div>

                                                {safety ? (
                                                    <div className="flex flex-col h-full justify-between">
                                                        <div className="flex items-center gap-2">
                                                            <div className={clsx(
                                                                "w-2 h-2 rounded-full",
                                                                safety.isSafe ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]"
                                                            )} />
                                                            <span className={clsx(
                                                                "text-lg font-bold tracking-tight",
                                                                safety.isSafe ? "text-white" : "text-red-400"
                                                            )}>
                                                                {safety.isSafe ? "Verified Safe" : "Threat Detected"}
                                                            </span>
                                                        </div>

                                                        {safety.isSafe ? (
                                                            <div className="text-xs text-[#64748B] mt-2">
                                                                No malware or social engineering threats detected by Google Protocol.
                                                            </div>
                                                        ) : (
                                                            <div className="mt-2 space-y-1">
                                                                {safety.threats.map(t => (
                                                                    <div key={t} className="text-xs text-red-300 font-mono bg-red-500/10 px-2 py-1 rounded border border-red-500/20">
                                                                        {t}
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        )}

                                                        <div className="mt-4 pt-4 border-t border-white/[0.06] flex items-center justify-between">
                                                            <span className="text-[10px] text-[#64748B] uppercase tracking-wider">Source</span>
                                                            <span className="text-[10px] text-white font-mono opacity-60">Google Safe Browsing API</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="h-32 flex flex-col items-center justify-center text-center opacity-60">
                                                        {safetyLoading ? (
                                                            <>
                                                                <Loader2 className="w-6 h-6 text-[#94A3B8] animate-spin mb-2" />
                                                                <span className="text-xs text-[#94A3B8]">Verifying Integrity...</span>
                                                            </>
                                                        ) : safetyError ? (
                                                            <>
                                                                <AlertTriangle className="w-6 h-6 text-red-400 mb-2 opacity-80" />
                                                                <span className="text-xs text-red-300">Verification Failed</span>
                                                                <span className="text-[10px] text-red-400/60 mt-1 max-w-[150px] leading-tight">{safetyError}</span>
                                                            </>
                                                        ) : (
                                                            <span className="text-xs text-[#64748B]">Waiting for scan...</span>
                                                        )}
                                                    </div>
                                                )}
                                            </button>

                                            {/* REMOVED: Brand Authority (keeping Knowledge Graph data private) */}

                                        </div>
                                    </section>

                                    {/* MAIN CONTENT GRID - WRAPPED IN PROGRESSIVE REVEAL */}
                                    <DeepAnalysisReveal status={status} className="mt-8">
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
                                                            {trustSignal}% Evidence-Backed
                                                        </span>
                                                    </div>
                                                </div>

                                                <div className="space-y-12">
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


                                            {/* CTA - Implementation Support */}
                                            <div className="col-span-full mt-12">
                                                <div className="p-6 rounded-lg bg-[#12141A] border border-white/[0.06] hover:border-white/[0.09] transition-colors">
                                                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                                                        <div className="flex-1">
                                                            <h3 className="text-[16px] font-medium text-[#EDEEF2] mb-2">
                                                                Need help implementing these changes?
                                                            </h3>
                                                            <p className="text-[13px] text-[#9AA0AE] leading-relaxed">
                                                                Schedule a complimentary 15-minute consultation to discuss your site's optimization strategy.
                                                            </p>
                                                        </div>
                                                        <a
                                                            href="mailto:madebyskovie@gmail.com?subject=Flux%20Intelligence%20Consultation%20Request"
                                                            className="shrink-0 px-5 py-2.5 rounded-lg bg-[#EDEEF2] text-[#0E0F12] text-[13px] font-medium hover:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-[#EDEEF2] focus:ring-offset-2 focus:ring-offset-[#12141A]"
                                                        >
                                                            Get Free Consultation
                                                        </a>
                                                    </div>
                                                </div>
                                            </div>



                                        </div>
                                    </DeepAnalysisReveal>
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
                                                    {status === 'complete' && (
                                                        <button
                                                            onClick={generateReport}
                                                            className="text-xs font-medium text-[#94A3B8] hover:text-white transition-colors flex items-center gap-2 ml-auto"
                                                        >
                                                            <Share2 className="w-3.5 h-3.5" /> Download Report
                                                        </button>
                                                    )}
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
                    {activeView === 'monitor' && <MonitorView />}

                    {(activeView === 'strategy' || activeView === 'settings') && (
                        <div className="max-w-4xl mx-auto py-12 text-center text-[#64748B]">
                            <Settings className="w-12 h-12 mx-auto text-[#334155] mb-4" />
                            <h2 className="text-lg font-semibold text-white">System View</h2>
                            <p className="text-sm">This module is currently under development.</p>
                        </div>
                    )}

                </div>
            </main >
        </div >
    );
}
