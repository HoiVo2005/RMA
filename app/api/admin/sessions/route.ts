import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

export async function GET(req: NextRequest) {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const now = new Date().toISOString();
    const { data: sessions, error } = await admin
        .from('auth.sessions')
        .select('id,user_id,created_at,expires_at,ip_address,user_agent')
        .gt('expires_at', now)
        .order('created_at', { ascending: false })
        .limit(200);

    if (error) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const userIds = Array.from(new Set((sessions || []).map((s: any) => s.user_id)));
    const { data: users, error: userError } = await admin
        .from('auth.users')
        .select('id,email,user_metadata')
        .in('id', userIds);

    if (userError) {
        return NextResponse.json({ error: userError.message }, { status: 500 });
    }

    const userMap = (users || []).reduce<Record<string, { email: string | null; full_name?: string | null }>>((acc, user: any) => {
        acc[user.id] = {
            email: user.email,
            full_name: user.user_metadata?.full_name ?? null,
        };
        return acc;
    }, {});

    const payload = (sessions || []).map((session: any) => ({
        id: session.id,
        userId: session.user_id,
        createdAt: session.created_at,
        expiresAt: session.expires_at,
        ipAddress: session.ip_address || null,
        userAgent: session.user_agent || null,
        email: userMap[session.user_id]?.email || null,
        fullName: userMap[session.user_id]?.full_name || null,
    }));

    return NextResponse.json({ data: payload });
}
