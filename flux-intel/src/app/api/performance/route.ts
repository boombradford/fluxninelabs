import { NextResponse } from 'next/server';
import { runLighthouseAudit } from '../../../lib/lighthouse';

export const maxDuration = 120; // Allow time for Lighthouse audit

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
        const err = error instanceof Error ? error : new Error(String(error));
        console.warn(`[Flux CrUX] Failed: ${err.message}`);
        return undefined;
    }
}

function normalizeUrl(input: string): string {
    const trimmed = input.trim();
    if (!trimmed) return trimmed;
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) return trimmed;
    return `https://${trimmed}`;
}

async function fetchPageSpeedMetrics(url: string) {
    try {
        return await runLighthouseAudit(url);
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`[Flux Lighthouse API] Failed: ${err.message}`);
        return null;
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    let normalizedUrl = '';
    try {
        normalizedUrl = normalizeUrl(url);
        new URL(normalizedUrl);
    } catch {
        return NextResponse.json({ error: 'Invalid URL format.' }, { status: 400 });
    }

    const [metrics, crux] = await Promise.all([
        fetchPageSpeedMetrics(normalizedUrl),
        fetchCruxMetrics(normalizedUrl)
    ]);

    if (!metrics) {
        return NextResponse.json({ error: 'Failed to fetch performance metrics' }, { status: 502 });
    }

    return NextResponse.json({ ...metrics, crux });
}
