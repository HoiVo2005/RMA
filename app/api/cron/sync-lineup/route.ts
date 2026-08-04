import { NextRequest, NextResponse } from 'next/server';
import { syncLineupFromHighlightly } from '@/lib/highlightly';

// Được gọi định kỳ (GitHub Actions, mỗi 10 phút — đúng tần suất khuyến nghị của Highlightly)
// để lấy đội hình ra sân CHÍNH THỨC ngay khi 2 đội công bố (thường 20-40 phút trước giờ đấu)
// và ghi vào site_settings.starting_lineup — trang chủ/trang Đội hình tự phản ánh ngay lần tải tiếp theo.
// Bảo vệ bằng CRON_SECRET giống các route /api/cron khác.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await syncLineupFromHighlightly();
    return NextResponse.json(result, { status: result.ok ? 200 : 200 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message || 'Đồng bộ đội hình thất bại' }, { status: 500 });
  }
}
