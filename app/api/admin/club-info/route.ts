import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { DEFAULT_CLUB_INFO, type ClubInfo } from '@/lib/club-info';

// Lấy / lưu thông tin tổng quan CLB (tên, biệt danh, sân, HLV, ảnh áo đấu...) — site_settings.club_info.
export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data } = await admin.from('site_settings').select('setting_value').eq('setting_key', 'club_info').maybeSingle();
  return NextResponse.json({ data: data?.setting_value || DEFAULT_CLUB_INFO });
}

export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = (await req.json()) as ClubInfo;

  if (!body.name?.trim() || !body.fullName?.trim()) {
    return NextResponse.json({ error: 'Thiếu tên CLB' }, { status: 400 });
  }

  const value: ClubInfo = {
    ...DEFAULT_CLUB_INFO,
    ...body,
    nicknames: Array.isArray(body.nicknames) ? body.nicknames.filter((n) => n.trim()) : [],
    capacity: Number(body.capacity) || 0,
    colors: {
      home: { ...DEFAULT_CLUB_INFO.colors.home, ...(body.colors?.home || {}) },
      away: { ...DEFAULT_CLUB_INFO.colors.away, ...(body.colors?.away || {}) },
      third: { ...DEFAULT_CLUB_INFO.colors.third, ...(body.colors?.third || {}) },
    },
  };

  const { error } = await admin
    .from('site_settings')
    .upsert(
      { setting_key: 'club_info', setting_value: value, updated_at: new Date().toISOString() },
      { onConflict: 'setting_key' }
    );

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ data: value });
}
