import { NextRequest, NextResponse } from 'next/server';
import webpush from 'web-push';
import { createSupabaseAdmin } from '@/lib/supabase';

// Gửi thông báo đẩy tới toàn bộ người đăng ký — dùng nội bộ (từ trang quản trị, hoặc từ cron
// khi có bài viết mới / trận đấu chuyển sang trạng thái "live"). Bảo vệ bằng CRON_SECRET hoặc
// phiên đăng nhập admin tuỳ cách bạn gọi route này.
export async function POST(req: NextRequest) {
  const vapidPublic = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
  const vapidPrivate = process.env.VAPID_PRIVATE_KEY;
  if (!vapidPublic || !vapidPrivate) {
    return NextResponse.json(
      { error: 'Chưa cấu hình VAPID_PRIVATE_KEY / NEXT_PUBLIC_VAPID_PUBLIC_KEY trong biến môi trường.' },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => null);
  const title = body?.title as string | undefined;
  const message = body?.body as string | undefined;
  const url = (body?.url as string | undefined) || '/';
  if (!title || !message) {
    return NextResponse.json({ error: 'Thiếu title hoặc body' }, { status: 400 });
  }

  webpush.setVapidDetails('mailto:admin@madridista-news-vn.local', vapidPublic, vapidPrivate);

  const db = createSupabaseAdmin();
  const { data: subs, error } = await db.from('push_subscriptions').select('*');
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });

  const payload = JSON.stringify({ title, body: message, url });
  let sent = 0;
  let removed = 0;

  await Promise.all(
    (subs || []).map(async (s) => {
      try {
        await webpush.sendNotification(
          { endpoint: s.endpoint, keys: { p256dh: s.p256dh, auth: s.auth } },
          payload
        );
        sent++;
      } catch (e: any) {
        // Subscription hết hạn/không hợp lệ (410/404) — dọn khỏi bảng.
        if (e?.statusCode === 410 || e?.statusCode === 404) {
          await db.from('push_subscriptions').delete().eq('endpoint', s.endpoint);
          removed++;
        }
      }
    })
  );

  return NextResponse.json({ sent, removed, total: subs?.length || 0 });
}
