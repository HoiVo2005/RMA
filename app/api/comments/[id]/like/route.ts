import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// Thích một bình luận — công khai. Chặn like trùng phía trình duyệt bằng localStorage (không phải bảo mật tuyệt đối).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  try {
    const db = createSupabaseAdmin();
    const { data, error } = await db.rpc('increment_comment_like', { p_comment_id: id });
    if (error) throw error;
    return NextResponse.json({ likes: data });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Không thích được bình luận' }, { status: 400 });
  }
}
