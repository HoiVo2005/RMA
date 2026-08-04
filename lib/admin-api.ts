import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { createSupabaseAdmin } from './supabase';

/**
 * Xác thực người dùng hiện tại có phải admin/editor không.
 * Trả về Supabase client (service role) nếu hợp lệ, ngược lại trả về null.
 */
export async function requireAdmin(req: NextRequest) {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;

  const token = req.headers.get('authorization')?.replace('Bearer ', '') || req.cookies.get('sb-access-token')?.value;
  if (!token) return null;

  const authClient = createClient(url, anonKey);
  const {
    data: { user },
  } = await authClient.auth.getUser(token);
  if (!user) return null;

  const admin = createSupabaseAdmin();
  const { data } = await admin.from('admin_profiles').select('id, role').eq('id', user.id).maybeSingle();
  return data ? admin : null;
}

export async function requireAdminUser(req: NextRequest) {
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

/** Tạo bộ 4 handler GET/POST/PATCH/DELETE dùng chung cho mọi bảng CRUD. */
export function crud(table: string) {
  return {
    GET: async (req: NextRequest) => {
      const admin = await requireAdmin(req);
      if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const { searchParams } = new URL(req.url);
      const orderBy = searchParams.get('orderBy') || 'created_at';
      const ascending = searchParams.get('asc') === 'true';
      const { data, error } = await admin.from(table).select('*').order(orderBy, { ascending });
      return NextResponse.json({ data, error: error?.message });
    },
    POST: async (req: NextRequest) => {
      const admin = await requireAdmin(req);
      if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const body = await req.json();
      const { data, error } = await admin.from(table).insert(body).select().single();
      return NextResponse.json({ data, error: error?.message }, { status: error ? 400 : 200 });
    },
    PATCH: async (req: NextRequest) => {
      const admin = await requireAdmin(req);
      if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const body = await req.json();
      const id = body.id;
      delete body.id;
      const { data, error } = await admin.from(table).update(body).eq('id', id).select().single();
      return NextResponse.json({ data, error: error?.message }, { status: error ? 400 : 200 });
    },
    DELETE: async (req: NextRequest) => {
      const admin = await requireAdmin(req);
      if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      const id = new URL(req.url).searchParams.get('id');
      const { error } = await admin.from(table).delete().eq('id', id);
      return NextResponse.json({ ok: !error, error: error?.message }, { status: error ? 400 : 200 });
    },
  };
}
