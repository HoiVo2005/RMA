import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { fetchHonorImage } from '@/lib/honor-images';

// Admin nhập tên danh hiệu (vd "La Liga", "Siêu cúp Tây Ban Nha") -> tự tra
// Wikipedia tìm ảnh cúp/huy chương/logo chính thức -> trả về URL để admin dán
// thẳng vào ô "Ảnh" mà không cần tự đi tìm ảnh thủ công.
export async function POST(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const title = (body.title || '').trim();
  if (!title) {
    return NextResponse.json({ error: 'Vui lòng nhập tên danh hiệu' }, { status: 400 });
  }

  try {
    const image_url = await fetchHonorImage(title);
    if (!image_url) {
      return NextResponse.json({ error: `Không tìm được ảnh phù hợp cho "${title}"` }, { status: 404 });
    }
    return NextResponse.json({ image_url });
  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Không lấy được ảnh từ Wikipedia' }, { status: 400 });
  }
}
