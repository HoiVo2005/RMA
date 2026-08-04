import { createClient } from '@supabase/supabase-js';

/**
 * Cấu hình tổng thể của website — chỉnh tại /admin/cai-dat, lưu trong
 * site_settings.site_config (cùng cơ chế key-value với club_info, starting_lineup...).
 * Mọi field đều có giá trị mặc định bên dưới nên chưa cấu hình gì cũng không lỗi trang.
 */

export type SiteFeatures = {
  comments: boolean; // bật/tắt khung bình luận ở trang chi tiết bài viết
  saveArticles: boolean; // bật/tắt nút "Lưu bài viết" (bookmark) — cũng ẩn/hiện tab "Đã lưu" trên menu
  notifications: boolean; // bật/tắt chuông thông báo (push notifications)
  predictions: boolean; // bật/tắt widget dự đoán tỷ số
};

// Bật/tắt từng mục trên menu điều hướng (header desktop + thanh tab mobile). "Trang chủ" luôn hiển thị
// nên không có trong danh sách này.
export type SiteMenu = {
  tinMoi: boolean;
  chuyenNhuong: boolean;
  lichThiDau: boolean;
  doiHinh: boolean;
  danhChoBan: boolean;
  nguonTin: boolean;
};

// Link mạng xã hội hiển thị ở footer — để trống field nào thì ẩn icon đó.
export type SiteSocialLinks = {
  facebook: string;
  x: string; // Twitter/X
  youtube: string;
  tiktok: string;
  instagram: string;
};

export type SiteFooter = {
  aboutText: string; // đoạn giới thiệu ngắn trong footer (thay cho đoạn cố định trong code)
  copyrightText: string; // dòng bản quyền cuối footer, để trống thì tự sinh "© {năm} {siteName}"
};

export type SiteSeo = {
  keywords: string; // từ khoá SEO, phân cách bằng dấu phẩy — đưa vào thẻ meta keywords
  ogImage: string; // ảnh đại diện khi chia sẻ lên Facebook/Zalo/X (Open Graph) — để trống thì dùng logo
};

// Mã theo dõi lượng truy cập / quảng cáo — dán ID vào đây thay vì sửa code mỗi khi đổi.
export type SiteAnalytics = {
  googleAnalyticsId: string; // vd: G-XXXXXXXXXX — để trống thì không nhúng Google Analytics
  facebookPixelId: string; // để trống thì không nhúng Facebook Pixel
};

export type SiteSettings = {
  siteName: string;
  tagline: string; // dòng phụ nhỏ cạnh tên site (header, footer)
  siteDescription: string; // mô tả SEO mặc định (thẻ meta description)
  logoUrl: string; // để trống thì dùng biểu tượng ♛ mặc định
  faviconUrl: string;
  primaryColor: string; // hex — ánh xạ biến CSS --gold-500
  primaryColorLight: string; // hex — ánh xạ biến CSS --gold-400
  backgroundColor: string; // hex — ánh xạ biến CSS --bg
  fontFamily: 'Inter' | 'Sora' | 'Georgia' | 'System';
  bannerUrl: string; // ảnh banner quảng bá phía trên trang chủ (để trống = ẩn)
  bannerTitle: string;
  bannerSubtitle: string;
  bannerLink: string;
  contactEmail: string; // email liên hệ hiển thị ở footer, để trống thì ẩn
  articlesPerPage: number; // số bài viết mỗi trang ở "Tin mới" và các trang danh sách phân trang
  ingestKeywords: string; // từ khoá lọc bài liên quan khi tự động lấy tin RSS, cách nhau bằng dấu phẩy
  socialLinks: SiteSocialLinks;
  footer: SiteFooter;
  seo: SiteSeo;
  analytics: SiteAnalytics;
  features: SiteFeatures;
  menu: SiteMenu;
  maintenance: {
    enabled: boolean;
    message: string;
  };
};

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  siteName: 'Madridista News VN',
  tagline: 'Hala Madrid, tin tức 24/7',
  siteDescription:
    'Tổng hợp và dịch tin tức Real Madrid từ các nguồn uy tín Tây Ban Nha, Pháp, Đức sang tiếng Việt, cập nhật liên tục.',
  logoUrl: '',
  faviconUrl: '/icons/icon-192.png',
  primaryColor: '#f2b807',
  primaryColorLight: '#ffd25f',
  backgroundColor: '#eef7ff',
  fontFamily: 'Inter',
  bannerUrl: '',
  bannerTitle: '',
  bannerSubtitle: '',
  bannerLink: '',
  contactEmail: '',
  articlesPerPage: 20,
  ingestKeywords: 'real madrid, los blancos, los merengues, bernabeu, bernabéu, madrid',
  socialLinks: { facebook: '', x: '', youtube: '', tiktok: '', instagram: '' },
  footer: {
    aboutText:
      "Nội dung được tổng hợp, dịch và biên soạn lại tự động từ các nguồn tin quốc tế uy tín (Marca, AS, Relevo, L'Équipe, Kicker...). Đây là bản tóm tắt và diễn giải lại, không sao chép nguyên văn bài gốc — vui lòng nhấn vào liên kết \"Nguồn\" trong mỗi bài để đọc bài viết đầy đủ.",
    copyrightText: '',
  },
  seo: { keywords: 'real madrid, tin tức real madrid, hala madrid, bóng đá tây ban nha, la liga', ogImage: '' },
  analytics: { googleAnalyticsId: '', facebookPixelId: '' },
  features: { comments: true, saveArticles: true, notifications: true, predictions: true },
  menu: { tinMoi: true, chuyenNhuong: true, lichThiDau: true, doiHinh: true, danhChoBan: true, nguonTin: true },
  maintenance: { enabled: false, message: 'Website đang bảo trì để nâng cấp, quay lại sau nhé!' },
};

/** Trộn dữ liệu đã lưu đè lên nền mặc định (đề phòng thiếu field khi mới thêm setting mới). */
export function mergeSiteSettings(saved: Partial<SiteSettings> | null | undefined): SiteSettings {
  if (!saved) return DEFAULT_SITE_SETTINGS;
  return {
    ...DEFAULT_SITE_SETTINGS,
    ...saved,
    socialLinks: { ...DEFAULT_SITE_SETTINGS.socialLinks, ...(saved.socialLinks || {}) },
    backgroundColor: saved.backgroundColor ?? DEFAULT_SITE_SETTINGS.backgroundColor,
    fontFamily: saved.fontFamily ?? DEFAULT_SITE_SETTINGS.fontFamily,
    footer: { ...DEFAULT_SITE_SETTINGS.footer, ...(saved.footer || {}) },
    seo: { ...DEFAULT_SITE_SETTINGS.seo, ...(saved.seo || {}) },
    analytics: { ...DEFAULT_SITE_SETTINGS.analytics, ...(saved.analytics || {}) },
    features: { ...DEFAULT_SITE_SETTINGS.features, ...(saved.features || {}) },
    menu: { ...DEFAULT_SITE_SETTINGS.menu, ...(saved.menu || {}) },
    maintenance: { ...DEFAULT_SITE_SETTINGS.maintenance, ...(saved.maintenance || {}) },
  };
}

function client() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

/** Lấy cấu hình website hiện tại — dùng ở server components (layout, trang chủ, middleware...). */
export async function getSiteSettings(): Promise<SiteSettings> {
  const c = client();
  if (!c) return DEFAULT_SITE_SETTINGS;
  const { data } = await c.from('site_settings').select('setting_value').eq('setting_key', 'site_config').maybeSingle();
  return mergeSiteSettings(data?.setting_value as Partial<SiteSettings> | null);
}
