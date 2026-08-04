import * as cheerio from 'cheerio';

export type ScrapedArticle = {
  title: string;
  description: string;
  image: string | null;
  bodyText: string;
  author: string | null;
  publishedAt: string | null;
};

function meta($: cheerio.CheerioAPI, ...names: string[]): string {
  for (const n of names) {
    const v =
      $(`meta[property="${n}"]`).attr('content') ||
      $(`meta[name="${n}"]`).attr('content');
    if (v) return v.trim();
  }
  return '';
}

/**
 * Tải trang bài viết gốc và trích xuất tiêu đề, mô tả, ảnh đại diện và nội dung
 * chính (dạng văn bản thuần) để phục vụ dịch thuật. Chỉ lấy đủ dữ liệu cần thiết,
 * không lưu lại HTML gốc.
 */
export async function scrapeArticle(url: string): Promise<ScrapedArticle> {
  const res = await fetch(url, {
    headers: {
      'user-agent':
        'Mozilla/5.0 (compatible; MadridistaNewsVNBot/1.0; +https://madridista-news-vn.example/bot)',
      accept: 'text/html,application/xhtml+xml',
    },
    redirect: 'follow',
    signal: AbortSignal.timeout(15000),
  });
  if (!res.ok) throw new Error(`Không tải được trang (HTTP ${res.status})`);
  const html = await res.text();
  const $ = cheerio.load(html);

  const title = meta($, 'og:title', 'twitter:title') || $('h1').first().text().trim() || $('title').text().trim();

  const description =
    meta($, 'og:description', 'twitter:description', 'description') || '';

  const image = meta($, 'og:image', 'og:image:secure_url', 'twitter:image') || null;

  const author =
    meta($, 'article:author', 'author') || $('[rel="author"]').first().text().trim() || null;

  const publishedAt =
    meta($, 'article:published_time', 'og:updated_time') ||
    $('time[datetime]').first().attr('datetime') ||
    null;

  // Loại bỏ phần thừa trước khi lấy nội dung chính
  $('script, style, nav, header, footer, aside, form, iframe, noscript').remove();

  const containerSelectors = [
    'article',
    '[itemprop="articleBody"]',
    '.article-body',
    '.article__body',
    '.entry-content',
    'main',
  ];
  let container: ReturnType<typeof $> | null = null;
  for (const sel of containerSelectors) {
    const el = $(sel).first();
    if (el.length && el.text().trim().length > 200) {
      container = el;
      break;
    }
  }
  const scope = container ?? $('body');

  const paragraphs = scope
    .find('p')
    .map((_, el) => $(el).text().replace(/\s+/g, ' ').trim())
    .get()
    .filter((t) => t.length > 40);

  const bodyText = paragraphs.slice(0, 20).join('\n\n').slice(0, 9000);

  return {
    title: title || '',
    description: description || bodyText.slice(0, 300),
    image,
    bodyText,
    author,
    publishedAt,
  };
}
