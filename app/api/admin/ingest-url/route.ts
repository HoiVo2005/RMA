import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { ingestSingleUrl } from '@/lib/ingest';

// Admin dán 1 link bài báo bất kỳ -> hệ thống tải toàn bộ nội dung + ảnh + dịch
// sang tiếng Việt -> trả về bản nháp (draft) để xem lại trước khi lưu/xuất bản.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const url = (body.url || '').trim();
  if (!url || !/^https?:\/\//i.test(url)) {
    return NextResponse.json({ error: 'URL không hợp lệ' }, { status: 400 });
  }

  try {
    const draft = await ingestSingleUrl(url, body.source ? body.source : undefined);
    return NextResponse.json({ data: draft });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Không lấy được bài viết' }, { status: 400 });
  }
}
