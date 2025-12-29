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
import { TextDecode } from "../components/ui/TextDecode";
import clsx from 'clsx';
import IntelligentTypewriter from '../components/IntelligentTypewriter';
import ThinkingLog, { Milestone } from '../components/ThinkingLog';
import { DeepAnalysisReveal }
    from '../components/DeepAnalysisReveal';
import { TechIcon } from '../components/ui/TechIcon';
import { CyberLoader } from '../components/ui/CyberLoader';

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


const MOCK_REPORT: AnalysisReport = {
    meta: {
        url: "https://demo.flux-intel.com",
        scanTimestamp: new Date().toISOString(),
        performance: {
            lighthouseScore: 88,
            lcp: "1.2s",
            inp: "45ms",
            cls: "0.01",
            speedIndex: "1.5s"
        }
    },
    coreSignals: {
        vibeScore: { grade: "B", score: 82, label: "Solid Foundation", summary: "Good base, needs polish." },
        headlineSignal: { grade: "A", label: "Example Signal", summary: "Strong messaging." },
        visualArchitecture: { grade: "B-", label: "Visuals", summary: "Clean but generic." }
    },
    clientReadySummary: {
        executiveSummary: "This is a demonstration of the Flux Intelligence Engine's terminal aesthetic. The system has detected strong structural integrity but suggests targeted optimizations in visual hierarchy and interaction depth.",
        top3WinsThisWeek: ["Optimize LCP", "Refine Typography", "Enhance Animations"]
    },
    strategicIntelligence: {
        onSiteStrategy: { summary: "Enhance core web vitals.", actions: ["Minify JS", "Optimize Images"] },
        offSiteGrowth: { summary: "Expand backlink profile.", actions: ["Guest posts", "Social signals"] },
        aiOpportunities: { summary: "Leverage AI for content.", actions: ["Auto-blogging", "Smart replies"] }
    },
    tacticalFixes: [
        {
            id: "fix-1",
            title: "Render blocking resources",
            category: "Performance",
            problem: "Critical CSS is not inlined.",
            recommendation: "Inline critical CSS and defer the rest.",
            impact: "High",
            severity: "Critical",
            effortHours: 4,
            owners: ["DevOps"],
            expectedOutcome: "Faster FCP",
            evidence: [{ label: "Blocking Time", value: "1200ms" }]
        },
        {
            id: "fix-2",
            title: "Low contrast text",

            category: "Accessibility",
            problem: "Gray text on white background.",
            recommendation: "Darken text color to meet WCAG AA.",
            impact: "Medium",
            severity: "High",
            effortHours: 2,
            owners: ["Design"],
            expectedOutcome: "Better readability"
        },
        {
            id: "fix-3",
            title: "Missing Alt Tags",
            category: "SEO",
            problem: "Images missing descriptive alt text.",
            recommendation: "Add alt tags to all images.",
            impact: "Low",
            severity: "Medium",
            effortHours: 1,
            owners: ["Content"],
            expectedOutcome: "Improved SEO"
        }
    ],
    type: "deep"
};

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

    // Animation Variants


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
                                    <div className="scale-125 mb-8">
                                        <CyberLoader text="ESTABLISHING_LINK" />
                                    </div>

                                    <div className="absolute bottom-12 left-0 right-0 text-center">
                                        <p className="text-[#64748B] text-xs font-mono animate-pulse tracking-widest uppercase">
                                            Flux Intelligence Engine v2.0
                                        </p>
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
                                            <span className="px-2.5 py-0.5 rounded-full bg-white/[0.06] text-[#94A3B8] text-xs font-semibold border border-white/[0.06] font-mono" suppressHydrationWarning>
                                                {new Date().toLocaleDateString()}
                                            </span>
                                            {report.type === 'fast' && <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded uppercase font-bold tracking-wide">Fast Pass</span>}
                                        </div>
                                        <p className="text-lg text-[#CBD5E1] leading-relaxed max-w-4xl min-h-[4em]">
                                            {report.clientReadySummary.executiveSummary}
                                        </p>
                                    </section>

                                    <div className="h-px bg-gradient-to-r from-white/[0.1] via-white/[0.05] to-transparent" />


                                    {report.strategicIntelligence && (
                                        <motion.section
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: 0.2 }}
                                            className="py-12 border-b border-white/[0.1]"
                                        >
                                            <div className="flex items-center gap-4 mb-10">
                                                <Target className="w-5 h-5 text-[#38BDF8]" />
                                                <h2 className="text-2xl font-light text-white tracking-tight uppercase">
                                                    <TextDecode text="Strategic Intelligence" />
                                                </h2>
                                            </div>

                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
                                                {/* On-Site Optimization */}
                                                <div className="space-y-6">
                                                    <h3 className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-widest border-t border-[#38BDF8] pt-4">On-Site Optimization</h3>
                                                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                                                        {report.strategicIntelligence.onSiteStrategy?.summary || 'Technical SEO, content architecture, and conversion optimization strategies.'}
                                                    </p>
                                                    <ul className="space-y-4">
                                                        {report.strategicIntelligence.onSiteStrategy?.actions?.map((action, i) => (
                                                            <li key={i} className="text-sm text-[#E2E8F0] leading-relaxed flex items-start gap-3">
                                                                <span className="text-[#64748B] font-mono select-none">0{i + 1}</span>
                                                                <span>{action}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* Off-Site Growth */}
                                                <div className="space-y-6">
                                                    <h3 className="text-xs font-mono font-bold text-[#A855F7] uppercase tracking-widest border-t border-[#A855F7] pt-4">Off-Site Growth</h3>
                                                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                                                        {report.strategicIntelligence.offSiteGrowth?.summary || 'Link building, brand mentions, and strategic partnerships.'}
                                                    </p>
                                                    <ul className="space-y-4">
                                                        {report.strategicIntelligence.offSiteGrowth?.actions?.map((action, i) => (
                                                            <li key={i} className="text-sm text-[#E2E8F0] leading-relaxed flex items-start gap-3">
                                                                <span className="text-[#64748B] font-mono select-none">0{i + 1}</span>
                                                                <span>{action}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>

                                                {/* AI & Automation */}
                                                <div className="space-y-6">
                                                    <h3 className="text-xs font-mono font-bold text-[#10B981] uppercase tracking-widest border-t border-[#10B981] pt-4">AI & Automation</h3>
                                                    <p className="text-sm text-[#94A3B8] leading-relaxed">
                                                        {report.strategicIntelligence.aiOpportunities?.summary || 'Schema markup, AI search optimization, process automation.'}
                                                    </p>
                                                    <ul className="space-y-4">
                                                        {report.strategicIntelligence.aiOpportunities?.actions?.map((action, i) => (
                                                            <li key={i} className="text-sm text-[#E2E8F0] leading-relaxed flex items-start gap-3">
                                                                <span className="text-[#64748B] font-mono select-none">0{i + 1}</span>
                                                                <span>{action}</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                </div>
                                            </div>
                                        </motion.section>
                                    )}


                                    {/* STRATEGIC INDEX - TERMINAL STYLE */}
                                    <div className="flex items-end justify-between py-8 border-b border-white/[0.1]">
                                        <div>
                                            <div className="text-xs font-mono text-[#64748B] uppercase tracking-widest mb-2">
                                                Strategic_Index
                                            </div>
                                            <p className="text-sm text-[#94A3B8] max-w-md leading-relaxed font-mono">
                                                {report.coreSignals?.vibeScore?.summary || (
                                                    <span className="animate-pulse bg-white/10 h-3 w-32 inline-block" />
                                                )}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            {report.coreSignals?.vibeScore?.score ? (
                                                <div className="flex items-baseline justify-end gap-2">
                                                    <span className="text-6xl font-light text-white tracking-tighter">
                                                        <CountUp value={report.coreSignals.vibeScore.score} />
                                                    </span>
                                                    <span className="text-sm text-[#64748B] font-mono mb-2">/100</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-end">
                                                    <div className="h-12 w-24 bg-white/10 animate-pulse mb-2" />
                                                    <span className="text-[10px] text-[#64748B] uppercase tracking-wider font-mono">CALCULATING_INDEX...</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* CORE METRICS - GRID STYLE (NO CARDS) */}
                                    <section className="border-b border-white/[0.1] mb-12">
                                        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-white/[0.1]">

                                            {/* Headline Signal */}
                                            <div className="py-6 md:pr-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest">
                                                        Headline_Signal
                                                    </span>
                                                    {report.coreSignals?.headlineSignal?.grade ? (
                                                        <span className={clsx("text-xl font-bold font-mono", getGradeColor(report.coreSignals?.headlineSignal?.grade))}>
                                                            {report.coreSignals?.headlineSignal?.grade}
                                                        </span>
                                                    ) : (
                                                        <span className="h-6 w-8 bg-white/10 animate-pulse" />
                                                    )}
                                                </div>
                                                <div className="text-sm text-[#E2E8F0] leading-relaxed">
                                                    {report.coreSignals?.headlineSignal?.summary || (
                                                        <div className="space-y-2">
                                                            <div className="h-3 w-3/4 bg-white/10 animate-pulse" />
                                                            <div className="h-3 w-1/2 bg-white/10 animate-pulse" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Visual Architecture */}
                                            <div className="py-6 md:px-6">
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest">
                                                        Visual_Architecture
                                                    </span>
                                                    {report.coreSignals?.visualArchitecture?.grade ? (
                                                        <span className={clsx("text-xl font-bold font-mono", getGradeColor(report.coreSignals?.visualArchitecture?.grade))}>
                                                            {report.coreSignals?.visualArchitecture?.grade}
                                                        </span>
                                                    ) : (
                                                        <span className="h-6 w-8 bg-white/10 animate-pulse" />
                                                    )}
                                                </div>
                                                <div className="text-sm text-[#E2E8F0] leading-relaxed">
                                                    {report.coreSignals?.visualArchitecture?.summary || (
                                                        <div className="space-y-2">
                                                            <div className="h-3 w-3/4 bg-white/10 animate-pulse" />
                                                            <div className="h-3 w-1/2 bg-white/10 animate-pulse" />
                                                        </div>
                                                    )}
                                                </div>
                                            </div>

                                            {/* Domain Integrity */}
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
                                                className="py-6 md:pl-6 text-left w-full hover:bg-white/[0.02] transition-colors"
                                            >
                                                <div className="flex items-center justify-between mb-4">
                                                    <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest">
                                                        Domain_Integrity
                                                    </span>
                                                    {safety && (
                                                        <span className={clsx("text-xl font-bold font-mono", safety.isSafe ? "text-[#EDEEF2]" : "text-red-400")}>
                                                            {safety.isSafe ? "PASS" : "FAIL"}
                                                        </span>
                                                    )}
                                                </div>

                                                {safety ? (
                                                    <div className="text-sm text-[#E2E8F0] leading-relaxed">
                                                        {safety.isSafe ? "No active malware or social threats." : `${safety.threats.length} active threat(s) detected.`}
                                                        <div className="flex items-center gap-2 mt-2">
                                                            <div className={clsx(
                                                                "w-1.5 h-1.5 rounded-full",
                                                                safety.isSafe ? "bg-emerald-500" : "bg-red-500"
                                                            )} />
                                                            <span className="text-xs text-[#64748B] font-mono">Google Safe Browsing API</span>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <div className="space-y-2">
                                                        <div className="h-3 w-3/4 bg-white/10 animate-pulse" />
                                                        <div className="h-3 w-1/2 bg-white/10 animate-pulse" />
                                                    </div>
                                                )}
                                            </button>
                                        </div>
                                    </section>

                                    {/* CORE WEB VITALS - TERMINAL STYLE */}
                                    <div className="mb-16">
                                        <div className="flex items-center gap-4 mb-6 opacity-90">
                                            <TechIcon icon={Zap} isActive={true} color="text-[#38BDF8]" />
                                            <span className="text-xs font-mono text-[#64748B] uppercase tracking-widest">Core_Web_Vitals (Mobile)</span>
                                        </div>

                                        {displayPerformance ? (
                                            <div className="grid grid-cols-2 md:grid-cols-5 gap-8 py-8 border-y border-white/[0.1]">
                                                {/* CWV: Lighthouse */}
                                                <div className="col-span-1 md:col-span-1 border-r border-white/[0.1] pr-4">
                                                    <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-2 font-mono">Performance_Score</div>
                                                    <div className={clsx(
                                                        "text-4xl font-light tracking-tighter",
                                                        getPerformanceColor(displayPerformance.lighthouseScore)
                                                    )}>
                                                        <CountUp value={displayPerformance.lighthouseScore} />
                                                    </div>
                                                </div>

                                                {/* CWV: Metrics */}
                                                <div className="col-span-1 md:col-span-1">
                                                    <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-2 font-mono">LCP (Load)</div>
                                                    <div className="text-xl text-white font-mono">{displayPerformance.lcp}</div>
                                                </div>
                                                <div className="col-span-1 md:col-span-1">
                                                    <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-2 font-mono">INP (Interact)</div>
                                                    <div className="text-xl text-white font-mono">{displayPerformance.inp}</div>
                                                </div>
                                                <div className="col-span-1 md:col-span-1">
                                                    <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-2 font-mono">CLS (Stable)</div>
                                                    <div className="text-xl text-white font-mono">{displayPerformance.cls}</div>
                                                </div>
                                                <div className="col-span-1 md:col-span-1">
                                                    <div className="text-[10px] text-[#64748B] uppercase tracking-wider mb-2 font-mono">Speed_Index</div>
                                                    <div className="text-xl text-white font-mono">{displayPerformance.speedIndex}</div>
                                                </div>
                                            </div>
                                        ) : (
                                            <div className="py-12 border-y border-white/[0.1] text-center">
                                                <Loader2 className="w-5 h-5 text-[#38BDF8] animate-spin mx-auto mb-3" />
                                                <span className="text-xs font-mono text-[#64748B]">MEASURING_LATENCY...</span>
                                            </div>
                                        )}
                                    </div>

                                    {/* MAIN CONTENT GRID - WRAPPED IN PROGRESSIVE REVEAL */}
                                    <DeepAnalysisReveal status={status} className="mt-8">
                                        <div className="grid grid-cols-1 xl:grid-cols-4 gap-12">

                                            {/* TACTICAL EXECUTION PLAN - TERMINAL STYLE */}
                                            <div className="xl:col-span-3 space-y-12">
                                                <div className="flex items-center justify-between border-b border-white/[0.1] pb-6">
                                                    <h3 className="text-xl font-light text-white uppercase tracking-tight">
                                                        <TextDecode text="Tactical Execution Plan" />
                                                        <span className="text-[#64748B] font-mono text-sm ml-4 normal-case">/ {report.tacticalFixes?.length || 0} ITEMS</span>
                                                    </h3>
                                                    <div className="text-xs font-mono text-[#64748B]">
                                                        EVIDENCE_CONFIDENCE: <span className={clsx("text-white", trustSignal > 80 ? "text-emerald-400" : "text-amber-400")}>{trustSignal}%</span>
                                                    </div>
                                                </div>

                                                <motion.div
                                                    initial={{ opacity: 0 }}
                                                    animate={{ opacity: 1 }}
                                                    transition={{ duration: 0.5, delay: 0.2 }}
                                                    className="divide-y divide-white/[0.1]"
                                                >
                                                    {report.tacticalFixes?.map((fix, idx) => (
                                                        <motion.div
                                                            key={fix.id || idx}
                                                            className="grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 py-12 group first:pt-0"
                                                        >
                                                            {/* LEFT: CAUSE & ACTION */}
                                                            <div className="lg:col-span-7 space-y-6">
                                                                <div className="flex items-start justify-between">
                                                                    <div className="space-y-2">
                                                                        <div className="flex items-center gap-3">
                                                                            <span className={clsx("text-[10px] font-mono font-bold uppercase tracking-widest", getImpactColor(fix.impact))}>
                                                                                {fix.impact}_PRIORITY
                                                                            </span>
                                                                            <span className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-widest">
                                                                                    // {fix.category}
                                                                            </span>
                                                                        </div>
                                                                        <h4 className="text-2xl font-light text-white leading-tight">{fix.title}</h4>
                                                                    </div>
                                                                </div>

                                                                <div className="grid grid-cols-1 gap-6">
                                                                    <div className="pl-4 border-l border-white/[0.1]">
                                                                        <span className="text-[#64748B] uppercase text-[10px] font-mono font-bold block mb-2">Observation</span>
                                                                        <p className="text-sm text-[#94A3B8] leading-relaxed">
                                                                            {fix.problem}
                                                                        </p>
                                                                    </div>
                                                                    <div className="pl-4 border-l border-[#38BDF8]">
                                                                        <span className="text-[#38BDF8] uppercase text-[10px] font-mono font-bold block mb-2">Recommendation</span>
                                                                        <p className="text-sm text-[#E2E8F0] leading-relaxed font-medium">
                                                                            {fix.recommendation}
                                                                        </p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex items-center gap-6 pt-2">
                                                                    <div className="text-xs font-mono text-[#64748B]">
                                                                        EFFORT: <span className="text-white">{fix.effortHours}h</span>
                                                                    </div>
                                                                    <div className="text-xs font-mono text-[#64748B]">
                                                                        OUTCOME: <span className="text-emerald-400">{fix.expectedOutcome}</span>
                                                                    </div>
                                                                </div>
                                                            </div>

                                                            {/* RIGHT: EVIDENCE DATA */}
                                                            <div className="lg:col-span-5">
                                                                <div className="h-full pl-6 border-l border-white/[0.1]">
                                                                    <div className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-widest mb-6 flex items-center gap-2">
                                                                        <Microscope className="w-3 h-3" /> Forensic_Evidence
                                                                    </div>

                                                                    {fix.evidence && fix.evidence.length > 0 ? (
                                                                        <ul className="space-y-4">
                                                                            {fix.evidence.map((ev, i) => (
                                                                                <li key={i} className="flex flex-col gap-1">
                                                                                    <span className="text-[10px] text-[#64748B] uppercase tracking-wide font-mono">{ev.label}</span>
                                                                                    <span className="text-xs font-mono text-[#E2E8F0] break-all border-b border-white/[0.1] pb-1 inline-block">
                                                                                        {ev.value}
                                                                                    </span>
                                                                                </li>
                                                                            ))}
                                                                        </ul>
                                                                    ) : (
                                                                        <div className="h-full flex flex-col items-center justify-center text-center opacity-50">
                                                                            <span className="text-xs font-mono text-[#64748B]">NO_DOM_SIGNAL</span>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        </motion.div>
                                                    ))}
                                                </motion.div>
                                            </div>

                                            {/* CTA - TERMINAL STYLE */}
                                            <div className="col-span-full mt-24 border-t border-white/[0.1] pt-12 text-center">
                                                <h3 className="text-xl font-light text-white mb-4">Implementation Support</h3>
                                                <p className="text-sm text-[#94A3B8] max-w-lg mx-auto mb-8 leading-relaxed">
                                                    Systems optimization requires precision execution. Schedule a brief with our principal strategist.
                                                </p>
                                                <a
                                                    href="mailto:madebyskovie@gmail.com?subject=Flux%20Intelligence%20Briefing%20Request"
                                                    className="inline-flex items-center gap-2 px-8 py-3 bg-white text-black text-sm font-bold uppercase tracking-widest hover:bg-[#38BDF8] hover:text-white transition-colors"
                                                >
                                                    Initialize Contact <Target className="w-4 h-4" />
                                                </a>
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
                                    initial={{ opacity: 0 }}
                                    animate={{ opacity: 1 }}
                                    exit={{ opacity: 0 }}
                                    className="bg-[#0A0A0A] border border-white/[0.2] w-full max-w-2xl flex flex-col max-h-[85vh]"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <div className="p-6 border-b border-white/[0.1] flex items-center justify-between bg-[#0A0A0A] shrink-0">
                                        <div>
                                            <div className="text-xs font-mono font-bold text-[#64748B] uppercase tracking-widest mb-2">// {selectedSignal.title}</div>
                                            <h3 className="text-xl font-light text-white max-w-lg leading-tight">{selectedSignal.data.summary}</h3>
                                        </div>
                                        <button onClick={() => setSelectedSignal(null)} className="p-2 hover:bg-white/[0.1] transition-colors border border-transparent hover:border-white/[0.1]">
                                            <X className="w-5 h-5 text-[#94A3B8]" />
                                        </button>
                                    </div>
                                    <div className="p-8 space-y-8 overflow-y-auto bg-[#0A0A0A]">
                                        <div className="flex items-start gap-8">
                                            <div className="p-6 border border-white/[0.1] text-center min-w-[120px]">
                                                <div className="text-[10px] font-mono font-bold text-[#64748B] uppercase tracking-widest mb-2">Grade_Score</div>
                                                <div className={clsx("text-4xl font-light tracking-tighter", getGradeColor(selectedSignal.data.grade).split(' ')[0])}>
                                                    {selectedSignal.data.grade}
                                                </div>
                                            </div>
                                            <div className="flex-1 pt-2">
                                                <p className="text-sm text-[#E2E8F0] leading-relaxed font-mono">
                                                    <span className="text-[#64748B] uppercase select-none mr-2">{">>>"}</span>
                                                    {selectedSignal.data.whyItMatters}
                                                </p>
                                            </div>
                                        </div>
                                        {selectedSignal.data.rationale && (
                                            <div className="space-y-4">
                                                <div className="text-xs font-mono font-bold text-[#38BDF8] uppercase tracking-widest flex items-center gap-2 border-b border-[#38BDF8]/20 pb-2">
                                                    <Microscope className="w-3.5 h-3.5" /> Detailed_Rationale

                                                </div>
                                                <p className="text-sm text-[#94A3B8] leading-loose whitespace-pre-wrap font-mono">
                                                    {selectedSignal.data.rationale}
                                                </p>
                                                {status === 'complete' && (
                                                    <button
                                                        onClick={generateReport}
                                                        className="text-xs font-mono font-bold text-white hover:underline transition-all flex items-center gap-2 mt-4"
                                                    >
                                                        [DOWNLOAD_FULL_REPORT] <Share2 className="w-3.5 h-3.5" />
                                                    </button>
                                                )}
                                            </div>
                                        )}
                                        {selectedSignal.data.quickWin && (
                                            <div className="border border-emerald-500/30 p-6">
                                                <div className="text-xs font-mono font-bold text-emerald-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                                                    <Target className="w-3.5 h-3.5" /> Quick_Win_Protocol
                                                </div>
                                                <p className="text-sm text-[#CBD5E1] leading-relaxed">
                                                    {selectedSignal.data.quickWin}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="p-4 border-t border-white/[0.1] flex justify-end shrink-0 bg-[#0A0A0A]">
                                        <button
                                            onClick={() => setSelectedSignal(null)}
                                            className="px-6 py-2 bg-white text-black text-xs font-mono font-bold uppercase hover:bg-[#38BDF8] hover:text-white transition-colors"
                                        >
                                            Close_Terminal
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
