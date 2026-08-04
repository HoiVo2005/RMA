import { NextRequest, NextResponse } from 'next/server';
import { runIngest } from '@/lib/ingest';

// Được Vercel Cron gọi định kỳ (xem vercel.json). Bảo vệ bằng CRON_SECRET.
export async function GET(req: NextRequest) {
  if (process.env.CRON_SECRET && req.headers.get('authorization') !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  try {
    const result = await runIngest();
    return NextResponse.json(result);
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e.message }, { status: 500 });
  }
}
