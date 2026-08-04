import { createSupabaseAdmin } from './supabase';
import { getFormationSlots } from './formations';

// Highlightly (soccer.highlightly.net) — dùng để lấy ĐỘI HÌNH RA SÂN THẬT (starting XI)
// ngay khi 2 đội công bố (thường 20-40 phút trước giờ bóng lăn), thay vì phải nhập tay.
// Đăng ký free tại https://highlightly.net (100 request/ngày, đủ dùng cho polling 10 phút/lần
// quanh giờ thi đấu). Cách lấy TEAM ID của Real Madrid: gọi thử
//   curl -H "x-rapidapi-key: <API_KEY>" "https://soccer.highlightly.net/teams?name=Real%20Madrid"
// rồi lấy field "id" trong kết quả, điền vào HIGHLIGHTLY_TEAM_ID.

const BASE_URL = 'https://soccer.highlightly.net';

function apiKey(): string {
  const key = process.env.HIGHLIGHTLY_API_KEY;
  if (!key) throw new Error('Thiếu HIGHLIGHTLY_API_KEY trong biến môi trường.');
  return key;
}

function teamId(): string {
  const id = process.env.HIGHLIGHTLY_TEAM_ID;
  if (!id) throw new Error('Thiếu HIGHLIGHTLY_TEAM_ID trong biến môi trường (ID đội Real Madrid trên Highlightly).');
  return id;
}

