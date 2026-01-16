import { NextResponse } from 'next/server';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { runLighthouseAudit } from '../../../../lib/lighthouse';
import { updateDriftRecord, DriftSnapshot } from '../../../../lib/driftStore';

export const maxDuration = 120;

const DEFAULT_USER_AGENT = 'Mozilla/5.0 (compatible; FluxDrift/1.0)';
const STOP_WORDS = new Set([
  'the', 'and', 'for', 'with', 'that', 'this', 'you', 'your', 'are', 'was', 'were', 'from', 'have', 'has', 'had',
  'but', 'not', 'our', 'their', 'they', 'them', 'his', 'her', 'she', 'him', 'its', 'can', 'will', 'just', 'about',
  'into', 'over', 'under', 'more', 'less', 'than', 'then', 'when', 'what', 'why', 'how', 'who', 'where', 'which',
  'a', 'an', 'to', 'of', 'in', 'on', 'at', 'by', 'or', 'as', 'is', 'it', 'be', 'if', 'we', 'us', 'do', 'does', 'did'
]);

function normalizeUrl(input: string): string {
  const trimmed = input.trim();
  if (!trimmed) return trimmed;
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
  return `https://${trimmed}`;
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
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, formFactor: 'PHONE' })
    });
    const data = await response.json();
    const record = data?.record;
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
    console.warn('[Drift CrUX] Failed to fetch field data:', err.message);
    return undefined;
  }
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

function extractPrimaryContent($: cheerio.CheerioAPI): string {
  const selectors = ['main', 'article', '[role="main"]', '#content', '.content'];
  let content = '';

  for (const selector of selectors) {
    const el = $(selector);
    if (el.length) {
      const clone = el.clone();
      clone.find('nav, footer, script, style, .cookie-banner, .popup').remove();
      content = clone.text().replace(/\s+/g, ' ').trim();
      if (content.length > 500) break;
    }
  }

  if (!content) {
    content = $('body').clone().find('nav, footer, script, style').remove().end().text().replace(/\s+/g, ' ').trim();
  }

  return content.slice(0, 2500);
}

