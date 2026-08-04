import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// Tăng lượt xem bài viết — gọi công khai từ trang chi tiết bài viết (không cần đăng nhập).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = createSupabaseAdmin();
    await db.rpc('increment_article_views', { article_id: id });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}
