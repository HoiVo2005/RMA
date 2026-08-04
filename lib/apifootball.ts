import { mapRawEventsToFixtureEvents, type RawMatchEvent } from './football-events';
import type { FixtureEvent } from './types';

// API-Football (api-sports.io / v3.football.api-sports.io) — có gói MIỄN PHÍ thật (100 request/ngày,
// không cần thẻ tín dụng) và trả về diễn biến THẬT theo từng trận (ai ghi bàn, ai kiến tạo, thẻ phạt,
// thay người) — khác với key test "123" của TheSportsDB (thường trả dữ liệu mẫu, không khớp trận thật).
//
// Cách lấy key: đăng ký free tại https://dashboard.api-football.com/register → vào phần "My Access"
// lấy API key, điền vào API_FOOTBALL_KEY.
// Cách lấy TEAM ID của Real Madrid: gọi thử (dán vào trình duyệt hoặc curl, thay YOUR_KEY):
//   https://v3.football.api-sports.io/teams?name=Real Madrid
//   (nhớ set header x-apisports-key: YOUR_KEY, hoặc dùng RapidAPI nếu đăng ký qua đó)
// rồi lấy field "id" trong response.team.id, điền vào API_FOOTBALL_TEAM_ID.

const BASE_URL = 'https://v3.football.api-sports.io';

function apiKey(): string | null {
  return process.env.API_FOOTBALL_KEY || null;
}

function teamId(): string | null {
  return process.env.API_FOOTBALL_TEAM_ID || null;
}

/** Đã cấu hình đủ để dùng API-Football chưa (key + team id). */
export function isApiFootballConfigured(): boolean {
  return Boolean(apiKey() && teamId());
}

async function apiFootballFetch(path: string, params: Record<string, string>) {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { 'x-apisports-key': apiKey()! },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`API-Football lỗi HTTP ${res.status}`);
  return res.json();
}

function normalizeTeamName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

function normalizeTeamNameForSearch(teamName: string): string {
  return teamName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/\bfc\b|\bcf\b|club\b|ac\b|cf\b/gi, '')
    .replace(/\s+/g, ' ')
    .trim();
}

export async function fetchTeamBadgeUrl(teamName: string): Promise<string | null> {
  if (!isApiFootballConfigured()) return null;
  const candidates = Array.from(
    new Set([
      teamName.trim(),
      normalizeTeamNameForSearch(teamName),
      normalizeTeamName(teamName),
    ])
  ).filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const json = await apiFootballFetch('/teams', { name: candidate });
      const response: any[] = json.response || [];
      const logo = response?.[0]?.team?.logo || null;
      if (logo) return logo;
    } catch {
      // ignore and thử candidate tiếp theo
    }
  }

  return null;
}

/**
 * Tìm ID trận đấu trên API-Football theo ngày thi đấu của đội Real Madrid (thường mỗi ngày chỉ có
 * tối đa 1 trận nên không cần khớp thêm theo đối thủ), rồi lấy timeline sự kiện của trận đó.
 * Trả về null nếu chưa cấu hình key/team id, không tìm thấy trận khớp, hoặc lỗi mạng — để nơi gọi
 * tự chuyển sang nguồn dự phòng (TheSportsDB) mà không làm hỏng cả lần đồng bộ.
 */
export async function fetchApiFootballEvents(matchTimeIso: string): Promise<FixtureEvent[] | null> {
  if (!isApiFootballConfigured()) return null;

  try {
    const date = matchTimeIso.slice(0, 10); // YYYY-MM-DD
    const fixturesJson = await apiFootballFetch('/fixtures', { team: teamId()!, date });
    const fixtures: any[] = fixturesJson.response || [];
    if (!fixtures.length) return null;
    const fixtureId = fixtures[0].fixture?.id;
    if (!fixtureId) return null;

    const eventsJson = await apiFootballFetch('/fixtures/events', { fixture: String(fixtureId) });
    const rawEvents: any[] = eventsJson.response || [];
    if (!rawEvents.length) return null;

    const homeTeamName: string = fixtures[0].teams?.home?.name || '';
    const homeNormalized = normalizeTeamName(homeTeamName);

    const mapped: RawMatchEvent[] = rawEvents.map((e) => {
      const teamName: string = e.team?.name || '';
      const team: 'home' | 'away' = normalizeTeamName(teamName) === homeNormalized ? 'home' : 'away';
      const type = (e.type || '').toLowerCase();
      const minute = e.time?.elapsed != null ? `${e.time.elapsed}${e.time.extra ? `+${e.time.extra}` : ''}` : '';

      if (type === 'goal') {
        return {
          minute,
          team,
          kind: 'goal',
          detail: e.detail || null,
          player: e.player?.name || null,
          incomingPlayer: null,
          assist: e.assist?.name || null,
        };
      }
      if (type === 'card') {
        return { minute, team, kind: 'card', detail: e.detail || null, player: e.player?.name || null, incomingPlayer: null, assist: null };
      }
      // "subst": player = cầu thủ RA sân, assist = cầu thủ VÀO sân (theo quy ước của API-Football).
      return {
        minute,
        team,
        kind: 'subst',
        detail: null,
        player: e.player?.name || null,
        incomingPlayer: e.assist?.name || null,
        assist: null,
      };
    });

    const events = mapRawEventsToFixtureEvents(mapped);
    return events.length ? events : null;
  } catch {
    return null;
  }
}
