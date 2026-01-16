import { NextResponse } from 'next/server';
import { getDriftRecord } from '../../../../lib/driftStore';

export async function POST(req: Request) {
  try {
    const { domain } = await req.json();
    if (!domain) return NextResponse.json({ error: 'Domain is required' }, { status: 400 });
    const record = getDriftRecord(domain);
    return NextResponse.json({
      domain,
      latest: record?.latest?.timestamp,
      previous: record?.previous?.timestamp
    });
  } catch (error) {
    const err = error instanceof Error ? error : new Error(String(error));
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
