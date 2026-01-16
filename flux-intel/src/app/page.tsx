"use client";

import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
    Search, Zap, Globe, Gauge, Activity, Database, Microscope, AlertTriangle
} from 'lucide-react';
import clsx from 'clsx';
import { DeepAnalysisReveal } from '../components/DeepAnalysisReveal';
import { CyberLoader } from '../components/ui/CyberLoader';

import { TacticalVision } from '../components/TacticalVision';
import ThinkingLog, { Milestone } from '../components/ThinkingLog';
import ResearchStream from '../components/ResearchStream';

// --- TYPES ---
interface PerformanceMetrics {
    lighthouseScore: number;
    seoScore?: number;
    accessibilityScore?: number;
    bestPracticesScore?: number;
    lcp: string;
    inp: string;
    cls: string;
    speedIndex: string;
    fcp?: string;
    fid?: string;
    tti?: string;
}

interface Recommendation {
    id: string;
    title: string;
    category: 'Performance' | 'SEO' | 'Content' | 'CTA' | 'Best Practices';
    priority: 'High' | 'Medium' | 'Low';
    evidence: string[];
    recommendation: string;
}

interface DataSourceStatus {
    status: 'ok' | 'unavailable' | 'error';
    detail: string;
}

interface AnalysisReport {
    meta: {
        url: string;
        scanTimestamp: string;
        performance?: PerformanceMetrics;
        crux?: {
            lcp?: string;
            inp?: string;
            cls?: string;
            dataSource?: string;
            collectionPeriod?: { firstDate: string; lastDate: string };
        };
        scanDiagnostics?: {
            robotsTxt?: { status: number; contentPreview?: string; sitemapUrls?: string[]; error?: string };
            llmsTxt?: { status: number; location: string; contentPreview?: string; error?: string };
        };
        dataSources?: {
            psi: DataSourceStatus;
            crux: DataSourceStatus;
            onPage: DataSourceStatus;
        };
    };
    error?: string;
    scannedPages?: string[];
    pageSignals?: {
        title?: string;
        metaDescription?: string;
        metaKeywords?: string;
        metaRobots?: string;
        xRobotsTag?: string;
        canonical?: string;
        h1?: string[];
        h2Count?: number;
        wordCount?: number;
        topKeywords?: Array<{ term: string; count: number }>;
        ctas?: Array<{ text: string; link: string }>;
    };
    type?: 'fast' | 'deep'; // Track which stage we are at
    analysisMode?: 'deterministic';
    summary?: string;
    recommendations?: Recommendation[];
    domIssues?: {
        lcp?: { rect: { width: number; height: number; top: number; left: number }; snippet?: string };
        cls?: Array<{ rect: { width: number; height: number; top: number; left: number }; snippet?: string }>;
    };
}

// --- HELPERS ---
const getPerformanceColor = (score: number) => {
    if (score >= 90) return 'text-emerald-400';
    if (score >= 50) return 'text-orange-300';
    return 'text-red-400';
};

const getPriorityColor = (priority: Recommendation['priority']) => {
    switch (priority) {
        case 'High': return 'text-red-300 border-red-500/30 bg-red-500/10';
        case 'Medium': return 'text-orange-300 border-orange-500/30 bg-orange-500/10';
        default: return 'text-emerald-300 border-emerald-500/30 bg-emerald-500/10';
    }
};

const getSourceStatusColor = (status: DataSourceStatus['status']) => {
    if (status === 'ok') return 'text-emerald-400';
    if (status === 'error') return 'text-red-400';
    return 'text-white/40';
};



