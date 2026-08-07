-- =====================================================
-- MADRIDISTA NEWS VN — SCHEMA (v2.1)
-- Chạy toàn bộ file này trong Supabase SQL Editor
-- =====================================================
create extension if not exists pgcrypto;

-- =====================================================
-- NGUỒN TIN
-- =====================================================
create table if not exists public.news_sources (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  country text not null,
  website_url text,
  rss_url text,
  logo_url text,
  reliability text not null default 'Uy tín',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- DANH MỤC
-- =====================================================
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- =====================================================
-- BÀI VIẾT
-- =====================================================
create table if not exists public.articles (
  id uuid primary key default gen_random_uuid(),
  source_id uuid references public.news_sources(id) on delete set null,
  category_id uuid references public.categories(id) on delete set null,

  source_name text not null,
  source_country text,

  original_title text not null,
  translated_title text not null,
  slug text,

  original_description text,
  summary_vi text,
  content_vi text,

  image_url text,
  original_url text not null unique,

  category text default 'Tin mới',
  reliability text default 'Uy tín',

  author_name text,
  published_at timestamptz,

  is_featured boolean not null default false,
  is_transfer_news boolean not null default false,

  status text not null default 'draft'
    check (status in ('draft', 'published', 'hidden', 'rejected')),

  view_count integer not null default 0,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.articles add column if not exists view_count integer not null default 0;
alter table public.articles add column if not exists slug text;

create or replace function public.increment_article_views(article_id uuid)
returns void language plpgsql security definer as $$
begin
  update public.articles set view_count = view_count + 1 where id = article_id;
end;
$$;

-- Slug cho URL bài viết (/bai-viet/{slug}) — bỏ dấu tiếng Việt + nối 8 ký tự id để chắc chắn không
-- trùng nhau. Tự sinh khi thêm bài mới (RSS ingest hoặc admin thêm tay), không cần nhập tay.
create extension if not exists unaccent;

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

create unique index if not exists articles_slug_key on public.articles (slug);

update public.articles
set slug = left(public.vn_slugify(coalesce(translated_title, original_title, '')), 80) || '-' || left(replace(id::text, '-', ''), 8)
where slug is null or trim(slug) = '';

create table if not exists public.article_keywords (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  keyword text not null,
  created_at timestamptz not null default now()
);

-- =====================================================
-- BÌNH LUẬN & TƯƠNG TÁC
-- =====================================================
create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  article_id uuid not null references public.articles(id) on delete cascade,
  author_name text not null default 'Độc giả',
  content text not null,
  likes integer not null default 0,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'hidden')),
  created_at timestamptz not null default now()
);

create index if not exists comments_article_id_idx on public.comments (article_id, created_at desc);

alter table public.comments enable row level security;

drop policy if exists "public read comments" on public.comments;
create policy "public read comments" on public.comments for select using (true);

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

