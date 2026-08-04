import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { syncSquadFromTheSportsDB } from '@/lib/sportsdb';

// Nút "Đồng bộ đội hình" trong trang quản trị — lấy danh sách cầu thủ hiện tại
// từ TheSportsDB (miễn phí) và thêm/cập nhật vào bảng players.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await syncSquadFromTheSportsDB();
    return NextResponse.json({ data: { ok: true, ...result } });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Đồng bộ thất bại' }, { status: 400 });
  }
}
