import type { FixtureEvent, FixtureEventType } from './types';

// Dùng chung cho mọi nguồn dữ liệu diễn biến trận đấu (API-Football, TheSportsDB, ...)
// để không lặp lại logic dịch/lọc ở nhiều nơi.

// Nhãn loại bàn thắng (tiếng Anh từ các API) → tiếng Việt. "Normal Goal"/"Goal" là bàn thắng
// bình thường, không cần ghi chú gì thêm nên KHÔNG có trong danh sách này (sẽ bị lọc bỏ).
const GOAL_DETAIL_VI: Record<string, string> = {
  penalty: 'phạt đền',
  'missed penalty': 'đá hỏng phạt đền',
  'own goal': 'phản lưới nhà',
  header: 'đánh đầu',
  'free kick': 'sút phạt',
  'overhead kick': 'móc bóng',
};

/** Dịch chi tiết loại bàn thắng sang tiếng Việt; trả về null nếu là bàn thắng thường (không cần ghi chú). */
export function translateGoalDetail(detail: string | null | undefined): string | null {
  const s = (detail || '').trim();
  if (!s) return null;
  if (/^(normal|regular)?\s*goal$/i.test(s)) return null;
  const vi = GOAL_DETAIL_VI[s.toLowerCase()];
  return vi || s;
}

// Các API bóng đá (đặc biệt gói/khoá miễn phí) đôi khi trả tên giữ chỗ thay vì tên cầu thủ thật khi
// thiếu dữ liệu, ví dụ "Substitution 1", "Unknown". Nhận diện để KHÔNG hiển thị như tên thật.
// Khác với trường hợp "trống hẳn" (null/rỗng) — đó có thể là 1 sự kiện CÓ THẬT (ví dụ bàn thắng tính
// vào tỷ số) nhưng API chưa gắn tên cầu thủ, nên không nên lọc bỏ luôn cả dòng, chỉ nên cảnh báo.
export function isPlaceholderName(s: string | null | undefined): boolean {
  if (!s) return true;
  const t = s.trim();
  if (!t) return true;
  return isFakeDemoName(t);
}

/** Tên giữ chỗ RÕ RÀNG là dữ liệu mẫu/giả (không phải do thiếu dữ liệu), luôn phải lọc bỏ. */
function isFakeDemoName(t: string): boolean {
  return /^substitution\s*\d*$/i.test(t) || /^unknown$/i.test(t) || /^n\/?a$/i.test(t);
}

/** true nếu tên trống hẳn (null/rỗng) — khác với tên giả kiểu demo. */
function isMissingName(s: string | null | undefined): boolean {
  return !s || !s.trim();
}

export type RawMatchEvent = {
  minute: string;
  team: 'home' | 'away';
  kind: 'goal' | 'card' | 'subst';
  detail: string | null; // "Penalty", "Yellow Card", tên ngắn cầu thủ vào sân, ...
  player: string | null; // cầu thủ ghi bàn / bị phạt thẻ / (với subst) cầu thủ RA sân
  incomingPlayer: string | null; // (chỉ subst) cầu thủ VÀO sân — nguồn khác nhau đặt field này khác nhau
  assist: string | null; // (chỉ goal) cầu thủ kiến tạo
};

/** Map danh sách sự kiện thô (đã chuẩn hoá ở mức field) sang FixtureEvent dùng trong admin. */
export function mapRawEventsToFixtureEvents(raw: RawMatchEvent[]): FixtureEvent[] {
  const out: FixtureEvent[] = [];

  for (const e of raw) {
    const rawPlayer = e.player ? e.player.trim() : '';
    // Tên giả kiểu demo (vd "Substitution 1") → bỏ hẳn dòng, đây chắc chắn là dữ liệu rác.
    if (rawPlayer && isFakeDemoName(rawPlayer)) continue;
    // Bàn thắng thiếu tên cầu thủ vẫn LÀ 1 BÀN THẮNG THẬT (đã tính vào tỷ số) — giữ lại, đánh dấu
    // "Chưa rõ cầu thủ" để admin biết mà tự bổ sung, thay vì mất luôn cả sự kiện một cách âm thầm.
    // Thẻ phạt/thay người thiếu tên thì bỏ qua như cũ vì không đáng để hiện "không rõ".
    if (isMissingName(rawPlayer) && e.kind !== 'goal') continue;
    const player = rawPlayer || 'Chưa rõ cầu thủ';

    if (e.kind === 'goal') {
      const noteBits: string[] = [];
      const goalDetail = translateGoalDetail(e.detail);
      if (goalDetail) noteBits.push(goalDetail);
      if (e.assist && !isPlaceholderName(e.assist)) noteBits.push(`kiến tạo: ${e.assist.trim()}`);
      out.push({ minute: e.minute, type: 'goal' as FixtureEventType, team: e.team, player, note: noteBits.join(' — ') || undefined });
    } else if (e.kind === 'card') {
      const isRed = /red/i.test(e.detail || '');
      out.push({ minute: e.minute, type: (isRed ? 'red' : 'yellow') as FixtureEventType, team: e.team, player });
    } else if (e.kind === 'subst') {
      const incoming = !isPlaceholderName(e.incomingPlayer) ? e.incomingPlayer!.trim() : !isPlaceholderName(e.detail) ? (e.detail as string).trim() : null;
      out.push({
        minute: e.minute,
        type: 'sub' as FixtureEventType,
        team: e.team,
        player,
        note: incoming ? `vào sân: ${incoming}` : undefined,
      });
    }
  }

  return out;
}
