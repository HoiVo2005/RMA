import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// Lưu đăng ký nhận thông báo đẩy của trình duyệt — công khai, không cần đăng nhập.
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const sub = body?.subscription;
  if (!sub?.endpoint || !sub?.keys?.p256dh || !sub?.keys?.auth) {
    return NextResponse.json({ error: 'Dữ liệu đăng ký không hợp lệ' }, { status: 400 });
  }

  try {
    const db = createSupabaseAdmin();
    const { error } = await db
      .from('push_subscriptions')
      .upsert(
        { endpoint: sub.endpoint, p256dh: sub.keys.p256dh, auth: sub.keys.auth },
        { onConflict: 'endpoint' }
      );
    if (error) throw error;
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Không lưu được đăng ký thông báo' }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const endpoint = body?.endpoint as string | undefined;
  if (!endpoint) return NextResponse.json({ error: 'Thiếu endpoint' }, { status: 400 });
  try {
    const db = createSupabaseAdmin();
    await db.from('push_subscriptions').delete().eq('endpoint', endpoint);
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Không huỷ được đăng ký' }, { status: 400 });
  }
}
