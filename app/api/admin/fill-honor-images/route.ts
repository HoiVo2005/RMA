import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';
import { fillMissingHonorImages } from '@/lib/honor-images';

export async function POST(req: NextRequest) {
    const admin = await requireAdmin(req);
    if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    try {
        const result = await fillMissingHonorImages();
        return NextResponse.json({ data: result });
    } catch (e: any) {
        return NextResponse.json({ error: e.message || 'Không cập nhật được ảnh danh hiệu' }, { status: 400 });
    }
}
