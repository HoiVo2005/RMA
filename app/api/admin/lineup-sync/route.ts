import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { syncLineupFromHighlightly } from '@/lib/highlightly';

// GET: đọc trạng thái bật/tắt tự động đồng bộ đội hình.
// PATCH: bật/tắt tự động đồng bộ (site_settings.lineup_auto_sync).
// POST: kích hoạt đồng bộ ngay lập tức (nút "Đồng bộ ngay" trong trang quản trị).
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data } = await admin.from('site_settings').select('setting_value').eq('setting_key', 'lineup_auto_sync').maybeSingle();
  // Mặc định BẬT nếu chưa từng thiết lập.
  const enabled = data?.setting_value === undefined || data?.setting_value === null ? true : data.setting_value === true;
  return NextResponse.json({ data: { enabled } });
}

export async function PATCH(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const { error } = await admin
    .from('site_settings')
    .upsert(
      { setting_key: 'lineup_auto_sync', setting_value: Boolean(body.enabled), updated_at: new Date().toISOString() },
      { onConflict: 'setting_key' }
    );
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: { enabled: Boolean(body.enabled) } });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await syncLineupFromHighlightly({ force: true });
    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Đồng bộ thất bại' }, { status: 400 });
  }
}
