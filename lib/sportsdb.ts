import { createSupabaseAdmin } from './supabase';
import { slugify } from './slug';
import { mapRawEventsToFixtureEvents, type RawMatchEvent } from './football-events';
import {
  fetchApiFootballEvents,
  isApiFootballConfigured,
  fetchTeamBadgeUrl as fetchApiFootballTeamBadgeUrl,
} from './apifootball';
import { fetchPlayerImageUrl } from './wikipedia';

// TheSportsDB — cơ sở dữ liệu thể thao mở, có API JSON miễn phí.
// Mặc định dùng key test công khai "123" (giới hạn thấp) và ID của Real Madrid (133738).
// Nên đăng ký tài khoản miễn phí tại thesportsdb.com để có key riêng, ổn định hơn.
function apiKey() {
  return process.env.THESPORTSDB_API_KEY || '123';
}
function teamId() {
  return process.env.THESPORTSDB_TEAM_ID || '133738'; // Real Madrid
}
const ONE_MONTH = 60 * 60 * 24 * 30;

function base() {
  return `https://www.thesportsdb.com/api/v1/json/${apiKey()}`;
}

const NATIONALITY_VI: Record<string, string> = {
  Spain: 'Tây Ban Nha',
  France: 'Pháp',
  England: 'Anh',
  Germany: 'Đức',
  Brazil: 'Brazil',
  Belgium: 'Bỉ',
  Croatia: 'Croatia',
  Uruguay: 'Uruguay',
  Argentina: 'Argentina',
  Austria: 'Áo',
  Portugal: 'Bồ Đào Nha',
  Netherlands: 'Hà Lan',
  'The Netherlands': 'Hà Lan',
  Italy: 'Ý',
  Ukraine: 'Ukraine',
  Serbia: 'Serbia',
  Morocco: 'Ma-rốc',
  Turkey: 'Thổ Nhĩ Kỳ',
  Colombia: 'Colombia',
  'Dominican Republic': 'Cộng hòa Dominica',
};

function toVietnameseCountry(name: string | null | undefined) {
  if (!name) return null;
  return NATIONALITY_VI[name] || name;
}

function mapPosition(raw: string | null | undefined): string {
  const s = (raw || '').toLowerCase();
  if (s.includes('goalkeeper')) return 'Thủ môn';
  if (s.includes('back') || s.includes('defen')) return 'Hậu vệ';
  if (s.includes('midfield')) return 'Tiền vệ';
  if (s.includes('forward') || s.includes('winger') || s.includes('striker')) return 'Tiền đạo';
  return 'Tiền vệ';
}

function isCoachingStaff(position: string | null | undefined, status: string | null | undefined) {
  const p = (position || '').toLowerCase();
  if (/coach|manager|president|director|staff/.test(p)) return true;
  if (status && status !== 'Active') return true;
  return false;
}

async function mapWithConcurrency<T, R>(items: T[], mapper: (item: T) => Promise<R>, concurrency = 5): Promise<R[]> {
  const results: R[] = [] as any;
  let nextIndex = 0;
  const workers = Array.from({ length: Math.min(concurrency, items.length) }, async () => {
    while (nextIndex < items.length) {
      const currentIndex = nextIndex++;
      results[currentIndex] = await mapper(items[currentIndex]);
    }
  });
  await Promise.all(workers);
  return results;
}

export type SyncResult = { fetched: number; upserted: number; eventsFilled?: number; apiFootballConfigured?: boolean; errors?: string[] };

