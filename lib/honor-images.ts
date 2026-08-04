import { createClient } from '@supabase/supabase-js';
import { parseHonors, serializeHonors } from './career';

/**
 * Tự động lấy ảnh minh hoạ (cúp/huy chương/giải thưởng thật) cho từng danh hiệu,
 * dựa trên ảnh đại diện (thumbnail) của bài viết Wikipedia tương ứng — cùng cách
 * dự án đang lấy ảnh cầu thủ ở `lib/wikipedia.ts`. Ảnh được THAM CHIẾU trực tiếp
 * tới URL trên Wikimedia (không tải về/lưu trữ lại), và luôn có phương án dự
 * phòng là icon SVG minh hoạ (`TrophyIcon`) nếu không tìm được ảnh phù hợp.
 */

const ONE_MONTH = 60 * 60 * 24 * 30;

// Ánh xạ các cách gọi danh hiệu phổ biến (tiếng Việt & tiếng Anh, viết tắt...)
// sang đúng tên bài viết Wikipedia có ảnh cúp/huy hiệu chính thức — tránh việc
// tìm kiếm chung chung ra nhầm bài viết không liên quan.
const ALIASES: [RegExp, string][] = [
  [/si[êe]u c[úu]p t[âa]y ban nha|supercopa de espa[nñ]a/i, 'Supercopa de España'],
  [/si[êe]u c[úu]p ch[âa]u [âa]u|uefa super cup/i, 'UEFA Super Cup'],
  [/c[úu]p nh[agrave] vua|king'?s cup/i, 'Copa del Rey'],
  [/copa del rey|c[úu]p qu[ốô]c gia t[âa]y ban nha|spanish cup/i, 'Copa del Rey'],
  [/la liga|giải vô địch quốc gia t[âa]y ban nha|vô địch t[âa]y ban nha/i, 'La Liga'],
  [/champions league|cúp c1|cúp ch[acirc]u [âa]u|c[úu]p vô địch ch[acirc]u [âa]u/i, 'UEFA Champions League'],
  [/europa league|cúp c2|cúp ch[au] [Ââ]u|c[úu]p ch[âa]u [âa]u/i, 'UEFA Europa League'],
  [/conference league|cúp c3|cúp c[ocirc]ng [đ?i] [l?u]u/i, 'UEFA Europa Conference League'],
  [/club world cup|cúp thế giới câu lạc bộ|cúp câu lạc bộ thế giới/i, 'FIFA Club World Cup'],
  [/intercontinental cup|cúp liên lục địa/i, 'FIFA Intercontinental Cup (2024–present)'],
  [/u-?20 world cup|giải vô địch thế giới u-?20/i, 'FIFA U-20 World Cup'],
  [/u-?17 world cup|giải vô địch thế giới u-?17/i, 'FIFA U-17 World Cup'],
  [/\bworld cup\b|cúp thế giới|giải vô địch thế giới/i, 'FIFA World Cup'],
  [/\beuro\b|giai vo dich chau au|giải vô địch ch[âa]u [âa]u/i, 'UEFA European Championship'],
  [/olympic|olympics|th[êe] v[ậa]n h[ộo]i/i, 'Football at the Summer Olympics'],
  [/nations league|giải vô địch các quốc gia|cúp các quốc gia/i, 'UEFA Nations League'],
  [/copa am[ée]rica|copa america|cúp mỹ/i, 'Copa América'],
  [/ballon d.?or|qu[ảa] b[óo]ng v[àa]ng/i, "Ballon d'Or"],
  [/golden boy|cầu thủ trẻ xuất sắc nhất/i, 'Golden Boy (football award)'],
  [/golden glove|găng tay vàng/i, 'FIFA World Cup Golden Glove'],
  [/golden ball|quả bóng vàng thế giới/i, 'FIFA World Cup Golden Ball'],
  [/pichichi|vua phá lưới|cầu thủ ghi bàn nhiều nhất/i, 'Pichichi Trophy'],
  [/trofeo pichichi/i, 'Pichichi Trophy'],
  [/kopa trophy|trofeo kopa/i, 'Kopa Trophy'],
  [/bota de oro|golden shoe|giày vàng châu âu|qua bóng vàng châu âu|qua bong vang chau au|quả bóng vàng châu âu/i, 'European Golden Shoe'],
  [/fifa fifpro world xi|once mundial fifpro|đội hình fifpro của năm|đội hình fifa của năm/i, 'FIFPro World XI'],
  [/đội hình esm của năm/i, 'ESM Team of the Year'],
  [/đội hình thứ 2 fifa fifpro/i, 'FIFPro World XI'],
  [/đội hình fifpro của năm/i, 'FIFPro World XI'],
  [/vận động viên của năm của bỉ|vận động viên bỉ của năm/i, 'Belgian Sportsman of the Year'],
  [/cầu thủ bỉ xuất sắc nhất ở nước ngoài|thủ môn chuyên nghiệp người bỉ của năm/i, 'Belgian Professional Footballer of the Year'],
  [/thủ môn xuất sắc nhất của giải thưởng bóng đá london/i, 'London Football Awards'],
  [/cầu thủ xuất sắc nhất la liga/i, 'La Liga Player of the Season'],
  [/chi[eê]c gi[aà]y (v[aà]ng|đ[oô]ng) của b[iỉ]/i, 'Belgian Golden Shoe'],
  [/mejor jugador de la liga de francia/i, 'UNFP Ligue 1 Player of the Year'],
  [/under-19 european championship|cúp u-?19 ch[âa]u [âa]u|giải u-?19 ch[âa]u [âa]u/i, 'UEFA European Under-19 Championship'],
  [/french leagues?|giải vô địch pháp|ligue 1/i, 'Ligue 1'],
  [/french cups?|cúp pháp|coupe de france/i, 'Coupe de France'],
  [/french super cups?|troph[eé]e des champions|cúp siêu ph[uù]ng ph[áp]/i, 'Trophée des Champions'],
  [/french league cups?|coupe de la ligue|cúp liên đoàn pháp/i, 'Coupe de la Ligue'],
  [/cup lien doan anh|cúp liên đoàn anh/i, 'EFL Cup'],
  [/cup quoc gia phap|cúp quốc gia pháp/i, 'Coupe de France'],
  [/cup quoc gia anh|cúp quốc gia anh/i, 'FA Cup'],
  [/doi hinh tieu bieu|doi hinh team of the season|doi hinh xuat sac|doi hinh xuat sac nhat/i, 'FIFPro World XI'],
  [/cau thu tre xuat sac nhat|cau thu tre xuat sac nhat/i, 'Golden Boy (football award)'],
  [/cau thu xuat sac nhat thang/i, 'Player of the Month'],
  [/cau thu xuat sac nhat.*champions league|doi hinh xuat sac nhat.*champions league/i, 'UEFA Champions League'],
  [/cau thu xuat sac nhat mua giai.*champions league|cau thu xuat sac nhat.*uefa champions league/i, 'UEFA Champions League'],
  [/doi hinh tieu bieu.*champions league|doi hinh xuat sac nhat.*champions league/i, 'UEFA Champions League'],
  [/doi hinh tieu bieu.*uefa european championship|doi hinh tieu bieu.*european championship|doi hinh.*uefa european championship/i, 'UEFA European Championship'],
  [/cau thu xuat sac nhat.*european championship|cau thu xuat sac nhat.*uefa european championship/i, 'UEFA European Championship'],
  [/ban thang dep nhat thang|goal of the month/i, 'Premier League Goal of the Month'],
  [/cau thu xuat sac nhat.*vong chung ket.*nations league|cau thu xuat sac nhat.*nations league/i, 'UEFA Nations League'],
  [/^la liga$|la liga\b/i, 'La Liga'],
  [/premier league|giải ngoại hạng anh/i, 'Premier League'],
  [/bundesliga|giải vô địch đức/i, 'Bundesliga'],
  [/serie a\b|giải vô địch ý/i, 'Serie A'],
  [/ligue 1|giải vô địch pháp/i, 'Ligue 1'],
];

const KNOWN_HONOR_WIKI_TITLES: Record<string, string> = {
  'fifa club world cups': 'FIFA Club World Cup',
  'european super cups': 'UEFA Super Cup',
  'national teams world cup': 'FIFA World Cup',
  'nations league': 'UEFA Nations League',
  'french leagues': 'Ligue 1',
  'french cups': 'Coupe de France',
  'french super cups': 'Trophée des Champions',
  'under-19 european championship': 'UEFA European Under-19 Championship',
  'french league cups': 'Coupe de la Ligue',
  'once mundial fifpro': 'FIFPro World XI',
  'fifa fifpro world xi': 'FIFPro World XI',
  'bota de oro': 'European Golden Shoe',
  'european golden shoe': 'European Golden Shoe',
  'trofeo pichichi': 'Pichichi Trophy',
  'pichichi trophy': 'Pichichi Trophy',
  'trofeo kopa': 'Kopa Trophy',
  'golden boy': 'Golden Boy (football award)',
  "ballon d'or": "Ballon d'Or",
  'la liga': 'La Liga',
  'uefa champions league': 'UEFA Champions League',
  'uefa europa league': 'UEFA Europa League',
  'uefa europa conference league': 'UEFA Europa Conference League',
  'fifa club world cup': 'FIFA Club World Cup',
  'fifa intercontinental cup (2024–present)': 'FIFA Intercontinental Cup',
  'fifa world cup': 'FIFA World Cup',
  'uefa european championship': 'UEFA European Championship',
  'copa américa': 'Copa América',
  'copa america': 'Copa América',
  'fa community shield': 'FA Community Shield',
  'premier league': 'Premier League',
  'bundesliga': 'Bundesliga',
  'serie a': 'Serie A',
  'ligue 1': 'Ligue 1',
  'fifpro world xi': 'FIFPro World XI',
  'unfp ligue 1 player of the year': 'UNFP Ligue 1 Player of the Year',
};

const KNOWN_HONOR_IMAGE_URLS: Record<string, string> = {
  'fa community shield': 'https://upload.wikimedia.org/wikipedia/commons/thumb/b/bb/FA_Community_Shield.JPG/330px-FA_Community_Shield.JPG',
};

function normalizeHonorTitle(title: string): string {
  return title
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function resolveQuery(title: string): string {
  const normalizedTitle = normalizeHonorTitle(title);
  for (const [re, q] of ALIASES) {
    if (re.test(title) || re.test(normalizedTitle)) return q;
  }
  return title;
}

function getKnownHonorImageUrl(title: string): string | null {
  const normalizedTitle = normalizeHonorTitle(title);
  if (KNOWN_HONOR_IMAGE_URLS[normalizedTitle]) return KNOWN_HONOR_IMAGE_URLS[normalizedTitle];

  const query = resolveQuery(title);
  const normalizedQuery = normalizeHonorTitle(query);
  if (KNOWN_HONOR_IMAGE_URLS[normalizedQuery]) return KNOWN_HONOR_IMAGE_URLS[normalizedQuery];

  return null;
}

async function getKnownHonorWikiImage(title: string): Promise<string | null> {
  const normalizedTitle = normalizeHonorTitle(title);
  const wikiTitle = KNOWN_HONOR_WIKI_TITLES[normalizedTitle] || KNOWN_HONOR_WIKI_TITLES[normalizeHonorTitle(resolveQuery(title))];
  if (!wikiTitle) return null;

  const image = extractWikiImage(await wikiSummary('en', wikiTitle));
  if (image) return image;
  return extractWikiImage(await wikiSummary('vi', wikiTitle));
}

function isCountryFlagSummary(summary: any): boolean {
  if (!summary) return false;
  const title = String(summary.title || '').toLowerCase();
  const description = String(summary.description || '').toLowerCase();
  const imageUrl = String(summary?.thumbnail?.source || summary?.originalimage?.source || '').toLowerCase();

  if (imageUrl.includes('/flag_of_') || imageUrl.includes('/flags/') || imageUrl.includes('flag-') || imageUrl.includes('flag_')) {
    return true;
  }
  if (description.includes('country') || description.includes('nation') || description.includes('state') || description.includes('territory')) {
    return true;
  }
  if (title.includes('national football team') || title.includes('football team') || title.includes('national team')) {
    return true;
  }
  if (title && ['vietnam', 'viet nam', 'belgium', 'bi', 'france', 'phap', 'england', 'anh', 'spain', 'tay ban nha', 'portugal', 'bo dao nha', 'germany', 'duc', 'italy', 'y'].includes(title)) {
    return true;
  }
  return false;
}

async function wikiSummary(lang: string, title: string): Promise<any | null> {
  try {
    const init = { next: { revalidate: ONE_MONTH } } as RequestInit & { next?: { revalidate: number } };
    const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, init);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

function extractWikiImage(summary: any): string | null {
  if (!summary) return null;
  if (isCountryFlagSummary(summary)) return null;
  return summary?.originalimage?.source || summary?.thumbnail?.source || null;
}

async function wikiSearchTitle(lang: string, q: string): Promise<string | null> {
  try {
    const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
    url.searchParams.set('action', 'query');
    url.searchParams.set('list', 'search');
    url.searchParams.set('srsearch', q);
    url.searchParams.set('srlimit', '5');
    url.searchParams.set('format', 'json');
    url.searchParams.set('origin', '*');
    const init = { next: { revalidate: ONE_MONTH } } as RequestInit & { next?: { revalidate: number } };
    const res = await fetch(url.toString(), init);
    if (!res.ok) return null;
    const json = await res.json();
    const hits = json?.query?.search || [];
    for (const hit of hits) {
      const title = hit?.title;
      if (!title) continue;
      const summary = await wikiSummary(lang, title);
      if (!summary) continue;
      if (isCountryFlagSummary(summary)) continue;
      const image = extractWikiImage(summary);
      if (image) return title;
    }
    return null;
  } catch {
    return null;
  }
}

/**
 * Trả về URL ảnh cho 1 danh hiệu, hoặc `null` nếu không tìm được — lúc đó nơi
 * gọi nên hiển thị icon SVG minh hoạ (`TrophyIcon`) thay thế.
 */
export async function fetchHonorImage(title: string): Promise<string | null> {
  if (!title?.trim()) return null;

  const knownUrl = getKnownHonorImageUrl(title);
  if (knownUrl) return knownUrl;

  const knownWikiImage = await getKnownHonorWikiImage(title);
  if (knownWikiImage) return knownWikiImage;

  const candidates = Array.from(
    new Set([
      resolveQuery(title),
      title.trim(),
    ])
  ).filter(Boolean);

  const langs = ['en', 'vi'];
  for (const lang of langs) {
    for (const query of candidates) {
      let summary = await wikiSummary(lang, query);
      const image = extractWikiImage(summary);
      if (image) return image;

      const found = await wikiSearchTitle(lang, query);
      if (found && found.toLowerCase() !== query.toLowerCase()) {
        summary = await wikiSummary(lang, found);
        const foundImage = extractWikiImage(summary);
        if (foundImage) return foundImage;
      }
    }
  }

  return null;
}

/**
 * Lấy ảnh cho nhiều danh hiệu song song, gộp theo tên (không tên trùng) để
 * giảm số lượt gọi khi cùng 1 danh hiệu xuất hiện ở nhiều cầu thủ khác nhau.
 */
export async function fetchHonorImages(titles: string[]): Promise<Record<string, string | null>> {
  const unique = Array.from(new Set(titles.map((t) => t.trim()).filter(Boolean)));
  const results = await Promise.all(
    unique.map(async (t) => {
      try {
        return [t, await fetchHonorImage(t)] as const;
      } catch {
        return [t, null] as const;
      }
    })
  );
  return Object.fromEntries(results);
}

export async function fillMissingHonorImages(): Promise<{ playersChecked: number; honorsChecked: number; honorsUpdated: number; playersUpdated: number }> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error('Missing Supabase environment variables.');
  }
  const db = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

  const { data: players } = await db.from('players').select('id, honors');
  if (!players) {
    return { playersChecked: 0, honorsChecked: 0, honorsUpdated: 0, playersUpdated: 0 };
  }

  let honorsChecked = 0;
  let honorsUpdated = 0;
  let playersUpdated = 0;

  const updates: Array<{ id: string; honors: string }> = [];

  for (const player of players) {
    if (!player.honors) continue;
    const parsed = parseHonors(player.honors);
    const missing = parsed.filter((h) => !h.image_url?.trim());
    if (!missing.length) continue;

    const fetched = await fetchHonorImages(missing.map((h) => h.title));
    let changed = false;
    honorsChecked += missing.length;

    const nextHonors = parsed.map((h) => {
      if (h.image_url?.trim()) return h;
      const url = fetched[h.title.trim()];
      if (url) {
        honorsUpdated += 1;
        changed = true;
        return { ...h, image_url: url };
      }
      return h;
    });

    if (changed) {
      updates.push({ id: player.id, honors: serializeHonors(nextHonors) });
    }
  }

  for (const update of updates) {
    const { error } = await db.from('players').update({ honors: update.honors }).eq('id', update.id);
    if (!error) playersUpdated += 1;
  }

  return {
    playersChecked: players.length,
    honorsChecked,
    honorsUpdated,
    playersUpdated,
  };
}
