import { NextResponse } from 'next/server';
import axios from 'axios';
import OpenAI from 'openai';
import Anthropic from '@anthropic-ai/sdk';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { STRATEGY_SYSTEM_PROMPT, FAST_SYSTEM_PROMPT, OUTPUT_INSTRUCTION_PROMPT } from '../../../lib/prompts/auditSystemPrompt';
import { getCachedData, setCachedData, generateCacheKey } from '../../../lib/cache';
import { runLighthouseAudit } from '../../../lib/lighthouse';

export const maxDuration = 120; // Allow time for Lighthouse + deep scan

// --- TYPES ---
interface RoutePerformanceMetrics {
  lighthouseScore: number; // 0-100 (Performance category)
  seoScore?: number; // 0-100
  accessibilityScore?: number; // 0-100
  bestPracticesScore?: number; // 0-100
  lcp: string; // Largest Contentful Paint (s)
  inp: string; // Interaction to Next Paint (ms)
  cls: string; // Cumulative Layout Shift
  speedIndex: string; // Speed Index (s)
  fcp: string; // First Contentful Paint
  fid: string; // First Input Delay
  tti: string; // Time to Interactive
  domIssues?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    lcp?: { rect: any, snippet?: string };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    cls?: Array<{ rect: any, snippet?: string }>;
  };
  finalUrl?: string;
  fetchTime?: string;
  lighthouseVersion?: string;
  crux?: {
    lcp?: string;
    inp?: string;
    cls?: string;
    dataSource?: string;
    collectionPeriod?: { firstDate: string; lastDate: string };
  };
}

interface PageSignals {
  url: string;
  statusCode: number;
  blocked?: boolean;
  blockedReason?: string;
  title?: string;
  metaDescription?: string;
  metaKeywords?: string;
  metaRobots?: string;
  xRobotsTag?: string;
  h1?: string[];
  h2Count?: number;
  wordCount?: number;
  canonical?: string;
  primaryContentSnippet?: string; // Cleaned text from main/article
  topKeywords?: Array<{ term: string; count: number }>;
  internalLinkCount?: number;
  externalLinkCount?: number;
  ctas?: { text: string; link: string }[]; // Detected CTAs
  schemaTypes?: string[]; // Detected JSON-LD types
  pageType?: string; // Heuristic label (blog, product, etc)
  performance?: RoutePerformanceMetrics; // Real Lighthouse metrics
  crux?: RoutePerformanceMetrics['crux'];
  techStack?: {
    cms: string[];
    analytics: string[];
    marketing: string[];
    security: string[];
  };
  authority?: {
    socials: { platform: string; url: string }[];
    contacts: { type: 'email' | 'phone'; value: string }[];
  };
  metaGovernance?: {
    openGraph: { title: boolean; description: boolean; image: boolean; url: boolean; siteName: boolean };
    twitter: { card: boolean; site: boolean; creator: boolean };
    favicon: boolean;
  };
  accessibility?: {
    altTextMissing: number; // Count of images missing alt
    headingOrder: string[]; // e.g. ['h1', 'h2', 'h1'] for hierarchy check
    ariaLabels: number; // Count of ARIA labels detected
  };
  resources?: {
    imageFormats: string[]; // ['jpg', 'webp', 'avif']
    resourceHints: string[]; // ['preload', 'preconnect']
  };
  navigation?: string[]; // Phase 3 (New)
}

// --- CONFIG ---
const MAX_PAGES_TO_ANALYZE = 3; // Reduced from 10 to avoid timeout (homepage + 2 key pages)
const DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; FluxIntel/1.0)';

interface SiteDiagnostics {
  robotsTxt?: { status: number; contentPreview?: string; sitemapUrls?: string[]; error?: string };
  llmsTxt?: { status: number; location: string; contentPreview?: string; error?: string };
}

const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'you', 'your', 'are', 'was', 'were', 'from', 'have', 'has', 'had',
  'but', 'not', 'our', 'their', 'they', 'them', 'his', 'her', 'she', 'him', 'its', 'can', 'will', 'just', 'about',
  'into', 'over', 'under', 'more', 'less', 'than', 'then', 'when', 'what', 'why', 'how', 'who', 'where', 'which',
  'a', 'an', 'to', 'of', 'in', 'on', 'at', 'by', 'or', 'as', 'is', 'it', 'be', 'if', 'we', 'us', 'do', 'does', 'did'
]);

