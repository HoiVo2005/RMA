import { createClient } from '@supabase/supabase-js';
import { demoArticles, demoFixtures, demoPlayers, demoSources } from './demo';
import { slugify } from './slug';
import type { Article, Fixture, NewsSource, Player } from './types';

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

/**
 * Giống getArticles nhưng có phân trang thật (dùng count + range của Supabase) —
 * trả về tổng số bài để tính số trang, dùng cho các trang danh sách dài (vd. /tin-moi)
 * thay vì tải hàng chục/hàng trăm bài trong 1 lần kéo dài vô tận.
 */
export async function getArticlesPage(
  opts: { category?: string; q?: string; featured?: boolean; page?: number; pageSize?: number } = {}
): Promise<{ items: Article[]; total: number; page: number; pageSize: number }> {
  const pageSize = opts.pageSize || 20;
  const page = Math.max(1, opts.page || 1);
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  const c = client();
  if (!c) {
    const all = demoArticles.filter(
      (a) =>
        (!opts.category || a.category === opts.category) &&
        (!opts.q || `${a.translated_title} ${a.summary_vi}`.toLowerCase().includes(opts.q.toLowerCase()))
    );
    return { items: all.slice(from, to + 1), total: all.length, page, pageSize };
  }

  let q = c
    .from('articles')
    .select('*', { count: 'exact' })
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .range(from, to);

  if (opts.category) q = q.eq('category', opts.category);
  if (opts.featured) q = q.eq('is_featured', true);
  if (opts.q) q = q.or(`translated_title.ilike.%${opts.q}%,summary_vi.ilike.%${opts.q}%`);

  const { data, error, count } = await q;
  return { items: error ? [] : (data as Article[]), total: count || 0, page, pageSize };
}

export async function getArticles(
  opts: { category?: string; q?: string; limit?: number; featured?: boolean } = {}
): Promise<Article[]> {
  const c = client();
  if (!c) {
    return demoArticles
      .filter(
        (a) =>
          (!opts.category || a.category === opts.category) &&
          (!opts.q ||
            `${a.translated_title} ${a.summary_vi}`.toLowerCase().includes(opts.q.toLowerCase()))
      )
      .slice(0, opts.limit || 50);
  }

  let q = c
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('published_at', { ascending: false })
    .limit(opts.limit || 50);

  if (opts.category) q = q.eq('category', opts.category);
  if (opts.featured) q = q.eq('is_featured', true);
  if (opts.q) q = q.or(`translated_title.ilike.%${opts.q}%,summary_vi.ilike.%${opts.q}%`);

  const { data, error } = await q;
  return error ? [] : (data as Article[]);
}

/** Lấy 1 bài viết theo slug hoặc id (fallback) — dùng cho trang chi tiết (/bai-viet/[slug]). */
export async function getArticle(idOrSlug: string): Promise<Article | null> {
  if (idOrSlug.startsWith('demo-')) return demoArticles.find((a) => a.id === idOrSlug) || null;
  const c = client();
  if (!c) return null;

  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  if (isUuid) {
    const { data } = await c
      .from('articles')
      .select('*')
      .eq('id', idOrSlug)
      .eq('status', 'published')
      .maybeSingle();
    return data as Article | null;
  }

  const { data } = await c
    .from('articles')
    .select('*')
    .eq('slug', idOrSlug)
    .eq('status', 'published')
    .maybeSingle();
  if (data) return data as Article;

  // Fallback for older articles with no stored `slug` field.
  const { data: legacy } = await c
    .from('articles')
    .select('*')
    .is('slug', null)
    .eq('status', 'published');
  return (legacy || []).find((a) => slugify(a.translated_title) === idOrSlug) || null;
}

export async function getRelatedArticles(a: Article, limit = 4): Promise<Article[]> {
  const all = await getArticles({ category: a.category, limit: limit + 1 });
  return all.filter((x) => x.id !== a.id).slice(0, limit);
}

export async function getTrendingArticles(limit = 5): Promise<Article[]> {
  const c = client();
  if (!c) return demoArticles.slice(0, limit);
  const { data } = await c
    .from('articles')
    .select('*')
    .eq('status', 'published')
    .order('view_count', { ascending: false })
    .limit(limit);
  return (data || []) as Article[];
}

export type FixturePrediction = { home_votes: number; draw_votes: number; away_votes: number };

