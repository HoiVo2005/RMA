'use client';
import { createSupabaseBrowser } from './supabase';

/**
 * Gọi API quản trị kèm token đăng nhập Supabase hiện tại.
 * Tự động chuyển về /login nếu phiên hết hạn (401).
 */
export async function adminFetch(url: string, init: RequestInit = {}) {
  const { data } = await createSupabaseBrowser().auth.getSession();
  const token = data.session?.access_token;
  const res = await fetch(url, {
    ...init,
    headers: {
      ...(init.headers || {}),
      ...(token ? { authorization: 'Bearer ' + token } : {}),
    },
  });
  if (res.status === 401 && typeof window !== 'undefined') {
    window.location.href = '/admin/login';
  }
  return res;
}

export async function adminJson<T = any>(url: string, init: RequestInit = {}): Promise<{ data: T | null; error?: string }> {
  const res = await adminFetch(url, init);
  try {
    return await res.json();
  } catch {
    return { data: null, error: 'Phản hồi không hợp lệ từ máy chủ' };
  }
}
