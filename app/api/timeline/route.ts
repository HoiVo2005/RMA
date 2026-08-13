import { NextResponse } from 'next/server';
import { getTimelineEvents } from '@/lib/data';

export async function GET(req: Request) {
    const url = new URL(req.url);
    const topic = url.searchParams.get('topic') || '';
    const range = url.searchParams.get('range') || '24h'; // default 24h
    let sinceHours: number | null = null;
    switch (range) {
        case '1h':
            sinceHours = 1;
            break;
        case '6h':
            sinceHours = 6;
            break;
        case '24h':
            sinceHours = 24;
            break;
        case '7d':
            sinceHours = 24 * 7;
            break;
        case 'all':
        default:
            sinceHours = null;
    }

    if (!topic) return NextResponse.json({ error: 'missing topic' }, { status: 400 });

    try {
        const events = await getTimelineEvents(topic, { sinceHours, limit: 500 });
        return NextResponse.json({ topic, range, count: events.length, events });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || String(e) }, { status: 500 });
    }
}
