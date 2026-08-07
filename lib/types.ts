export type ArticleStatus = 'draft' | 'published' | 'hidden' | 'rejected';

export type CommentStatus = 'pending' | 'approved' | 'hidden';

export type Article = {
  id: string;
  slug?: string | null;
  source_id?: string | null;
  source_name: string;
  source_country: string | null;
  original_title: string;
  translated_title: string;
  original_description?: string | null;
  summary_vi: string | null;
  content_vi: string | null;
  image_url: string | null;
  original_url: string;
  category: string;
  reliability: string;
  author_name: string | null;
  published_at: string | null;
  status: ArticleStatus;
  view_count?: number;
  is_featured: boolean;
  is_transfer_news: boolean;
  created_at?: string;
  updated_at?: string;
};

export type NewsSource = {
  id: string;
  name: string;
  country: string;
  website_url: string | null;
  rss_url: string | null;
  logo_url: string | null;
  reliability: string;
  is_active: boolean;
};

export type FixtureLineup = {
  formation: string;
  assignments: Record<string, string | null>;
  source?: 'auto' | 'manual';
  syncedAt?: string;
};

export type Fixture = {
  id: string;
  competition: string;
  home_team: string;
  away_team: string;
  home_logo_url: string | null;
  away_logo_url: string | null;
  stadium: string | null;
  match_time: string;
  status: string;
  home_score: number | null;
  away_score: number | null;
  events?: FixtureEvent[];
  lineup?: FixtureLineup | null;
};

export type Player = {
  id: string;
  name: string;
  slug: string;
  shirt_number: number | null;
  position: string | null;
  nationality: string | null;
  image_url: string | null;
  date_of_birth?: string | null;
  is_active: boolean;
  bio?: string | null;
  birthplace?: string | null;
  height_cm?: number | null;
  /** Sự nghiệp trẻ — nhiều dòng: "Câu lạc bộ | Từ năm | Đến năm" */
  youth_clubs?: string | null;
  /** Sự nghiệp chuyên nghiệp — nhiều dòng: "Câu lạc bộ | Từ năm | Đến năm | Số trận | Số bàn" */
  career_clubs?: string | null;
  /** Đội tuyển quốc gia — nhiều dòng: "Đội tuyển | Từ năm | Đến năm | Số trận | Số bàn" */
  national_team?: string | null;
  /** Nhiều dòng, mỗi dòng: "Tên danh hiệu | Số lần | Các năm cách nhau bởi dấu phẩy" */
  honors?: string | null;
};

export const CATEGORIES = ['Tin mới', 'Chuyển nhượng', 'Đội hình', 'Chấn thương', 'Phỏng vấn'] as const;
export const RELIABILITY_LEVELS = ['Uy tín', 'Khá uy tín', 'Tin đồn'] as const;
export const PLAYER_POSITIONS = ['Thủ môn', 'Hậu vệ', 'Tiền vệ', 'Tiền đạo'] as const;
export const FIXTURE_STATUSES = ['scheduled', 'live', 'finished', 'postponed'] as const;
export const COMPETITIONS = ['La Liga', 'UEFA Champions League', 'Copa del Rey', 'Giao hữu'] as const;

export type FixtureEventType = 'goal' | 'yellow' | 'red' | 'sub';
export const FIXTURE_EVENT_TYPES: { value: FixtureEventType; label: string }[] = [
  { value: 'goal', label: 'Bàn thắng' },
  { value: 'yellow', label: 'Thẻ vàng' },
  { value: 'red', label: 'Thẻ đỏ' },
  { value: 'sub', label: 'Thay người' },
];

export type FixtureEvent = {
  minute: string; // vd "45+2"
  type: FixtureEventType;
  team: 'home' | 'away';
  player: string;
  note?: string; // vd "kiến tạo: ...", "vào sân thay ..."
};

export type Comment = {
  id: string;
  article_id: string;
  author_name: string;
  content: string;
  likes: number;
  status?: CommentStatus;
  created_at: string;
};
