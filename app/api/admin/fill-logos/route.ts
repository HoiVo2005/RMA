import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { fillMissingFixtureLogos } from '@/lib/sportsdb';

// Điền logo còn thiếu cho các trận đã có (kể cả trận nhập tay) bằng cách tra
// tên đội thật qua TheSportsDB — không đoán/gán URL sai.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  try {
    const result = await fillMissingFixtureLogos();
    return NextResponse.json({ data: result });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Không điền được logo' }, { status: 400 });
  }
}
