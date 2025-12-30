import { NextResponse } from 'next/server';
import axios from 'axios';

// Reusing the robust fetch logic from the main audit route
async function fetchPageSpeedMetrics(url: string) {
    const attemptFetch = async (useKey: boolean) => {
        const apiKey = process.env.GOOGLE_PSI_API_KEY || '';
        const keyParam = useKey && apiKey ? `&key=${apiKey}` : '';
        const apiUrl = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&strategy=mobile${keyParam}`;
        return axios.get(apiUrl, { timeout: 45000 }); // Generous timeout for retry
    };

    try {
        let data;
        try {
            const res = await attemptFetch(true);
            data = res.data;
        } catch (e) {
            console.warn(`[Flux PSI API] First attempt failed. Retrying without key...`);
            const res = await attemptFetch(false);
            data = res.data;
        }

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const audits = (data.lighthouseResult.audits || {}) as any;

        return {
            lighthouseScore: Math.round(data.lighthouseResult.categories.performance.score * 100),
            lcp: audits['largest-contentful-paint']?.displayValue,
            inp: audits['interactive']?.displayValue, // Proxy for INP
            cls: audits['cumulative-layout-shift']?.displayValue,
            speedIndex: audits['speed-index']?.displayValue,
            fcp: audits['first-contentful-paint']?.displayValue,
        };
    } catch (error) {
        const err = error instanceof Error ? error : new Error(String(error));
        console.error(`[Flux PSI API] Failed: ${err.message}`);
        return null;
    }
}

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const url = searchParams.get('url');

    if (!url) {
        return NextResponse.json({ error: 'URL is required' }, { status: 400 });
    }

    const metrics = await fetchPageSpeedMetrics(url);

    if (!metrics) {
        return NextResponse.json({ error: 'Failed to fetch performance metrics' }, { status: 502 });
    }

    return NextResponse.json(metrics);
}
