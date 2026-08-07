import { createBrowserClient } from '@supabase/ssr';
import { createClient } from '@supabase/supabase-js';

export const hasSupabase = () =>
  Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

/** Client dùng trong trình duyệt (giữ phiên đăng nhập admin). */
export function createSupabaseBrowser() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
/** Client phía server dùng service role — bỏ qua RLS, chỉ dùng trong API routes đã xác thực admin. */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Thiếu NEXT_PUBLIC_SUPABASE_URL hoặc SUPABASE_SERVICE_ROLE_KEY trong biến môi trường.');
  }
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}