// Client-side PSI fetch hook
// Reason: Avoid exposing API keys; /api/audit fetches PSI in deep mode when available.
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
                console.warn("[Flux Client Fallback] Failed to fetch PSI metrics", err);
            } finally {
                setLoading(false);
            }
        };

        fetchMetrics();
    }, [url, trigger]);

    return { metrics, loading };
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
    const [status, setStatus] = useState<'idle' | 'scouting' | 'analyzing' | 'analyzing_deep' | 'complete'>('idle');
    const [scanStatusMessage, setScanStatusMessage] = useState('Initializing scan...');
    const [, setMilestones] = useState<Milestone[]>([]);
    const [report, setReport] = useState<AnalysisReport | null>(null);
    const [error, setError] = useState<string | null>(null);

    // Client-Side Performance Fetcher (Triggers when report is ready but missing performance)
    const { metrics: clientMetrics, loading: clientMetricsLoading } = useClientSidePerformance(
        report?.meta?.url || '',
        status === 'complete' && !report?.meta?.performance
    );

    // Merge client metrics if available
    const displayPerformance = report?.meta?.performance || clientMetrics;
    const summary = report?.summary || 'Scan complete. Showing verified data and recommendations only.';

    // Persistence: Clean up legacy URL storage
    useEffect(() => {
        if (typeof window !== 'undefined') {
            localStorage.removeItem('flux_audit_url');
        }
    }, []);

    useEffect(() => {
        if (report) setError(null);
    }, [report]);

    const handleSetReport = (newReport: AnalysisReport | null) => {
        setReport(newReport);
    };



    // Loading Sequence Effect
    useEffect(() => {
        if (status !== 'scouting') return;
        const messages = [
            "Initializing scan",
            "Resolving target domain...",
            "Extracting on-page data...",
            "Measuring performance...",
            "Building recommendations..."
        ];
        let i = 0;
        setScanStatusMessage(messages[0]);
        const interval = setInterval(() => {
            i = (i + 1) % messages.length;
            setScanStatusMessage(messages[i]);
        }, 3500); // 3.5s to allow typewriter to finish
        return () => clearInterval(interval);
    }, [status]);
    const runAudit = async (e?: React.FormEvent, forceRefresh = false) => {
        if (e) e.preventDefault();

        let targetUrl = url.trim();
        if (!targetUrl) {
            setError('Please enter a website domain to begin the analysis.');
            return;
        }

        if (!/^https?:\/\//i.test(targetUrl)) {
            targetUrl = `https://${targetUrl}`;
            setUrl(targetUrl);
        }

        setStatus('scouting');
        setError(null);
        handleSetReport(null);

        setMilestones([
            { id: 'init', message: 'Initializing scan...', status: 'active', timestamp: Date.now() },
            { id: 'resolve', message: 'Resolving domain...', status: 'pending' },
            { id: 'extract', message: 'Extracting on-page data...', status: 'pending' },
            { id: 'performance', message: 'Running PSI & CrUX...', status: 'pending' },
            { id: 'recommend', message: 'Building recommendations...', status: 'pending' }
        ]);

        try {
            setMilestones(m => m.map(mile =>
                mile.id === 'init' ? { ...mile, status: 'complete' } :
                    mile.id === 'resolve' ? { ...mile, status: 'active', timestamp: Date.now() } :
                        mile
            ));

            const fastRes = await fetch('/api/audit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ url: targetUrl, mode: 'fast', forceRefresh }),
            });

            setMilestones(m => m.map(mile =>
                mile.id === 'resolve' ? { ...mile, status: 'complete' } :
                    mile.id === 'extract' ? { ...mile, status: 'active', timestamp: Date.now(), detail: 'HTML parsed' } :
                        mile
            ));

            const fastData = (await fastRes.json()) as AnalysisReport;
            if (!fastRes.ok) throw new Error((fastData as unknown as { error: string }).error || 'Initial scan failed');

            setMilestones(m => m.map(mile =>
                mile.id === 'extract' ? { ...mile, status: 'complete' } :
                    mile.id === 'performance' ? { ...mile, status: 'active', timestamp: Date.now() } :
                        mile
            ));

            handleSetReport(fastData);
            setStatus('analyzing_deep');

            const [deepRes] = await Promise.all([
                fetch('/api/audit', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ url: targetUrl, mode: 'deep', forceRefresh }),
                }),
                new Promise(resolve => setTimeout(resolve, 500))
            ]);

            let deepData: AnalysisReport;
            try {
                deepData = (await deepRes.json()) as AnalysisReport;
            } catch (parseErr) {
                setStatus('complete');
                setMilestones(m => m.map(mile =>
                    mile.id === 'performance' ? { ...mile, status: 'complete' } :
                        mile.id === 'recommend' ? { ...mile, status: 'complete', timestamp: Date.now(), detail: 'Deep scan unavailable' } :
                            mile
                ));
                return;
            }

            if (!deepRes.ok) {
                const errorMsg = deepRes.status === 504
                    ? 'Analysis timed out. Showing quick insights instead. Try re-scanning with a simpler site or refresh the page.'
                    : deepData.error || 'Deep analysis failed';
                console.warn('[Flux]', errorMsg);
                setStatus('complete');
                setMilestones(m => m.map(mile =>
                    mile.id === 'performance' ? { ...mile, status: 'complete' } :
                        mile.id === 'recommend' ? { ...mile, status: 'complete', timestamp: Date.now(), detail: 'Deep scan unavailable' } :
                            mile
                ));
                return;
            }

            setMilestones(m => m.map(mile =>
                mile.id === 'performance' ? { ...mile, status: 'complete' } :
                    mile.id === 'recommend' ? { ...mile, status: 'complete', timestamp: Date.now() } :
                        mile
            ));

            handleSetReport(deepData);
            setStatus('complete');
        } catch (err: unknown) {
            const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred';
            setError(errorMessage);
            setStatus(report ? 'complete' : 'idle');
        }
    };

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
                            <Activity className="w-4 h-4" aria-hidden="true" />
                        </div>
                        <button
                            type="button"
                            className="p-2.5 text-[#555555] hover:text-[#8B8B8B] transition-colors cursor-pointer"
                            aria-label="Search"
                        >
                            <Search className="w-4 h-4" aria-hidden="true" />
                        </button>
                        <button
                            type="button"
                            className="p-2.5 text-[#555555] hover:text-[#8B8B8B] transition-colors cursor-pointer"
                            aria-label="Global view"
                        >
                            <Globe className="w-4 h-4" aria-hidden="true" />
                        </button>
                    </aside>

                    <div className="flex-1 overflow-y-auto bg-[#0D1117]" id="main-content">
                        <div className="p-6 lg:p-10">

                            {/* --- AUDIT VIEW --- */}
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
                                                            <span className="text-[12px] font-medium text-[#f06c5b] uppercase tracking-[0.2em]">Trusted Audit</span>
                                                        </div>
                                                        <h1 className="text-5xl font-bold tracking-tighter text-white max-w-2xl mx-auto leading-[1.05]">
                                                            Real-data website audit. No guesswork.
                                                        </h1>
                                                    </div>

                                                    <form onSubmit={(e) => runAudit(e)} className="max-w-2xl mx-auto space-y-8">
                                                        <div className="flex flex-col md:flex-row items-stretch md:items-center border border-white/[0.12] bg-white/[0.03] backdrop-blur-xl p-2 rounded-2xl focus-within:border-[#f06c5b]/60 transition-all shadow-2xl group gap-2 md:gap-0">
                                                            <div className="flex-1 flex items-center px-4 py-2 md:py-0">
                                                                <span className="text-[12px] font-bold text-white/50 mr-3 shrink-0">TARGET</span>
                                                                <input
                                                                    type="text"
                                                                    value={url}
                                                                    onChange={(e) => {
                                                                        if (error) setError(null);
                                                                        setUrl(e.target.value);
                                                                    }}
                                                                    placeholder="domain.com"
                                                                    className="w-full bg-transparent text-white py-2 focus:outline-none placeholder:text-white/20 text-[16px]"
                                                                    aria-label="Website domain"
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

                                                {/* Evidence Grid */}
                                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                                                    <div className="glass-card p-6 space-y-3">
                                                        <span className="tech-label">Performance (PSI)</span>
                                                        <p className="text-[12px] text-white/60 leading-relaxed">Lab scores and vitals from PageSpeed Insights.</p>
                                                    </div>
                                                    <div className="glass-card p-6 space-y-3">
                                                        <span className="tech-label">Field Data (CrUX)</span>
                                                        <p className="text-[12px] text-white/60 leading-relaxed">Real user p75 metrics where Google has origin data.</p>
                                                    </div>
                                                    <div className="glass-card p-6 space-y-3">
                                                        <span className="tech-label">On-Page SEO</span>
                                                        <p className="text-[12px] text-white/60 leading-relaxed">Title, meta, canonical, headings, and keywords.</p>
                                                    </div>
                                                    <div className="glass-card p-6 space-y-3">
                                                        <span className="tech-label">CTA Extraction</span>
                                                        <p className="text-[12px] text-white/60 leading-relaxed">Primary calls-to-action and next-step clarity.</p>
                                                    </div>
                                                </div>

                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                    <div className="p-6 border border-[rgba(255,255,255,0.04)] space-y-6 bg-white/[0.01]">
                                                        <span className="tech-label">What you get</span>
                                                        <ThinkingLog milestones={[
                                                            { id: '1', message: 'Verified PSI performance metrics', status: 'complete' },
                                                            { id: '2', message: 'CrUX field data when available', status: 'complete' },
                                                            { id: '3', message: 'On-page SEO + CTA inventory', status: 'active' }
                                                        ]} />
                                                    </div>
                                                    <div className="p-6 border border-[rgba(255,255,255,0.04)] space-y-4 bg-white/[0.01]">
                                                        <span className="tech-label">Trust-first output</span>
                                                        <p className="text-[13px] text-white/60 leading-relaxed">
                                                            Recommendations only cite observed data. If something is missing, we say so instead of guessing.
                                                        </p>
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
                                                    <p className="text-[10px] uppercase tracking-[0.3em] font-bold text-white/40">Scan in progress</p>
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
                                                            <span className="text-[12px] font-bold text-white/40 uppercase tracking-[0.25em]">Verified Report</span>
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
                                                            {report.type === 'fast' ? "Initial Scan" : "Full Scan"}
                                                        </div>
                                                    </div>
                                                </div>
                                                    <div className="flex justify-center px-4">
                                                        <p className="text-[16px] text-[#94a3b8] leading-relaxed max-w-3xl text-center font-medium">
                                                        {summary}
                                                        </p>
                                                    </div>
                                            </section>

                                            {report.meta.dataSources && (
                                                <section className="pt-8 border-t border-white/[0.05]">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <Database className="w-3.5 h-3.5 text-[#f06c5b]" />
                                                        <h2 className="text-lg font-semibold text-[#E8E8E8] tracking-tight">Data Sources</h2>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-[12px] text-white/60">
                                                        {([
                                                            { label: 'PageSpeed Insights', data: report.meta.dataSources.psi },
                                                            { label: 'CrUX Field Data', data: report.meta.dataSources.crux },
                                                            { label: 'On-Page Crawl', data: report.meta.dataSources.onPage }
                                                        ] as const).map(source => (
                                                            <div key={source.label} className="glass-card p-5 rounded-2xl border border-white/[0.06] space-y-2">
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">{source.label}</div>
                                                                <div className={clsx("text-[12px] font-semibold uppercase tracking-[0.2em]", getSourceStatusColor(source.data.status))}>
                                                                    {source.data.status}
                                                                </div>
                                                                <div className="text-white/60">{source.data.detail}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {report.scannedPages && report.scannedPages.length > 0 && (
                                                <section className="pt-8 border-t border-white/[0.05]">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <Globe className="w-3.5 h-3.5 text-[#f06c5b]" />
                                                        <h2 className="text-lg font-semibold text-[#E8E8E8] tracking-tight">Pages Scanned</h2>
                                                    </div>
                                                    <div className="glass-card p-5 rounded-2xl border border-white/[0.06] text-[12px] text-white/60 space-y-2">
                                                        {report.scannedPages.map((page) => (
                                                            <div key={page} className="text-white/70 break-all">{page}</div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {report.meta.scanDiagnostics && (
                                                <section className="pt-8 border-t border-white/[0.05]">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <Database className="w-3.5 h-3.5 text-[#f06c5b]" />
                                                        <h2 className="text-lg font-semibold text-[#E8E8E8] tracking-tight">Scan Diagnostics</h2>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[12px] text-white/60">
                                                        <div className="glass-card p-5 rounded-2xl border border-white/[0.06]">
                                                            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">robots.txt</div>
                                                            <div className="font-semibold text-white/70">
                                                                Status: {report.meta.scanDiagnostics.robotsTxt?.status ?? 'N/A'}
                                                            </div>
                                                            <div className="mt-2 text-white/50">
                                                                Sitemaps: {report.meta.scanDiagnostics.robotsTxt?.sitemapUrls?.length ?? 0}
                                                            </div>
                                                            {report.meta.scanDiagnostics.robotsTxt?.contentPreview && (
                                                                <pre className="mt-3 text-[10px] leading-relaxed whitespace-pre-wrap text-white/40 bg-black/40 p-2 rounded border border-white/5 max-h-32 overflow-auto">
                                                                    {report.meta.scanDiagnostics.robotsTxt.contentPreview}
                                                                </pre>
                                                            )}
                                                        </div>
                                                        <div className="glass-card p-5 rounded-2xl border border-white/[0.06]">
                                                            <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-2">llms.txt</div>
                                                            <div className="font-semibold text-white/70">
                                                                Status: {report.meta.scanDiagnostics.llmsTxt?.status ?? 'N/A'}
                                                            </div>
                                                            <div className="mt-2 text-white/50">
                                                                Location: {report.meta.scanDiagnostics.llmsTxt?.location || 'N/A'}
                                                            </div>
                                                            {report.meta.scanDiagnostics.llmsTxt?.contentPreview && (
                                                                <pre className="mt-3 text-[10px] leading-relaxed whitespace-pre-wrap text-white/40 bg-black/40 p-2 rounded border border-white/5 max-h-32 overflow-auto">
                                                                    {report.meta.scanDiagnostics.llmsTxt.contentPreview}
                                                                </pre>
                                                            )}
                                                        </div>
                                                    </div>
                                                </section>
                                            )}

                                            {report.meta.crux && (
                                                <section className="pt-8 border-t border-white/[0.05]">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <Gauge className="w-3.5 h-3.5 text-[#f06c5b]" />
                                                        <h2 className="text-lg font-semibold text-[#E8E8E8] tracking-tight">Field Performance (CrUX)</h2>
                                                    </div>
                                                    <div className="glass-card p-5 rounded-2xl border border-white/[0.06] text-[12px] text-white/60 space-y-3">
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-white/40 uppercase tracking-[0.2em] text-[10px]">LCP</span>
                                                            <span className="text-white/80 font-semibold">{report.meta.crux.lcp || 'NOT OBSERVED'}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-white/40 uppercase tracking-[0.2em] text-[10px]">INP</span>
                                                            <span className="text-white/80 font-semibold">{report.meta.crux.inp || 'NOT OBSERVED'}</span>
                                                        </div>
                                                        <div className="flex items-center justify-between">
                                                            <span className="text-white/40 uppercase tracking-[0.2em] text-[10px]">CLS</span>
                                                            <span className="text-white/80 font-semibold">{report.meta.crux.cls || 'NOT OBSERVED'}</span>
                                                        </div>
                                                        <div className="text-white/40 text-[10px] uppercase tracking-[0.2em]">
                                                            {report.meta.crux.collectionPeriod
                                                                ? `Period ${report.meta.crux.collectionPeriod.firstDate} → ${report.meta.crux.collectionPeriod.lastDate}`
                                                                : 'Collection period not observed'}
                                                        </div>
                                                    </div>
                                                </section>
                                            )}

                                            {report.pageSignals && (
                                                <section className="pt-8 border-t border-white/[0.05]">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <Microscope className="w-3.5 h-3.5 text-[#f06c5b]" />
                                                        <h2 className="text-lg font-semibold text-[#E8E8E8] tracking-tight">On-Page Signals</h2>
                                                    </div>
                                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-[12px] text-white/60">
                                                        <div className="glass-card p-5 rounded-2xl border border-white/[0.06] space-y-3">
                                                            <div>
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Title</div>
                                                                <div className="text-white/70 font-semibold break-words">
                                                                    {report.pageSignals.title || 'NOT OBSERVED'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Meta Description</div>
                                                                <div className="text-white/60 break-words">
                                                                    {report.pageSignals.metaDescription || 'NOT OBSERVED'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Meta Keywords</div>
                                                                <div className="text-white/60 break-words">
                                                                    {report.pageSignals.metaKeywords || 'NOT OBSERVED'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Canonical</div>
                                                                <div className="text-white/60 break-words">
                                                                    {report.pageSignals.canonical || 'NOT OBSERVED'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="glass-card p-5 rounded-2xl border border-white/[0.06] space-y-3">
                                                            <div>
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">H1</div>
                                                                <div className="text-white/70 font-semibold break-words">
                                                                    {report.pageSignals.h1?.length ? report.pageSignals.h1.join(' | ') : 'NOT OBSERVED'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Meta Robots / X-Robots-Tag</div>
                                                                <div className="text-white/60 break-words">
                                                                    {report.pageSignals.metaRobots || report.pageSignals.xRobotsTag || 'NOT OBSERVED'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Word Count</div>
                                                                <div className="text-white/60 break-words">
                                                                    {report.pageSignals.wordCount !== undefined ? report.pageSignals.wordCount : 'NOT OBSERVED'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">H2 Count</div>
                                                                <div className="text-white/60 break-words">
                                                                    {report.pageSignals.h2Count !== undefined ? report.pageSignals.h2Count : 'NOT OBSERVED'}
                                                                </div>
                                                            </div>
                                                            <div>
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30 mb-1">Top Keywords</div>
                                                                <div className="text-white/60 break-words">
                                                                    {report.pageSignals.topKeywords?.length
                                                                        ? report.pageSignals.topKeywords.map(k => `${k.term} (${k.count})`).join(', ')
                                                                        : 'NOT OBSERVED'}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </section>
                                            )}

                                            {report.pageSignals?.ctas && (
                                                <section className="pt-8 border-t border-white/[0.05]">
                                                    <div className="flex items-center gap-3 mb-6">
                                                        <Zap className="w-3.5 h-3.5 text-[#f06c5b]" />
                                                        <h2 className="text-lg font-semibold text-[#E8E8E8] tracking-tight">CTA Extraction</h2>
                                                    </div>
                                                    <div className="glass-card p-5 rounded-2xl border border-white/[0.06] text-[12px] text-white/60 space-y-3">
                                                        {report.pageSignals.ctas.length === 0 && (
                                                            <div className="text-white/50">No CTAs detected on the scanned page.</div>
                                                        )}
                                                        {report.pageSignals.ctas.map((cta, idx) => (
                                                            <div key={`${cta.text}-${idx}`} className="flex items-start justify-between gap-4">
                                                                <div className="text-white/80 font-semibold">{cta.text || 'Untitled CTA'}</div>
                                                                <div className="text-white/40 text-[10px] break-all">{cta.link}</div>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </section>
                                            )}

                                            {/* MAIN CONTENT GRID */}
                                            <div className="standard-mode-wrapper">
                                                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
                                                    <div className="flex flex-col space-y-6">
                                                        <div className="flex items-center justify-center pb-6 border-b border-white/[0.06]">
                                                            <span className="tech-label text-white/50">Page Preview</span>
                                                        </div>
                                                        <div className="flex-1">
                                                            <TacticalVision
                                                                url={report.meta.url}
                                                                isScanning={status !== 'complete'}
                                                                domIssues={report.domIssues}
                                                            />
                                                        </div>
                                                    </div>

                                                    <div className={clsx(
                                                        "glass-card p-10 flex flex-col h-full bg-white/[0.01] border-white/[0.08] rounded-3xl",
                                                        status === 'analyzing_deep' && "ring-1 ring-[#f06c5b]/30 shadow-[0_0_40px_rgba(240,108,91,0.15)]"
                                                    )}>
                                                        <div className="flex items-center justify-between mb-8 pb-6 border-b border-white/[0.06]">
                                                            <span className="tech-label text-white/50">Performance Snapshot</span>
                                                            {clientMetricsLoading && (
                                                                <span className="text-[10px] uppercase tracking-[0.2em] text-white/40">Updating</span>
                                                            )}
                                                        </div>

                                                        <div className="grid grid-cols-2 gap-6">
                                                            <div className="space-y-2">
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">PSI Score</div>
                                                                <div className={clsx("text-4xl font-black tracking-tight", getPerformanceColor(displayPerformance?.lighthouseScore || 0))}>
                                                                    {displayPerformance?.lighthouseScore ?? '--'}
                                                                </div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">Speed Index</div>
                                                                <div className="text-2xl font-semibold text-white/80">{displayPerformance?.speedIndex || 'N/A'}</div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">LCP</div>
                                                                <div className="text-2xl font-semibold text-white/80">{displayPerformance?.lcp || 'N/A'}</div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">INP</div>
                                                                <div className="text-2xl font-semibold text-white/80">{displayPerformance?.inp || 'N/A'}</div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">CLS</div>
                                                                <div className="text-2xl font-semibold text-white/80">{displayPerformance?.cls || 'N/A'}</div>
                                                            </div>
                                                            <div className="space-y-2">
                                                                <div className="text-[10px] uppercase tracking-[0.2em] text-white/30">SEO Score</div>
                                                                <div className="text-2xl font-semibold text-white/80">{displayPerformance?.seoScore ?? 'N/A'}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                </div>

                                                {report.domIssues?.lcp && (
                                                    <div className="p-4 bg-white/[0.02] rounded-lg border border-white/5 flex flex-col gap-2">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-[10px] font-mono font-medium text-white/40 uppercase tracking-[0.12em]">LCP Element</span>
                                                            <span className="text-[8px] font-mono text-white/20">COORD: {(report.domIssues.lcp.rect as { left: number }).left},{(report.domIssues.lcp.rect as { top: number }).top}</span>
                                                        </div>
                                                        <div className="text-[10px] font-mono text-white/40 bg-black/40 p-2 rounded border border-white/5 overflow-hidden text-ellipsis whitespace-nowrap">
                                                            {report.domIssues.lcp.snippet || 'No snippet available'}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            <DeepAnalysisReveal status={status}>
                                                <div className="space-y-10">
                                                    <div className="flex items-end justify-between border-b border-white/[0.12] pb-6">
                                                        <h3 className="text-3xl font-bold tracking-tight text-[#f8fafc] flex items-center gap-4">
                                                            Recommendations
                                                            <span className="text-[14px] font-bold text-white/30 tracking-widest">[{report.recommendations?.length || 0} ITEMS]</span>
                                                        </h3>
                                                    </div>

                                                    <div className="divide-y divide-[rgba(255,255,255,0.04)]">
                                                        {(report.recommendations || []).map((rec) => (
                                                            <div key={rec.id} className="py-10 grid grid-cols-1 lg:grid-cols-2 gap-10">
                                                                <div className="space-y-4">
                                                                    <div className="flex items-center gap-3">
                                                                        <span className={clsx("text-[11px] font-bold uppercase tracking-[0.15em]", getPriorityColor(rec.priority))}>{rec.priority}</span>
                                                                        <span className="text-[11px] font-bold text-white/30 uppercase tracking-[0.15em]">{rec.category}</span>
                                                                    </div>
                                                                    <h4 className="text-2xl font-bold text-[#f8fafc] tracking-tight">{rec.title}</h4>
                                                                    <p className="text-[15px] text-white/60 leading-relaxed font-medium">{rec.recommendation}</p>
                                                                </div>
                                                                <div className="space-y-4">
                                                                    <div className="p-5 bg-white/[0.01] border border-white/[0.04] rounded-xl">
                                                                        <span className="tech-label opacity-40">Evidence</span>
                                                                        <div className="grid grid-cols-1 gap-3 mt-4">
                                                                            {rec.evidence.map((item, idx) => (
                                                                                <div key={`${rec.id}-ev-${idx}`} className="text-[12px] font-mono text-[#f06c5b] break-all">
                                                                                    {item}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            </div>
                                                        ))}
                                                        {(!report.recommendations || report.recommendations.length === 0) && (
                                                            <div className="py-10 text-white/60">No recommendations generated for this scan.</div>
                                                        )}
                                                    </div>
                                                </div>
                                            </DeepAnalysisReveal>
                                        </motion.div>
                                    )}
                                </AnimatePresence>

                        </div>
                    </div>
                </div >
            </main >
        </div >
    );
}
