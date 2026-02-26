import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_SAFE_BROWSING_API_KEY || '';

        if (!apiKey) {
            return NextResponse.json({
                error: 'Safety check unavailable: GOOGLE_SAFE_BROWSING_API_KEY is not configured.'
            }, { status: 503 });
        }

        const apiUrl = `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`;

        // Construct the request body for Safe Browsing API
        const requestBody = {
            client: {
                clientId: "flux-nine-engine",
                clientVersion: "1.0.0"
            },
            threatInfo: {
                // Check all major threat types
                threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
                platformTypes: ["ANY_PLATFORM"],
                threatEntryTypes: ["URL"],
                threatEntries: [
                    { url: url }
                ]
            }
        };

        const response = await axios.post(apiUrl, requestBody);
        const matches = response.data.matches || [];

        const isSafe = matches.length === 0;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const threats = matches.map((m: any) => m.threatType);

        return NextResponse.json({
            isSafe,
            threats,
            checkedAt: new Date().toISOString()
        });

    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.warn('[Flux Safety API] Error (non-blocking):', errorMessage);

        // FAIL OPEN: Don't block the audit if safety check fails
        // Return 200 with degraded mode instead of 500 error
        return NextResponse.json({
            error: 'Safety check unavailable due to API error.'
        }, { status: 503 });
    }
}
