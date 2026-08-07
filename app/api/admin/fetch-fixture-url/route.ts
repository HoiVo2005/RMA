import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { createSupabaseAdmin } from '@/lib/supabase';
import { fetchFixtureFromTheSportsDBUrl } from '@/lib/sportsdb';

export async function POST(req: NextRequest) {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const url = (body.url || '').trim();
    if (!url || !/^https?:\/\//i.test(url)) {
        return NextResponse.json({ error: 'URL không hợp lệ' }, { status: 400 });
    }

    const payload = await fetchFixtureFromTheSportsDBUrl(url);
    if (!payload) {
        return NextResponse.json(
            { error: 'Không lấy được dữ liệu từ URL này. Vui lòng dùng link TheSportsDB hợp lệ.' },
            { status: 400 },
        );
    }

    const db = createSupabaseAdmin();
    const { data: existing, error } = await db.from('fixtures').select('*').eq('external_id', payload.external_id).maybeSingle();
    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (existing) {
        return NextResponse.json({ data: { ...existing, ...payload } });
        return NextResponse.json({ data: payload });
    }
