import { NextRequest, NextResponse } from 'next/server';

// Chế độ bảo trì (bật/tắt ở /admin/cai-dat) — khi bật, mọi trang CÔNG KHAI đều bị chuyển hướng
// sang /bao-tri, NGOẠI TRỪ /admin, /login (để admin vẫn đăng nhập & tắt bảo trì được), /api
// (để các route nội bộ/cron không bị chặn) và file tĩnh. Dùng fetch REST trực tiếp tới Supabase
// (không dùng @supabase/supabase-js) vì middleware chạy ở Edge Runtime, cần gọn nhẹ và nhanh.
export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/admin') ||
    pathname.startsWith('/login') ||
    pathname.startsWith('/api') ||
    pathname === '/bao-tri' ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/icons') ||
    pathname === '/manifest.json' ||
    pathname === '/sw.js' ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return NextResponse.next(); // chưa cấu hình DB thì không chặn gì cả

  try {
    const res = await fetch(`${url}/rest/v1/site_settings?select=setting_value&setting_key=eq.site_config`, {
      headers: { apikey: anonKey, authorization: `Bearer ${anonKey}` },
      // Middleware chạy trên mọi request nên cache ngắn để không dội quá nhiều lần gọi Supabase.
      next: { revalidate: 20 },
    });
    if (!res.ok) return NextResponse.next();
    const rows = (await res.json()) as Array<{ setting_value?: { maintenance?: { enabled?: boolean } } }>;
    const enabled = Boolean(rows[0]?.setting_value?.maintenance?.enabled);
    if (enabled) {
      const dest = req.nextUrl.clone();
      dest.pathname = '/bao-tri';
      return NextResponse.rewrite(dest);
    }
  } catch {
    // lỗi mạng/DB thì cho qua bình thường, không để bảo trì "giả" chặn cả site
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
