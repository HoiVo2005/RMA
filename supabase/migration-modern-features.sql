-- =====================================================
-- MIGRATION: Tính năng hiện đại (v3 "Aurora Madrid")
-- Chạy file này trong Supabase → SQL Editor SAU KHI đã chạy schema.sql gốc.
-- An toàn để chạy nhiều lần (dùng if not exists / on conflict).
-- =====================================================

-- ---------- BÌNH LUẬN & TƯƠNG TÁC ----------
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  author_name text not null default 'Độc giả',
  content text not null,
  likes integer not null default 0,
  created_at timestamptz not null default now()
);

create index if not exists comments_article_id_idx on public.comments (article_id, created_at desc);

alter table public.comments enable row level security;

drop policy if exists "public read comments" on public.comments;
create policy "public read comments" on public.comments for select using (true);

-- Ghi (thêm bình luận / like) chỉ thực hiện qua API route dùng service_role key,
-- nên không cần policy insert/update công khai — mặc định sẽ bị chặn với RLS bật, đúng như mong muốn.

create or replace function public.increment_comment_like(p_comment_id uuid)
returns integer language plpgsql security definer as $$
declare
  new_likes integer;
begin
  update public.comments set likes = likes + 1 where id = p_comment_id
  returning likes into new_likes;
  return new_likes;
end;
$$;

-- ---------- THÔNG BÁO ĐẨY (PUSH NOTIFICATIONS / PWA) ----------
create table if not exists public.push_subscriptions (
  id uuid primary key default gen_random_uuid(),
  endpoint text not null unique,
  p256dh text not null,
  auth text not null,
  created_at timestamptz not null default now()
);

alter table public.push_subscriptions enable row level security;
-- Không có policy công khai — chỉ ghi/đọc qua API route dùng service_role key.

-- ---------- CẦU THỦ YÊU THÍCH (theo dõi) ----------
-- Lưu ý: mặc định tính năng "theo dõi cầu thủ" lưu tại trình duyệt (localStorage),
-- giống cơ chế "Đã lưu bài viết" hiện có — không cần bảng riêng.
-- Bảng dưới đây chỉ dùng nếu sau này muốn đồng bộ theo tài khoản đăng nhập.
create table if not exists public.player_follows (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (device_id, player_id)
);
alter table public.player_follows enable row level security;

-- ---------- HỒ SƠ CẦU THỦ ĐẦY ĐỦ (tiểu sử, CLB đã qua, danh hiệu) ----------
-- career_clubs / honors / youth_clubs / national_team lưu dạng text nhiều dòng, mỗi dòng phân cách
-- bởi " | " để soạn dễ dàng trong trang quản trị qua các ô nhập riêng (không cần trình soạn JSON).
alter table public.players add column if not exists bio text;
alter table public.players add column if not exists career_clubs text; -- Sự nghiệp chuyên nghiệp: Club | Từ | Đến | Trận | Bàn
alter table public.players add column if not exists honors text;       -- Danh hiệu: Tên | Số lần | Các năm
alter table public.players add column if not exists birthplace text;
alter table public.players add column if not exists height_cm integer;
alter table public.players add column if not exists youth_clubs text;    -- Sự nghiệp trẻ: Club | Từ | Đến
alter table public.players add column if not exists national_team text; -- Đội tuyển QG: Đội | Từ | Đến | Trận | Bàn

-- =====================================================
-- ĐỘI HÌNH RA SÂN THEO TỪNG TRẬN (đồng bộ tự động từ Highlightly)
-- Lưu trực tiếp trên bản ghi fixtures để trang "Chi tiết trận đấu" hiển thị
-- ĐÚNG đội hình của trận đó, thay vì chỉ có 1 đội hình "hiện tại" dùng chung
-- cho trang chủ. Giá trị dạng: { formation, assignments, source, syncedAt }.
-- =====================================================
alter table public.fixtures add column if not exists lineup jsonb;
