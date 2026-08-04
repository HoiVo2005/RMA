import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { FORMATIONS } from '@/lib/formations';

// Lấy / lưu đội hình ra sân (sơ đồ + cầu thủ theo từng vị trí) — dùng trang quản trị.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { data } = await admin.from('site_settings').select('setting_value').eq('setting_key', 'starting_lineup').maybeSingle();
  return NextResponse.json({ data: data?.setting_value || null });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const formation = body.formation;
  const assignments = body.assignments || {};

  if (!FORMATIONS[formation]) {
    return NextResponse.json({ error: 'Sơ đồ không hợp lệ' }, { status: 400 });
  }

  const { error } = await admin
    .from('site_settings')
    .upsert(
      {
        setting_key: 'starting_lineup',
        setting_value: { formation, assignments, source: 'manual', syncedAt: new Date().toISOString() },
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'setting_key' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: { formation, assignments } });
}