export async function getFixturePrediction(fixtureId: string): Promise<FixturePrediction> {
  const c = client();
  const empty = { home_votes: 0, draw_votes: 0, away_votes: 0 };
  if (!c) return empty;
  const { data } = await c
    .from('fixture_predictions')
    .select('home_votes, draw_votes, away_votes')
    .eq('fixture_id', fixtureId)
    .maybeSingle();
  return data || empty;
}

export async function getSources(): Promise<NewsSource[]> {
  const c = client();
  if (!c) return demoSources;
  const { data } = await c.from('news_sources').select('*').eq('is_active', true).order('country');
  return (data || []) as NewsSource[];
}

export async function getFixtures(): Promise<Fixture[]> {
  const c = client();
  if (!c) return demoFixtures;
  const { data } = await c.from('fixtures').select('*').order('match_time');
  return (data || []) as Fixture[];
}

/**
 * Lấy các sự kiện/tin liên quan tới một chủ đề (topic) trong khoảng thời gian.
 * Tìm trong `translated_title`, `summary_vi`, `content_vi`.
 */
export async function getTimelineEvents(
  topic: string,
  opts: { sinceHours?: number | null; limit?: number } = {},
): Promise<Article[]> {
  const c = client();
  const limit = opts.limit || 200;
  if (!c) {
    // demo fallback: filter demoArticles
    const q = demoArticles.filter((a) =>
      `${a.translated_title} ${a.summary_vi} ${a.content_vi}`.toLowerCase().includes(topic.toLowerCase()),
    );
    if (opts.sinceHours) {
      const cutoff = Date.now() - opts.sinceHours * 3600 * 1000;
      return q.filter((a) => new Date(a.published_at || '').getTime() >= cutoff).slice(0, limit);
    }
    return q.slice(0, limit);
  }

  let q = c.from('articles').select('*').eq('status', 'published').order('published_at', { ascending: false }).limit(limit);

  // match in title/summary/content (case-insensitive)
  const safe = topic.replace(/%/g, '\\%').replace(/'/g, "''");
  const orExpr = `translated_title.ilike.%${safe}%,summary_vi.ilike.%${safe}%,content_vi.ilike.%${safe}%`;
  q = q.or(orExpr);

  if (opts.sinceHours) {
    const cutoff = new Date(Date.now() - opts.sinceHours * 3600 * 1000).toISOString();
    q = q.gte('published_at', cutoff);
  }

  const { data, error } = await q;
  return error ? [] : (data as Article[]);
}

export function getFixtureSlug(f: Fixture): string {
  const datePart = Number.isNaN(new Date(f.match_time).getTime())
    ? ''
    : new Date(f.match_time).toISOString().slice(0, 10);
  const parts = [f.home_team, f.away_team, f.competition, datePart].filter(Boolean).map((part) => slugify(part));
  return parts.join('-').replace(/-+/g, '-');
}

export async function getFixtureById(id: string): Promise<Fixture | null> {
  const c = client();
  if (!c) return demoFixtures.find((f) => f.id === id) || null;
  const { data } = await c.from('fixtures').select('*').eq('id', id).maybeSingle();
  return (data as Fixture) || null;
}

export async function getFixtureBySlugOrId(value: string): Promise<Fixture | null> {
  const byId = await getFixtureById(value);
  if (byId) return byId;

  const fixtures = await getFixtures();
  return fixtures.find((f) => getFixtureSlug(f) === value) || null;
}

export async function getUpcomingFixture(): Promise<Fixture | null> {
  const fixtures = await getFixtures();
  const now = Date.now();
  const upcoming = fixtures
    .filter((f) => new Date(f.match_time).getTime() >= now)
    .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime());
  return upcoming[0] || null;
}

/** Trận đấu đang diễn ra (status = 'live') — dùng cho Live Match Center trên trang chủ. */
export async function getLiveFixture(): Promise<Fixture | null> {
  const c = client();
  if (!c) return demoFixtures.find((f) => f.status === 'live') || null;
  const { data } = await c.from('fixtures').select('*').eq('status', 'live').order('match_time').limit(1).maybeSingle();
  return (data as Fixture) || null;
}

/** Danh sách bình luận công khai của 1 bài viết, mới nhất trước. */
export async function getComments(articleId: string): Promise<import('./types').Comment[]> {
  const c = client();
  if (!c) return [];
  const { data } = await c
    .from('comments')
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: false })
    .limit(200);
  return (data || []) as import('./types').Comment[];
}

