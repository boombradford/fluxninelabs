import { NextResponse } from 'next/server';
import axios from 'axios';
import OpenAI from 'openai';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { STRATEGY_SYSTEM_PROMPT, FAST_SYSTEM_PROMPT, OUTPUT_INSTRUCTION_PROMPT } from '../../../lib/prompts/auditSystemPrompt';
import { getCachedData, setCachedData, generateCacheKey } from '../../../lib/cache';

export const maxDuration = 60; // Max execution time for Vercel (Hobby)

// --- TYPES ---
interface RoutePerformanceMetrics {
  lighthouseScore: number; // 0-100
  lcp: string; // Largest Contentful Paint (s)
  inp: string; // Interaction to Next Paint (ms)
  cls: string; // Cumulative Layout Shift
  speedIndex: string; // Speed Index (s)
  fcp: string; // First Contentful Paint
  fid: string; // First Input Delay
  tti: string; // Time to Interactive
}

interface PageSignals {
  url: string;
  statusCode: number;
  title?: string;
  metaDescription?: string;
  h1?: string[];
  h2Count?: number;
  wordCount?: number;
  canonical?: string;
  primaryContentSnippet?: string; // Cleaned text from main/article
  internalLinkCount?: number;
  externalLinkCount?: number;
  ctas?: { text: string; link: string }[]; // Detected CTAs
  schemaTypes?: string[]; // Detected JSON-LD types
  pageType?: string; // Heuristic label (blog, product, etc)
  performance?: RoutePerformanceMetrics; // NEW: Real-world PSI metrics
}

// --- CONFIG ---
const MAX_PAGES_TO_ANALYZE = 10;
const MICROLINK_API_KEY = process.env.MICROLINK_API_KEY;

// --- STEP 1: FACT EXTRACTION (LAYER 0) ---

function extractPrimaryContent($: cheerio.CheerioAPI): string {
  // Try to find the main content area
  const selectors = ['main', 'article', '[role="main"]', '#content', '.content'];
  let content = '';

  for (const selector of selectors) {
    const el = $(selector);
    if (el.length) {
      // Clone to avoid modifying original
      const clone = el.clone();
      // Remove noise
      clone.find('nav, footer, script, style, .cookie-banner, .popup').remove();
      content = clone.text().replace(/\s+/g, ' ').trim();
      if (content.length > 500) break; // Found substantial content
    }
  }

  // Fallback to body if no main detected
  if (!content) {
    content = $('body').clone().find('nav, footer, script, style').remove().end().text().replace(/\s+/g, ' ').trim();
  }

  return content.slice(0, 2500); // Limit context window usage
}

function detectCtas($: cheerio.CheerioAPI): { text: string; link: string }[] {
  const ctas: { text: string; link: string }[] = [];
  const intentVerbs = ['buy', 'book', 'join', 'sign', 'contact', 'subscribe', 'get', 'start'];

  $('a, button').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href') || '';
    const lowerText = text.toLowerCase();

    // Check for high-intent verbs or obvious visual classes
    const isIntent = intentVerbs.some(v => lowerText.includes(v));
    const isButton = $(el).attr('class')?.toLowerCase().includes('btn') || $(el).attr('class')?.toLowerCase().includes('button');

    if ((isIntent || isButton) && text.length < 50 && href) {
      ctas.push({ text, link: href });
    }
  });

  return ctas.slice(0, 5); // Top 5
}

function detectSchema($: cheerio.CheerioAPI): string[] {
  const schemas: string[] = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const data = JSON.parse($(el).html() || '{}');
      const type = data['@type'];
      if (type) {
        if (Array.isArray(type)) schemas.push(...type);
        else schemas.push(type);
      }
    } catch (e) { }
  });
  return [...new Set(schemas)];
}

function heuristicPageType(url: string, h1: string): string {
  const lowerUrl = url.toLowerCase();
  if (lowerUrl === '/' || lowerUrl.endsWith('.com/') || lowerUrl.endsWith('.org/')) return 'Homepage';
  if (lowerUrl.includes('blog') || lowerUrl.includes('news')) return 'Blog/Article';
  if (lowerUrl.includes('product') || lowerUrl.includes('shop') || lowerUrl.includes('store')) return 'Product/Collection';
  if (lowerUrl.includes('contact')) return 'Contact';
  if (lowerUrl.includes('about')) return 'About';
  if (lowerUrl.includes('about')) return 'About';
  return 'General Page';
}


