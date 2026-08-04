import { NextRequest, NextResponse } from 'next/server';
import { createSupabaseAdmin } from '@/lib/supabase';

// Bình chọn dự đoán kết quả trận đấu — công khai, không cần đăng nhập.
// Chặn bình chọn trùng ở phía trình duyệt bằng localStorage (không phải cơ chế bảo mật tuyệt đối).
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await req.json();
  const choice = body.choice;
  if (!['home', 'draw', 'away'].includes(choice)) {
    return NextResponse.json({ error: 'Lựa chọn không hợp lệ' }, { status: 400 });
  }
  try {
    const db = createSupabaseAdmin();
    const { data, error } = await db.rpc('vote_fixture_prediction', { p_fixture_id: id, p_choice: choice });
    if (error) throw error;
    return NextResponse.json({ data: data?.[0] || null });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Không gửi được bình chọn' }, { status: 400 });
  }
}
