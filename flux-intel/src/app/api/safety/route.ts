import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const { url } = await req.json();

        if (!url) {
            return NextResponse.json({ error: 'URL is required' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_PSI_API_KEY || ''; // Reusing the key
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
        const threats = matches.map((m: any) => m.threatType);

        return NextResponse.json({
            isSafe,
            threats,
            checkedAt: new Date().toISOString()
        });

    } catch (error: any) {
        console.error('[Flux Safety API] Error:', error.message);
        // Fail open (don't block the user if the safety API fails, but report error)
        return NextResponse.json({ error: 'Failed to verify safety status', details: error.message }, { status: 500 });
    }
}