// --- STEP 1: FACT EXTRACTION (LAYER 0) ---
function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
}

function extractTopKeywords(text: string, limit = 12): Array<{ term: string; count: number }> {
  const counts = new Map<string, number>();
  const words = text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, ' ')
    .split(/\s+/)
    .filter(word => word.length > 2 && !STOP_WORDS.has(word));

  for (const word of words) {
    counts.set(word, (counts.get(word) || 0) + 1);
  }

  return Array.from(counts.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([term, count]) => ({ term, count }));
}

async function fetchTextResource(url: string, timeout = 6000) {
  try {
    const response = await axios.get(url, {
      timeout,
      validateStatus: () => true,
      headers: { 'User-Agent': DEFAULT_USER_AGENT }
    });
    const content = typeof response.data === 'string' ? response.data : '';
    return {
      status: response.status,
      content
    };
  } catch (error) {
    const err = error as Error;
    return {
      status: 0,
      content: '',
      error: err.message
    };
  }
}

async function fetchSiteDiagnostics(baseUrl: string): Promise<SiteDiagnostics> {
  const origin = new URL(baseUrl).origin;
  const robotsUrl = `${origin}/robots.txt`;
  const robotsRes = await fetchTextResource(robotsUrl);
  const robotsPreview = robotsRes.content ? robotsRes.content.slice(0, 2000) : undefined;
  const sitemapUrls = robotsRes.content
    ? robotsRes.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => /^sitemap:/i.test(line))
      .map(line => line.replace(/^sitemap:\s*/i, '').trim())
      .filter(Boolean)
    : [];

  const llmsLocations = [`${origin}/llms.txt`, `${origin}/.well-known/llms.txt`];
  let llmsResult: SiteDiagnostics['llmsTxt'];
  for (const location of llmsLocations) {
    const res = await fetchTextResource(location);
    if (res.status === 200) {
      llmsResult = {
        status: res.status,
        location,
        contentPreview: res.content.slice(0, 2000)
      };
      break;
    }
    if (!llmsResult) {
      llmsResult = {
        status: res.status,
        location,
        error: res.error
      };
    }
  }

  return {
    robotsTxt: {
      status: robotsRes.status,
      contentPreview: robotsPreview,
      sitemapUrls,
      error: robotsRes.error
    },
    llmsTxt: llmsResult
  };
}

function formatMs(value?: number): string | undefined {
  if (!value) return undefined;
  const seconds = value / 1000;
  return `${seconds.toFixed(2)} s`;
}

async function fetchCruxMetrics(url: string) {
  const apiKey = process.env.GOOGLE_CRUX_API_KEY || '';
  if (!apiKey) return undefined;

  const endpoint = `https://chromeuxreport.googleapis.com/v1/records:queryRecord?key=${apiKey}`;
  try {
    const response = await axios.post(endpoint, {
      url,
      formFactor: 'PHONE'
    }, {
      timeout: 10000,
      headers: { 'Content-Type': 'application/json' }
    });

    const record = response.data?.record;
    const metrics = record?.metrics || {};
    const lcp = metrics?.LARGEST_CONTENTFUL_PAINT_MS?.percentiles?.p75;
    const inp = metrics?.INTERACTION_TO_NEXT_PAINT_MS?.percentiles?.p75;
    const cls = metrics?.CUMULATIVE_LAYOUT_SHIFT_SCORE?.percentiles?.p75;

    return {
      lcp: formatMs(lcp),
      inp: inp ? `${inp} ms` : undefined,
      cls: cls ? cls.toFixed(2) : undefined,
      dataSource: record?.collectionPeriod ? 'CrUX' : undefined,
      collectionPeriod: record?.collectionPeriod
        ? {
          firstDate: `${record.collectionPeriod.firstDate.year}-${String(record.collectionPeriod.firstDate.month).padStart(2, '0')}`,
          lastDate: `${record.collectionPeriod.lastDate.year}-${String(record.collectionPeriod.lastDate.month).padStart(2, '0')}`
        }
        : undefined
    };
  } catch (error) {
    const err = error as Error;
    console.warn('[Flux CrUX] Failed to fetch field data:', err.message);
    return undefined;
  }
}

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


