export type ClubStint = { name: string; fromYear: string; toYear: string; apps: string; goals: string };
export type Honor = { title: string; count: string; years: string; image_url?: string };

export type HonorCategory = 'league' | 'continental' | 'cup' | 'international' | 'individual' | 'other';

/**
 * Đoán loại danh hiệu từ tên (giải quốc nội, cúp châu lục, cúp quốc nội, đội tuyển, cá nhân...)
 * để hiển thị icon "cúp" phù hợp — không dùng ảnh cúp thật (bản quyền), chỉ dùng icon minh hoạ.
 */
export function categorizeHonor(title: string): HonorCategory {
  const t = title.toLowerCase();
  if (/champions league|europa league|conference league|super cup|siêu cúp|liên lục địa|club world cup/.test(t)) return 'continental';
  if (/world cup|euro|nations league|copa am[eé]rica|vô địch quốc gia|đội tuyển/.test(t)) return 'international';
  if (/cúp qu[oố]c gia|copa del rey|fa cup|dfb-pokal|coupe de france|cúp/.test(t)) return 'cup';
  if (/la liga|premier league|bundesliga|serie a|ligue 1|giải vô địch|division|liga\b/.test(t)) return 'league';
  if (/pichichi|zamora|golden boy|ballon d'?or|quả bóng vàng|mvp|xuất sắc nhất|top scorer|vua phá lưới|của tháng|player of/.test(t)) return 'individual';
  return 'other';
}

/**
 * Phân tích chuỗi nhiều dòng dạng "Tên | Từ năm | Đến năm | Số trận | Số bàn" thành danh sách.
 * Các phần "Số trận"/"Số bàn" có thể vắng mặt (dùng cho sự nghiệp trẻ, không theo dõi thống kê).
 */
export function parseClubStints(raw: string | null | undefined): ClubStint[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      return {
        name: parts[0] || '',
        fromYear: parts[1] || '',
        toYear: parts[2] || '',
        apps: parts[3] || '',
        goals: parts[4] || '',
      };
    })
    .filter((c) => c.name);
}

/**
 * Chuyển danh sách CLB/đội tuyển có cấu trúc thành chuỗi nhiều dòng để lưu vào cột text.
 * @param withStats nếu true, luôn ghi kèm 2 cột "Số trận | Số bàn" (dùng cho sự nghiệp chuyên nghiệp/đội tuyển).
 */
export function serializeClubStints(list: ClubStint[], withStats: boolean): string {
  return list
    .filter((c) => c.name.trim())
    .map((c) => {
      const base = `${c.name.trim()} | ${c.fromYear.trim()} | ${c.toYear.trim()}`;
      return withStats ? `${base} | ${c.apps.trim()} | ${c.goals.trim()}` : base;
    })
    .join('\n');
}

/**
 * Phân tích chuỗi nhiều dòng dạng "Tên danh hiệu | Số lần | Các năm | URL ảnh"
 * thành danh sách danh hiệu. Phần "URL ảnh" là TUỲ CHỌN (thêm sau) — dữ liệu
 * cũ chỉ có 3 phần vẫn đọc được bình thường, `image_url` sẽ là chuỗi rỗng.
 */
export function parseHonors(raw: string | null | undefined): Honor[] {
  if (!raw) return [];
  return raw
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const parts = line.split('|').map((p) => p.trim());
      return {
        title: parts[0] || '',
        count: parts[1] || '',
        years: parts[2] || '',
        image_url: parts[3]?.trim() || '',
      };
    })
    .filter((h) => h.title);
}

/**
 * Chuyển danh sách danh hiệu có cấu trúc thành chuỗi nhiều dòng để lưu vào cột text.
 * Luôn ghi đủ 4 phần (kể cả khi chưa có ảnh) để giữ định dạng nhất quán.
 */
export function serializeHonors(list: Honor[]): string {
  return list
    .filter((h) => h.title.trim())
    .map((h) => `${h.title.trim()} | ${h.count.trim()} | ${h.years.trim()} | ${(h.image_url || '').trim()}`)
    .join('\n');
}