export async function getPlayers(): Promise<Player[]> {
  const c = client();
  if (!c) return demoPlayers;
  const { data } = await c.from('players').select('*').eq('is_active', true).order('shirt_number');
  return (data || []) as Player[];
}

/** Lấy 1 cầu thủ theo id hoặc slug — dùng cho trang hồ sơ cầu thủ (/doi-hinh/[id]). */
export async function getPlayer(idOrSlug: string): Promise<Player | null> {
  const c = client();
  if (!c) return demoPlayers.find((p) => p.id === idOrSlug || p.slug === idOrSlug) || null;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(idOrSlug);
  const { data } = await c
    .from('players')
    .select('*')
    .eq(isUuid ? 'id' : 'slug', idOrSlug)
    .maybeSingle();
  return (data as Player) || null;
}

export type LineupSlot = { id: string; label: string; x: number; y: number; player: Player | null };

async function resolveLineupSlots(
  c: NonNullable<ReturnType<typeof client>>,
  config: { formation: string; assignments: Record<string, string | null>; source?: 'auto' | 'manual'; syncedAt?: string }
): Promise<{ formation: string; slots: LineupSlot[]; source: 'auto' | 'manual'; syncedAt: string | null }> {
  const { getFormationSlots } = await import('./formations');
  const slots = getFormationSlots(config.formation);

  const playerIds = Object.values(config.assignments || {}).filter(Boolean) as string[];
  const { data: players } = playerIds.length
    ? await c.from('players').select('*').in('id', playerIds)
    : { data: [] as Player[] };
  const byId = new Map((players || []).map((p) => [p.id, p as Player]));

  return {
    formation: config.formation,
    slots: slots.map((slot) => ({ ...slot, player: byId.get(config.assignments?.[slot.id] || '') || null })),
    source: config.source || 'manual',
    syncedAt: config.syncedAt || null,
  };
}

/** Đội hình "hiện tại" dùng chung cho trang chủ/trang Đội hình (site_settings.starting_lineup). */
export async function getStartingLineup(): Promise<{
  formation: string;
  slots: LineupSlot[];
  source: 'auto' | 'manual';
  syncedAt: string | null;
} | null> {
  const c = client();
  if (!c) return null;

  const { data: setting } = await c
    .from('site_settings')
    .select('setting_value')
    .eq('setting_key', 'starting_lineup')
    .maybeSingle();
  if (!setting?.setting_value) return null;

  return resolveLineupSlots(c, setting.setting_value);
}

/** Đội hình gắn với MỘT trận cụ thể (fixtures.lineup) — dùng cho trang "Chi tiết trận đấu". */
export async function getFixtureLineup(fixture: Fixture): Promise<{
  formation: string;
  slots: LineupSlot[];
  source: 'auto' | 'manual';
  syncedAt: string | null;
} | null> {
  const c = client();
  if (!c || !fixture.lineup?.formation) return null;
  return resolveLineupSlots(c, fixture.lineup);
}

export type StandingRow = {
  rank: number;
  team: string;
  badge: string | null;
  played: number;
  win: number;
  draw: number;
  loss: number;
  gf: number;
  ga: number;
  gd: number;
  points: number;
  form: string | null;
};

export async function getStandings(): Promise<{ season: string; table: StandingRow[] } | null> {
  const c = client();
  if (!c) return null;

  const { data } = await c.from('site_settings').select('setting_value').eq('setting_key', 'la_liga_standings').maybeSingle();
  if (!data?.setting_value) return null;

  const raw = data.setting_value as { season: string; table: any[] };
  const table: StandingRow[] = (raw.table || [])
    .map((t) => ({
      rank: Number(t.intRank ?? t.rank ?? 0),
      team: t.strTeam ?? t.team ?? '',
      badge: t.strTeamBadge ?? t.badge ?? null,
      played: Number(t.intPlayed ?? 0),
      win: Number(t.intWin ?? 0),
      draw: Number(t.intDraw ?? 0),
      loss: Number(t.intLoss ?? 0),
      gf: Number(t.intGoalsFor ?? 0),
      ga: Number(t.intGoalsAgainst ?? 0),
      gd: Number(t.intGoalDifference ?? 0),
      points: Number(t.intPoints ?? 0),
      form: t.strForm ?? null,
    }))
    .sort((a, b) => a.rank - b.rank);

  return { season: raw.season, table };
}