/** Đồng bộ toàn bộ danh sách cầu thủ hiện tại từ TheSportsDB vào bảng players. */
export async function syncSquadFromTheSportsDB(): Promise<SyncResult> {
  const res = await fetch(`${base()}/lookup_all_players.php?id=${teamId()}`, { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`TheSportsDB lỗi HTTP ${res.status}`);
  const json = await res.json();
  const players: any[] = json.player || [];

  const db = createSupabaseAdmin();
  const errors: string[] = [];

  const payloads = players
    .filter((p) => !isCoachingStaff(p.strPosition, p.strStatus))
    .map((p) => {
      const name = p.strPlayer;
      if (!name) return null;
      return {
        name,
        slug: slugify(name),
        shirt_number: p.strNumber ? parseInt(p.strNumber, 10) || null : null,
        position: mapPosition(p.strPosition),
        nationality: toVietnameseCountry(p.strNationality),
        image_url: p.strCutout || p.strThumb || p.strRender || null,
        date_of_birth: p.dateBorn || null,
        is_active: true,
      };
    })
    .filter((p): p is { name: string; slug: string; shirt_number: number | null; position: string; nationality: string | null; image_url: string | null; date_of_birth: string | null; is_active: boolean } => Boolean(p));

  const missingImagePayloads = payloads.filter((p) => !p.image_url);
  const images = await mapWithConcurrency(missingImagePayloads, async (payload) => {
    try {
      return await fetchPlayerImageUrl(payload.name);
    } catch {
      return null;
    }
  }, 3);
  images.forEach((image, idx) => {
    if (image) missingImagePayloads[idx].image_url = image;
  });

  let upserted = 0;
  const { error } = await db.from('players').upsert(payloads, { onConflict: 'slug' });
  if (!error) {
    upserted = payloads.length;
  } else {
    errors.push(error.message);
  }

  return { fetched: players.length, upserted, errors: errors.length ? errors : undefined };
}

function toIsoDate(ev: any): string {
  if (ev.strTimestamp) return new Date(ev.strTimestamp.replace(' ', 'T') + 'Z').toISOString();
  const time = ev.strTime && ev.strTime !== '00:00:00' ? ev.strTime : '00:00:00';
  return new Date(`${ev.dateEvent}T${time}Z`).toISOString();
}

function toStatus(ev: any): string {
  const s = (ev.strStatus || '').toLowerCase();
  if (s.includes('postpon')) return 'postponed';
  if (s.includes('cancel')) return 'postponed';
  if (ev.intHomeScore !== null && ev.intHomeScore !== undefined) return 'finished';
  return 'scheduled';
}

/** Chuẩn hoá tên giải đấu từ TheSportsDB về 1 trong các nhãn dùng trên trang. */
function normalizeCompetition(strLeague: string | null | undefined): string {
  const s = (strLeague || '').toLowerCase();
  if (s.includes('champions league')) return 'UEFA Champions League';
  if (s.includes('copa del rey')) return 'Copa del Rey';
  if (s.includes('super cup') || s.includes('supercopa')) return 'Giao hữu';
  if (s.includes('friendly') || s.includes('club friendlies')) return 'Giao hữu';
  if (s.includes('la liga') || s.includes('primera') || s.includes('laliga')) return 'La Liga';
  return strLeague || 'La Liga';
}

type SportsDbTimelineItem = {
  strTimeline: string; // "Goal" | "Card" | "subst" | ...
  strTimelineDetail: string | null; // "Penalty"/"Own Goal" cho bàn thắng, "Yellow Card"/"Red Card" cho thẻ, tên cầu thủ vào sân cho "subst"
  strHome: 'Yes' | 'No';
  strPlayer: string | null;
  strAssist: string | null;
  intTime: string | null;
};

/** Tra "timeline" (diễn biến) của 1 trận từ TheSportsDB — trả về mảng thô, lỗi thì trả []. */
async function fetchEventTimeline(idEvent: string): Promise<SportsDbTimelineItem[]> {
  try {
    const res = await fetch(`${base()}/lookuptimeline.php?id=${idEvent}`, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) return [];
    const json = await res.json();
    return json.timeline || [];
  } catch {
    return [];
  }
}

/** Map timeline thô của TheSportsDB sang FixtureEvent dùng trong admin (Diễn biến trận đấu). */
function mapTimelineToEvents(timeline: SportsDbTimelineItem[]) {
  const raw: RawMatchEvent[] = timeline.map((t) => {
    const kind = (t.strTimeline || '').toLowerCase();
    return {
      minute: t.intTime || '',
      team: t.strHome === 'Yes' ? 'home' : 'away',
      kind: kind === 'card' ? 'card' : kind === 'subst' ? 'subst' : 'goal',
      detail: t.strTimelineDetail,
      player: t.strPlayer,
      // strAssist với "subst" chứa TÊN ĐẦY ĐỦ cầu thủ vào sân; strTimelineDetail chỉ là tên ngắn.
      incomingPlayer: t.strAssist,
      assist: t.strAssist,
    };
  });
  // Chỉ giữ lại các dòng đúng loại (goal/card/subst) — lọc bỏ các strTimeline khác không hỗ trợ.
  const supported = raw.filter((_, i) => ['goal', 'card', 'subst'].includes((timeline[i].strTimeline || '').toLowerCase()));
  return mapRawEventsToFixtureEvents(supported);
}

/** Đồng bộ các trận gần nhất + sắp tới từ TheSportsDB vào bảng fixtures. */
export async function syncFixturesFromTheSportsDB(): Promise<SyncResult> {
  const [nextRes, lastRes] = await Promise.all([
    fetch(`${base()}/eventsnext.php?id=${teamId()}`, { signal: AbortSignal.timeout(15000) }),
    fetch(`${base()}/eventslast.php?id=${teamId()}`, { signal: AbortSignal.timeout(15000) }),
  ]);
  const nextJson = nextRes.ok ? await nextRes.json() : {};
  const lastJson = lastRes.ok ? await lastRes.json() : {};
  const events: any[] = [...(nextJson.events || []), ...(lastJson.results || lastJson.events || [])];

  const db = createSupabaseAdmin();
  let upserted = 0;
  const errors: string[] = [];

  // Chỉ những trận đã có sẵn trong DB mà CHƯA có diễn biến (chưa nhập tay) mới được tự động điền,
  // để không ghi đè lên dữ liệu admin đã nhập thủ công. Giới hạn số lần gọi timeline mỗi lần đồng bộ
  // để tránh vượt hạn mức của gói miễn phí TheSportsDB.
  const { data: existingRows } = await db.from('fixtures').select('external_id, events').not('external_id', 'is', null);
  const hasEventsByExtId = new Map<string, boolean>();
  for (const r of existingRows || []) {
    hasEventsByExtId.set(r.external_id as string, Array.isArray(r.events) && r.events.length > 0);
  }
  const MAX_TIMELINE_FETCHES = 5;
  let timelineFetches = 0;
  let eventsFilled = 0;

  const payloads: Record<string, any>[] = [];

  for (const ev of events) {
    if (!ev.strHomeTeam || !ev.strAwayTeam || !ev.dateEvent) continue;
    const status = toStatus(ev);
    const externalId = String(ev.idEvent);
    const payload: Record<string, any> = {
      external_id: externalId,
      competition: normalizeCompetition(ev.strLeague),
      home_team: ev.strHomeTeam,
      away_team: ev.strAwayTeam,
      home_logo_url: ev.strHomeTeamBadge || null,
      away_logo_url: ev.strAwayTeamBadge || null,
      stadium: ev.strVenue || null,
      match_time: toIsoDate(ev),
      status,
      home_score: ev.intHomeScore !== null && ev.intHomeScore !== undefined ? parseInt(ev.intHomeScore, 10) : null,
      away_score: ev.intAwayScore !== null && ev.intAwayScore !== undefined ? parseInt(ev.intAwayScore, 10) : null,
    };

    // Trận đã kết thúc + chưa có diễn biến nào trong DB → thử tự tra ai ghi bàn (và thẻ, thay người).
    // Ưu tiên API-Football (nếu đã cấu hình key — trả dữ liệu THẬT theo từng trận), TheSportsDB là
    // phương án dự phòng (key miễn phí đôi khi trả dữ liệu mẫu, đã được lọc bớt tên giả). Best-effort:
    // lỗi/không có dữ liệu thì bỏ qua, không chặn phần cập nhật tỷ số.
    if (status === 'finished' && !hasEventsByExtId.get(externalId) && timelineFetches < MAX_TIMELINE_FETCHES) {
      timelineFetches++;
      const mapped = (await fetchApiFootballEvents(payload.match_time)) ?? mapTimelineToEvents(await fetchEventTimeline(externalId));
      if (mapped && mapped.length) {
        payload.events = mapped;
        eventsFilled++;
      }
    }

    payloads.push(payload);
  }

  if (payloads.length > 0) {
    const { error } = await db.from('fixtures').upsert(payloads, { onConflict: 'external_id' });
    if (!error) {
      upserted = payloads.length;
    } else if (errors.length < 3) {
      errors.push(error.message);
    }
  }

  return {
    fetched: events.length,
    upserted,
    eventsFilled,
    apiFootballConfigured: isApiFootballConfigured(),
    errors: errors.length ? errors : undefined,
  };
}

const TEAM_NAME_OVERRIDES_RAW: Record<string, string> = {
  // Các đội tuyển quốc gia tiếng Việt / tên rút gọn
  'bỉ': 'Belgium',
  'pháp': 'France',
  'anh': 'England',
  'đức': 'Germany',
  'tây ban nha': 'Spain',
  'bồ đào nha': 'Portugal',
  'ý': 'Italy',
  'hà lan': 'Netherlands',
  'thụy sĩ': 'Switzerland',
  'thụy điển': 'Sweden',
  'na uy': 'Norway',
  'đan mạch': 'Denmark',
  'cộng hòa ireland': 'Republic of Ireland',
  'maroc': 'Morocco',
  'ma-rốc': 'Morocco',
  'mỹ': 'United States',
  'hoa kỳ': 'United States',
  'việt nam': 'Vietnam',
  'nhật bản': 'Japan',
  'hàn quốc': 'South Korea',
  'trung quốc': 'China',
  'cộng hòa séc': 'Czech Republic',
  'sec': 'Czech Republic',

  // Đội tuyển trẻ
  'bỉ u17': 'Belgium U17',
  'bỉ u19': 'Belgium U19',
  'bỉ u20': 'Belgium U20',
  'bỉ u21': 'Belgium U21',
  'bỉ u23': 'Belgium U23',
  'pháp u17': 'France U17',
  'pháp u19': 'France U19',
  'pháp u20': 'France U20',
  'pháp u21': 'France U21',
  'pháp u23': 'France U23',
  'anh u15': 'England U15',
  'anh u16': 'England U16',
  'anh u17': 'England U17',
  'anh u18': 'England U18',
  'anh u19': 'England U19',
  'anh u20': 'England U20',
  'anh u21': 'England U21',
  'anh u23': 'England U23',
  'u15 anh': 'England U15',
  'u16 anh': 'England U16',
  'u17 anh': 'England U17',
  'u18 anh': 'England U18',
  'u19 anh': 'England U19',
  'u20 anh': 'England U20',
  'u21 anh': 'England U21',
  'u23 anh': 'England U23',
  'u-15 anh': 'England U15',
  'u-16 anh': 'England U16',
  'u-17 anh': 'England U17',
  'u-18 anh': 'England U18',
  'u-19 anh': 'England U19',
  'u-20 anh': 'England U20',
  'u-21 anh': 'England U21',
  'u-23 anh': 'England U23',

  // Tên CLB và biệt danh thường gặp
  'monaco ii': 'AS Monaco',
  'as monaco ii': 'AS Monaco',
  'paris saint germain muon': 'Paris Saint-Germain',
  'paris saint germain': 'Paris Saint-Germain',
  'psg': 'Paris Saint-Germain',
  'real madrid cf': 'Real Madrid',
  'real madrid': 'Real Madrid',
  'real madrid castilla': 'Real Madrid',
  'real madrid b': 'Real Madrid',
  'atletico madrid': 'Atlético Madrid',
  'athletico madrid': 'Atlético Madrid',
  'atletico madrid b': 'Atlético Madrid',
  'levante b': 'Levante',
  'villarreal b': 'Villarreal',
  'benfica b': 'Benfica',
  'barcelona b': 'Barcelona',
  'juventus next gen': 'Juventus',
  'inter milan': 'Inter Milan',
  'internazionale': 'Inter Milan',
  'psv': 'PSV Eindhoven',
  'psv eindhoven': 'PSV Eindhoven',
  'heerenveen': 'SC Heerenveen',
  'sparta rotterdam': 'Sparta Rotterdam',
  'spartaan': 'Sparta Rotterdam',
  'smitshoek': 'SV Smitshoek',
  'bvv barendrecht': 'BVV Barendrecht',
  'thổ nhĩ kỳ': 'Turkey',
  'thổ nhĩ kì': 'Turkey',
  'thổ nhĩ kỳ u17': 'Turkey U17',
  'thổ nhĩ kì u17': 'Turkey U17',
  'u17 thổ nhĩ kỳ': 'Turkey U17',
  'u17 thổ nhĩ kì': 'Turkey U17',
  'u-17 thổ nhĩ kỳ': 'Turkey U17',
  'u-17 thổ nhĩ kì': 'Turkey U17',
  'u15 anh': 'England U15',
  'u16 anh': 'England U16',
  'u-15 anh': 'England U15',
  'u-16 anh': 'England U16',
};

const TEAM_NAME_OVERRIDES: Record<string, string> = Object.fromEntries(
  Object.entries(TEAM_NAME_OVERRIDES_RAW).map(([key, value]) => [normalizeStringKey(key), value])
);

function stripNationalTeamAgeGroup(teamName: string): string {
  return teamName
    .replace(/\(.*?\)/g, '')
    .replace(/mượn/gi, '')
    .replace(/\b(?:u[-\s]?\d+|\d+[-\s]?u)\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function normalizeStringKey(value: string): string {
  return value
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\s+/g, ' ')
    .toLowerCase();
}

function translateVietnameseTeamName(teamName: string): string {
  const cleaned = normalizeStringKey(teamName.replace(/\(.*?\)/g, '').replace(/mượn/gi, ''));
  if (!cleaned) return teamName.trim();

  if (TEAM_NAME_OVERRIDES[cleaned]) return TEAM_NAME_OVERRIDES[cleaned];

  const agePrefix = cleaned.match(/^(?:u[-\s]?(\d+)|(\d+)[-\s]?u)\s+(.+)$/);
  const ageSuffix = !agePrefix && cleaned.match(/^(.+?)\s+(?:u[-\s]?(\d+)|(\d+)[-\s]?u)$/);

  let country = cleaned;
  let ageGroup: string | null = null;
  if (agePrefix) {
    ageGroup = agePrefix[1] || agePrefix[2] || null;
    country = agePrefix[3] || country;
  } else if (ageSuffix) {
    country = ageSuffix[1] || country;
    ageGroup = ageSuffix[2] || ageSuffix[3] || null;
  }

  country = country
    .replace(/\b(doi tuyen quoc gia|doi tuyen tre|doi tuyen|quoc gia|nuoc|cua)\b/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (country && TEAM_NAME_OVERRIDES[country]) {
    return ageGroup ? `${TEAM_NAME_OVERRIDES[country]} U${ageGroup}` : TEAM_NAME_OVERRIDES[country];
  }

  return teamName.trim();
}

function normalizeTeamNameForBadge(teamName: string): string {
  let normalized = translateVietnameseTeamName(teamName);
  if (!normalized) return normalized;

  normalized = normalized.replace(/\(.*?\)/g, '').replace(/mượn/gi, '').trim();
  normalized = normalized.replace(/u[-\s]?(\d+)/gi, 'U$1');
  normalized = normalized.replace(/\s+/g, ' ').trim();

  const key = normalizeStringKey(normalized);
  return TEAM_NAME_OVERRIDES[key] || normalized;
}

function buildTeamBadgeSearchCandidates(teamName: string): string[] {
  const stripped = stripNationalTeamAgeGroup(teamName);
  const canonicalFull = normalizeTeamNameForBadge(teamName);
  const canonicalStripped = normalizeTeamNameForBadge(stripped);
  const raw = teamName.trim();
  const rawStripped = stripped.trim();

  return Array.from(
    new Set([canonicalFull, canonicalStripped, raw, rawStripped])
  ).filter(Boolean) as string[];
}

function selectSoccerTeam(teams: any[]): any | null {
  if (!Array.isArray(teams) || teams.length === 0) return null;
  const soccerTeam = teams.find((team) => String(team?.strSport).toLowerCase() === 'soccer');
  return soccerTeam || teams[0];
}

function encodeWikimediaTitle(title: string): string {
  return encodeURIComponent(title.trim().replace(/\s+/g, '_'));
}

async function getCommonsFileUrl(fileName: string): Promise<string | null> {
  const title = encodeWikimediaTitle(`File:${fileName}`);
  try {
    const res = await fetch(`https://commons.wikimedia.org/w/api.php?action=query&titles=${title}&prop=imageinfo&iiprop=url&format=json&origin=*`, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: ONE_MONTH },
    } as RequestInit & { next?: { revalidate: number } });
    if (!res.ok) return null;
    const json = await res.json();
    const page = Object.values(json.query?.pages || {})[0] as any;
    return page?.imageinfo?.[0]?.url || null;
  } catch {
    return null;
  }
}

async function getWikidataTeamBadgeUrl(teamName: string): Promise<string | null> {
  const search = encodeURIComponent(teamName.trim());
  if (!search) return null;

  try {
    const res = await fetch(`https://www.wikidata.org/w/api.php?action=wbsearchentities&search=${search}&language=en&format=json&type=item&limit=5&origin=*`, {
      signal: AbortSignal.timeout(10000),
      next: { revalidate: ONE_MONTH },
    } as RequestInit & { next?: { revalidate: number } });
    if (!res.ok) return null;
    const json = await res.json();
    const entities: any[] = json.search || [];

    for (const entity of entities) {
      const qid = entity.id;
      if (!qid) continue;
      const entityRes = await fetch(`https://www.wikidata.org/wiki/Special:EntityData/${qid}.json?origin=*`, {
        signal: AbortSignal.timeout(10000),
        next: { revalidate: ONE_MONTH },
      } as RequestInit & { next?: { revalidate: number } });
      if (!entityRes.ok) continue;
      const entityJson = await entityRes.json();
      const data = entityJson.entities?.[qid];
      const claims = data?.claims || {};
      const imageClaims = [...(claims.P154 || []), ...(claims.P18 || [])];
      for (const claim of imageClaims) {
        const fileName = claim?.mainsnak?.datavalue?.value;
        if (typeof fileName === 'string' && fileName) {
          const fileUrl = await getCommonsFileUrl(fileName);
          if (fileUrl) return fileUrl;
        }
      }
    }
  } catch {
    return null;
  }
  return null;
}

async function getWikipediaTeamBadgeUrl(teamName: string): Promise<string | null> {
  const query = encodeURIComponent(teamName.trim());
  if (!query) return null;

  try {
    const languages = ['en', 'vi'];
    for (const lang of languages) {
      const wikiRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages|info&piprop=original&titles=${query}&origin=*`, {
        signal: AbortSignal.timeout(10000),
        next: { revalidate: ONE_MONTH },
      } as RequestInit & { next?: { revalidate: number } });
      if (!wikiRes.ok) continue;
      const wikiJson = await wikiRes.json();
      const pages = wikiJson.query?.pages || {};
      const page = Object.values(pages)[0] as any;
      if (page?.original?.source) return page.original.source;

      const searchRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&list=search&format=json&srsearch=${query}&srlimit=1&origin=*`, {
        signal: AbortSignal.timeout(10000),
        next: { revalidate: ONE_MONTH },
      } as RequestInit & { next?: { revalidate: number } });
      if (!searchRes.ok) continue;
      const searchJson = await searchRes.json();
      const title = searchJson.query?.search?.[0]?.title;
      if (!title) continue;

      const pageRes = await fetch(`https://${lang}.wikipedia.org/w/api.php?action=query&format=json&prop=pageimages|info&piprop=original&titles=${encodeURIComponent(title)}&origin=*`, {
        signal: AbortSignal.timeout(10000),
        next: { revalidate: ONE_MONTH },
      } as RequestInit & { next?: { revalidate: number } });
      if (!pageRes.ok) continue;
      const pageJson = await pageRes.json();
      const page2 = Object.values(pageJson.query?.pages || {})[0] as any;
      if (page2?.original?.source) return page2.original.source;
    }
  } catch {
    return null;
  }

  return null;
}

