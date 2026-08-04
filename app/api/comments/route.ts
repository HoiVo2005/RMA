import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// Bình luận công khai — không cần đăng nhập. Ghi qua service_role key (RLS chặn ghi trực tiếp từ trình duyệt).
export async function GET(req: NextRequest) {
  const articleId = req.nextUrl.searchParams.get('article_id');
  if (!articleId) return NextResponse.json({ error: 'Thiếu article_id' }, { status: 400 });

  try {
    const db = createSupabaseAdmin();
    const { data, error } = await db
      .from('comments')
      .select('*')
      .eq('article_id', articleId)
      .order('created_at', { ascending: false })
      .limit(200);
    if (error) throw error;
    return NextResponse.json({ data: data || [] });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Không tải được bình luận' }, { status: 400 });
  }
}

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const articleId = body?.article_id as string | undefined;
  const authorName = (body?.author_name as string | undefined)?.trim().slice(0, 60);
  const content = (body?.content as string | undefined)?.trim().slice(0, 1000);

  if (!articleId || !content) {
    return NextResponse.json({ error: 'Thiếu nội dung bình luận' }, { status: 400 });
  }
  if (content.length < 2) {
    return NextResponse.json({ error: 'Bình luận quá ngắn' }, { status: 400 });
  }

  try {
    const db = createSupabaseAdmin();
    const { data, error } = await db
      .from('comments')
      .insert({ article_id: articleId, author_name: authorName || 'Độc giả ẩn danh', content })
      .select('*')
      .single();
    if (error) throw error;
    return NextResponse.json({ data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Không gửi được bình luận' }, { status: 400 });
  }
}
