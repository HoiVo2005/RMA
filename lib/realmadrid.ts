import * as cheerio from 'cheerio';

const SQUAD_URL = 'https://www.realmadrid.com/en-US/football/first-team/players';
const PLAYER_URL_PREFIX = 'https://www.realmadrid.com/en-US/football/first-team/players/';
const UA = 'Mozilla/5.0 (compatible; MadridistaNewsVNBot/1.0; +https://madridista-news-vn.example/bot)';
const SQUAD_SLUGS_TTL = 1000 * 60 * 5;

let squadSlugsCache: { slugs: string[]; expiresAt: number } | null = null;

async function getCachedSquadSlugs(): Promise<string[]> {
  if (!squadSlugsCache || Date.now() > squadSlugsCache.expiresAt) {
    squadSlugsCache = {
      slugs: await fetchSquadSlugs(),
      expiresAt: Date.now() + SQUAD_SLUGS_TTL,
    };
  }
  return squadSlugsCache.slugs;
}

function normalize(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // bỏ dấu
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, '')
    .trim();
}

async function fetchHtml(url: string): Promise<string> {
  const res = await fetch(url, {
    headers: { 'user-agent': UA, accept: 'text/html' },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Không tải được trang realmadrid.com (HTTP ${res.status})`);
  return res.text();
}

/** Lấy danh sách slug của toàn bộ đội hình hiện tại (cầu thủ + HLV) từ trang danh sách đội hình. */
async function fetchSquadSlugs(): Promise<string[]> {
  const html = await fetchHtml(SQUAD_URL);
  const $ = cheerio.load(html);
  const slugs = new Set<string>();
  $(`a[href^="${PLAYER_URL_PREFIX}"], a[href*="/football/first-team/players/"]`).each((_, el) => {
    const href = $(el).attr('href') || '';
    const clean = href.split('?')[0].replace(/\/$/, '');
    const slug = clean.split('/').filter(Boolean).pop();
    if (slug && slug.length > 1) slugs.add(slug);
  });
  return [...slugs];
}

/**
 * Chọn slug khớp nhất với tên cầu thủ được nhập, dựa trên số từ trùng khớp
 * giữa tên và slug (vd. slug là tên đầy đủ dạng "vinicius-paixao-de-oliveira-junior"
 * nên không thể đoán trực tiếp từ tên thường gọi "Vinicius Junior").
 */
function bestMatchingSlug(name: string, slugs: string[]): string | null {
  const queryTokens = normalize(name).split(/\s+/).filter((t) => t.length > 1);
  if (!queryTokens.length) return null;

  let best: { slug: string; score: number } | null = null;
  for (const slug of slugs) {
    const slugTokens = slug.split('-').filter(Boolean);
    let score = 0;
    for (const qt of queryTokens) {
      if (slugTokens.some((st) => st === qt || st.startsWith(qt) || qt.startsWith(st))) score++;
    }
    if (score > 0 && (!best || score > best.score)) {
      best = { slug, score };
    }
  }
  return best?.slug || null;
}

/**
 * Lấy ảnh thi đấu mới nhất của cầu thủ tại Real Madrid, trực tiếp từ trang chủ
 * chính thức realmadrid.com (không phải ảnh Wikipedia). Tìm cầu thủ bằng cách
 * đối chiếu với danh sách đội hình hiện tại (không đoán slug trực tiếp từ tên,
 * vì realmadrid.com dùng tên đầy đủ trong URL — vd. "Vini Jr." có slug
 * "vinicius-paixao-de-oliveira-junior").
 */
export async function fetchRealMadridPlayerImage(
  name: string
): Promise<{ image_url: string; profile_url: string } | null> {
  const slugs = await getCachedSquadSlugs();
  const slug = bestMatchingSlug(name, slugs);
  if (!slug) return null; // không có trong đội hình hiện tại (đã rời CLB, cầu thủ trẻ...)

  const profileUrl = `${PLAYER_URL_PREFIX}${slug}`;
  const html = await fetchHtml(profileUrl);
  const $ = cheerio.load(html);

  // Ảnh thi đấu (hero image) là ảnh đầu tiên trong trang thuộc thư viện ảnh
  // "/is/image/realmadrid/" — nằm trước phần thông tin cá nhân/danh hiệu.
  let imageUrl: string | null = null;
  $('img').each((_, el) => {
    if (imageUrl) return;
    const src = $(el).attr('src') || '';
    if (src.includes('assets.realmadrid.com/is/image/realmadrid/')) {
      imageUrl = src;
    }
  });
  if (!imageUrl) return null;

  // Tăng độ phân giải ảnh (mặc định trang chủ chỉ nhúng ảnh nhỏ ~420px).
  const highRes = (imageUrl as string).replace(/([?&])wid=\d+/, '$1wid=800').replace(/([?&])hei=\d+/, '$1hei=1000');

  return { image_url: highRes, profile_url: profileUrl };
}
