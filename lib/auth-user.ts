import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from './supabase';
import { NextRequest, NextResponse } from 'next/server';

export async function requireUser(req: NextRequest) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !anonKey) return null;

    const token = req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('sb-access-token')?.value;
    if (!token) return null;

    const authClient = createClient(url, anonKey);
    const {
        data: { user },
    } = await authClient.auth.getUser(token);
    return user;
}

export async function requireUserOrPublic(req: NextRequest) {
    return await requireUser(req);
}