-- ---------- CẦU THỦ YÊU THÍCH (THEO DÕI) ----------
create table if not exists public.player_follows (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  player_id uuid not null references public.players(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (device_id, player_id)
);

alter table public.player_follows enable row level security;

-- =====================================================
-- CẦU THỦ
-- =====================================================
alter table public.players add column if not exists bio text;
alter table public.players add column if not exists career_clubs text;
alter table public.players add column if not exists honors text;
alter table public.players add column if not exists birthplace text;
alter table public.players add column if not exists height_cm integer;
alter table public.players add column if not exists youth_clubs text;
alter table public.players add column if not exists national_team text;

-- =====================================================
-- LỊCH THI ĐẤU
-- =====================================================
create table if not exists public.fixtures (
  id uuid primary key default gen_random_uuid(),
  external_id text,
  competition text not null,
  home_team text not null,
  away_team text not null,
  home_logo_url text,
  away_logo_url text,
  stadium text,
  match_time timestamptz not null,
  status text not null default 'scheduled',
  home_score integer,
  away_score integer,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.fixtures add column if not exists external_id text;
alter table public.fixtures add column if not exists events jsonb not null default '[]'::jsonb;
create unique index if not exists idx_fixtures_external_id on public.fixtures(external_id) where external_id is not null;

-- =====================================================
-- TÀI KHOẢN QUẢN TRỊ
-- =====================================================
create table if not exists public.admin_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  role text not null default 'editor' check (role in ('admin', 'editor')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- =====================================================
-- NHẬT KÝ CRON
-- =====================================================
create table if not exists public.cron_logs (
  id uuid primary key default gen_random_uuid(),
  job_name text not null,
  source_name text,
  total_found integer not null default 0,
  total_inserted integer not null default 0,
  total_skipped integer not null default 0,
  total_failed integer not null default 0,
  status text not null default 'running',
  error_message text,
  started_at timestamptz not null default now(),
  finished_at timestamptz
);

-- =====================================================
-- DỰ ĐOÁN KẾT QUẢ TRẬN ĐẤU
-- =====================================================
create table if not exists public.fixture_predictions (
  fixture_id uuid primary key references public.fixtures(id) on delete cascade,
  home_votes integer not null default 0,
  draw_votes integer not null default 0,
  away_votes integer not null default 0,
  updated_at timestamptz not null default now()
);

create or replace function public.vote_fixture_prediction(p_fixture_id uuid, p_choice text)
returns table(home_votes integer, draw_votes integer, away_votes integer)
language plpgsql security definer as $$
begin
  insert into public.fixture_predictions (fixture_id) values (p_fixture_id)
  on conflict (fixture_id) do nothing;

  if p_choice = 'home' then
    update public.fixture_predictions set home_votes = home_votes + 1, updated_at = now() where fixture_id = p_fixture_id;
  elsif p_choice = 'draw' then
    update public.fixture_predictions set draw_votes = draw_votes + 1, updated_at = now() where fixture_id = p_fixture_id;
  elsif p_choice = 'away' then
    update public.fixture_predictions set away_votes = away_votes + 1, updated_at = now() where fixture_id = p_fixture_id;
  end if;

  return query select fp.home_votes, fp.draw_votes, fp.away_votes from public.fixture_predictions fp where fp.fixture_id = p_fixture_id;
end;
$$;

alter table public.fixture_predictions enable row level security;
drop policy if exists "public read predictions" on public.fixture_predictions;
create policy "public read predictions" on public.fixture_predictions for select using (true);

-- =====================================================
-- CẤU HÌNH WEBSITE
-- =====================================================
create table if not exists public.site_settings (
  id uuid primary key default gen_random_uuid(),
  setting_key text not null unique,
  setting_value jsonb,
  updated_at timestamptz not null default now()
);

-- =====================================================
-- INDEX
-- =====================================================
create index if not exists idx_articles_status on public.articles(status);
create index if not exists idx_articles_published_at on public.articles(published_at desc);
create index if not exists idx_articles_category on public.articles(category);
create index if not exists idx_articles_source_id on public.articles(source_id);
create index if not exists idx_fixtures_match_time on public.fixtures(match_time);

-- =====================================================
-- TRIGGER updated_at
-- =====================================================
create or replace function public.update_updated_at_column()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

do $$
declare t text;
begin
  foreach t in array array['articles','news_sources','players','fixtures','admin_profiles']
  loop
    execute format('drop trigger if exists trg_touch_updated_at on public.%I', t);
    execute format('create trigger trg_touch_updated_at before update on public.%I for each row execute function public.update_updated_at_column()', t);
  end loop;
end $$;

-- =====================================================
-- TỰ TẠO admin_profiles KHI CÓ USER MỚI (tuỳ chọn)
-- =====================================================
create or replace function public.handle_new_admin_user()
returns trigger language plpgsql security definer as $$
begin
  insert into public.admin_profiles (id, email, role)
  values (new.id, new.email, 'editor')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_admin_user();

-- =====================================================
-- RLS
-- =====================================================
alter table public.articles enable row level security;
alter table public.news_sources enable row level security;
alter table public.categories enable row level security;
alter table public.players enable row level security;
alter table public.fixtures enable row level security;
alter table public.comments enable row level security;
alter table public.push_subscriptions enable row level security;
alter table public.player_follows enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.cron_logs enable row level security;
alter table public.site_settings enable row level security;

drop policy if exists "public read published articles" on public.articles;
drop policy if exists "public read sources" on public.news_sources;
drop policy if exists "public read categories" on public.categories;
drop policy if exists "public read players" on public.players;
drop policy if exists "public read fixtures" on public.fixtures;
drop policy if exists "public read comments" on public.comments;
drop policy if exists "admins manage articles" on public.articles;
drop policy if exists "admins manage sources" on public.news_sources;
drop policy if exists "admins manage categories" on public.categories;
drop policy if exists "admins manage players" on public.players;
drop policy if exists "admins manage fixtures" on public.fixtures;
drop policy if exists "admin read own profile" on public.admin_profiles;

create policy "public read published articles" on public.articles for select using (status = 'published');
create policy "public read sources" on public.news_sources for select using (is_active = true);
create policy "public read categories" on public.categories for select using (true);
create policy "public read players" on public.players for select using (is_active = true);
create policy "public read fixtures" on public.fixtures for select using (true);

create policy "admins manage articles" on public.articles for all to authenticated
  using (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()))
  with check (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()));

create policy "admins manage sources" on public.news_sources for all to authenticated
  using (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()))
  with check (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()));

