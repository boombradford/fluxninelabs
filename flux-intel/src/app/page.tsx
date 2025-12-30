"use client";

import { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Share2, Search, Zap, Globe, Gauge, Activity, Target, ArrowRight, Settings, AlertTriangle, Monitor, Database, Lock, Loader2, Microscope, Maximize2, X, Trophy, LayoutTemplate, RefreshCw, ShieldCheck, Info, Printer, Check
} from 'lucide-react';
import { TextDecode } from "../components/ui/TextDecode";
import clsx from 'clsx';
import { DeepAnalysisReveal } from '../components/DeepAnalysisReveal';
import { TechIcon } from '../components/ui/TechIcon';
import { CyberLoader } from '../components/ui/CyberLoader';

import { MonitorView } from '../components/MonitorView';
import { CountUp } from '../components/CountUp';
import { WarRoomView } from '../components/WarRoomView';
import { TacticalVision } from '../components/TacticalVision';
import ThinkingLog from '../components/ThinkingLog';
import ResearchStream, { DeepScanningLine } from '../components/ResearchStream';

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
    error?: string; // Added to handle error state
    scannedPages?: string[];
    coreSignals: {
        vibeScore: CoreSignal;
        headlineSignal: CoreSignal;
        visualArchitecture: CoreSignal;
    };
    tacticalFixes?: TacticalFix[]; // Optional initially in Fast Mode
    strategicIntelligence?: {
        onSiteStrategy?: { summary: string, actions: string[] };
        offSiteGrowth?: { summary: string, actions: string[] };
        aiOpportunities?: { summary: string, actions: string[] };
    };
    signals?: {
        navigation?: string[];
    };
    clientReadySummary: {
        executiveSummary: string;
        top3WinsThisWeek: string[];
    };
    type?: 'fast' | 'deep'; // Track which stage we are at
    domIssues?: {
        lcp?: { rect: { width: number; height: number; top: number; left: number }; snippet?: string };
        cls?: Array<{ rect: { width: number; height: number; top: number; left: number }; snippet?: string }>;
    };
    vs?: { // New property for VS mode
        self: AnalysisReport;
        enemy: AnalysisReport;
    };
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
                // eslint-disable-next-line @typescript-eslint/no-explicit-any
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
    type: "deep",
    vs: {
        self: {
            meta: { url: "https://demo.flux-intel.com", scanTimestamp: new Date().toISOString(), performance: { lighthouseScore: 88, lcp: "1.2s", inp: "45ms", cls: "0.01", speedIndex: "1.5s" } },
            coreSignals: { vibeScore: { grade: "B" }, headlineSignal: { grade: "A" }, visualArchitecture: { grade: "B-" } },
            clientReadySummary: { executiveSummary: "Self summary", top3WinsThisWeek: [] }
        },
        enemy: {
            meta: { url: "https://competitor.com", scanTimestamp: new Date().toISOString(), performance: { lighthouseScore: 75, lcp: "2.5s", inp: "80ms", cls: "0.05", speedIndex: "2.8s" } },
            coreSignals: { vibeScore: { grade: "C" }, headlineSignal: { grade: "B" }, visualArchitecture: { grade: "C+" } },
            clientReadySummary: { executiveSummary: "Enemy summary", top3WinsThisWeek: [] }
        }
    }
};

