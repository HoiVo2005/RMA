import { createClient } from '@supabase/supabase-js';

/**
 * Thông tin tổng quan về CLB. Giá trị mặc định bên dưới chỉ dùng làm "nền" khi
 * chưa cấu hình gì trong CSDL (site_settings.club_info) — mọi thứ đều có thể
 * chỉnh sửa tại /admin/thong-tin-clb mà không cần sửa code, kể cả ảnh áo đấu
 * (dán link ảnh thật thay cho ô màu). Vị trí trên bảng xếp hạng La Liga vẫn
 * lấy TỰ ĐỘNG từ dữ liệu đồng bộ (`getStandings`) chứ không nằm ở đây.
 */

export type ClubKit = { label: string; primary: string; secondary: string; image_url?: string };

export type ClubInfo = {
  name: string;
  fullName: string;
  logoUrl?: string;
  nicknames: string[];
  founded: string; // YYYY-MM-DD
  foundedLabel: string;
  foundedAs: string;
  stadium: string;
  capacity: number;
  president: string;
  headCoach: string;
  website: string;
  colors: {
    home: ClubKit;
    away: ClubKit;
    third: ClubKit;
  };
};

export const DEFAULT_CLUB_INFO: ClubInfo = {
  name: 'Real Madrid',
  fullName: 'Real Madrid Club de Fútbol',
  logoUrl: '',
  nicknames: ['Los Blancos (Màu Trắng)', 'Los Merengues', 'Los Vikingos (Những người Viking)', 'La Casa Blanca (Nhà Trắng)', 'Reyes de Europa (Vua châu Âu)'],
  founded: '1902-03-06',
  foundedLabel: '6 tháng 3 năm 1902',
  foundedAs: 'Câu lạc bộ bóng đá Madrid',
  stadium: 'Sân vận động Santiago Bernabéu',
  capacity: 78297,
  president: 'Florentino Pérez',
  headCoach: 'Jose Mourinho',
  website: 'https://www.realmadrid.com',
  colors: {
    home: { label: 'Màu áo sân nhà', primary: '#ffffff', secondary: '#f2b807', image_url: '' },
    away: { label: 'Màu áo sân khách', primary: '#0d1330', secondary: '#0d1330', image_url: '' },
    third: { label: 'Màu áo thứ ba', primary: '#3a7bd5', secondary: '#ffffff', image_url: '' },
  },
};

/** Giữ export cũ (CLUB_INFO) để không phải sửa những nơi khác đang import nó làm hằng số tĩnh. */
export const CLUB_INFO = DEFAULT_CLUB_INFO;

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

/** Trộn dữ liệu đã lưu trong CSDL đè lên nền mặc định (đề phòng thiếu field khi mới nâng cấp). */
function mergeClubInfo(saved: Partial<ClubInfo> | null | undefined): ClubInfo {
  if (!saved) return DEFAULT_CLUB_INFO;
  return {
    ...DEFAULT_CLUB_INFO,
    ...saved,
    colors: {
      home: { ...DEFAULT_CLUB_INFO.colors.home, ...(saved.colors?.home || {}) },
      away: { ...DEFAULT_CLUB_INFO.colors.away, ...(saved.colors?.away || {}) },
      third: { ...DEFAULT_CLUB_INFO.colors.third, ...(saved.colors?.third || {}) },
    },
  };
}

/** Lấy thông tin CLB hiện tại — ưu tiên dữ liệu trong CSDL (site_settings.club_info), có sẵn giá trị mặc định. */
export async function getClubInfo(): Promise<ClubInfo> {
  const c = client();
  if (!c) return DEFAULT_CLUB_INFO;

  const { data } = await c.from('site_settings').select('setting_value').eq('setting_key', 'club_info').maybeSingle();
  return mergeClubInfo(data?.setting_value as Partial<ClubInfo> | null);
}

/** Tính số năm đã trôi qua kể từ ngày thành lập, tự cập nhật theo thời gian thực. */
export function yearsSinceFounded(founded: string = DEFAULT_CLUB_INFO.founded): number {
  const foundedDate = new Date(founded);
  const now = new Date();
  let years = now.getFullYear() - foundedDate.getFullYear();
  const beforeAnniversary =
    now.getMonth() < foundedDate.getMonth() || (now.getMonth() === foundedDate.getMonth() && now.getDate() < foundedDate.getDate());
  if (beforeAnniversary) years -= 1;
  return years;
}
