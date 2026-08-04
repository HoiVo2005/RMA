import { NextResponse } from 'next/server';
import { getSiteSettings } from '@/lib/site-settings';

// API công khai (KHÔNG cần đăng nhập) — trả cấu hình website cho các component phía client
// (Header, SaveButton, CommentSection, NotificationBell, PredictionWidget...) dùng để tự ẩn/hiện
// hoặc đổi tên/logo mà không cần build lại code mỗi khi admin đổi cấu hình.
export async function GET() {
  const settings = await getSiteSettings();
  return NextResponse.json(
    { data: settings },
    { headers: { 'cache-control': 'public, max-age=30, stale-while-revalidate=120' } }
  );
}
