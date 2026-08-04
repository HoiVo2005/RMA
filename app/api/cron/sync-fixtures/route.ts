import { NextRequest, NextResponse } from 'next/server';
import { syncFixturesFromTheSportsDB, syncStandingsFromTheSportsDB } from '@/lib/sportsdb';

// Được gọi định kỳ (Vercel Cron hoặc GitHub Actions) để cập nhật thời gian,
// tỉ số, trạng thái các trận đấu VÀ bảng xếp hạng La Liga.
// Bảo vệ bằng CRON_SECRET giống /api/cron/ingest.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const fixtures = await syncFixturesFromTheSportsDB();
    let standings: any = null;
    let standingsError: string | null = null;
    try {
      standings = await syncStandingsFromTheSportsDB();
    } catch (e: any) {
      standingsError = e.message; // không chặn kết quả đồng bộ trận đấu nếu BXH lỗi
    }
    return NextResponse.json({ ok: true, fixtures, standings, standingsError });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
