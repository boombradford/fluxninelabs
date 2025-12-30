import { NextResponse } from 'next/server';
import axios from 'axios';

export async function POST(req: Request) {
    try {
        const { query } = await req.json();

        if (!query) {
            return NextResponse.json({ error: 'Query is required' }, { status: 400 });
        }

        const apiKey = process.env.GOOGLE_PSI_API_KEY || '';
        const apiUrl = `https://kgsearch.googleapis.com/v1/entities:search?query=${encodeURIComponent(query)}&key=${apiKey}&limit=1&indent=true`;

        const response = await axios.get(apiUrl);
        const itemList = response.data.itemListElement || [];

        if (itemList.length === 0) {
            return NextResponse.json({
                found: false,
                checkedAt: new Date().toISOString()
            });
        }

        const entity = itemList[0].result;
        const score = itemList[0].resultScore;

        return NextResponse.json({
            found: true,
            entity: {
                name: entity.name,
                description: entity.description, // e.g., "Corporation"
                detailedDescription: entity.detailedDescription?.articleBody,
                url: entity.detailedDescription?.url,
                image: entity.image?.contentUrl
            },
            score,
            checkedAt: new Date().toISOString()
        });

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
        console.error('Authority API Error:', error);
        return NextResponse.json({ error: 'Failed to fetch authority data' }, { status: 500 });
    }
}