export default function Dashboard() {
    const [url, setUrl] = useState('');
    const [enemyUrl, setEnemyUrl] = useState(''); // VS Mode: Competitor URL
    const [isVsMode, setIsVsMode] = useState(false); // VS Mode Toggle
    const [status, setStatus] = useState<'idle' | 'scouting' | 'analyzing' | 'analyzing_deep' | 'complete'>('idle');
    const [scanStatusMessage, setScanStatusMessage] = useState('Initializing Flux Engine...');
    const [milestones, setMilestones] = useState<Milestone[]>([]);
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [enemyReport, setEnemyReport] = useState<AnalysisReport | null>(null); // VS Mode: Competitor Report
    const [error, setError] = useState<string | null>(null);
    const [activeView, setActiveView] = useState<'audit' | 'monitor' | 'strategy' | 'settings' | 'vs'>('audit');
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
        if (!targetUrl) {
            setError('Please enter a website domain to begin the analysis.');
            return;
        }

        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = `https://${targetUrl}`;
            setUrl(targetUrl); // Update UI
        }

        setStatus('scouting');
        setError(null);
        handleSetReport(null);
        setEnemyReport(null); // Reset enemy report
        setActiveView('audit');

        // Initialize milestones
        setMilestones([
            { id: 'init', message: isVsMode ? 'Initializing War Room...' : 'Initializing Flux Engine...', status: 'active', timestamp: Date.now() },
            { id: 'dns', message: isVsMode ? 'Acquiring multiple targets...' : 'Resolving domain...', status: 'pending' },
            { id: 'scrape', message: 'Extracting intelligence...', status: 'pending' },
            { id: 'analyze', message: 'Running comparative analysis...', status: 'pending' },
            { id: 'complete', message: 'Generating tactical report...', status: 'pending' }
        ]);

        try {
            // Update: DNS resolved
            setMilestones(m => m.map(mile =>
                mile.id === 'init' ? { ...mile, status: 'complete' } :
                    mile.id === 'dns' ? { ...mile, status: 'active', timestamp: Date.now() } :
                        mile
            ));

            // VS MODE: PARALLEL EXECUTION
            if (isVsMode && enemyUrl) {
                // PHASE 1: DUAL FAST PASS
                const [selfRes, enemyRes] = await Promise.all([
                    fetch('/api/audit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: targetUrl, mode: 'fast', forceRefresh }),
                    }),
                    fetch('/api/audit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: enemyUrl, mode: 'fast', forceRefresh }),
                    })
                ]);

                // Update: Scraped
                setMilestones(m => m.map(mile =>
                    mile.id === 'dns' ? { ...mile, status: 'complete' } :
                        mile.id === 'scrape' ? { ...mile, status: 'active', timestamp: Date.now(), detail: 'Intercepting rival signals...' } :
                            mile
                ));

                const selfData = await selfRes.json();
                const enemyData = await enemyRes.json();

                if (!selfRes.ok) throw new Error((selfData as { error?: string }).error || 'Self scan failed');
                // Note: If enemy fails, we could potentially just show self, but for now we fail hard.

                // Update: Analyzed
                setMilestones(m => m.map(mile =>
                    mile.id === 'scrape' ? { ...mile, status: 'complete' } :
                        mile.id === 'analyze' ? { ...mile, status: 'active', timestamp: Date.now() } :
                            mile
                ));

                // Render Fast Results (Self) - We don't render Enemy Fast yet, we wait for Deep
                handleSetReport(selfData);
                setEnemyReport(enemyData);
                setStatus('analyzing_deep');

                // PHASE 2: DUAL DEEP PASS
                const [deepSelf, deepEnemy] = await Promise.all([
                    fetch('/api/audit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: targetUrl, mode: 'deep', forceRefresh }),
                    }),
                    fetch('/api/audit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: enemyUrl, mode: 'deep', forceRefresh }),
                    }),
                    new Promise(resolve => setTimeout(resolve, 5000)) // 5s War Room Delay
                ]);

                const deepSelfData = await deepSelf.json();
                const deepEnemyData = await deepEnemy.json();

                // Update: Complete
                setMilestones(m => m.map(mile =>
                    mile.id === 'analyze' ? { ...mile, status: 'complete' } :
                        mile.id === 'complete' ? { ...mile, status: 'complete', timestamp: Date.now() } :
                            mile
                ));

                // Combine self and enemy reports into a single report object for the 'vs' view
                handleSetReport({
                    ...deepSelfData,
                    vs: {
                        self: deepSelfData,
                        enemy: deepEnemyData
                    }
                });
                setStatus('complete');
                setActiveView('vs'); // Switch to VS view

            } else {
                // SINGLE MODE (Legacy)
                // PHASE 1: FAST PASS
                let fastRes;
                if (prefetchRef.current && !forceRefresh) {
                    fastRes = await prefetchRef.current;
                    prefetchRef.current = null;
                } else {
                    fastRes = await fetch('/api/audit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: targetUrl, mode: 'fast', forceRefresh }),
                    });
                }

                // Update: Scraped
                setMilestones(m => m.map(mile =>
                    mile.id === 'dns' ? { ...mile, status: 'complete' } :
                        mile.id === 'scrape' ? { ...mile, status: 'active', timestamp: Date.now(), detail: 'Parsing HTML, extracting metadata...' } :
                            mile
                ));

                const fastData = (await fastRes.json()) as AnalysisReport;
                if (!fastRes.ok) throw new Error((fastData as unknown as { error: string }).error || 'Initial scan failed');

                // Update: Analyzed
                setMilestones(m => m.map(mile =>
                    mile.id === 'scrape' ? { ...mile, status: 'complete' } :
                        mile.id === 'analyze' ? { ...mile, status: 'active', timestamp: Date.now() } :
                            mile
                ));

                // Render Fast Results Immediately
                handleSetReport(fastData);
                setStatus('analyzing_deep');

                console.log('[Flux Debug] Starting Deep Analysis fetch...');
                // PHASE 2: DEEP PASS
                const [deepRes] = await Promise.all([
                    fetch('/api/audit', {
                        method: 'POST',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ url: targetUrl, mode: 'deep', forceRefresh }),
                    }),
                    new Promise(resolve => setTimeout(resolve, 500)) // Smooth transition without artificial slowdown
                ]);
                console.log('[Flux Debug] Deep Analysis fetch completed. Status:', deepRes.status);

                // Improved error handling for timeouts

                let deepData;
                try {
                    deepData = (await deepRes.json()) as AnalysisReport;
                } catch (parseErr) {
                    // Likely got HTML error page due to timeout
                    console.warn('[Flux] Deep analysis timed out or returned invalid JSON');
                    // Keep fast mode results and mark as complete
                    setStatus('complete');
                    setMilestones(m => m.map(mile =>
                        mile.id === 'analyze' ? { ...mile, status: 'complete' } :
                            mile.id === 'complete' ? { ...mile, status: 'complete', timestamp: Date.now() } :
                                mile
                    ));
                    // Show warning but don't break the whole experience
                    console.warn('Fast mode results retained. Deep analysis unavailable.');
                    return; // Exit early, keep fast results
                }

                if (!deepRes.ok) {
                    const errorMsg = deepRes.status === 504
                        ? 'Analysis timed out. Showing quick insights instead. Try re-scanning with a simpler site or refresh the page.'
                        : deepData.error || 'Deep analysis failed';
                    // Don't throw - keep the fast results we already have
                    console.warn('[Flux]', errorMsg);
                    setStatus('complete');
                    setMilestones(m => m.map(mile =>
                        mile.id === 'analyze' ? { ...mile, status: 'complete' } :
                            mile.id === 'complete' ? { ...mile, status: 'complete', timestamp: Date.now() } :
                                mile
                    ));
                    return; // Exit early, keep fast results
                }

                // Update: Complete
                setMilestones(m => m.map(mile =>
                    mile.id === 'analyze' ? { ...mile, status: 'complete' } :
                        mile.id === 'complete' ? { ...mile, status: 'complete', timestamp: Date.now() } :
                            mile
                ));

                console.log('[Flux Debug] Deep Analysis Response:', {
                    hasTacticalFixes: !!deepData?.tacticalFixes,
                    tacticalFixesCount: deepData?.tacticalFixes?.length || 0,
                    hasStrategicIntel: !!deepData?.strategicIntelligence,
                    fullData: deepData
                });
                handleSetReport(deepData);
                console.log('[Flux Debug] Report state should update now with deep data');
                setStatus('complete');
            }

            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (err: any) {
            console.error(err);
            // Provide helpful error messages for common scenarios
            let errorMessage = err.message || 'An unexpected error occurred';
            if (err.message?.includes('Failed to fetch') || err.message?.includes('timed out')) {
                errorMessage = 'Connection timed out. The analysis may be taking longer than expected. Please try again with a simpler website.';
            }
            setError(errorMessage);
            if (report) {
                // If we have partial data (Fast Pass), don't reset to idle.
                setStatus('complete');
            } else {
                setStatus('idle');
            }
        }
    };



    const trustSignal = calculateTrustSignal(report?.tacticalFixes);

    // Report Generation Function - Triggers Print Dialog for PDF Export
    const generateReport = () => {
        window.print();
    };

    // Animation Variants


    return (
        <div className="min-h-screen flex bg-black text-white antialiased selection:bg-cyan-500/30">

            {/* Skip to main content - for keyboard users */}
            <a
                href="#main-content"
                className="sr-only focus:not-sr-only focus:absolute focus:top-4 focus:left-4 focus:z-50 focus:px-4 focus:py-2 focus:bg-[#38BDF8] focus:text-white focus:rounded-lg focus:shadow-lg"
            >
                Skip to main content
            </a>

            {/* MAIN CONTENT */}
            <main
                className="flex-1 flex flex-col min-w-0 bg-[#030712] relative overflow-hidden"
                role="main"
                aria-label="Analysis dashboard"
            >
                <div className="absolute top-0 inset-x-0 h-[800px] bg-flux-glow pointer-events-none opacity-20" aria-hidden="true" />

                {/* HEADER - Instrumented AppBar */}
                <header
                    className="h-14 border-b border-[rgba(255,255,255,0.06)] bg-[#0B0F14] px-6 flex items-center justify-between sticky top-0 z-50"
                    role="banner"
                >
                    <div className="flex items-center gap-8">
                        <button
                            onClick={() => window.location.reload()}
                            className="flex items-center gap-3.5"
                        >
                            <img src="/brand/logo.jpg" alt="Logo" className="w-6 h-6 object-contain" />
                            <span className="text-[14px] font-semibold text-[#f8fafc] tracking-tight">
                                Flux Intelligence
                            </span>
                        </button>
                    </div>

                    {status !== 'idle' && (
                        <div className="flex-1 max-w-lg mx-8">
                            <div className="relative flex items-center">
                                <span className="absolute left-3 text-[10px] font-mono text-[#555555]">URL::</span>
                                <input
                                    type="text"
                                    value={url}
                                    readOnly
                                    className="w-full pl-14 pr-4 py-1.5 bg-transparent border border-[rgba(255,255,255,0.04)] text-[11px] font-mono text-[#8B8B8B] focus:outline-none"
                                />
                            </div>
                        </div>
                    )}

                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 px-3 py-1 border border-[rgba(255,255,255,0.04)]">
                            <div className="w-1 h-1 rounded-full bg-[#3D8B6E]" />
                            <span className="text-[10px] font-mono text-[#555555]">Online</span>
                        </div>
                    </div>
                </header>

                <div className="flex-1 flex overflow-hidden">
                    {/* PERSISTENT SIDEBAR RAIL */}
                    <aside className="w-14 border-r border-white/[0.04] bg-[#030712] flex flex-col items-center py-6 gap-6 shrink-0">
                        <div className="p-2.5 text-[#f06c5b] bg-[#f06c5b]/10 rounded-xl transition-all hover:scale-110">
                            <Activity className="w-4 h-4" />
                        </div>
                        <div className="p-2.5 text-[#555555] hover:text-[#8B8B8B] transition-colors cursor-pointer">
                            <Search className="w-4 h-4" />
                        </div>
                        <div className="p-2.5 text-[#555555] hover:text-[#8B8B8B] transition-colors cursor-pointer">
                            <Globe className="w-4 h-4" />
                        </div>
                    </aside>

                    <div className="flex-1 overflow-y-auto bg-[#0D1117]" id="main-content">
                        <div className="p-6 lg:p-10">

                            {/* --- AUDIT VIEW --- */}
                            {activeView === 'audit' && (
                                <AnimatePresence>

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
                                    {/* WORKSPACE LANDING - High Density Precision */}
                                    {status === 'idle' && !report && (
                                        <div className="max-w-6xl mx-auto relative min-h-[70vh] flex flex-col justify-center animate-in fade-in slide-in-from-bottom-2 duration-1000">
                                            <div className="space-y-24 relative z-10 w-full">
                                                {/* Primary Controller - Now Centered */}
                                                <div className="text-center space-y-12">
                                                    <div className="flex flex-col items-center gap-6">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-1.5 h-1.5 bg-[#f06c5b] rounded-full" />
                                                            <span className="text-[12px] font-medium text-[#f06c5b] uppercase tracking-[0.2em]">Research Lab</span>
                                                        </div>
                                                        <h1 className="text-5xl font-bold tracking-tighter text-white max-w-2xl mx-auto leading-[1.05]">
                                                            Website forensics and strategic analysis.
                                                        </h1>
                                                    </div>

                                                    <form onSubmit={(e) => runAudit(e)} className="max-w-2xl mx-auto space-y-8">
                                                        <div className="flex flex-col md:flex-row items-stretch md:items-center border border-white/[0.12] bg-white/[0.03] backdrop-blur-xl p-2 rounded-2xl focus-within:border-[#f06c5b]/60 transition-all shadow-2xl group gap-2 md:gap-0">
                                                            <div className="flex-1 flex items-center px-4 py-2 md:py-0">
                                                                <span className="text-[12px] font-bold text-white/50 mr-3 shrink-0">TARGET</span>
                                                                <input
                                                                    type="text"
                                                                    value={url}
                                                                    onChange={(e) => setUrl(e.target.value)}
                                                                    placeholder="domain.com"
                                                                    className="w-full bg-transparent text-white py-2 focus:outline-none placeholder:text-white/20 text-[16px]"
                                                                    autoFocus
                                                                />
                                                            </div>
                                                            <button
                                                                type="submit"
                                                                className="px-8 py-3 bg-[#f06c5b] text-white font-bold text-[12px] tracking-widest hover:bg-[#ff7d6d] transition-all uppercase rounded-xl shadow-[0_0_20px_rgba(240,108,91,0.2)] hover:shadow-[0_0_25px_rgba(240,108,91,0.4)] active:scale-95 shrink-0"
                                                            >
                                                                Start Scan
                                                            </button>
                                                        </div>

                                                        {/* INSTRUMENTED PRESETS */}
                                                        <div className="flex flex-col items-center gap-4">
                                                            <div className="flex items-center gap-3">
                                                                <div className="h-[1px] w-8 bg-white/[0.04]" />
                                                                <span className="tech-label text-white/20">Quick Intervals</span>
                                                                <div className="h-[1px] w-8 bg-white/[0.04]" />
                                                            </div>
                                                            <div className="flex items-center justify-center gap-8">
                                                                {['stripe.com', 'linear.app', 'vercel.com'].map((domain) => (
                                                                    <button
                                                                        key={domain}
                                                                        onClick={() => setUrl(`https://${domain}`)}
                                                                        className="group flex flex-col items-center gap-1.5"
                                                                    >
                                                                        <span className="text-[12px] font-bold text-white/40 group-hover:text-white transition-colors">
                                                                            {domain}
                                                                        </span>
                                                                        <div className="h-[2px] w-0 bg-[#f06c5b] group-hover:w-full transition-all duration-500 rounded-full" />
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </form>
                                                </div>

                                                {/* Instrument Grid - Balanced & Centered */}
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                                    <div className="glass-card p-6 space-y-4">
                                                        <span className="tech-label">Regional Latency</span>
                                                        <div className="flex items-end gap-2">
                                                            <div className="text-2xl font-bold text-[#f8fafc]">12.4ms</div>
                                                            <span className="text-[10px] text-[#10b981] font-semibold pb-1 uppercase tracking-wider">Nominal</span>
                                                        </div>
                                                        <div className="h-1 bg-white/[0.04] overflow-hidden rounded-full">
                                                            <div className="h-full bg-[#10b981] w-[85%]" />
                                                        </div>
                                                    </div>
                                                    <div className="glass-card p-6 space-y-4">
                                                        <span className="tech-label">Intelligence Score</span>
                                                        <div className="flex items-end gap-2">
                                                            <div className="text-2xl font-bold text-[#f8fafc]">98.2</div>
                                                            <span className="text-[10px] text-[#f06c5b] font-semibold pb-1 uppercase tracking-wider">Elite</span>
                                                        </div>
                                                        <div className="h-1 bg-white/[0.04] overflow-hidden rounded-full">
                                                            <div className="h-full bg-[#f06c5b] w-[98%]" />
                                                        </div>
                                                    </div>
                                                    <div className="glass-card p-6 space-y-4">
                                                        <span className="tech-label text-white/40">Identity Cache</span>
                                                        <div className="flex items-end gap-2">
                                                            <div className="text-2xl font-bold text-white">4.2gb</div>
                                                            <span className="text-[10px] text-white/40 font-semibold pb-1 uppercase tracking-wider">Cold</span>
                                                        </div>
                                                        <div className="h-1 bg-white/[0.08] overflow-hidden rounded-full">
                                                            <div className="h-full bg-white/20 w-[42%]" />
                                                        </div>
                                                    </div>
                                                </div>

                                                {/* Side Intelligence - Now Row Based & Balanced */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                    <MonitorView />
                                                    <div className="p-6 border border-[rgba(255,255,255,0.04)] space-y-6 bg-white/[0.01]">
                                                        <span className="tech-label">System Feed</span>
                                                        <ThinkingLog milestones={[
                                                            { id: '1', message: 'Encryption layer valid', status: 'complete' },
                                                            { id: '2', message: 'Sandbox isolation active', status: 'complete' },
                                                            { id: '3', message: 'Ready for intake', status: 'active' }
                                                        ]} />
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    )}



                                    {/* LOADING STAGE - High Impact Centered */}
                                    {(status === 'scouting' || status === 'analyzing') && (
                                        <motion.div
                                            key="loader"
                                            initial={{ opacity: 0 }}
                                            animate={{ opacity: 1 }}
                                            exit={{ opacity: 0 }}
                                            className="fixed inset-0 z-[60] flex items-center justify-center bg-[#030712]/95 backdrop-blur-3xl p-6"
                                        >
                                            <div className="w-full max-w-2xl space-y-16 flex flex-col items-center">
                                                <div className="w-full">
                                                    <CyberLoader text={scanStatusMessage} large />
                                                </div>
                                                <div className="w-full">
                                                    <ResearchStream status={status} centered />
                                                </div>
                                                <div className="text-center space-y-2 opacity-50">
                                                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Neural Link Established</p>
                                                    <div className="flex gap-1 justify-center">
                                                        {[0, 1, 2].map(i => (
                                                            <div key={i} className="w-1.5 h-[1px] bg-[#f06c5b]" />
                                                        ))}
                                                    </div>
                                                </div>
                                            </div>
                                        </motion.div>
                                    )}


                                    {/* REPORT VIEW (Both Fast & Deep) */}
                                    {report && report.meta && (
                                        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="relative space-y-12 pb-20 max-w-[1400px] report-content">


                                            {/* HEADER SECTION - Premium restraint */}
                                            <section className="space-y-4 pt-10">
                                                <div className="flex flex-col items-center gap-6">
                                                    <div className="space-y-2 flex flex-col items-center">
                                                        <div className="flex items-center gap-3">
                                                            <div className="w-2 h-2 rounded-full bg-[#f06c5b] shadow-[0_0_10px_rgba(240,108,91,0.4)]" />
                                                            <span className="text-[12px] font-bold text-white/40 uppercase tracking-[0.25em]">Forensic Signal Isolation</span>
                                                        </div>
                                                        <h1 className="text-5xl font-bold tracking-tight text-[#f8fafc]">
                                                            {new URL(report.meta.url).hostname.replace('www.', '')}
                                                        </h1>
                                                    </div>

                                                    <div className="flex items-center gap-3">
                                                        <div className="px-4 py-2 border border-white/[0.08] bg-white/[0.02] rounded-full text-[11px] font-semibold text-white/50 uppercase tracking-widest" suppressHydrationWarning>
                                                            {new Date().toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: '2-digit' }).toUpperCase()}
                                                        </div>
                                                        <div className="px-4 py-2 bg-[#f06c5b]/10 border border-[#f06c5b]/20 text-[#f06c5b] text-[11px] uppercase font-bold tracking-widest rounded-full">
                                                            {report.type === 'fast' ? "Standard Audit" : "Deep Analysis"}
                                                        </div>
                                                    </div>
                                                </div>
                                                <div className="flex justify-center px-4">
                                                    <p className="text-[16px] text-[#94a3b8] leading-relaxed max-w-3xl text-center font-medium">
                                                        {report.clientReadySummary.executiveSummary}
                                                    </p>
                                                </div>
                                            </section>



                                            {report.strategicIntelligence && (
                                                <section className="pt-12 border-t border-white/[0.05]">
                                                    <div className="flex items-center gap-3 mb-8">
                                                        <Target className="w-3.5 h-3.5 text-[#f06c5b]" />
                                                        <h2 className="text-lg font-semibold text-[#E8E8E8] tracking-tight">Strategic Intelligence</h2>
                                                    </div>

                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
                                                        {/* On-Site Optimization */}
                                                        <div className="space-y-5">
                                                            <div className="tech-label border-b border-white/[0.08] pb-2 flex items-center justify-between">
                                                                <span className="text-white/60">On-Site Vectors</span>
                                                                <span className="text-[#f06c5b]">01</span>
                                                            </div>
                                                            <p className="text-[14px] text-[#94a3b8] leading-relaxed font-medium">
                                                                {report.strategicIntelligence.onSiteStrategy?.summary}
                                                            </p>
                                                            <div className="space-y-3">
                                                                {report.strategicIntelligence.onSiteStrategy?.actions?.map((action, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => setSelectedSignal({
                                                                            title: 'On-Site Strategy',
                                                                            data: { summary: action, grade: 'PR-1', whyItMatters: "Technical foundation reinforcement.", rationale: "Critical infrastructure path." }
                                                                        })}
                                                                        className="w-full text-left text-[12px] text-white/50 leading-relaxed flex items-start gap-3 hover:text-[#f8fafc] transition-colors group"
                                                                    >
                                                                        <span className="text-[#f06c5b] font-bold select-none text-[14px]">›</span>
                                                                        <span className="font-medium">{action}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* Off-Site Growth */}
                                                        <div className="space-y-5">
                                                            <div className="tech-label border-b border-white/[0.08] pb-2 flex items-center justify-between">
                                                                <span className="text-white/60">Off-Site Authority</span>
                                                                <span className="text-[#f06c5b]">02</span>
                                                            </div>
                                                            <p className="text-[14px] text-[#94a3b8] leading-relaxed font-medium">
                                                                {report.strategicIntelligence.offSiteGrowth?.summary}
                                                            </p>
                                                            <div className="space-y-3">
                                                                {report.strategicIntelligence.offSiteGrowth?.actions?.map((action, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => setSelectedSignal({
                                                                            title: 'Off-Site Growth',
                                                                            data: { summary: action, grade: 'GR-1', whyItMatters: "External resonance expansion.", rationale: "Domain authority signal." }
                                                                        })}
                                                                        className="w-full text-left text-[12px] text-white/50 leading-relaxed flex items-start gap-3 hover:text-[#f8fafc] transition-colors group"
                                                                    >
                                                                        <span className="text-[#f06c5b] font-bold select-none text-[14px]">›</span>
                                                                        <span className="font-medium">{action}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>

                                                        {/* AI & Automation */}
                                                        <div className="space-y-5">
                                                            <div className="tech-label border-b border-white/[0.08] pb-2 flex items-center justify-between">
                                                                <span className="text-white/60">AI Protocols</span>
                                                                <span className="text-[#f06c5b]">03</span>
                                                            </div>
                                                            <p className="text-[14px] text-[#94a3b8] leading-relaxed font-medium">
                                                                {report.strategicIntelligence.aiOpportunities?.summary}
                                                            </p>
                                                            <div className="space-y-3">
                                                                {report.strategicIntelligence.aiOpportunities?.actions?.map((action, i) => (
                                                                    <button
                                                                        key={i}
                                                                        onClick={() => setSelectedSignal({
                                                                            title: 'AI Automation',
                                                                            data: { summary: action, grade: 'AI-1', whyItMatters: "Scalability and precision enhancement.", rationale: "Forward-looking optimization." }
                                                                        })}
                                                                        className="w-full text-left text-[12px] text-white/50 leading-relaxed flex items-start gap-3 hover:text-[#f8fafc] transition-colors group"
                                                                    >
                                                                        <span className="text-[#f06c5b] font-bold select-none text-[14px]">›</span>
                                                                        <span className="font-medium">{action}</span>
                                                                    </button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>
                                            )}


                                            {/* STRATEGIC INDEX - TERMINAL STYLE */}
                                            {/* OLD LOCATION OF STRATEGIC INDEX - REMOVED */}
                                            {/* (Moved to Top Grid) */}



                                            {/* MAIN CONTENT GRID - WAR ROOM MODE */}


                                            {/* MAIN CONTENT GRID - STANDARD MODE */}
                                            {!isVsMode && (<div className="standard-mode-wrapper">
                                                {/* SPLIT HERO: VISUAL + SCORE - Re-Balanced for Symmetry */}
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">

                                                    {/* VISUAL AUDIT */}
                                                    <div className="flex flex-col space-y-4">
                                                        <div className="flex items-center justify-between">
                                                            <span className="tech-label text-white/60">Visual Surface Forensics</span>
                                                            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Layer 01</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <TacticalVision
                                                                url={report.meta.url}
                                                                fixes={report.tacticalFixes}
                                                                isScanning={status !== 'complete'}
                                                                domIssues={report.domIssues}
                                                            />
                                                        </div>
                                                    </div>

                                                    {/* INTELLIGENCE SIDEBAR - Styled for Premium SaaS feel */}
                                                    <div className={clsx(
                                                        "glass-card p-8 flex flex-col h-full bg-white/[0.01] border-white/[0.08]",
                                                        status === 'analyzing_deep' && "ring-1 ring-[#f06c5b]/30 shadow-[0_0_40px_rgba(240,108,91,0.15)]"
                                                    )}>
                                                        <div className="flex items-center justify-between mb-8 pb-4 border-b border-white/[0.08]">
                                                            <span className="tech-label text-white/60">Intelligence Matrix</span>
                                                            <span className="text-[10px] text-white/40 uppercase tracking-widest font-bold">Layer 02</span>
                                                        </div>

                                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-10">
                                                            <div className="space-y-1">
                                                                <div className="tech-label text-white/40 lowercase">Performance Density</div>
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className={clsx("text-6xl font-black tracking-tighter", getPerformanceColor(displayPerformance?.lighthouseScore || 0))}>
                                                                        {displayPerformance?.lighthouseScore || "-"}
                                                                    </span>
                                                                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Base</span>
                                                                </div>
                                                            </div>
                                                            <div className="space-y-1">
                                                                <div className="tech-label text-white/40 lowercase">
                                                                    {report.coreSignals?.vibeScore?.label || "Strategic Grade"}
                                                                </div>
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className={clsx("text-6xl font-black tracking-tighter", getGradeColor(report.coreSignals?.vibeScore?.grade))}>
                                                                        {report.coreSignals?.vibeScore?.grade || "-"}
                                                                    </span>
                                                                    <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Core</span>
                                                                </div>
                                                            </div>
                                                        </div>

                                                        {/* SECONDARY SIGNALS - Refined Contrast */}
                                                        <div className="grid grid-cols-3 gap-6 py-8 border-y border-white/5 mb-8">
                                                            <button
                                                                onClick={() => setSelectedSignal({ title: 'Headline Strength', data: report.coreSignals?.headlineSignal })}
                                                                className="text-center group"
                                                            >
                                                                <div className="text-[10px] font-bold mb-2 text-white/30 uppercase tracking-wider group-hover:text-[#f06c5b] transition-colors">Narrative</div>
                                                                <div className={clsx("text-2xl font-black", getGradeColor(report.coreSignals?.headlineSignal?.grade))}>
                                                                    {report.coreSignals?.headlineSignal?.grade || "-"}
                                                                </div>
                                                            </button>
                                                            <button
                                                                onClick={() => setSelectedSignal({ title: 'Visual Quality', data: report.coreSignals?.visualArchitecture })}
                                                                className="text-center group"
                                                            >
                                                                <div className="text-[10px] font-bold mb-2 text-white/30 uppercase tracking-wider group-hover:text-[#f06c5b] transition-colors">Visual</div>
                                                                <div className={clsx("text-2xl font-black", getGradeColor(report.coreSignals?.visualArchitecture?.grade))}>
                                                                    {report.coreSignals?.visualArchitecture?.grade || "-"}
                                                                </div>
                                                            </button>
                                                            <div className="text-center">
                                                                <div className="text-[10px] font-bold mb-2 text-white/30 uppercase tracking-wider">Integrity</div>
                                                                <div className={clsx("text-2xl font-black", safety?.isSafe ? "text-[#10b981]" : "text-red-400")}>
                                                                    {safety ? (safety.isSafe ? "PASS" : "FAIL") : "-"}
                                                                </div>
                                                            </div>
                                                        </div>

                                                        <div className="flex-1 flex flex-col justify-center space-y-4">
                                                            <div className="flex items-center justify-between">
                                                                <span className="text-[11px] font-bold text-white/40 uppercase tracking-[0.2em]">Strategic Verdict</span>
                                                                {status === 'analyzing_deep' && (
                                                                    <div className="flex items-center gap-2">
                                                                        <div className="w-1.5 h-1.5 rounded-full bg-[#f06c5b] animate-pulse" />
                                                                        <span className="text-[10px] text-[#f06c5b] font-bold uppercase tracking-widest">Synthesis active</span>
                                                                    </div>
                                                                )}
                                                            </div>

                                                            {status === 'analyzing_deep' ? (
                                                                <div className="pt-2">
                                                                    <ResearchStream status={status} />
                                                                </div>
                                                            ) : (
                                                                <p className="text-[15px] leading-relaxed font-medium text-[#f8fafc]/90">
                                                                    {report.coreSignals?.vibeScore?.summary || "Analyzing signal resonance..."}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                </div>

                                                {report.domIssues?.lcp && (
                                                    <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5 flex flex-col gap-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-mono font-medium text-amber-500 uppercase tracking-[0.12em]">LCP Element</span>
                                                            <span className="text-[8px] font-mono text-white/20">COORD: {(report.domIssues.lcp.rect as { left: number }).left},{(report.domIssues.lcp.rect as { top: number }).top}</span>
                                                        </div>
                                                        <div className="text-[10px] font-mono text-white/40 bg-black/40 p-2 rounded border border-white/5 overflow-hidden text-ellipsis whitespace-nowrap">
                                                            {report.domIssues.lcp.snippet || 'No snippet available'}
                                                        </div>
                                                    </div>
                                                )}

                                                {report.signals?.navigation && report.signals.navigation.length > 0 && (
                                                    <div className="mt-6 pt-6 border-t border-white/[0.05]">
                                                        <h3 className="text-[10px] font-mono font-medium text-[#a1a1aa] uppercase tracking-[0.12em] mb-3">Detected Navigation</h3>
                                                        <div className="flex flex-wrap gap-2">
                                                            {report.signals.navigation.map((item, i) => (
                                                                <div key={i} className="px-2 py-1 bg-white/[0.03] border border-white/[0.05] rounded text-xs text-white/70 font-mono">
                                                                    {item}
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>)}
                                            <DeepAnalysisReveal status={status}>
                                                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                                                    <div className="lg:col-span-3 space-y-12">
                                                        <div className="flex items-end justify-between border-b border-white/[0.12] pb-6 mb-12">
                                                            <h3 className="text-3xl font-bold tracking-tight text-[#f8fafc] flex items-center gap-4">
                                                                Tactical Action Plan
                                                                <span className="text-[14px] font-bold text-white/30 tracking-widest">[{report.tacticalFixes?.length || 0} ITEMS]</span>
                                                            </h3>
                                                            <div className="text-[12px] font-bold text-white/40 uppercase tracking-[0.2em] flex items-center gap-3">
                                                                Confidence Level: <span className={clsx("font-black", trustSignal > 80 ? "text-[#10b981]" : "text-[#f59e0b]")}>{trustSignal}%</span>
                                                            </div>
                                                        </div>

                                                        <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                                                            {report.tacticalFixes?.map((fix, idx) => (
                                                                <div key={fix.id || idx} className="grid grid-cols-1 lg:grid-cols-2 gap-12 py-16 group">
                                                                    <div className="space-y-8">
                                                                        <div className="space-y-2">
                                                                            <div className="flex items-center gap-3">
                                                                                <span className={clsx("text-[11px] font-bold uppercase tracking-[0.15em]", getImpactColor(fix.impact))}>{fix.impact}</span>
                                                                                <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em]">{fix.category}</span>
                                                                            </div>
                                                                            <h4 className="text-2xl font-bold text-[#f8fafc] tracking-tight">{fix.title}</h4>
                                                                        </div>
                                                                        <div className="space-y-8">
                                                                            <div className="space-y-3">
                                                                                <span className="tech-label text-white/60">Observation</span>
                                                                                <p className="text-[16px] text-white/60 leading-relaxed font-medium">{fix.problem}</p>
                                                                            </div>
                                                                            <div className="space-y-3">
                                                                                <span className="tech-label text-[#f06c5b]/80">Recommendation</span>
                                                                                <p className="text-[16px] text-[#f8fafc] leading-relaxed font-semibold">{fix.recommendation}</p>
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                    <div className="space-y-8">
                                                                        <div className="grid grid-cols-2 gap-8">
                                                                            <div className="space-y-1.5">
                                                                                <span className="tech-label text-white/30">Effort Est.</span>
                                                                                <div className="text-[15px] font-bold text-[#f8fafc]">{fix.effortHours}h</div>
                                                                            </div>
                                                                            <div className="space-y-1.5">
                                                                                <span className="tech-label text-white/30">Target Outcome</span>
                                                                                <div className="text-[15px] font-bold text-[#f8fafc]">{fix.expectedOutcome}</div>
                                                                            </div>
                                                                        </div>
                                                                        <div className="p-6 bg-white/[0.01] border border-white/[0.04] space-y-4 rounded-xl">
                                                                            <span className="tech-label opacity-40">Supporting Proof</span>
                                                                            <div className="grid grid-cols-1 gap-4">
                                                                                {(fix.evidence || []).slice(0, 4).map((ev, i) => (
                                                                                    <div key={i} className="flex flex-col gap-1">
                                                                                        <span className="text-[9px] font-medium text-white/30 uppercase tracking-widest">{ev.label}</span>
                                                                                        <span className="text-[12px] font-mono text-[#f06c5b] break-all">{ev.value}</span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    <div className="col-span-full mt-24 border border-[rgba(255,255,255,0.06)] bg-white/[0.01] p-12 text-center max-w-4xl mx-auto">
                                                        <div className="tech-label mb-6">Execution Support</div>
                                                        <h3 className="text-2xl font-semibold text-[#E8E8E8] mb-4 tracking-tight">Access Principal Strategist</h3>
                                                        <p className="text-[13px] text-[#909090] max-w-lg mx-auto mb-10 leading-relaxed">
                                                            Strategic pivots require precision instrumentation. Coordinate with our technical team for immediate implementation support.
                                                        </p>
                                                        <a href="mailto:madebyskovie@gmail.com?subject=Strategic%20Briefing%20Request" className="inline-flex items-center gap-3 px-10 py-3.5 bg-[#f06c5b] text-white text-[12px] font-bold uppercase tracking-widest hover:bg-[#ff7d6d] transition-all rounded-xl shadow-[0_0_20px_rgba(240,108,91,0.2)]">
                                                            Initialize Sync <Activity className="w-4 h-4" />
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
                                                    <div className="text-xs font-mono font-medium text-[#a1a1aa] uppercase tracking-[0.12em] mb-2">{'//'} {selectedSignal.title}</div>
                                                    <h3 className="text-xl font-light text-white max-w-lg leading-tight">{selectedSignal.data.summary}</h3>
                                                </div>
                                                <button onClick={() => setSelectedSignal(null)} className="p-2 hover:bg-white/[0.1] transition-colors border border-transparent hover:border-white/[0.1]">
                                                    <X className="w-5 h-5 text-[#a1a1aa]" />
                                                </button>
                                            </div>
                                            <div className="p-8 space-y-8 overflow-y-auto bg-[#0A0A0A]">
                                                <div className="flex items-start gap-8">
                                                    <div className="p-6 border border-white/[0.1] text-center min-w-[120px]">
                                                        <div className="text-[10px] font-mono font-medium text-[#64748B] uppercase tracking-[0.12em] mb-2">Grade Score</div>
                                                        <div className={clsx("text-4xl font-light tracking-tighter", getGradeColor(selectedSignal.data.grade).split(' ')[0])}>
                                                            {selectedSignal.data.grade}
                                                        </div>
                                                    </div>
                                                    <div className="flex-1 pt-2">
                                                        <p className="text-sm text-[#E2E8F0] leading-relaxed font-mono">
                                                            <span className="text-[#a1a1aa] uppercase select-none mr-2">{">>>"}</span>
                                                            {selectedSignal.data.whyItMatters}
                                                        </p>
                                                    </div>
                                                </div>
                                                {selectedSignal.data.rationale && (
                                                    <div className="space-y-4">
                                                        <div className="text-xs font-semibold text-[#f06c5b] uppercase tracking-[0.2em] flex items-center gap-2 border-b border-[#f06c5b]/20 pb-2">
                                                            <Microscope className="w-3.5 h-3.5" /> Detailed Rationale
                                                        </div>
                                                        <p className="text-sm text-[#a1a1aa] leading-loose whitespace-pre-wrap font-mono">
                                                            {selectedSignal.data.rationale}
                                                        </p>
                                                        {status === 'complete' && (
                                                            <button
                                                                onClick={generateReport}
                                                                className="text-xs font-mono font-medium text-white hover:underline transition-all flex items-center gap-2 mt-4"
                                                            >
                                                                Download Report <Share2 className="w-3.5 h-3.5" />
                                                            </button>
                                                        )}
                                                    </div>
                                                )}
                                                {selectedSignal.data.quickWin && (
                                                    <div className="border border-emerald-500/30 p-6">
                                                        <div className="text-xs font-mono font-medium text-emerald-400 uppercase tracking-[0.12em] mb-3 flex items-center gap-2">
                                                            <Target className="w-3.5 h-3.5" /> Quick Win Protocol
                                                        </div>
                                                        <p className="text-sm text-[#CBD5E1] leading-relaxed">
                                                            {selectedSignal.data.quickWin}
                                                        </p>
                                                    </div>
                                                )}
                                            </div>
                                            <div className="p-4 border-t border-white/[0.08] flex justify-end shrink-0 bg-[#030712]">
                                                <button
                                                    onClick={() => setSelectedSignal(null)}
                                                    className="px-8 py-2.5 bg-[#f8fafc] text-[#030712] text-[12px] font-bold uppercase tracking-widest hover:bg-[#64748b] hover:text-white transition-all rounded-lg"
                                                >
                                                    Dismiss
                                                </button>
                                            </div>
                                        </motion.div>
                                    </motion.div>
                                )}
                            </AnimatePresence>

                            {/* VS MODE (COMPETITOR RESEARCH) */}
                            {
                                activeView === 'vs' && report && report.vs && (
                                    <WarRoomView
                                        selfReport={report.vs.self}
                                        enemyReport={report.vs.enemy}
                                    />
                                )
                            }

                            {/* MONITOR / STRATEGY PLACEHOLDERS */}
                            {activeView === 'monitor' && <MonitorView />}

                            {
                                (activeView === 'strategy' || activeView === 'settings') && (
                                    <div className="max-w-4xl mx-auto py-12 text-center text-[#a1a1aa]">
                                        <Settings className="w-12 h-12 mx-auto text-[#334155] mb-4" />
                                        <h2 className="text-lg font-semibold text-white">System View</h2>
                                        <p className="text-sm">This module is currently under development.</p>
                                    </div>
                                )
                            }

                        </div>
                    </div>
                </div >
            </main >
        </div >
    );
}
