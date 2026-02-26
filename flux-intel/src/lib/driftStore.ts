export interface DriftSnapshot {
  url: string;
  domain: string;
  timestamp: string;
  psi?: {
    lighthouseScore: number;
    lcp: string;
    inp: string;
    cls: string;
    fcp?: string;
    tti?: string;
    speedIndex: string;
    seoScore?: number;
    accessibilityScore?: number;
    bestPracticesScore?: number;
  };
  crux?: {
    lcp?: string;
    inp?: string;
    cls?: string;
    dataSource?: string;
    collectionPeriod?: { firstDate: string; lastDate: string };
  };
  onPage?: {
    title?: string;
    metaDescription?: string;
    canonical?: string;
    metaRobots?: string;
    xRobotsTag?: string;
    h1?: string[];
    h2Count?: number;
    wordCount?: number;
    topKeywords?: Array<{ term: string; count: number }>;
    ctas?: Array<{ text: string; link: string }>;
  };
  diagnostics?: {
    robotsTxt?: { status: number; sitemapUrls?: string[]; error?: string };
  };
}

export interface DriftRecord {
  latest?: DriftSnapshot;
  previous?: DriftSnapshot;
}

const driftStore = new Map<string, DriftRecord>();

export function getDriftRecord(domain: string): DriftRecord | undefined {
  return driftStore.get(domain);
}

export function updateDriftRecord(domain: string, snapshot: DriftSnapshot): DriftRecord {
  const existing = driftStore.get(domain) || {};
  const updated: DriftRecord = {
    previous: existing.latest,
    latest: snapshot,
  };
  driftStore.set(domain, updated);
  return updated;
}
