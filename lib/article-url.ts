import { slugify } from './slug';

/**
 * Sinh đường dẫn công khai cho 1 bài viết — ưu tiên slug đẹp (vd:
 * /bai-viet/mbappe-lap-cu-dup-a1b2c3d4) thay vì UUID trần trụi.
 * Nếu bài chưa có slug (dữ liệu cũ chưa chạy migration) thì tạo slug từ title.
 */
export function articleHref(a: { id: string; slug?: string | null; translated_title?: string }): string {
  const slug = a.slug || (a.translated_title ? slugify(a.translated_title) : a.id);
  return `/bai-viet/${slug}`;
}
