import { aiConfig, aiCompleteJson } from './ai';
import { fetchRealMadridPlayerImage } from './realmadrid';

export type WikipediaPlayerDraft = {
  name: string;
  bio: string;
  birthplace: string | null;
  height_cm: number | null;
  date_of_birth: string | null;
  nationality: string | null;
  /** "Câu lạc bộ | Từ năm | Đến năm" — dùng cho sự nghiệp trẻ */
  youth_clubs: string;
  /** "Câu lạc bộ | Từ năm | Đến năm | Số trận | Số bàn" */
  career_clubs: string;
  /** "Đội tuyển | Từ năm | Đến năm | Số trận | Số bàn" */
  national_team: string;
  /** "Tên danh hiệu | Số lần | Các năm" */
  honors: string;
  image_url: string | null;
  /** "realmadrid" nếu lấy được ảnh thi đấu mới nhất từ realmadrid.com, "wikipedia" nếu chỉ có ảnh đại diện Wikipedia. */
  image_source: 'realmadrid' | 'wikipedia' | null;
  wikipedia_url: string;
  source_lang: 'vi' | 'en';
};

type WikiSearchHit = { title: string };

async function wikiFetchJson(lang: string, params: Record<string, string>) {
  const url = new URL(`https://${lang}.wikipedia.org/w/api.php`);
  url.searchParams.set('format', 'json');
  url.searchParams.set('origin', '*');
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString(), { signal: AbortSignal.timeout(15000) });
  if (!res.ok) throw new Error(`Wikipedia API lỗi (HTTP ${res.status})`);
  return res.json();
}

async function searchTitle(lang: string, name: string): Promise<string | null> {
  const json = await wikiFetchJson(lang, { action: 'query', list: 'search', srsearch: name, srlimit: '1' });
  const hits: WikiSearchHit[] = json?.query?.search || [];
  return hits[0]?.title || null;
}

