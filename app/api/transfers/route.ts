import { NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

function parseRange(range?: string) {
    switch ((range || '').toLowerCase()) {
        case '1h':
            return 1;
        case '6h':
            return 6;
        case '24h':
            return 24;
        case '7d':
            return 168;
        case 'all':
            return null;
        default:
            return 24;
    }
}

export async function GET(req: Request) {
    try {
        const url = new URL(req.url);
        const topic = url.searchParams.get('topic') || '';
        const range = url.searchParams.get('range') || '24h';
        const sinceHours = parseRange(range);

        const supabase = createSupabaseAdmin();

        let q = supabase.from('transfers_events').select('*');
        if (topic) {
            const like = `%${topic}%`;
            q = q.or(`topic.ilike.${like},content.ilike.${like},actor.ilike.${like}`);
        }
        if (sinceHours && typeof sinceHours === 'number') {
            const cutoff = new Date(Date.now() - sinceHours * 3600 * 1000).toISOString();
            q = q.gte('published_at', cutoff);
        }
        q = q.order('published_at', { ascending: false }).limit(200);

        const { data, error } = await q;
        if (error) throw error;
        return NextResponse.json({ topic, range, count: data?.length ?? 0, events: data ?? [] });
    } catch (err: any) {
        return NextResponse.json({ error: err.message || String(err) }, { status: 500 });
    }
}
