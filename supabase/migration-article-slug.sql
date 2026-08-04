-- =====================================================
-- THÊM SLUG CHO BÀI VIẾT (URL đẹp, không lộ UUID)
-- Chạy file này trong Supabase SQL Editor trên project ĐÃ có sẵn dữ liệu.
-- Sau khi chạy: /bai-viet/{id-dài-khó-đọc} → /bai-viet/mbappe-lap-cu-dup-a1b2c3d4
-- Link kiểu cũ (theo id) vẫn hoạt động bình thường, không bị gãy.
-- =====================================================

-- Cần extension "unaccent" để bỏ dấu tiếng Việt khi tạo slug.
create extension if not exists unaccent;

alter table public.articles add column if not exists slug text;

-- Hàm chuyển văn bản tiếng Việt có dấu -> slug URL-friendly (bỏ dấu, chữ thường, nối dấu gạch ngang).
create or replace function public.vn_slugify(input text)
returns text
language sql
immutable
as $$
  select trim(both '-' from
    regexp_replace(
      lower(unaccent(replace(replace(coalesce(input, ''), 'đ', 'd'), 'Đ', 'D'))),
      '[^a-z0-9]+', '-', 'g'
    )
  )
$$;

-- Tự sinh slug từ tiêu đề tiếng Việt mỗi khi thêm bài mới (RSS tự động lấy tin hoặc admin thêm tay
-- ở /admin/bai-viet), nối thêm 8 ký tự đầu của id để đảm bảo không trùng nhau. Nếu admin tự nhập
-- slug riêng thì chỉ chuẩn hoá lại (bỏ dấu, ký tự lạ) chứ không ghi đè.
create or replace function public.set_article_slug()
returns trigger
language plpgsql
as $$
declare
  base text;
begin
  if new.slug is null or trim(new.slug) = '' then
    base := public.vn_slugify(coalesce(new.translated_title, new.original_title, ''));
    if base = '' then base := 'bai-viet'; end if;
    new.slug := left(base, 80) || '-' || left(replace(new.id::text, '-', ''), 8);
  else
    new.slug := public.vn_slugify(new.slug);
  end if;
  return new;
end;
$$;

drop trigger if exists trg_articles_slug on public.articles;
create trigger trg_articles_slug
before insert on public.articles
for each row execute function public.set_article_slug();

-- Sinh slug cho toàn bộ bài viết đã có sẵn trước khi thêm cột này.
update public.articles
set slug = left(public.vn_slugify(coalesce(translated_title, original_title, '')), 80) || '-' || left(replace(id::text, '-', ''), 8)
where slug is null or trim(slug) = '';

-- Đảm bảo mỗi slug là duy nhất và tra cứu nhanh.
create unique index if not exists articles_slug_key on public.articles (slug);