function detectCtas($: cheerio.CheerioAPI): { text: string; link: string }[] {
  const ctas: { text: string; link: string }[] = [];
  const intentVerbs = ['buy', 'book', 'join', 'sign', 'contact', 'subscribe', 'get', 'start'];

  $('a, button').each((_, el) => {
    const text = $(el).text().trim();
    const href = $(el).attr('href') || '';
    const lowerText = text.toLowerCase();
    const isIntent = intentVerbs.some(v => lowerText.includes(v));
    const isButton = $(el).attr('class')?.toLowerCase().includes('btn') || $(el).attr('class')?.toLowerCase().includes('button');

    if ((isIntent || isButton) && text.length < 50 && href) {
      ctas.push({ text, link: href });
    }
  });

  return ctas.slice(0, 5);
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

async function fetchSiteDiagnostics(baseUrl: string) {
  const origin = new URL(baseUrl).origin;
  const robotsUrl = `${origin}/robots.txt`;
  const robotsRes = await fetchTextResource(robotsUrl);
  const sitemapUrls = robotsRes.content
    ? robotsRes.content
      .split('\n')
      .map(line => line.trim())
      .filter(line => /^sitemap:/i.test(line))
      .map(line => line.replace(/^sitemap:\s*/i, '').trim())
      .filter(Boolean)
    : [];

  return {
    robotsTxt: {
      status: robotsRes.status,
      sitemapUrls,
      error: robotsRes.error
    }
  };
}

async function analyzePage(url: string) {
  const response = await axios.get(url, {
    headers: { 'User-Agent': DEFAULT_USER_AGENT },
    timeout: 10000,
    validateStatus: () => true
  });
  const statusCode = response.status;
  if (statusCode < 200 || statusCode >= 300) {
    throw new Error(`HTTP ${statusCode}`);
  }

  const html = response.data;
  const $ = cheerio.load(html);

  const title = $('title').text().trim();
  const metaDescription = $('meta[name="description"]').attr('content') || '';
  const metaRobots = $('meta[name="robots"]').attr('content') || $('meta[name="googlebot"]').attr('content') || '';
  const xRobotsTag = Array.isArray(response.headers?.['x-robots-tag'])
    ? response.headers['x-robots-tag'].join(', ')
    : (response.headers?.['x-robots-tag'] as string | undefined);
  const canonical = $('link[rel="canonical"]').attr('href');
  const h1s = $('h1').map((_, el) => $(el).text().trim()).get();
  const h2Count = $('h2').length;

  const primaryContent = extractPrimaryContent($);
  const topKeywords = extractTopKeywords(primaryContent);
  const ctas = detectCtas($);

  return {
    title,
    metaDescription,
    canonical,
    metaRobots,
    xRobotsTag,
    h1: h1s,
    h2Count,
    wordCount: primaryContent.split(/\s+/).length,
    topKeywords,
    ctas
  };
}

type Severity = 'High' | 'Medium' | 'Low';

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

function computeDeltas(prev?: DriftSnapshot, next?: DriftSnapshot): DriftDelta[] {
  if (!prev || !next) return [];
  const deltas: DriftDelta[] = [];
  const addDelta = (delta: Omit<DriftDelta, 'id'>) => {
    deltas.push({ id: `delta-${String(deltas.length + 1).padStart(2, '0')}`, ...delta });
  };

  const prevPsi = prev.psi;
  const nextPsi = next.psi;
  if (prevPsi && nextPsi) {
    const scoreDiff = nextPsi.lighthouseScore - prevPsi.lighthouseScore;
    if (Math.abs(scoreDiff) >= 10) {
      addDelta({
        label: 'PSI Performance Score',
        severity: scoreDiff < 0 ? 'High' : 'Medium',
        before: `${prevPsi.lighthouseScore}/100`,
        after: `${nextPsi.lighthouseScore}/100`,
        note: scoreDiff < 0 ? `Dropped by ${Math.abs(scoreDiff)} points` : `Improved by ${scoreDiff} points`
      });
    }

    const lcpPrev = parseSeconds(prevPsi.lcp);
    const lcpNext = parseSeconds(nextPsi.lcp);
    if (lcpPrev && lcpNext) {
      const diff = lcpNext - lcpPrev;
      if (Math.abs(diff) >= 0.5) {
        addDelta({
          label: 'LCP (PSI)',
          severity: diff >= 1 ? 'High' : 'Medium',
          before: prevPsi.lcp,
          after: nextPsi.lcp,
          note: diff > 0 ? `Slower by ${diff.toFixed(2)}s` : `Faster by ${Math.abs(diff).toFixed(2)}s`
        });
      }
    }

    const inpPrev = parseMilliseconds(prevPsi.inp);
    const inpNext = parseMilliseconds(nextPsi.inp);
    if (inpPrev && inpNext) {
      const diff = inpNext - inpPrev;
      if (Math.abs(diff) >= 100) {
        addDelta({
          label: 'INP (PSI)',
          severity: diff >= 200 ? 'High' : 'Medium',
          before: prevPsi.inp,
          after: nextPsi.inp,
          note: diff > 0 ? `Slower by ${Math.round(diff)}ms` : `Faster by ${Math.round(Math.abs(diff))}ms`
        });
      }
    }

    const clsPrev = parseNumeric(prevPsi.cls);
    const clsNext = parseNumeric(nextPsi.cls);
    if (clsPrev !== undefined && clsNext !== undefined) {
      const diff = clsNext - clsPrev;
      if (Math.abs(diff) >= 0.05) {
        addDelta({
          label: 'CLS (PSI)',
          severity: diff >= 0.1 ? 'High' : 'Medium',
          before: prevPsi.cls,
          after: nextPsi.cls,
          note: diff > 0 ? `Worse by ${diff.toFixed(2)}` : `Improved by ${Math.abs(diff).toFixed(2)}`
        });
      }
    }
  }

  const prevCrux = prev.crux;
  const nextCrux = next.crux;
  if (prevCrux && nextCrux) {
    const lcpPrev = parseSeconds(prevCrux.lcp);
    const lcpNext = parseSeconds(nextCrux.lcp);
    if (lcpPrev && lcpNext) {
      const diff = lcpNext - lcpPrev;
      if (Math.abs(diff) >= 0.5) {
        addDelta({
          label: 'CrUX LCP (p75)',
          severity: diff >= 1 ? 'High' : 'Medium',
          before: prevCrux.lcp || 'N/A',
          after: nextCrux.lcp || 'N/A',
          note: diff > 0 ? `Slower by ${diff.toFixed(2)}s` : `Faster by ${Math.abs(diff).toFixed(2)}s`
        });
      }
    }
  }

  const prevOn = prev.onPage;
  const nextOn = next.onPage;
  if (prevOn && nextOn) {
    if (prevOn.title !== nextOn.title) {
      addDelta({
        label: 'Title Tag',
        severity: 'Medium',
        before: prevOn.title || 'NOT OBSERVED',
        after: nextOn.title || 'NOT OBSERVED'
      });
    }
    if (prevOn.metaDescription !== nextOn.metaDescription) {
      addDelta({
        label: 'Meta Description',
        severity: 'Medium',
        before: prevOn.metaDescription || 'NOT OBSERVED',
        after: nextOn.metaDescription || 'NOT OBSERVED'
      });
    }
    if (prevOn.canonical !== nextOn.canonical) {
      addDelta({
        label: 'Canonical URL',
        severity: 'Medium',
        before: prevOn.canonical || 'NOT OBSERVED',
        after: nextOn.canonical || 'NOT OBSERVED'
      });
    }
    const prevRobots = prevOn.metaRobots || prevOn.xRobotsTag || '';
    const nextRobots = nextOn.metaRobots || nextOn.xRobotsTag || '';
    if (prevRobots !== nextRobots) {
      addDelta({
        label: 'Robots Directive',
        severity: 'High',
        before: prevRobots || 'NOT OBSERVED',
        after: nextRobots || 'NOT OBSERVED'
      });
    }
    const prevH1 = prevOn.h1?.join(' | ') || '';
    const nextH1 = nextOn.h1?.join(' | ') || '';
    if (prevH1 !== nextH1) {
      addDelta({
        label: 'H1',
        severity: 'Medium',
        before: prevH1 || 'NOT OBSERVED',
        after: nextH1 || 'NOT OBSERVED'
      });
    }
    if (prevOn.wordCount && nextOn.wordCount) {
      const diff = (nextOn.wordCount - prevOn.wordCount) / prevOn.wordCount;
      if (Math.abs(diff) >= 0.3) {
        addDelta({
          label: 'Word Count',
          severity: 'Medium',
          before: String(prevOn.wordCount),
          after: String(nextOn.wordCount),
          note: diff > 0 ? `Increased by ${Math.round(diff * 100)}%` : `Decreased by ${Math.round(Math.abs(diff) * 100)}%`
        });
      }
    }
    const prevKeywords = prevOn.topKeywords?.slice(0, 3).map(k => k.term).join(', ') || '';
    const nextKeywords = nextOn.topKeywords?.slice(0, 3).map(k => k.term).join(', ') || '';
    if (prevKeywords && nextKeywords && prevKeywords !== nextKeywords) {
      addDelta({
        label: 'Top Keywords',
        severity: 'Medium',
        before: prevKeywords,
        after: nextKeywords
      });
    }
    const prevCtas = prevOn.ctas?.map(c => c.text).join(' | ') || '';
    const nextCtas = nextOn.ctas?.map(c => c.text).join(' | ') || '';
    if (prevCtas !== nextCtas) {
      addDelta({
        label: 'CTA Text',
        severity: prevCtas && !nextCtas ? 'High' : 'Medium',
        before: prevCtas || 'NOT OBSERVED',
        after: nextCtas || 'NOT OBSERVED'
      });
    }
  }

  const prevRobots = prev?.diagnostics?.robotsTxt;
  const nextRobots = next?.diagnostics?.robotsTxt;
  if (prevRobots && nextRobots) {
    const prevSitemaps = prevRobots.sitemapUrls?.join(' | ') || '';
    const nextSitemaps = nextRobots.sitemapUrls?.join(' | ') || '';
    if (prevSitemaps !== nextSitemaps) {
      addDelta({
        label: 'Sitemap URLs',
        severity: 'Medium',
        before: prevSitemaps || 'NOT OBSERVED',
        after: nextSitemaps || 'NOT OBSERVED'
      });
    }
  }

  return deltas;
}

function buildActions(deltas: DriftDelta[]): DriftAction[] {
  const sorted = [...deltas].sort((a, b) => {
    const weight = (sev: Severity) => (sev === 'High' ? 3 : sev === 'Medium' ? 2 : 1);
    return weight(b.severity) - weight(a.severity);
  });

  return sorted.slice(0, 6).map((delta, idx) => ({
    id: `action-${String(idx + 1).padStart(2, '0')}`,
    title: `Review ${delta.label} change`,
    severity: delta.severity,
    evidence: [
      `Before: ${delta.before}`,
      `After: ${delta.after}`,
      delta.note ? `Note: ${delta.note}` : 'Observed change'
    ]
  }));
}

export async function POST(req: Request) {
  try {
    const { url } = await req.json();
    if (!url) return NextResponse.json({ error: 'URL is required' }, { status: 400 });

    let normalizedUrl = '';
    try {
      normalizedUrl = normalizeUrl(url);
      new URL(normalizedUrl);
    } catch {
      return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
    }

    const domain = new URL(normalizedUrl).hostname.replace('www.', '');

    const [psi, crux, onPage, diagnostics] = await Promise.all([
      runLighthouseAudit(normalizedUrl).catch(() => undefined),
      fetchCruxMetrics(normalizedUrl),
      analyzePage(normalizedUrl).catch(() => undefined),
      fetchSiteDiagnostics(normalizedUrl)
    ]);

    const snapshot: DriftSnapshot = {
      url: normalizedUrl,
      domain,
      timestamp: new Date().toISOString(),
      psi,
      crux,
      onPage,
      diagnostics
    };

    const record = updateDriftRecord(domain, snapshot);
    const deltas = computeDeltas(record.previous, record.latest);
    const actions = buildActions(deltas);

    return NextResponse.json({
      domain,
      latest: record.latest,
      previous: record.previous,
      deltas,
      actions,
      status: record.previous ? 'ok' : 'baseline'
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    console.error('[Flux Drift] Error:', err.message);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