async function fetchPageSpeedMetrics(url: string): Promise<RoutePerformanceMetrics | undefined> {
  // Graceful degradation: If PSI fails, return undefined.
  const attemptFetch = async (useKey: boolean) => {
    const apiKey = process.env.GOOGLE_PSI_API_KEY || '';
    const keyParam = useKey && apiKey ? `&key=${apiKey}` : '';
    const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile${keyParam}`;
    return axios.get(apiUrl, { timeout: 30000 }); // Increased timeout to 30s
  };

  try {
    console.log(`[Flux PSI] Fetching metrics for ${url}...`);
    let data;

    try {
      const res = await attemptFetch(true);
      data = res.data;
    } catch (e: any) {
      console.warn(`[Flux PSI] First attempt failed (${e.message}). Retrying without key/proxy...`);
      // Retry logic: sometimes key fails, or transient network issue
      const res = await attemptFetch(false); // Fallback to public quota
      data = res.data;
    }

    const lighthouse = data.lighthouseResult?.categories?.performance?.score * 100 || 0;
    const aud = data.lighthouseResult?.audits || {};

    // Extract Core Web Vitals (prefer field data via loadingExperience if available, but audits are more detailed for Lighthouse)
    const lcp = aud['largest-contentful-paint']?.displayValue || 'N/A';
    const cls = aud['cumulative-layout-shift']?.displayValue || 'N/A';
    const speedIndex = aud['speed-index']?.displayValue || 'N/A';
    const inp = aud['interaction-to-next-paint']?.displayValue || 'N/A'; // Lighthouse 12+ audit
    const fcp = aud['first-contentful-paint']?.displayValue || 'N/A';
    const fid = aud['max-potential-fid']?.displayValue || 'N/A';
    const tti = aud['interactive']?.displayValue || 'N/A';

    console.log(`[Flux PSI] Success: Score ${lighthouse}`);

    return {
      lighthouseScore: Math.round(lighthouse),
      lcp,
      inp,
      cls,
      speedIndex,
      fcp,
      fid,
      tti
    };

  } catch (error: any) {
    console.warn(`[Flux PSI] Fatal Failure: ${error.message}`);
    if (error.response) {
      console.warn(`[Flux PSI] API Error Details:`, JSON.stringify(error.response.data));
    }
    return undefined; // Fail silently, audit continues without performance data
  }
}

async function discoverPages(baseUrl: string): Promise<string[]> {
  const pages = new Set<string>([baseUrl]);
  const domain = new URL(baseUrl).hostname;
  console.log(`[Flux Discovery] Starting discovery for ${baseUrl}`);

  const sitemapUrls = [`${baseUrl}/sitemap.xml`, `${baseUrl}/sitemap_index.xml`];
  for (const sitemapUrl of sitemapUrls) {
    try {
      const { data } = await axios.get(sitemapUrl, { timeout: 3000 });
      const result = await parseStringPromise(data);
      const urls: any[] = [];
      if (result.urlset?.url) urls.push(...result.urlset.url);
      if (result.sitemapindex?.sitemap) urls.push(...result.sitemapindex.sitemap);
      urls.forEach((entry: any) => {
        const loc = entry.loc?.[0];
        if (loc && pages.size < MAX_PAGES_TO_ANALYZE * 2) pages.add(loc.trim());
      });
      if (pages.size > 1) break;
    } catch (e) { }
  }

  if (pages.size === 1) {
    try {
      const { data } = await axios.get(baseUrl, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FluxIntel/1.0)' },
        timeout: 5000
      });
      const $ = cheerio.load(data);
      $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (!href) return;
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          if (new URL(absoluteUrl).hostname === domain && pages.size < MAX_PAGES_TO_ANALYZE) {
            pages.add(absoluteUrl);
          }
        } catch (e) { }
      });
    } catch (e) { }
  }

  return Array.from(pages).slice(0, MAX_PAGES_TO_ANALYZE);
}

async function analyzePage(url: string, includePerformance = false): Promise<PageSignals> {
  try {
    // Parallel Extraction: Cheat code for speed. fetch HTML and PSI at same time if needed.
    const [htmlRes, performance] = await Promise.all([
      axios.get(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; FluxIntel/1.0)' },
        timeout: 5000
      }),
      includePerformance ? fetchPageSpeedMetrics(url) : Promise.resolve(undefined)
    ]);

    const html = htmlRes.data;
    const $ = cheerio.load(html);

    // Core Metadata
    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const h1s = $('h1').map((_, el) => $(el).text().trim()).get();

    // Extracted Signals
    const primaryContent = extractPrimaryContent($);
    const ctas = detectCtas($);
    const schemaTypes = detectSchema($);
    const internalLinks = $('a[href^="/"], a[href^="' + url + '"]').length; // Rough internal link count

    return {
      url,
      statusCode: 200,
      title,
      metaDescription: metaDesc,
      h1: h1s,
      h2Count: $('h2').length,
      wordCount: primaryContent.split(/\s+/).length,
      canonical: $('link[rel="canonical"]').attr('href'),
      primaryContentSnippet: primaryContent,
      internalLinkCount: internalLinks,
      ctas,
      schemaTypes,
      pageType: heuristicPageType(url, h1s[0] || ''),
      performance // Inject Real World Metrics if requested
    };
  } catch (e: any) {
    console.error(`[Flux Analyze] Failed ${url}: ${e.message}`);
    return { url, statusCode: e.response?.status || 500 };
  }
}

// --- HELPER: Ensure Report Structure ---
function ensureReportStructure(raw: any, domain: string): any {
  const base = {
    meta: { url: domain, scanTimestamp: new Date().toISOString() },
    coreSignals: {
      vibeScore: { score: 50, label: "Calibrating...", summary: "Analyzing signal resonance..." },
      headlineSignal: { grade: "C", score: 50, label: "Pending", summary: "Extracting Core Narrative...", whyItMatters: "Analyzing alignment with user intent..." },
      visualArchitecture: { grade: "C", score: 50, label: "Pending", summary: "Mapping Visual Hierarchy...", whyItMatters: "Evaluating cognitive load..." }
    },
    clientReadySummary: {
      executiveSummary: "Flux Engine is synthesizing the initial data stream. Deep tactical analysis is running in background.",
      top3WinsThisWeek: ["Pending analysis...", "Pending analysis...", "Pending analysis..."]
    },
    tacticalFixes: [], // Empty array triggers Skeleton in UI
    strategicIntelligence: undefined // Undefined triggers Skeleton in UI
  };

  // Deep Merge (Simple level)
  return {
    ...base,
    ...raw,
    meta: { ...base.meta, ...raw?.meta },
    coreSignals: {
      ...base.coreSignals,
      ...raw?.coreSignals,
      vibeScore: { ...base.coreSignals.vibeScore, ...raw?.coreSignals?.vibeScore },
      headlineSignal: { ...base.coreSignals.headlineSignal, ...raw?.coreSignals?.headlineSignal },
      visualArchitecture: { ...base.coreSignals.visualArchitecture, ...raw?.coreSignals?.visualArchitecture }
    }
  };
}

// --- STEP 2: STRATEGIST (AI WITH 3-LAYER ARCHITECTURE) ---
async function generateAuditReport(pages: PageSignals[], domain: string, mode: 'fast' | 'deep') {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  const isFast = mode === 'fast';

  // Prepare structured dataset for the AI
  const dataset = pages.filter(p => p.statusCode === 200).map(p => ({
    url: p.url,
    type: p.pageType,
    meta: { title: p.title, description: p.metaDescription, canonical: p.canonical },
    structure: { h1: p.h1, h2Count: p.h2Count, wordCount: p.wordCount },
    signals: {
      ctas: p.ctas?.map(c => c.text).join(', '),
      schema: p.schemaTypes,
      internalLinks: p.internalLinkCount
    },
    // INJECT TRUTH: If available, AI sees real speed.
    performance: p.performance ? {
      score: p.performance.lighthouseScore,
      lcp: p.performance.lcp,
      inp: p.performance.inp
    } : undefined,
    contentSnippet: p.primaryContentSnippet ? p.primaryContentSnippet.substring(0, isFast ? 1000 : 2500) + '...' : 'No content extracted'
  }));

  const userInstruction = {
    instruction: isFast ? "Analyze the homepage ONLY. Provide a Vibe Check and Top 3 Wins." : "Analyze this dataset using the defined strategic lenses. NOTICE: If 'performance' data is present, you MUST prioritize it over heuristic guesses about code bloat.",
    outputRequirement: isFast ? undefined : OUTPUT_INSTRUCTION_PROMPT, // Fast uses implicit schema in Sys Prompt
    siteContext: { domain, scanTimestamp: new Date().toISOString() },
    dataset
  };

  try {
    const response = await openai.chat.completions.create({
      model: isFast ? "gpt-4o-mini" : "gpt-4o", // Reverting to stable models to fix crash
      messages: [
        { role: "system", content: isFast ? FAST_SYSTEM_PROMPT : STRATEGY_SYSTEM_PROMPT }, // Select Prompt based on Mode
        { role: "user", content: JSON.stringify(userInstruction) }
      ],
      response_format: { type: "json_object" },
      temperature: 0.2, // Lower temperature for consistent scientific scoring
      max_tokens: isFast ? 1000 : 8000 // Increased from 4000 to 8000 for deep runs
    });

    const content = response.choices[0].message.content || '{}';
    const parsed = JSON.parse(content);

    // FORCE INJECT PERFORMANCE TRUTH (Do not rely on AI echo)
    const homepage = pages.find(p => p.url === domain || p.url === domain + '/') || pages[0];
    const report = ensureReportStructure(parsed, domain);

    if (homepage?.performance) {
      report.meta.performance = homepage.performance;
    }

    return report;

  } catch (error) {
    console.warn("JSON Parse failed, attempting repair...", error);

    // Fallback for Fast Mode Failure
    if (isFast) {
      console.warn("[Flux Fast] AI failed, returning guaranteed fallback.");
      return ensureReportStructure({}, domain);
    }

    // Attempt Repair for Deep Mode
    try {
      const retryResponse = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are a JSON repair bot. Fix the syntax of the following JSON. Return ONLY the JSON object." },
          { role: "user", content: (error as any)?.message?.toString() || "Fix invalid JSON output" }
        ],
        response_format: { type: "json_object" }
      });
      const retryParsed = JSON.parse(retryResponse.choices[0].message.content || '{}');
      return ensureReportStructure(retryParsed, domain);
    } catch (finalError) {
      console.error("Critical Failure in AI Generation");
      return ensureReportStructure({}, domain);
    }
  }
}

// --- MAIN HANDLER ---
export async function POST(req: Request) {
  try {
    const { url, mode = 'deep', forceRefresh = false } = await req.json(); // Default to deep for backward compatibility
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    console.log(`[Flux Intel] Audit started for: ${url} (Mode: ${mode}, Refresh: ${forceRefresh})`);

    // CACHE CHECK: Do we have the homepage extracted already?
    const cacheKey = generateCacheKey(url);
    const cachedEntry = getCachedData(cacheKey);

    let mainPageSignal: PageSignals;

    if (cachedEntry && !forceRefresh) {
      console.log(`[Flux Cache] Hit for ${url}`);
      mainPageSignal = cachedEntry;
    } else {
      if (forceRefresh) console.log(`[Flux Cache] Force Refresh detected. Bypassing cache.`);
      // Fetch Homepage (No PSI for Fast Mode to save time)
      // If Deep mode, we fetch PSI here to save time for sub-pages later
      mainPageSignal = await analyzePage(url, mode === 'deep');
      setCachedData(cacheKey, mainPageSignal);
    }

    if (mode === 'fast') {
      // --- FAST PASS: LIVE IN < 3s ---
      const report = await generateAuditReport([mainPageSignal], url, 'fast');
      return NextResponse.json({ ...report, type: 'fast' });
    } else {
      // --- DEEP PASS: ASYNC BACKFILL ---
      console.log(`[Flux Deep] Backend processing (Parallelized)...`);

      // OPTIMIZATION: Run PSI and Discovery in PARALLEL to save ~5 seconds
      const psiPromise = !mainPageSignal.performance
        ? fetchPageSpeedMetrics(url)
        : Promise.resolve(mainPageSignal.performance);

      const discoveryPromise = discoverPages(url);

      const [psi, targetPages] = await Promise.all([psiPromise, discoveryPromise]);

      // Attach PSI if we fetched it
      if (psi) mainPageSignal.performance = psi;

      // exclude homepage from re-analysis
      const subPages = targetPages.filter(p => !p.includes(url) && p !== url + '/');

      console.log(`[Flux Deep] Analyzing ${subPages.length} sub-pages + Homepage...`);

      const pageResults = await Promise.all(subPages.map(p => analyzePage(p, false))); // No PSI for subpages
      const validPages = [mainPageSignal, ...pageResults.filter(p => p.statusCode === 200)];

      // Force-refresh the homepage content for Deep Pass if it was truncated in Fast Pass
      // (Fast pass truncates to 2500 chars in `extractPrimaryContent`, but AI might need more context in deep mode)
      // For now, we rely on the implementation plan.

      // 3. Deep Analysis
      const auditReport = await generateAuditReport(validPages, url, 'deep');

      // 4. Merge
      auditReport.meta = {
        ...auditReport.meta,
        url,
        scanTimestamp: new Date().toISOString(),
        performance: mainPageSignal.performance
      };
      auditReport.scannedPages = validPages.map(p => p.url);

      return NextResponse.json({ ...auditReport, type: 'deep' });
    }

  } catch (error: any) {
    console.error('[Flux Intel] FATAL ERROR:', error);
    return NextResponse.json({
      error: error.message || 'Audit process failed',
      details: error.toString()
    }, { status: 500 });
  }
}