create policy "admins manage categories" on public.categories for all to authenticated
  using (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()))
  with check (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()));

create policy "admins manage players" on public.players for all to authenticated
  using (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()))
  with check (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()));

create policy "admins manage fixtures" on public.fixtures for all to authenticated
  using (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()))
  with check (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()));

create policy "admin read own profile" on public.admin_profiles for select to authenticated using (id = auth.uid());

-- site_settings: dùng để lưu cấu hình hiển thị công khai (VD: đội hình ra sân) —
-- ai cũng đọc được, chỉ admin mới ghi được.
drop policy if exists "public read site_settings" on public.site_settings;
drop policy if exists "admins manage site_settings" on public.site_settings;
create policy "public read site_settings" on public.site_settings for select using (true);
create policy "admins manage site_settings" on public.site_settings for all to authenticated
  using (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()))
  with check (exists (select 1 from public.admin_profiles where admin_profiles.id = auth.uid()));

-- =====================================================
-- DỮ LIỆU MẶC ĐỊNH
-- =====================================================
insert into public.categories (name, slug, description) values
  ('Tin mới', 'tin-moi', 'Tin tức mới nhất về Real Madrid'),
  ('Chuyển nhượng', 'chuyen-nhuong', 'Tin chuyển nhượng Real Madrid'),
  ('Đội hình', 'doi-hinh', 'Tin đội hình và cầu thủ'),
  ('Chấn thương', 'chan-thuong', 'Thông tin chấn thương'),
  ('Phỏng vấn', 'phong-van', 'Phỏng vấn cầu thủ và huấn luyện viên')
on conflict (slug) do nothing;

insert into public.news_sources (name, country, website_url, reliability) values
  ('Marca', 'Tây Ban Nha', 'https://www.marca.com', 'Uy tín'),
  ('AS', 'Tây Ban Nha', 'https://as.com', 'Uy tín'),
  ('Relevo', 'Tây Ban Nha', 'https://www.relevo.com', 'Uy tín'),
  ('L''Équipe', 'Pháp', 'https://www.lequipe.fr', 'Uy tín'),
  ('RMC Sport', 'Pháp', 'https://rmcsport.bfmtv.com', 'Uy tín'),
  ('Foot Mercato', 'Pháp', 'https://www.footmercato.net', 'Khá uy tín'),
  ('Kicker', 'Đức', 'https://www.kicker.de', 'Uy tín'),
  ('Sky Sport Deutschland', 'Đức', 'https://sport.sky.de', 'Uy tín'),
  ('Sport Bild', 'Đức', 'https://sportbild.bild.de', 'Khá uy tín')
on conflict (name) do nothing;
