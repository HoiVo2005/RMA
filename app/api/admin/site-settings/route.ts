import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { DEFAULT_SITE_SETTINGS, mergeSiteSettings, type SiteSettings } from '@/lib/site-settings';

// Lấy / lưu cấu hình tổng thể website (tên, logo, màu sắc, bật/tắt tính năng, bảo trì...) —
// site_settings.site_config. Dùng ở trang /admin/cai-dat.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await admin.from('site_settings').select('setting_value').eq('setting_key', 'site_config').maybeSingle();
  return NextResponse.json({ data: mergeSiteSettings(data?.setting_value as Partial<SiteSettings> | null) });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as Partial<SiteSettings>;

  if (!body.siteName?.trim()) {
    return NextResponse.json({ error: 'Thiếu tên website' }, { status: 400 });
  }

  const value: SiteSettings = mergeSiteSettings(body);

  const { error } = await admin
    .from('site_settings')
    .upsert({ setting_key: 'site_config', setting_value: value, updated_at: new Date().toISOString() }, { onConflict: 'setting_key' });

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: value });
}
