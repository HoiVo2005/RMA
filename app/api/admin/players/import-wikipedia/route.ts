import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { fetchPlayerFromWikipedia } from '@/lib/wikipedia';

// Admin nhập tên cầu thủ -> tìm bài Wikipedia tương ứng (ưu tiên tiếng Việt) ->
// trích xuất tiểu sử, ngày sinh, nơi sinh, chiều cao, sự nghiệp CLB/đội tuyển,
// danh hiệu -> trả về bản nháp để admin xem lại trước khi điền vào form.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const name = (body.name || '').trim();
  if (!name) {
    return NextResponse.json({ error: 'Vui lòng nhập tên cầu thủ' }, { status: 400 });
  }

  try {
    const draft = await fetchPlayerFromWikipedia(name);
    return NextResponse.json({ data: draft });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Không lấy được dữ liệu từ Wikipedia' }, { status: 400 });
  }
}
