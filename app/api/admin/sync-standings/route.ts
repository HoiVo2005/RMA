import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { syncStandingsFromTheSportsDB } from '@/lib/sportsdb';

// Đồng bộ bảng xếp hạng La Liga trực tiếp từ TheSportsDB.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await syncStandingsFromTheSportsDB();
    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Không đồng bộ được bảng xếp hạng' }, { status: 400 });
  }
}