async function fetchPageSpeedMetrics(url: string): Promise<RoutePerformanceMetrics> {
  const result = await runLighthouseAudit(url);
  return result;
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
      const urls: unknown[] = [];
      if (result.urlset?.url) urls.push(...result.urlset.url);
      if (result.sitemapindex?.sitemap) urls.push(...result.sitemapindex.sitemap);
      urls.forEach((entry: unknown) => {
        const loc = (entry as { loc?: string[] }).loc?.[0];
        if (loc && pages.size < MAX_PAGES_TO_ANALYZE * 2) pages.add(loc.trim());
      });
      if (pages.size > 1) break;
    } catch (e) { }
  }

  if (pages.size === 1) {
    try {
      const { data } = await axios.get(baseUrl, {
        headers: { 'User-Agent': DEFAULT_USER_AGENT },
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

// --- NEW: Tech Stack Fingerprinting ---
interface TechStack {
  cms: string[];
  analytics: string[];
  marketing: string[];
  security: string[];
}

function detectTechStack(html: string, $: cheerio.CheerioAPI): TechStack {
  const stack: TechStack = { cms: [], analytics: [], marketing: [], security: [] };
  const lowerHtml = html.toLowerCase();
  const scripts = $('script').map((_, el) => $(el).attr('src') || '').get().join(' ').toLowerCase();
  const metaGen = $('meta[name="generator"]').attr('content')?.toLowerCase() || '';

  // CMS Fingerprints
  if (lowerHtml.includes('wp-content') || metaGen.includes('wordpress')) stack.cms.push('WordPress');
  if (lowerHtml.includes('shopify.com') || lowerHtml.includes('cdn.shopify.com')) stack.cms.push('Shopify');
  if (lowerHtml.includes('wix.com') || metaGen.includes('wix')) stack.cms.push('Wix');
  if (lowerHtml.includes('squarespace')) stack.cms.push('Squarespace');
  if (lowerHtml.includes('next_data') || lowerHtml.includes('__next')) stack.cms.push('Next.js');
  if (lowerHtml.includes('webflow')) stack.cms.push('Webflow');

  // Analytics Fingerprints
  if (lowerHtml.includes('googletagmanager.com/gtm.js')) stack.analytics.push('Google Tag Manager');
  if (lowerHtml.includes('google-analytics.com') || lowerHtml.includes('ga(')) stack.analytics.push('Google Analytics');
  if (lowerHtml.includes('segment.com/analytics.js')) stack.analytics.push('Segment');
  if (lowerHtml.includes('hotjar.com')) stack.analytics.push('Hotjar');
  if (lowerHtml.includes('mixpanel.com')) stack.analytics.push('Mixpanel');
  if (lowerHtml.includes('clarity.ms')) stack.analytics.push('Microsoft Clarity');

  // Marketing Tech
  if (lowerHtml.includes('hubspot.com') || lowerHtml.includes('hs-scripts')) stack.marketing.push('HubSpot');
  if (lowerHtml.includes('klaviyo.com')) stack.marketing.push('Klaviyo');
  if (lowerHtml.includes('connect.facebook.net')) stack.marketing.push('Meta Pixel');
  if (lowerHtml.includes('linkedin.com/insight')) stack.marketing.push('LinkedIn Insight');
  if (lowerHtml.includes('intercom.com') || lowerHtml.includes('intercomcdn')) stack.marketing.push('Intercom');
  if (lowerHtml.includes('drift.com')) stack.marketing.push('Drift');
  if (lowerHtml.includes('marketo.com')) stack.marketing.push('Marketo');

  // Security/CDN
  if (lowerHtml.includes('cloudflare')) stack.security.push('Cloudflare');
  if (lowerHtml.includes('vercel.app') || scripts.includes('_vercel')) stack.security.push('Vercel');

  return stack;
}

// --- NEW: Social & Contact Extraction ---
interface AuthoritySignals {
  socials: { platform: string; url: string }[];
  contacts: { type: 'email' | 'phone'; value: string }[];
}

function extractAuthoritySignals($: cheerio.CheerioAPI): AuthoritySignals {
  const signals: AuthoritySignals = { socials: [], contacts: [] };
  const socialDomains = ['linkedin.com', 'twitter.com', 'x.com', 'facebook.com', 'instagram.com', 'youtube.com', 'tiktok.com'];

  // Extract Links
  $('a[href]').each((_, el) => {
    const href = $(el).attr('href')?.trim();
    if (!href) return;

    // Socials
    if (socialDomains.some(d => href.includes(d))) {
      const platform = socialDomains.find(d => href.includes(d))?.split('.')[0] || 'social';
      // simple dedup check
      if (!signals.socials.some(s => s.url === href)) {
        signals.socials.push({ platform, url: href });
      }
    }

    // Contacts
    if (href.startsWith('mailto:')) {
      signals.contacts.push({ type: 'email', value: href.replace('mailto:', '').split('?')[0] });
    }
    if (href.startsWith('tel:')) {
      signals.contacts.push({ type: 'phone', value: href.replace('tel:', '') });
    }
  });

  return signals;
}

// --- NEW: Deep Forensics (Phase 3) ---
function detectMetaGovernance($: cheerio.CheerioAPI) {
  return {
    openGraph: {
      title: !!$('meta[property="og:title"]').attr('content'),
      description: !!$('meta[property="og:description"]').attr('content'),
      image: !!$('meta[property="og:image"]').attr('content'),
      url: !!$('meta[property="og:url"]').attr('content'),
      siteName: !!$('meta[property="og:site_name"]').attr('content')
    },
    twitter: {
      card: !!$('meta[name="twitter:card"]').attr('content'),
      site: !!$('meta[name="twitter:site"]').attr('content'),
      creator: !!$('meta[name="twitter:creator"]').attr('content')
    },
    favicon: !!$('link[rel="icon"]').attr('href') || !!$('link[rel="shortcut icon"]').attr('href')
  };
}

function assessAccessibility($: cheerio.CheerioAPI) {
  let missingAlt = 0;
  $('img').each((_, el) => {
    const alt = $(el).attr('alt');
    if (!alt || alt.trim() === '') missingAlt++;
  });

  const headingOrder: string[] = [];
  $('h1, h2, h3, h4, h5, h6').each((_, el) => {
    headingOrder.push(el.tagName.toLowerCase());
  });

  return {
    altTextMissing: missingAlt,
    headingOrder: headingOrder.slice(0, 10), // First 10 for snapshot
    ariaLabels: $('[aria-label], [aria-labelledby]').length
  };
}

function auditResources(html: string, $: cheerio.CheerioAPI) {
  const formats = new Set<string>();
  const hints = new Set<string>();

  // Image Formats
  $('img').each((_, el) => {
    const src = $(el).attr('src')?.toLowerCase() || '';
    if (src.endsWith('.webp')) formats.add('webp');
    if (src.endsWith('.avif')) formats.add('avif');
    if (src.endsWith('.jpg') || src.endsWith('.jpeg')) formats.add('jpg');
    if (src.endsWith('.png')) formats.add('png');
    if (src.endsWith('.svg')) formats.add('svg');
  });

  // Resource Hints
  $('link[rel]').each((_, el) => {
    const rel = $(el).attr('rel')?.toLowerCase();
    if (rel === 'preload') hints.add('preload');
    if (rel === 'preconnect') hints.add('preconnect');
    if (rel === 'dns-prefetch') hints.add('dns-prefetch');
  });

  return {
    imageFormats: Array.from(formats),
    resourceHints: Array.from(hints)
  };
}

// --- NEW: Navigation Extraction (Phase 3) ---
function extractNavigation($: cheerio.CheerioAPI): string[] {
  const navItems = new Set<string>();

  // Target common navigation containers
  $('nav a, header a, footer a, [role="navigation"] a').each((_, el) => {
    const text = $(el).text().trim();
    // Filter for reasonably short, meaningful links
    if (text && text.length < 25 && text.length > 2) {
      navItems.add(text);
    }
  });

  return Array.from(navItems).slice(0, 15); // Top 15 items to avoid token bloat
}

async function analyzePage(url: string, includePerformance = false): Promise<PageSignals> {
  try {
    // Parallel Extraction: fetch HTML and Lighthouse metrics at same time if needed.
    const [htmlResResult, performanceResult, cruxResult] = await Promise.allSettled([
      axios.get(url, {
        headers: { 'User-Agent': DEFAULT_USER_AGENT },
        timeout: 10000,
        validateStatus: () => true
      }),
      includePerformance ? fetchPageSpeedMetrics(url) : Promise.resolve(undefined),
      includePerformance ? fetchCruxMetrics(url) : Promise.resolve(undefined)
    ]);

    if (htmlResResult.status !== 'fulfilled') {
      throw htmlResResult.reason;
    }

    const performance = performanceResult.status === 'fulfilled' ? performanceResult.value : undefined;
    const crux = cruxResult.status === 'fulfilled' ? cruxResult.value : undefined;
    if (performanceResult.status === 'rejected') {
      console.warn(`[Flux Lighthouse] Performance audit failed for ${url}:`, performanceResult.reason);
    }
    if (cruxResult.status === 'rejected') {
      console.warn(`[Flux CrUX] Field data fetch failed for ${url}:`, cruxResult.reason);
    }

    if (performance && crux) {
      performance.crux = crux;
    }

    const htmlRes = htmlResResult.value;
    const statusCode = htmlRes.status;
    if (statusCode < 200 || statusCode >= 300) {
      return {
        url,
        statusCode,
        blocked: [401, 403, 429, 503].includes(statusCode),
        blockedReason: `HTTP ${statusCode}`
      };
    }

    const html = htmlRes.data;
    const $ = cheerio.load(html);

    // Core Metadata
    const title = $('title').text().trim();
    const metaDesc = $('meta[name="description"]').attr('content') || '';
    const metaKeywords = $('meta[name="keywords"]').attr('content') || '';
    const metaRobots = $('meta[name="robots"]').attr('content') || $('meta[name="googlebot"]').attr('content') || '';
    const xRobotsTag = Array.isArray(htmlRes.headers?.['x-robots-tag'])
      ? htmlRes.headers['x-robots-tag'].join(', ')
      : (htmlRes.headers?.['x-robots-tag'] as string | undefined);
    const h1s = $('h1').map((_, el) => $(el).text().trim()).get();

    // Extracted Signals
    const primaryContent = extractPrimaryContent($);
    const topKeywords = extractTopKeywords(primaryContent);
    const ctas = detectCtas($);
    const schemaTypes = detectSchema($);
    const internalLinks = $('a[href^="/"], a[href^="' + url + '"]').length; // Rough internal link count

    // NEW: Advanced Signals (Phase 2 & 3)
    const techStack = detectTechStack(html, $);
    const authority = extractAuthoritySignals($);
    const metaGovernance = detectMetaGovernance($);
    const accessibility = assessAccessibility($);
    const resources = auditResources(html, $);
    const navigation = extractNavigation($); // Phase 3

    return {
      url,
      statusCode,
      title,
      metaDescription: metaDesc,
      metaKeywords,
      metaRobots,
      xRobotsTag,
      h1: h1s,
      h2Count: $('h2').length,
      wordCount: primaryContent.split(/\s+/).length,
      canonical: $('link[rel="canonical"]').attr('href'),
      primaryContentSnippet: primaryContent,
      topKeywords,
      internalLinkCount: internalLinks,
      ctas,
      schemaTypes,
      pageType: heuristicPageType(url, h1s[0] || ''),
      performance, // Inject Real World Metrics if requested
      crux,
      techStack, // NEW Phase 2
      authority, // NEW Phase 2
      metaGovernance, // NEW Phase 3
      accessibility, // NEW Phase 3
      resources, // Phase 3
      navigation // Phase 3
    };
  } catch (e) {
    const errMsg = e instanceof Error ? e.message : String(e);
    const status = (e as { response?: { status: number } }).response?.status || 500;
    console.error(`[Flux Analyze] Failed ${url}: ${errMsg}`);
    return { url, statusCode: status, blocked: [401, 403, 429, 503].includes(status), blockedReason: errMsg };
  }
}


// --- STEP 2: STRATEGIST (AI WITH 3-LAYER ARCHITECTURE) ---
async function generateAuditReport(pages: PageSignals[], domain: string, mode: 'fast' | 'deep', siteDiagnostics?: SiteDiagnostics) {
  const isFast = mode === 'fast';

  // Prepare structured dataset for the AI
  const dataset = pages.filter(p => p.statusCode === 200).map(p => ({
    url: p.url,
    type: p.pageType,
    meta: { title: p.title, description: p.metaDescription, canonical: p.canonical },
    seo: {
      metaKeywords: p.metaKeywords,
      metaRobots: p.metaRobots,
      xRobotsTag: p.xRobotsTag,
      topKeywords: p.topKeywords
    },
    structure: { h1: p.h1, h2Count: p.h2Count, wordCount: p.wordCount },
    signals: {
      ctas: p.ctas?.map(c => c.text).join(', '),
      schema: p.schemaTypes,
      internalLinks: p.internalLinkCount,
      techStack: p.techStack, // Phase 2
      authority: p.authority, // Phase 2
      metaGovernance: p.metaGovernance, // Phase 3
      accessibility: p.accessibility, // Phase 3
      resources: p.resources, // Phase 3
      navigation: p.navigation, // Phase 3 (New)
      contentSnippet: p.primaryContentSnippet?.slice(0, 2000)
    },
    // INJECT TRUTH: If available, AI sees real speed.
    performance: p.performance ? {
      score: p.performance.lighthouseScore,
      lcp: p.performance.lcp,
      inp: p.performance.inp,
      cls: p.performance.cls,
      fcp: p.performance.fcp,
      speedIndex: p.performance.speedIndex,
      seoScore: p.performance.seoScore,
      accessibilityScore: p.performance.accessibilityScore,
      bestPracticesScore: p.performance.bestPracticesScore
    } : undefined,
    crux: p.crux,
    contentSnippet: p.primaryContentSnippet ? p.primaryContentSnippet.substring(0, isFast ? 1000 : 2500) + '...' : 'No content extracted'
  }));

  // CALCULATE DETERMINISTIC VIBE SCORE (Homepage)
  const homepage = dataset[0];
  let calculatedScore = 50; // Baseline
  if (homepage) {
    // 1. Performance (Max 25)
    const perfScore = homepage.performance?.score || 0;
    if (perfScore >= 90) calculatedScore += 25;
    else if (perfScore >= 70) calculatedScore += 15;
    else if (perfScore >= 50) calculatedScore += 5;

    // 2. SEO Basics (Max 15)
    if (homepage.structure.h1 && homepage.structure.h1.length > 0) calculatedScore += 5;
    if (homepage.meta.title) calculatedScore += 5;
    if (homepage.meta.description) calculatedScore += 5;

    // 3. Tech Maturity (Max 10)
    const techCount = (homepage.signals.techStack?.cms?.length || 0) +
      (homepage.signals.techStack?.analytics?.length || 0) +
      (homepage.signals.techStack?.marketing?.length || 0);
    if (techCount > 0) calculatedScore += 5;
    if (techCount > 3) calculatedScore += 5;

    // 4. Content Depth (Max 10)
    if ((homepage.structure.wordCount || 0) > 500) calculatedScore += 10;
    else if ((homepage.structure.wordCount || 0) > 200) calculatedScore += 5;

    // 5. Authority/Socials (Max 10)
    if ((homepage.signals.authority?.socials?.length || 0) > 0) calculatedScore += 10;
    else calculatedScore -= 5; // Penalty for no social proof

    // Cap at 98
    calculatedScore = Math.min(calculatedScore, 98);
  }

  // Build specific, forceful instruction for Claude
  const userInstruction = isFast
    ? {
      instruction: "Analyze the homepage ONLY. Provide a Vibe Check and Top 3 Wins.",
      siteContext: { domain, scanTimestamp: new Date().toISOString() },
      siteDiagnostics,
      dataset
    }
    : {
      instruction: `You are analyzing ${domain}. This is a REAL CLIENT AUDIT - provide specific, valuable insights.

CRITICAL REQUIREMENTS:
1. QUOTE ACTUAL CONTENT from the site (H1s, CTAs, meta tags, body text). This is not optional.
2. Reference SPECIFIC METRICS (word counts, LCP values, etc.)
3. SEO MUST be FACT-BASED. Use the provided metadata, robots.txt, llms.txt, and keyword frequency data only.
4. VOLUME IS MANDATORY: You must write 150-250 words for every 'problem' field and 100-150 words for every 'recommendation' field.
5. EXPLAIN WHY cada find is a revenue-killer.
6. Provide exactly 6-8 Tactical Fixes.

BANNED PHRASES: "tactical maneuver", "asymmetric advantage", "optimize performance" (generic), "improve SEO" (generic).

ACTUAL SITE DATA:
- Homepage H1: "${homepage?.structure?.h1?.join(' | ') || 'not detected'}"
- Homepage Title: "${homepage?.meta?.title || 'not detected'}"
- Homepage Meta Description: "${homepage?.meta?.description || 'not detected'}"
- Page Performance: ${homepage?.performance ? `LCP ${homepage.performance.lcp}ms, Score: ${homepage.performance.score}` : 'not measured'}
- CTAs Found: ${homepage?.signals?.ctas || 'none detected'}
- Content Snippet: ${homepage?.signals?.contentSnippet || 'not detected'}

MANDATORY SCORE: ${calculatedScore}/100. (DO NOT CHANGE)

USE THIS DATA. Quote the exact snippets.`,
      outputRequirement: OUTPUT_INSTRUCTION_PROMPT,
      siteContext: { domain, scanTimestamp: new Date().toISOString() },
      siteDiagnostics,
      dataset
    };

  const buildDeterministicReport = () => {
    const homepage = pages.find(p => p.url === domain || p.url === domain + '/') || pages[0];
    const pageSignals = homepage ? {
      title: homepage.title,
      metaDescription: homepage.metaDescription,
      metaKeywords: homepage.metaKeywords,
      metaRobots: homepage.metaRobots,
      xRobotsTag: homepage.xRobotsTag,
      canonical: homepage.canonical,
      h1: homepage.h1,
      topKeywords: homepage.topKeywords
    } : undefined;
    return {
      meta: {
        url: domain,
        scanTimestamp: new Date().toISOString(),
        performance: homepage?.performance,
        crux: homepage?.crux,
        scanDiagnostics: siteDiagnostics
      },
      type: mode,
      analysisMode: 'deterministic',
      scannedPages: pages.map(p => p.url),
      signals: {
        navigation: homepage?.navigation
      },
      pageSignals,
      domIssues: homepage?.performance?.domIssues
    };
  };

  try {
    let content;

    if (isFast) {
      // FAST MODE: Use gpt-4o-mini for quick technical extraction
      if (!process.env.OPENAI_API_KEY) {
        console.warn('[Flux AI] OPENAI_API_KEY missing. Returning deterministic scan data.');
        return buildDeterministicReport();
      }
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
      const response = await openai.chat.completions.create({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: FAST_SYSTEM_PROMPT },
          { role: "user", content: `You must return your response in JSON format. Here is the request: ${JSON.stringify(userInstruction)}` }
        ],
        response_format: { type: "json_object" },
        temperature: 0.2,
        max_tokens: 1000
      });
      content = response.choices[0].message.content || '{}';
    } else {
      // DEEP MODE: Use Claude-3.5-Sonnet for strategic synthesis
      console.log('[Flux Debug] ANTHROPIC_API_KEY exists:', !!process.env.ANTHROPIC_API_KEY);
      console.log('[Flux Debug] ANTHROPIC_API_KEY length:', process.env.ANTHROPIC_API_KEY?.length || 0);

      if (!process.env.ANTHROPIC_API_KEY) {
        console.warn('[Flux AI] ANTHROPIC_API_KEY missing. Returning deterministic scan data.');
        return buildDeterministicReport();
      }

      const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

      const claudeResponse = await anthropic.messages.create({
        model: "claude-3-5-sonnet-20241022",
        max_tokens: 8000,
        temperature: 0.15,
        system: STRATEGY_SYSTEM_PROMPT,
        messages: [{
          role: "user",
          content: JSON.stringify(userInstruction)
        }]
      });

      // Extract text content from Claude's response
      content = claudeResponse.content[0].type === 'text'
        ? claudeResponse.content[0].text
        : '{}';
    }
    console.log('[Flux AI] Raw response length:', content.length);

    let parsed: unknown;
    try {
      parsed = JSON.parse(content);
      console.log('[Flux AI] Parsed tacticalFixes count:', (parsed as { tacticalFixes?: unknown[] })?.tacticalFixes?.length || 0);
    } catch (parseError) {
      console.error('[Flux AI] JSON Parse Error:', parseError);
      throw new Error('AI response was not valid JSON.');
    }

    if (!parsed || typeof parsed !== 'object') {
      throw new Error('AI response was empty or invalid.');
    }

    const homepage = pages.find(p => p.url === domain || p.url === domain + '/') || pages[0];
    const report = parsed as Record<string, unknown>;
    const pageSignals = homepage ? {
      title: homepage.title,
      metaDescription: homepage.metaDescription,
      metaKeywords: homepage.metaKeywords,
      metaRobots: homepage.metaRobots,
      xRobotsTag: homepage.xRobotsTag,
      canonical: homepage.canonical,
      h1: homepage.h1,
      topKeywords: homepage.topKeywords
    } : undefined;

    const meta = (report.meta as Record<string, unknown>) || {};
    report.meta = {
      ...meta,
      url: domain,
      scanTimestamp: new Date().toISOString(),
      performance: homepage?.performance,
      crux: homepage?.crux,
      scanDiagnostics: siteDiagnostics
    };

    report.scannedPages = pages.map(p => p.url);
    report.type = mode;
    report.analysisMode = 'ai';
    report.signals = {
      ...(report.signals as Record<string, unknown>),
      navigation: homepage?.navigation
    };
    report.pageSignals = pageSignals;
    report.domIssues = homepage?.performance?.domIssues;

    return report;

  } catch (error: unknown) {
    console.warn('[Flux AI] Generation failed, returning deterministic scan data only.', error);
    return buildDeterministicReport();
  }
}

// --- MAIN HANDLER ---
export async function POST(req: Request) {
  try {
    const { url, mode = 'deep', forceRefresh = false } = await req.json(); // Default to deep for backward compatibility
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    let normalizedUrl = '';
    try {
      normalizedUrl = normalizeUrl(url);
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
    }

    console.log(`[Flux Intel] Audit started for: ${normalizedUrl} (Mode: ${mode}, Refresh: ${forceRefresh})`);

    const siteDiagnostics = await fetchSiteDiagnostics(normalizedUrl);

    // CACHE CHECK: Do we have the homepage extracted already?
    const cacheKey = generateCacheKey(normalizedUrl);
    const cachedEntry = getCachedData(cacheKey);

    let mainPageSignal: PageSignals;

    if (cachedEntry && !forceRefresh) {
      console.log(`[Flux Cache] Hit for ${normalizedUrl}`);
      mainPageSignal = cachedEntry;
    } else {
      if (forceRefresh) console.log(`[Flux Cache] Force Refresh detected. Bypassing cache.`);
      // Fetch Homepage (No Lighthouse for Fast Mode to save time)
      // If Deep mode, we fetch Lighthouse here to save time for sub-pages later
      mainPageSignal = await analyzePage(normalizedUrl, mode === 'deep');
      setCachedData(cacheKey, mainPageSignal);
    }

    if (mainPageSignal.statusCode !== 200) {
      const reason = mainPageSignal.blockedReason || `HTTP ${mainPageSignal.statusCode}`;
      return NextResponse.json({
        error: `Unable to scan ${normalizedUrl}: ${reason}`,
        scanDiagnostics: siteDiagnostics
      }, { status: 502 });
    }

    if (mode === 'fast') {
      // --- FAST PASS: LIVE IN < 3s ---
      const report = await generateAuditReport([mainPageSignal], normalizedUrl, 'fast', siteDiagnostics);
      return NextResponse.json({ ...report, type: 'fast' });
    } else {
      // --- DEEP PASS: ASYNC BACKFILL ---
      console.log(`[Flux Deep] Backend processing (Parallelized)...`);

      // OPTIMIZATION: Run Lighthouse and discovery in parallel
      const psiPromise = !mainPageSignal.performance
        ? fetchPageSpeedMetrics(normalizedUrl)
        : Promise.resolve(mainPageSignal.performance);

      const discoveryPromise = discoverPages(normalizedUrl);

      const [psi, targetPages] = await Promise.all([psiPromise, discoveryPromise]);

      // Attach Lighthouse data if we fetched it
      if (psi) mainPageSignal.performance = psi;

      // exclude homepage from re-analysis but KEEP sub-pages
      const subPages = targetPages.filter(p => {
        const pNorm = p.endsWith('/') ? p.slice(0, -1) : p;
        const uNorm = normalizedUrl.endsWith('/') ? normalizedUrl.slice(0, -1) : normalizedUrl;
        return pNorm !== uNorm;
      });

      console.log(`[Flux Deep] Analyzing ${subPages.length} sub-pages + Homepage...`);

      const pageResults = await Promise.all(subPages.map(p => analyzePage(p, false))); // No Lighthouse for subpages
      const validPages = [mainPageSignal, ...pageResults.filter(p => p.statusCode === 200)];

      // Force-refresh the homepage content for Deep Pass if it was truncated in Fast Pass
      // (Fast pass truncates to 2500 chars in `extractPrimaryContent`, but AI might need more context in deep mode)
      // For now, we rely on the implementation plan.

      // 3. Deep Analysis
      const auditReport = await generateAuditReport(validPages, normalizedUrl, 'deep', siteDiagnostics);

      // 4. Merge
      auditReport.meta = {
        ...auditReport.meta,
        url: normalizedUrl,
        scanTimestamp: new Date().toISOString(),
        performance: mainPageSignal.performance,
        crux: mainPageSignal.crux
      };
      auditReport.scannedPages = validPages.map(p => p.url);

      return NextResponse.json({ ...auditReport, type: 'deep' });
    }

  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Flux Intel] FATAL ERROR:', err);
    return NextResponse.json({
      error: err.message || 'Audit process failed',
      details: err.toString()
    }, { status: 500 });
  }
}
