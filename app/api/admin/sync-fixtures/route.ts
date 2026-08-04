import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { syncFixturesFromTheSportsDB } from '@/lib/sportsdb';

// Nút "Đồng bộ lịch thi đấu" — lấy các trận gần nhất + sắp tới từ TheSportsDB
// và thêm/cập nhật vào bảng fixtures (chống trùng theo external_id).
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await syncFixturesFromTheSportsDB();
    return NextResponse.json({ data: { ok: true, ...result } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Đồng bộ thất bại' }, { status: 400 });
  }
}