async function highlightlyFetch(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), {
    headers: { 'x-rapidapi-key': apiKey() },
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Highlightly lỗi HTTP ${res.status} — ${await res.text().catch(() => '')}`);
  return res.json();
}

type HighlightlyMatch = {
  id: number;
  date: string;
  homeTeam: { id: number; name: string };
  awayTeam: { id: number; name: string };
  state: { description: string };
};

type HighlightlyLineupPlayer = { name: string; number: number; position: string };
type HighlightlyTeamLineup = {
  id: number;
  name: string;
  formation: string;
  substitutes: HighlightlyLineupPlayer[];
  initialLineup: HighlightlyLineupPlayer[][];
};
type HighlightlyLineupResponse = { homeTeam: HighlightlyTeamLineup; awayTeam: HighlightlyTeamLineup };

/**
 * Tìm trận gần nhất của Real Madrid (đang diễn ra HOẶC sắp diễn ra trong vòng 3 ngày tới) —
 * đây là trận có khả năng đã/sắp có đội hình chính thức.
 */
async function findRelevantMatch(): Promise<HighlightlyMatch | null> {
  const id = teamId();
  const [homeRes, awayRes] = await Promise.all([
    highlightlyFetch('/matches', { homeTeamId: id }),
    highlightlyFetch('/matches', { awayTeamId: id }),
  ]);
  const matches: HighlightlyMatch[] = [...(homeRes?.data || []), ...(awayRes?.data || [])];
  if (matches.length === 0) return null;

  const now = Date.now();
  const THREE_DAYS = 3 * 24 * 60 * 60 * 1000;

  // Ưu tiên trận đang diễn ra (mọi trạng thái khác "Not started"/"Finished"...)
  const inPlayStates = ['first half', 'second half', 'half time', 'extra time', 'break time', 'penalties'];
  const live = matches.find((m) => inPlayStates.includes((m.state?.description || '').toLowerCase()));
  if (live) return live;

  // Ngược lại, chọn trận SẮP diễn ra gần nhất trong 3 ngày tới (đội hình thường công bố ~30-40' trước giờ đấu)
  const upcoming = matches
    .filter((m) => {
      const t = new Date(m.date).getTime();
      return t > now && t - now < THREE_DAYS;
    })
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  return upcoming[0] || null;
}

function normalizeName(s: string): string {
  return s
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z]/g, '');
}

/** Ghép cầu thủ trong lineup trả về từ Highlightly với bản ghi cầu thủ trong bảng `players` — ưu tiên số áo, sau đó tới tên. */
function matchPlayer(
  hlPlayer: HighlightlyLineupPlayer,
  squad: { id: string; name: string; shirt_number: number | null }[]
): string | null {
  const byNumber = squad.find((p) => p.shirt_number != null && p.shirt_number === hlPlayer.number);
  if (byNumber) return byNumber.id;

  const target = normalizeName(hlPlayer.name);
  const byName = squad.find((p) => {
    const n = normalizeName(p.name);
    return n === target || n.endsWith(target) || target.endsWith(n);
  });
  return byName?.id || null;
}

/**
 * Tìm bản ghi trận đấu tương ứng trong bảng `fixtures` (đồng bộ từ TheSportsDB, provider
 * KHÁC với Highlightly nên không có ID chung) — ghép theo tên đối thủ (không phải Real Madrid)
 * + thời gian thi đấu gần nhau (trong vòng 12 giờ). Best-effort: nếu không khớp được thì bỏ qua,
 * không chặn phần ghi vào site_settings.starting_lineup (đội hình "hiện tại" cho trang chủ vẫn
 * hoạt động bình thường).
 */
async function findMatchingFixtureId(
  admin: ReturnType<typeof createSupabaseAdmin>,
  opponentName: string,
  matchDateIso: string
): Promise<string | null> {
  const target = normalizeName(opponentName);
  const matchTime = new Date(matchDateIso).getTime();
  const TWELVE_HOURS = 12 * 60 * 60 * 1000;

  const { data: fixtures } = await admin
    .from('fixtures')
    .select('id, home_team, away_team, match_time')
    .gte('match_time', new Date(matchTime - TWELVE_HOURS).toISOString())
    .lte('match_time', new Date(matchTime + TWELVE_HOURS).toISOString());

  const candidate = (fixtures || []).find((f) => {
    const home = normalizeName(f.home_team);
    const away = normalizeName(f.away_team);
    return home.includes(target) || target.includes(home) || away.includes(target) || target.includes(away);
  });
  return candidate?.id || null;
}

export type LineupSyncResult = {
  ok: boolean;
  matchId?: number;
  fixtureId?: string | null;
  formation?: string;
  matchedCount?: number;
  totalCount?: number;
  unmatchedNames?: string[];
  reason?: string;
};

/**
 * Đồng bộ đội hình ra sân thật từ Highlightly vào `site_settings.starting_lineup`
 * — API công khai /api/lineup và trang chủ sẽ tự phản ánh ngay lần load tiếp theo,
 * KHÔNG cần đổi gì thêm ở phần hiển thị.
 */
export async function syncLineupFromHighlightly(opts: { force?: boolean } = {}): Promise<LineupSyncResult> {
  const admin = createSupabaseAdmin();

  // Nếu admin đã tắt tự động đồng bộ (vd muốn tự xếp đội hình dự đoán trước), bỏ qua —
  // trừ khi được gọi thủ công (nút "Đồng bộ ngay" trong trang quản trị dùng opts.force).
  if (!opts.force) {
    const { data: toggle } = await admin
      .from('site_settings')
      .select('setting_value')
      .eq('setting_key', 'lineup_auto_sync')
      .maybeSingle();
    if (toggle?.setting_value === false) {
      return { ok: false, reason: 'Đang tắt tự động đồng bộ đội hình (bật lại ở trang quản trị).' };
    }
  }

  const match = await findRelevantMatch();
  if (!match) return { ok: false, reason: 'Không có trận nào đang diễn ra hoặc sắp diễn ra trong 3 ngày tới.' };

  const lineup: HighlightlyLineupResponse = await highlightlyFetch(`/lineups/${match.id}`);
  const rmId = Number(teamId());
  const teamLineup = match.homeTeam.id === rmId ? lineup.homeTeam : lineup.awayTeam;
  if (!teamLineup?.formation || !teamLineup.initialLineup?.length) {
    return { ok: false, matchId: match.id, reason: 'Chưa có đội hình chính thức cho trận này (thường công bố 20-40 phút trước giờ đấu).' };
  }

  const { data: squadRaw } = await admin.from('players').select('id, name, shirt_number');
  const squad = (squadRaw || []) as { id: string; name: string; shirt_number: number | null }[];

  const slots = getFormationSlots(teamLineup.formation);
  // Bỏ hàng đầu tiên (thủ môn) khỏi initialLineup để ghép lần lượt với các slot còn lại —
  // initialLineup[0] luôn là thủ môn theo tài liệu Highlightly.
  const flatPlayers: HighlightlyLineupPlayer[] = teamLineup.initialLineup.flat();

  const assignments: Record<string, string | null> = {};
  const unmatchedNames: string[] = [];
  let matchedCount = 0;

  slots.forEach((slot, i) => {
    const hlPlayer = flatPlayers[i];
    if (!hlPlayer) {
      assignments[slot.id] = null;
      return;
    }
    const playerId = matchPlayer(hlPlayer, squad);
    assignments[slot.id] = playerId;
    if (playerId) matchedCount++;
    else unmatchedNames.push(hlPlayer.name);
  });

  const lineupValue = {
    formation: teamLineup.formation,
    assignments,
    source: 'auto' as const,
    syncedAt: new Date().toISOString(),
  };

  await admin.from('site_settings').upsert(
    {
      setting_key: 'starting_lineup',
      setting_value: { ...lineupValue, matchId: match.id },
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'setting_key' }
  );

  // Ghi thêm vào ĐÚNG bản ghi trận đấu (nếu tìm được) — để trang "Chi tiết trận đấu"
  // (/lich-thi-dau/[id]) hiển thị đội hình của CHÍNH trận đó, không chỉ trận "hiện tại".
  const opponentName = (match.homeTeam.id === rmId ? match.awayTeam.name : match.homeTeam.name) || '';
  const fixtureId = opponentName ? await findMatchingFixtureId(admin, opponentName, match.date) : null;
  if (fixtureId) {
    await admin.from('fixtures').update({ lineup: lineupValue, updated_at: new Date().toISOString() }).eq('id', fixtureId);
  }

  return {
    ok: true,
    matchId: match.id,
    fixtureId,
    formation: teamLineup.formation,
    matchedCount,
    totalCount: slots.length,
    unmatchedNames,
  };
}