/** Tra logo 1 đội bóng theo tên thật từ TheSportsDB (không đoán URL). */
export async function getTeamBadgeUrl(teamName: string): Promise<string | null> {
  const candidates = buildTeamBadgeSearchCandidates(teamName);

  for (const candidate of candidates) {
    try {
      const res = await fetch(`${base()}/searchteams.php?t=${encodeURIComponent(candidate)}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) continue;
      const json = await res.json();
      const team = selectSoccerTeam(json.teams || []);
      const badge = team?.strTeamBadge || team?.strBadge || null;
      if (badge) return badge;
    } catch {
      // thử candidate tiếp theo
    }
  }

  if (isApiFootballConfigured()) {
    for (const candidate of candidates) {
      const badge = await fetchApiFootballTeamBadgeUrl(candidate);
      if (badge) return badge;
    }
  }

  for (const candidate of candidates) {
    const badge = await getWikipediaTeamBadgeUrl(candidate);
    if (badge) return badge;
  }

  for (const candidate of candidates) {
    const badge = await getWikidataTeamBadgeUrl(candidate);
    if (badge) return badge;
  }

  return null;
}

export type FillLogosResult = { teamsChecked: number; teamsFound: number; rowsUpdated: number };

/**
 * Điền logo còn thiếu cho các trận đã có trong bảng fixtures (kể cả trận nhập tay),
 * bằng cách tra tên đội thật qua TheSportsDB — không tự đoán/gán URL sai.
 */
export async function fillMissingFixtureLogos(): Promise<FillLogosResult> {
  const db = createSupabaseAdmin();
  const { data: rows } = await db
    .from('fixtures')
    .select('id, home_team, away_team, home_logo_url, away_logo_url')
    .or('home_logo_url.is.null,away_logo_url.is.null');

  const teamNames = new Set<string>();
  for (const r of rows || []) {
    if (!r.home_logo_url) teamNames.add(r.home_team);
    if (!r.away_logo_url) teamNames.add(r.away_team);
  }
  // Build a set of canonical team names (normalized) so we only lookup each
  // logical team once even if it appears with multiple name variants in DB.
  const normalizedSet = new Set<string>();
  for (const r of rows || []) {
    if (!r.home_logo_url && r.home_team) normalizedSet.add(normalizeTeamNameForBadge(r.home_team));
    if (!r.away_logo_url && r.away_team) normalizedSet.add(normalizeTeamNameForBadge(r.away_team));
  }

  const normalizedArr = Array.from(normalizedSet).filter(Boolean) as string[];
  const badgeEntries = await mapWithConcurrency(
    normalizedArr,
    async (canonical) => [canonical, await getTeamBadgeUrl(canonical)] as const,
    5,
  );
  const badgeByCanonical = new Map<string, string | null>(badgeEntries);

  let rowsUpdated = 0;
  for (const r of rows || []) {
    const patch: Record<string, string> = {};
    const homeKey = r.home_team ? normalizeTeamNameForBadge(r.home_team) : '';
    const awayKey = r.away_team ? normalizeTeamNameForBadge(r.away_team) : '';
    const homeBadge = !r.home_logo_url ? badgeByCanonical.get(homeKey) : null;
    const awayBadge = !r.away_logo_url ? badgeByCanonical.get(awayKey) : null;
    if (homeBadge) patch.home_logo_url = homeBadge;
    if (awayBadge) patch.away_logo_url = awayBadge;
    if (Object.keys(patch).length) {
      const { error } = await db.from('fixtures').update(patch).eq('id', r.id);
      if (!error) rowsUpdated++;
    }
  }

  return {
    teamsChecked: normalizedArr.length,
    teamsFound: Array.from(badgeByCanonical.values()).filter(Boolean).length,
    rowsUpdated,
  };
}

function currentLaLigaSeason(): string {
  const now = new Date();
  const y = now.getUTCFullYear();
  // Mùa La Liga bắt đầu khoảng tháng 8 -> từ tháng 7 trở đi tính là mùa mới bắt đầu
  return now.getUTCMonth() >= 6 ? `${y}-${y + 1}` : `${y - 1}-${y}`;
}

export type StandingsSyncResult = { season: string; teams: number };

/** Đồng bộ bảng xếp hạng La Liga trực tiếp từ TheSportsDB, lưu vào site_settings. */
export async function syncStandingsFromTheSportsDB(): Promise<StandingsSyncResult> {
  const leagueId = process.env.THESPORTSDB_LEAGUE_ID || '4335'; // La Liga
  const season = process.env.THESPORTSDB_SEASON || currentLaLigaSeason();

  const res = await fetch(`${base()}/lookuptable.php?l=${leagueId}&s=${season}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`TheSportsDB lỗi HTTP ${res.status}`);
  const json = await res.json();
  const table = json.table || [];
  if (!table.length) {
    throw new Error(
      `Không lấy được bảng xếp hạng (mùa "${season}", league id ${leagueId}). Có thể mùa giải chưa có dữ liệu trên TheSportsDB — thử lại sau hoặc chỉnh THESPORTSDB_SEASON.`
    );
  }

  const db = createSupabaseAdmin();
  const { error } = await db.from('site_settings').upsert(
    {
      setting_key: 'la_liga_standings',
      setting_value: { season, table, updatedAt: new Date().toISOString() },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'setting_key' }
  );
  if (error) throw new Error(error.message);

  return { season, teams: table.length };
}
