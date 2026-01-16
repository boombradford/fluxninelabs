export interface LighthouseMetrics {
  lighthouseScore: number; // 0-100 (Performance category)
  seoScore?: number; // 0-100
  accessibilityScore?: number; // 0-100
  bestPracticesScore?: number; // 0-100
  lcp: string;
  inp: string;
  cls: string;
  speedIndex: string;
  fcp: string;
  fid: string;
  tti: string;
  domIssues?: {
    lcp?: { rect: { top: number; left: number; width: number; height: number }; snippet?: string };
    cls?: Array<{ rect: { top: number; left: number; width: number; height: number }; snippet?: string }>;
  };
  finalUrl?: string;
  fetchTime?: string;
  lighthouseVersion?: string;
}

interface PageSpeedAuditNode {
  boundingRect?: { top: number; left: number; width: number; height: number };
  snippet?: string;
}

interface PageSpeedAuditDetailsItem {
  node?: PageSpeedAuditNode;
}

interface PageSpeedResult {
  lighthouseResult?: {
    categories?: {
      performance?: { score?: number };
      seo?: { score?: number };
      accessibility?: { score?: number };
      ['best-practices']?: { score?: number };
    };
    audits?: Record<string, { displayValue?: string; details?: { items?: PageSpeedAuditDetailsItem[] } }>;
    finalUrl?: string;
    fetchTime?: string;
    lighthouseVersion?: string;
  };
}

function formatCategoryScore(score?: number): number {
  return Math.round((score || 0) * 100);
}

function readDisplayValue(audits: Record<string, { displayValue?: string }> | undefined, key: string): string {
  return audits?.[key]?.displayValue || 'N/A';
}

function extractNodeDetails(items: PageSpeedAuditDetailsItem[] | undefined) {
  if (!items?.length) return undefined;
  const node = items[0]?.node;
  if (!node?.boundingRect) return undefined;
  return { rect: node.boundingRect, snippet: node.snippet };
}

function extractNodeListDetails(items: PageSpeedAuditDetailsItem[] | undefined) {
  if (!items?.length) return undefined;
  return items
    .map(item => {
      const node = item.node;
      if (node?.boundingRect) return { rect: node.boundingRect, snippet: node.snippet };
      return null;
    })
    .filter(Boolean) as Array<{ rect: { top: number; left: number; width: number; height: number }; snippet?: string }>;
}

export async function runLighthouseAudit(url: string): Promise<LighthouseMetrics> {
  const apiKey = process.env.GOOGLE_PSI_API_KEY || '';
  if (!apiKey) {
    throw new Error('GOOGLE_PSI_API_KEY is not configured.');
  }

  const endpoint = new URL('https://www.googleapis.com/pagespeedonline/v5/runPagespeed');
  endpoint.searchParams.set('url', url);
  endpoint.searchParams.set('key', apiKey);
  endpoint.searchParams.set('strategy', 'mobile');
  endpoint.searchParams.set('category', 'performance');
  endpoint.searchParams.append('category', 'seo');
  endpoint.searchParams.append('category', 'accessibility');
  endpoint.searchParams.append('category', 'best-practices');

  const response = await fetch(endpoint.toString(), { method: 'GET' });
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`PageSpeed Insights error ${response.status}: ${body}`);
  }

  const data = (await response.json()) as PageSpeedResult;
  const lhr = data.lighthouseResult;
  const audits = lhr?.audits || {};
  const domIssues: LighthouseMetrics['domIssues'] = {};

  try {
    const lcpAudit = audits['largest-contentful-paint-element'];
    const lcpNode = extractNodeDetails(lcpAudit?.details?.items);
    if (lcpNode) domIssues.lcp = lcpNode;
  } catch (error) {
    console.warn('[Flux PSI] Failed to parse LCP element', error);
  }

  try {
    const clsAudit = audits['layout-shift-elements'];
    const clsNodes = extractNodeListDetails(clsAudit?.details?.items);
    if (clsNodes?.length) domIssues.cls = clsNodes;
  } catch (error) {
    console.warn('[Flux PSI] Failed to parse CLS elements', error);
  }

  return {
    lighthouseScore: formatCategoryScore(lhr?.categories?.performance?.score),
    seoScore: formatCategoryScore(lhr?.categories?.seo?.score),
    accessibilityScore: formatCategoryScore(lhr?.categories?.accessibility?.score),
    bestPracticesScore: formatCategoryScore(lhr?.categories?.['best-practices']?.score),
    lcp: readDisplayValue(audits, 'largest-contentful-paint'),
    inp: readDisplayValue(audits, 'interaction-to-next-paint'),
    cls: readDisplayValue(audits, 'cumulative-layout-shift'),
    speedIndex: readDisplayValue(audits, 'speed-index'),
    fcp: readDisplayValue(audits, 'first-contentful-paint'),
    fid: readDisplayValue(audits, 'max-potential-fid'),
    tti: readDisplayValue(audits, 'interactive'),
    domIssues,
    finalUrl: lhr?.finalUrl,
    fetchTime: lhr?.fetchTime,
    lighthouseVersion: lhr?.lighthouseVersion
  };
}
