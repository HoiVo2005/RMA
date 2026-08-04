export type FormationSlot = { id: string; label: string; x: number; y: number };

// Toạ độ % trên sân: x = trái(0)→phải(100), y = trên/tấn công(0)→dưới/thủ môn(100).
export const FORMATIONS: Record<string, FormationSlot[]> = {
  '4-3-3': [
    { id: 'gk', label: 'TM', x: 50, y: 92 },
    { id: 'lb', label: 'HVT', x: 15, y: 72 },
    { id: 'cb1', label: 'TV', x: 37, y: 76 },
    { id: 'cb2', label: 'TV', x: 63, y: 76 },
    { id: 'rb', label: 'HVP', x: 85, y: 72 },
    { id: 'cm1', label: 'TV', x: 28, y: 48 },
    { id: 'cm2', label: 'TV', x: 50, y: 44 },
    { id: 'cm3', label: 'TV', x: 72, y: 48 },
    { id: 'lw', label: 'CT', x: 18, y: 18 },
    { id: 'st', label: 'TĐ', x: 50, y: 12 },
    { id: 'rw', label: 'CP', x: 82, y: 18 },
  ],
  '4-4-2': [
    { id: 'gk', label: 'TM', x: 50, y: 92 },
    { id: 'lb', label: 'HVT', x: 15, y: 72 },
    { id: 'cb1', label: 'TV', x: 37, y: 76 },
    { id: 'cb2', label: 'TV', x: 63, y: 76 },
    { id: 'rb', label: 'HVP', x: 85, y: 72 },
    { id: 'lm', label: 'TVT', x: 15, y: 45 },
    { id: 'cm1', label: 'TV', x: 40, y: 48 },
    { id: 'cm2', label: 'TV', x: 60, y: 48 },
    { id: 'rm', label: 'TVP', x: 85, y: 45 },
    { id: 'st1', label: 'TĐ', x: 40, y: 14 },
    { id: 'st2', label: 'TĐ', x: 60, y: 14 },
  ],
  '3-5-2': [
    { id: 'gk', label: 'TM', x: 50, y: 92 },
    { id: 'cb1', label: 'TV', x: 25, y: 76 },
    { id: 'cb2', label: 'TV', x: 50, y: 80 },
    { id: 'cb3', label: 'TV', x: 75, y: 76 },
    { id: 'lwb', label: 'CBT', x: 10, y: 50 },
    { id: 'cm1', label: 'TV', x: 32, y: 48 },
    { id: 'cm2', label: 'TV', x: 50, y: 44 },
    { id: 'cm3', label: 'TV', x: 68, y: 48 },
    { id: 'rwb', label: 'CBP', x: 90, y: 50 },
    { id: 'st1', label: 'TĐ', x: 40, y: 14 },
    { id: 'st2', label: 'TĐ', x: 60, y: 14 },
  ],
  '4-2-3-1': [
    { id: 'gk', label: 'TM', x: 50, y: 92 },
    { id: 'lb', label: 'HVT', x: 15, y: 74 },
    { id: 'cb1', label: 'TV', x: 37, y: 78 },
    { id: 'cb2', label: 'TV', x: 63, y: 78 },
    { id: 'rb', label: 'HVP', x: 85, y: 74 },
    { id: 'cdm1', label: 'TVPT', x: 37, y: 58 },
    { id: 'cdm2', label: 'TVPT', x: 63, y: 58 },
    { id: 'lam', label: 'TĐC', x: 18, y: 32 },
    { id: 'cam', label: 'TVC', x: 50, y: 28 },
    { id: 'ram', label: 'TĐC', x: 82, y: 32 },
    { id: 'st', label: 'TĐ', x: 50, y: 10 },
  ],
};

export const FORMATION_NAMES = Object.keys(FORMATIONS);

/**
 * Sinh toạ độ sơ đồ cho MỌI chuỗi đội hình dạng "4-2-3-1", "5-3-2", "4-1-4-1"...
 * kể cả các sơ đồ không có sẵn trong FORMATIONS ở trên. Dùng khi đồng bộ đội
 * hình thật từ nguồn dữ liệu ngoài (Highlightly...) — API có thể trả về sơ đồ
 * bất kỳ, không chỉ giới hạn trong 4 mẫu admin hay dùng.
 * Số lượng cầu thủ mỗi tuyến LUÔN khớp với các số trong chuỗi (vd "4-2-3-1"
 * → tuyến thủ môn 1 + hậu vệ 4 + tiền vệ phòng ngự 2 + tiền vệ công 3 + tiền đạo 1),
 * đúng với cách nhóm hàng của dữ liệu lineup thật (initialLineup theo từng hàng).
 */
export function generateFormationSlots(formation: string): FormationSlot[] {
  const lineSizes = formation
    .split('-')
    .map((n) => parseInt(n, 10))
    .filter((n) => Number.isFinite(n) && n > 0);
  if (lineSizes.length === 0) return FORMATIONS['4-3-3'];

  const slots: FormationSlot[] = [{ id: 'gk', label: 'TM', x: 50, y: 92 }];
  const lineCount = lineSizes.length;

  lineSizes.forEach((size, lineIdx) => {
    // y giảm dần từ gần khung thành (78) tới gần vạch giữa sân/tấn công (10)
    const y = Math.round(78 - (lineIdx / Math.max(lineCount - 1, 1)) * 68);
    const isLastLine = lineIdx === lineCount - 1;
    const isFirstLine = lineIdx === 0;
    for (let i = 0; i < size; i++) {
      // x trải đều từ 12 đến 88 theo số lượng cầu thủ trên tuyến
      const x = size === 1 ? 50 : Math.round(12 + (i / (size - 1)) * 76);
      let label = 'TV';
      if (isFirstLine) {
        if (size >= 2 && (i === 0 || i === size - 1)) label = i === 0 ? 'HVT' : 'HVP';
      } else if (isLastLine) {
        if (size === 1) label = 'TĐ';
        else if (i === 0 || i === size - 1) label = 'CT';
        else label = 'TĐ';
      } else if (lineIdx === lineCount - 2 && lineCount >= 3) {
        // tuyến sát hàng công nhất (vd hàng "3" trong 4-2-3-1) — thường là tiền vệ công
        label = 'TVC';
      }
      slots.push({ id: `l${lineIdx}-${i}`, label, x, y });
    }
  });

  return slots;
}

/** Lấy sơ đồ vị trí: ưu tiên mẫu có sẵn (bố cục đẹp, đã tay chỉnh), sinh tự động nếu không có. */
export function getFormationSlots(formation: string): FormationSlot[] {
  return FORMATIONS[formation] || generateFormationSlots(formation);
}