async function getSummary(lang: string, title: string) {
  const res = await fetch(`https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`, {
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) return null;
  return res.json();
}

async function getWikitextSection(lang: string, title: string, section: number): Promise<string> {
  const json = await wikiFetchJson(lang, { action: 'parse', page: title, prop: 'wikitext', section: String(section), redirects: 'true' });
  return json?.parse?.wikitext?.['*'] || '';
}

type WikiSection = { index: string; line: string };

async function getSections(lang: string, title: string): Promise<WikiSection[]> {
  const json = await wikiFetchJson(lang, { action: 'parse', page: title, prop: 'sections', redirects: 'true' });
  return json?.parse?.sections || [];
}

const HONOURS_PATTERNS = [
  'honour', 'honor', 'title', 'trophy', 'trophies', 'award', // en
  'danh hiệu', 'giải thưởng', // vi
];
const CAREER_STATS_PATTERNS = ['career statistics', 'thống kê sự nghiệp'];

function findSectionIndex(sections: WikiSection[], patterns: string[]): number | null {
  for (const s of sections) {
    const line = s.line.toLowerCase();
    if (patterns.some((p) => line.includes(p))) return Number(s.index);
  }
  return null;
}

/**
 * Lấy phần wikitext CẦN THIẾT để trích xuất dữ liệu — thay vì cắt 12000 ký tự
 * đầu của TOÀN BỘ bài viết (dễ bị cắt mất trước khi tới phần "Honours" ở các
 * bài dài, nhiều chú thích). Lấy riêng: (1) phần mở đầu + infobox (chứa sẵn
 * career clubs/personal info), (2) mục "Career statistics" nếu có, (3) mục
 * "Honours"/"Danh hiệu" nếu có — mỗi mục lấy riêng nên không bị mục khác
 * "nuốt mất" chỗ trong giới hạn ký tự.
 */
async function getRelevantWikitext(lang: string, title: string): Promise<string> {
  const [lead, sections] = await Promise.all([getWikitextSection(lang, title, 0), getSections(lang, title)]);

  const parts = [`== Mở đầu + Infobox (chứa sẵn tên CLB/năm thi đấu/số trận/số bàn) ==\n${lead.slice(0, 9000)}`];

  const honoursIdx = findSectionIndex(sections, HONOURS_PATTERNS);
  if (honoursIdx !== null) {
    const honours = await getWikitextSection(lang, title, honoursIdx);
    // Mục Honours thường chứa nhiều mục con lồng bên trong (theo từng CLB/đội
    // tuyển/cấp độ trẻ, và mục "Cá nhân"/"Individual" ở cuối). KHÔNG cắt ngắn
    // mục này — cắt ở đây là nguyên nhân chính khiến các danh hiệu ở cuối mục
    // (thường là "Cá nhân") bị rơi mất trước khi tới tay AI.
    parts.push(`== Honours (danh hiệu) — TOÀN BỘ mục này, gồm cả các mục con lồng bên trong như "Cá nhân"/"Individual" ==\n${honours}`);
  } else {
    // Không tìm thấy mục Honours riêng — thử lấy mục thống kê sự nghiệp,
    // đôi khi honours được gộp chung ở đó với tên mục khác thường.
    const statsIdx = findSectionIndex(sections, CAREER_STATS_PATTERNS);
    if (statsIdx !== null) {
      const stats = await getWikitextSection(lang, title, statsIdx);
      parts.push(`== Career statistics ==\n${stats}`);
    }
  }

  return parts.join('\n\n');
}

/**
 * Tìm bài viết Wikipedia của cầu thủ: ưu tiên bản tiếng Việt, nếu không có
 * (hoặc quá sơ sài) thì dùng bản tiếng Anh.
 */
async function findArticle(name: string): Promise<{ lang: 'vi' | 'en'; title: string } | null> {
  const viTitle = await searchTitle('vi', name);
  if (viTitle) {
    const summary = await getSummary('vi', viTitle);
    if (summary?.extract && summary.extract.length > 200) {
      return { lang: 'vi', title: viTitle };
    }
  }
  const enTitle = await searchTitle('en', name);
  if (enTitle) return { lang: 'en', title: enTitle };
  if (viTitle) return { lang: 'vi', title: viTitle };
  return null;
}

/**
 * Lấy thông tin cầu thủ từ Wikipedia (tiểu sử, ngày sinh, nơi sinh, chiều cao,
 * sự nghiệp CLB/đội tuyển, danh hiệu) và dùng AI để chuẩn hoá thành đúng định
 * dạng các trường của bảng `players`. Luôn trả về bản NHÁP — admin cần xem lại
 * trước khi lưu, vì infobox Wikipedia có thể thiếu/lỗi thời một phần.
 */
export async function fetchPlayerImageUrl(name: string): Promise<string | null> {
  if (!name?.trim()) return null;

  try {
    const rm = await fetchRealMadridPlayerImage(name);
    if (rm?.image_url) return rm.image_url;
  } catch {
    // ignore
  }

  for (const lang of ['vi', 'en'] as const) {
    const title = await searchTitle(lang, name);
    if (!title) continue;
    const summary = await getSummary(lang, title);
    if (summary?.thumbnail?.source) return summary.thumbnail.source;
    if (summary?.originalimage?.source) return summary.originalimage.source;
  }

  return null;
}

export async function fetchPlayerFromWikipedia(name: string): Promise<WikipediaPlayerDraft> {
  const article = await findArticle(name);
  if (!article) throw new Error(`Không tìm thấy bài viết Wikipedia cho "${name}"`);

  const { lang, title } = article;
  const [summary, wikitext] = await Promise.all([getSummary(lang, title), getRelevantWikitext(lang, title)]);

  const wikipediaUrl = `https://${lang}.wikipedia.org/wiki/${encodeURIComponent(title.replace(/ /g, '_'))}`;
  let image = summary?.thumbnail?.source || summary?.originalimage?.source || null;
  let imageSource: 'realmadrid' | 'wikipedia' | null = image ? 'wikipedia' : null;

  // Ưu tiên ảnh thi đấu mới nhất tại Real Madrid từ trang chủ chính thức thay vì
  // ảnh đại diện Wikipedia (thường là ảnh cũ/ảnh ở CLB trước). Nếu realmadrid.com
  // không có (cầu thủ đã rời CLB, hoặc trang đổi cấu trúc) thì vẫn giữ ảnh Wikipedia.
  try {
    const rm = await fetchRealMadridPlayerImage(name);
    if (rm?.image_url) {
      image = rm.image_url;
      imageSource = 'realmadrid';
    }
  } catch {
    // Bỏ qua — không chặn luồng chính chỉ vì lấy ảnh thất bại.
  }

  const cfg = aiConfig();
  if (!cfg) {
    // Không có API key AI — trả về phần tóm tắt thô, admin tự điền chi tiết còn lại.
    return {
      name: title,
      bio: (summary?.extract || '').slice(0, 800),
      birthplace: null,
      height_cm: null,
      date_of_birth: null,
      nationality: null,
      youth_clubs: '',
      career_clubs: '',
      national_team: '',
      honors: '',
      image_url: image,
      image_source: imageSource,
      wikipedia_url: wikipediaUrl,
      source_lang: lang,
    };
  }

  const prompt = `Bạn nhận được nội dung thô (định dạng wikitext) của bài viết Wikipedia về 1 cầu thủ bóng đá. Hãy đọc và trích xuất thông tin thành JSON, viết bằng tiếng Việt (kể cả khi bài gốc là tiếng Anh — hãy dịch/viết lại).

Trả về đúng các khoá sau, không thêm chữ nào khác ngoài JSON:
- "bio": tiểu sử ngắn 3-5 câu bằng tiếng Việt, giới thiệu cầu thủ (không sao chép nguyên văn, viết lại bằng lời văn tự nhiên).
- "birthplace": nơi sinh (thành phố, quốc gia), null nếu không rõ.
- "height_cm": chiều cao tính bằng cm (số nguyên), null nếu không rõ.
- "date_of_birth": ngày sinh dạng "YYYY-MM-DD", null nếu không rõ.
- "nationality": quốc tịch bằng tiếng Việt (vd "Anh", "Pháp", "Brazil"), null nếu không rõ.
- "youth_clubs": sự nghiệp cầu thủ trẻ, MỖI DÒNG 1 CLB theo định dạng CHÍNH XÁC "Tên CLB | Từ năm | Đến năm" (bỏ trống nếu không có, không ghi số trận/bàn ở mục này).
- "career_clubs": sự nghiệp chuyên nghiệp, MỖI DÒNG 1 CLB theo định dạng CHÍNH XÁC "Tên CLB | Từ năm | Đến năm | Số trận | Số bàn" (để trống Số trận/Số bàn nếu không rõ, nhưng vẫn giữ đủ 5 phần ngăn bởi dấu |).
- "national_team": sự nghiệp đội tuyển quốc gia (mọi cấp độ), MỖI DÒNG theo định dạng CHÍNH XÁC "Tên đội tuyển | Từ năm | Đến năm | Số trận | Số bàn".
- "honors": TOÀN BỘ danh hiệu/giải thưởng đã giành — bắt buộc quét hết mục Honours/Danh hiệu, kể cả các mục con lồng bên trong, không được dừng giữa chừng hay bỏ sót mục nào vì lý do độ dài. Cụ thể phải gồm:
  (a) danh hiệu tập thể ở MỌI CLB đã từng khoác áo (kể cả các CLB nhỏ/cũ, không chỉ CLB hiện tại),
  (b) danh hiệu tập thể ở MỌI cấp đội tuyển quốc gia (trẻ U-15/U-17/U-20/U-23... và đội tuyển quốc gia chính thức),
  (c) TOÀN BỘ danh hiệu/giải thưởng CÁ NHÂN (thường nằm ở mục con "Cá nhân"/"Individual" ở cuối, ví dụ: Vua phá lưới, Cầu thủ xuất sắc nhất, Đội hình tiêu biểu/Team of the season, Cầu thủ trẻ xuất sắc nhất, Cầu thủ xuất sắc nhất tháng, Quả bóng vàng giải đấu...). KHÔNG được bỏ mục "Cá nhân" ra ngoài — đây là lỗi hay gặp nhất.
  MỖI DÒNG 1 danh hiệu, theo định dạng CHÍNH XÁC "Tên danh hiệu | Số lần | Các năm cách nhau bởi dấu phẩy" (vd "La Liga | 2 | 2022, 2024"). Với giải thưởng cá nhân không có "số lần" rõ ràng theo mùa, vẫn đếm số lần xuất hiện trong danh sách năm (vd được vào Đội hình tiêu biểu La Liga 2 mùa thì ghi "Đội hình tiêu biểu La Liga | 2 | 2021-22, 2022-23").
  KHÔNG đưa vào các kết quả á quân/về nhì/thua chung kết (ví dụ "Copa América á quân" KHÔNG phải danh hiệu, bỏ qua) — chỉ tính danh hiệu đã thực sự VÔ ĐỊCH/GIÀNH ĐƯỢC.
- Nếu 1 mục hoàn toàn không có dữ liệu, trả về chuỗi rỗng "" cho mục đó (không bịa số liệu).

Tóm tắt bài viết: ${(summary?.extract || '').slice(0, 1000)}

Nội dung wikitext (đã trích riêng phần mở đầu/infobox và mục danh hiệu/thống kê, không phải toàn bộ bài):
${wikitext.slice(0, 40000)}`;

  try {
    const parsed = await aiCompleteJson<{
      bio?: string;
      birthplace?: string | null;
      height_cm?: number | null;
      date_of_birth?: string | null;
      nationality?: string | null;
      youth_clubs?: string;
      career_clubs?: string;
      national_team?: string;
      honors?: string;
    }>(cfg, prompt, 0.2);

    return {
      name: title,
      bio: parsed.bio || (summary?.extract || '').slice(0, 800),
      birthplace: parsed.birthplace || null,
      height_cm: typeof parsed.height_cm === 'number' ? parsed.height_cm : null,
      date_of_birth: parsed.date_of_birth || null,
      nationality: parsed.nationality || null,
      youth_clubs: parsed.youth_clubs || '',
      career_clubs: parsed.career_clubs || '',
      national_team: parsed.national_team || '',
      honors: parsed.honors || '',
      image_url: image,
      image_source: imageSource,
      wikipedia_url: wikipediaUrl,
      source_lang: lang,
    };
  } catch {
    // AI trích xuất lỗi — vẫn trả về phần tóm tắt thô để admin không mất công tìm lại từ đầu.
    return {
      name: title,
      bio: (summary?.extract || '').slice(0, 800),
      birthplace: null,
      height_cm: null,
      date_of_birth: null,
      nationality: null,
      youth_clubs: '',
      career_clubs: '',
      national_team: '',
      honors: '',
      image_url: image,
      image_source: imageSource,
      wikipedia_url: wikipediaUrl,
      source_lang: lang,
    };
  }
}
