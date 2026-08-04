import { NextResponse } from 'next/server';
import { getLiveFixture } from '@/lib/data';

// API công khai — Live Match Center trên trang chủ gọi định kỳ (polling) để cập nhật tỉ số trực tiếp.
export async function GET() {
  const fixture = await getLiveFixture();
  return NextResponse.json({ data: fixture });
}
