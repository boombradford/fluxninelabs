import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { parseStringPromise } from 'xml2js';
import { getCachedData, setCachedData, generateCacheKey } from '../../../lib/cache';
import { runLighthouseAudit } from '../../../lib/lighthouse';

export const maxDuration = 120; // Allow time for PSI + deep scan

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
  performance?: RoutePerformanceMetrics; // PSI lab metrics
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

interface Recommendation {
  id: string;
  title: string;
  category: 'Performance' | 'SEO' | 'Content' | 'CTA' | 'Best Practices';
  priority: 'High' | 'Medium' | 'Low';
  evidence: string[];
  recommendation: string;
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
  // Parallel Extraction: fetch HTML and PSI metrics at same time if needed.
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
      console.warn(`[Flux PSI] Performance audit failed for ${url}:`, performanceResult.reason);
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


// --- STEP 2: DATA-TRUTH REPORT ---
function parseNumeric(value?: string): number | undefined {
  if (!value) return undefined;
  const match = value.replace(',', '.').match(/[\d.]+/);
  if (!match) return undefined;
  const parsed = Number(match[0]);
  return Number.isFinite(parsed) ? parsed : undefined;
}

function parseSeconds(value?: string): number | undefined {
  if (!value) return undefined;
  if (value.toLowerCase().includes('ms')) {
    const ms = parseNumeric(value);
    return ms ? ms / 1000 : undefined;
  }
  return parseNumeric(value);
}

function parseMilliseconds(value?: string): number | undefined {
  if (!value) return undefined;
  if (value.toLowerCase().includes('s')) {
    const seconds = parseNumeric(value);
    return seconds ? seconds * 1000 : undefined;
  }
  return parseNumeric(value);
}

function buildRecommendations(homepage?: PageSignals): Recommendation[] {
  if (!homepage) return [];
  const recommendations: Recommendation[] = [];
  const add = (rec: Omit<Recommendation, 'id'>) => {
    recommendations.push({
      id: `rec-${String(recommendations.length + 1).padStart(2, '0')}`,
      ...rec
    });
  };

  const performance = homepage.performance;
  const lcpSec = parseSeconds(performance?.lcp);
  const inpMs = parseMilliseconds(performance?.inp);
  const clsVal = parseNumeric(performance?.cls);
  const perfScore = performance?.lighthouseScore;

  if (typeof perfScore === 'number' && perfScore < 50) {
    add({
      title: 'Improve overall PSI performance score',
      category: 'Performance',
      priority: 'High',
      evidence: [`PSI performance score: ${perfScore}/100`, `LCP: ${performance?.lcp || 'N/A'}`, `INP: ${performance?.inp || 'N/A'}`, `CLS: ${performance?.cls || 'N/A'}`],
      recommendation: 'Address large render-blocking assets and heavy above-the-fold elements. Prioritize compressing hero media, trimming unused scripts, and deferring non-critical resources to bring PSI into a healthy range.'
    });
  }

  if (lcpSec && lcpSec > 2.5) {
    add({
      title: 'Reduce LCP to under 2.5s',
      category: 'Performance',
      priority: lcpSec > 4 ? 'High' : 'Medium',
      evidence: [`PSI LCP: ${performance?.lcp || 'N/A'}`, `Final URL: ${performance?.finalUrl || homepage.url}`],
      recommendation: 'Reduce the size and load time of the largest above-the-fold element. Optimize hero images (next-gen formats + proper sizing), improve server response time, and preconnect critical origins.'
    });
  }

  if (inpMs && inpMs > 200) {
    add({
      title: 'Bring INP under 200ms',
      category: 'Performance',
      priority: inpMs > 500 ? 'High' : 'Medium',
      evidence: [`PSI INP: ${performance?.inp || 'N/A'}`],
      recommendation: 'Cut main-thread blocking JS, reduce long tasks, and avoid heavy client-side hydration. Audit third-party scripts and move non-critical work to idle callbacks.'
    });
  }

  if (clsVal && clsVal > 0.1) {
    add({
      title: 'Stabilize layout to reduce CLS',
      category: 'Performance',
      priority: clsVal > 0.25 ? 'High' : 'Medium',
      evidence: [`PSI CLS: ${performance?.cls || 'N/A'}`],
      recommendation: 'Reserve space for images, embeds, and fonts. Ensure consistent sizing for banners and prevent late-loading elements from shifting content.'
    });
  }

  if (!homepage.title) {
    add({
      title: 'Add a clear, specific title tag',
      category: 'SEO',
      priority: 'High',
      evidence: ['Title tag: NOT OBSERVED'],
      recommendation: 'Write a concise title that matches the primary offer and includes the core keyword. Keep it under ~60 characters.'
    });
  }

  if (!homepage.metaDescription) {
    add({
      title: 'Add a meta description that sets expectations',
      category: 'SEO',
      priority: 'Medium',
      evidence: ['Meta description: NOT OBSERVED'],
      recommendation: 'Summarize the value proposition in 1–2 sentences and include a clear benefit or differentiator.'
    });
  }

  if (!homepage.h1 || homepage.h1.length === 0) {
    add({
      title: 'Add a single, descriptive H1',
      category: 'SEO',
      priority: 'High',
      evidence: ['H1: NOT OBSERVED'],
      recommendation: 'Use one H1 that mirrors the main offer and clarifies the primary intent of the page.'
    });
  } else if (homepage.h1.length > 1) {
    add({
      title: 'Consolidate multiple H1s',
      category: 'SEO',
      priority: 'Medium',
      evidence: [`H1 count: ${homepage.h1.length}`, `Observed H1s: ${homepage.h1.join(' | ')}`],
      recommendation: 'Keep a single H1 to reduce ambiguity for search engines and align the page around one primary topic.'
    });
  }

  if (!homepage.canonical) {
    add({
      title: 'Add a canonical URL',
      category: 'SEO',
      priority: 'Medium',
      evidence: ['Canonical: NOT OBSERVED'],
      recommendation: 'Set a canonical link to the preferred URL to prevent duplicate content signals.'
    });
  }

  const robotsValue = homepage.metaRobots || homepage.xRobotsTag || '';
  if (robotsValue.toLowerCase().includes('noindex')) {
    add({
      title: 'Remove noindex from the primary page',
      category: 'SEO',
      priority: 'High',
      evidence: [`Robots directive: ${robotsValue}`],
      recommendation: 'If this page should rank, remove the noindex directive and ensure it is crawlable.'
    });
  }

  if ((homepage.wordCount || 0) < 200) {
    add({
      title: 'Increase primary content depth',
      category: 'Content',
      priority: 'Medium',
      evidence: [`Word count (main content): ${homepage.wordCount || 0}`],
      recommendation: 'Add clear, customer-facing copy that explains the offer, proof points, and next steps. Aim for 300–600 words of focused content.'
    });
  }

  if (!homepage.ctas || homepage.ctas.length === 0) {
    add({
      title: 'Add a clear primary CTA',
      category: 'CTA',
      priority: 'High',
      evidence: ['CTAs: NOT OBSERVED'],
      recommendation: 'Add a primary call-to-action with explicit intent (e.g., “Book a demo”, “Get pricing”). Place it above the fold.'
    });
  }

  return recommendations.slice(0, 6);
}

function buildSummary(domain: string, homepage?: PageSignals, recommendations: Recommendation[] = []): string {
  if (!homepage) return `Scan complete for ${domain}. No page data was collected.`;
  const parts: string[] = [];
  if (homepage.performance?.lighthouseScore !== undefined) {
    parts.push(`PSI performance score is ${homepage.performance.lighthouseScore}/100`);
  }
  if (homepage.crux?.lcp) {
    parts.push(`CrUX field LCP is ${homepage.crux.lcp}`);
  }
  if (homepage.ctas?.length) {
    const sample = homepage.ctas.map(c => c.text).slice(0, 2).join(' | ');
    parts.push(`Detected ${homepage.ctas.length} CTA${homepage.ctas.length > 1 ? 's' : ''} (${sample})`);
  } else {
    parts.push('No CTAs detected');
  }
  const topGaps = recommendations.map(r => r.title).slice(0, 3);
  const headline = topGaps.length ? `Top gaps: ${topGaps.join('; ')}.` : 'No major gaps detected in the current scan.';
  return `${parts.join('. ')}. ${headline}`;
}

async function generateAuditReport(pages: PageSignals[], domain: string, mode: 'fast' | 'deep', siteDiagnostics?: SiteDiagnostics) {
  const homepage = pages.find(p => p.url === domain || p.url === domain + '/') || pages[0];
  const recommendations = buildRecommendations(homepage);
  const dataSources = {
    psi: homepage?.performance
      ? { status: 'ok', detail: `Score ${homepage.performance.lighthouseScore}/100` }
      : { status: 'unavailable', detail: 'PSI data not available' },
    crux: homepage?.crux
      ? { status: 'ok', detail: homepage.crux.collectionPeriod ? `P75 ${homepage.crux.collectionPeriod.firstDate} → ${homepage.crux.collectionPeriod.lastDate}` : 'Field data available' }
      : { status: 'unavailable', detail: 'CrUX data not available for this origin' },
    onPage: { status: 'ok', detail: `${pages.length} page${pages.length === 1 ? '' : 's'} scanned` }
  };

  return {
    meta: {
      url: domain,
      scanTimestamp: new Date().toISOString(),
      performance: homepage?.performance,
      crux: homepage?.crux,
      scanDiagnostics: siteDiagnostics,
      dataSources
    },
    type: mode,
    analysisMode: 'deterministic',
    scannedPages: pages.map(p => p.url),
    pageSignals: homepage ? {
      title: homepage.title,
      metaDescription: homepage.metaDescription,
      metaKeywords: homepage.metaKeywords,
      metaRobots: homepage.metaRobots,
      xRobotsTag: homepage.xRobotsTag,
      canonical: homepage.canonical,
      h1: homepage.h1,
      h2Count: homepage.h2Count,
      wordCount: homepage.wordCount,
      topKeywords: homepage.topKeywords,
      ctas: homepage.ctas || []
    } : undefined,
    recommendations,
    summary: buildSummary(domain, homepage, recommendations),
    domIssues: homepage?.performance?.domIssues
  };
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
      // Fetch Homepage (No PSI for Fast Mode to save time)
      // If Deep mode, we fetch PSI here to save time for sub-pages later
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

      // OPTIMIZATION: Run PSI and discovery in parallel
      const psiPromise = !mainPageSignal.performance
        ? fetchPageSpeedMetrics(normalizedUrl)
        : Promise.resolve(mainPageSignal.performance);

      const cruxPromise = !mainPageSignal.crux
        ? fetchCruxMetrics(normalizedUrl)
        : Promise.resolve(mainPageSignal.crux);

      const discoveryPromise = discoverPages(normalizedUrl);

      const [psi, crux, targetPages] = await Promise.all([psiPromise, cruxPromise, discoveryPromise]);

      if (psi) mainPageSignal.performance = psi;
      if (crux) mainPageSignal.crux = crux;

      // exclude homepage from re-analysis but KEEP sub-pages
      const subPages = targetPages.filter(p => {
        const pNorm = p.endsWith('/') ? p.slice(0, -1) : p;
        const uNorm = normalizedUrl.endsWith('/') ? normalizedUrl.slice(0, -1) : normalizedUrl;
        return pNorm !== uNorm;
      });

      console.log(`[Flux Deep] Analyzing ${subPages.length} sub-pages + Homepage...`);

      const pageResults = await Promise.all(subPages.map(p => analyzePage(p, false))); // No PSI for subpages
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
