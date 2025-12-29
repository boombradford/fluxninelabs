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
        } catch (e: any) {
            console.warn(`[Flux PSI API] First attempt failed. Retrying without key...`);
            const res = await attemptFetch(false);
            data = res.data;
        }

        const lighthouse = data.lighthouseResult?.categories?.performance?.score * 100 || 0;
        const aud = data.lighthouseResult?.audits || {};

        return {
            lighthouseScore: Math.round(lighthouse),
            lcp: aud['largest-contentful-paint']?.displayValue || 'N/A',
            inp: aud['interaction-to-next-paint']?.displayValue || 'N/A',
            cls: aud['cumulative-layout-shift']?.displayValue || 'N/A',
            speedIndex: aud['speed-index']?.displayValue || 'N/A',
            fcp: aud['first-contentful-paint']?.displayValue || 'N/A',
            fid: aud['max-potential-fid']?.displayValue || 'N/A',
            tti: aud['interactive']?.displayValue || 'N/A'
        };
    } catch (error: any) {
        console.error(`[Flux PSI API] Failed: ${error.message}`);
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
