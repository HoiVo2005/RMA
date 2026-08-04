import Parser from 'rss-parser';
import { createSupabaseAdmin } from './supabase';
import { translateArticle } from './translate';
import { scrapeArticle } from './scrape';
import { getSiteSettings, DEFAULT_SITE_SETTINGS } from './site-settings';
import type { NewsSource } from './types';

const parser = new Parser({ timeout: 15000 });

/**
 * Từ khoá lọc bài liên quan lấy từ Cài đặt (/admin/cai-dat → "ingestKeywords"), cách nhau bằng
 * dấu phẩy — chỉnh ở đó khi cần thêm/bớt từ khoá mà không phải sửa code.
 */
function isRelevant(title = '', extra = '', keywords: string[]) {
  const s = (title + ' ' + extra).toLowerCase();
  return keywords.some((k) => s.includes(k));
}

export type IngestResult = {
  ok: boolean;
  sources: number;
  found: number;
  inserted: number;
  skipped: number;
  failed: number;
};

/**
 * Duyệt qua toàn bộ nguồn tin đang bật + có RSS, lấy bài viết liên quan Real Madrid,
 * tải trang gốc để lấy đầy đủ ảnh + nội dung, dịch sang tiếng Việt và lưu vào Supabase
 * (trạng thái "published"). Bỏ qua bài đã tồn tại theo original_url.
 */
export async function runIngest(): Promise<IngestResult> {
  const db = createSupabaseAdmin();
  const settings = await getSiteSettings();
  const keywordsRaw = settings.ingestKeywords || DEFAULT_SITE_SETTINGS.ingestKeywords;
  const keywords = keywordsRaw
    .split(',')
    .map((k) => k.trim().toLowerCase())
    .filter(Boolean);

  const { data: sources, error } = await db
    .from('news_sources')
    .select('*')
    .eq('is_active', true)
    .not('rss_url', 'is', null);

  if (error) throw new Error(error.message);

  const { data: log } = await db.from('cron_logs').insert({ job_name: 'rss_ingest', status: 'running' }).select().single();

  let found = 0,
    inserted = 0,
    skipped = 0,
    failed = 0;

  for (const source of (sources || []) as NewsSource[]) {
    try {
      const feed = await parser.parseURL(source.rss_url!);
      const sortedItems = [...(feed.items || [])].sort((a, b) => {
        const ta = new Date(a.isoDate || a.pubDate || 0).getTime();
        const tb = new Date(b.isoDate || b.pubDate || 0).getTime();
        return tb - ta; // mới nhất trước
      });

      for (const item of sortedItems) {
        found++;
        const rssDesc = item.contentSnippet || item.content || (item as any).summary || '';
        if (!item.link || !item.title || !isRelevant(item.title, rssDesc, keywords)) {
          skipped++;
          continue;
        }

        // Bỏ qua nếu đã có trong CSDL
        const { data: existing } = await db.from('articles').select('id').eq('original_url', item.link).maybeSingle();
        if (existing) {
          skipped++;
          continue;
        }

        try {
          let bodyText = rssDesc;
          let image: string | null = (item as any).enclosure?.url || null;
          let author: string | null = (item as any).creator || null;

          try {
            const full = await scrapeArticle(item.link);
            bodyText = full.bodyText || rssDesc;
            image = image || full.image;
            author = author || full.author;
          } catch {
            // Nếu không tải được trang gốc, vẫn dùng nội dung tóm tắt từ RSS
          }

          const vi = await translateArticle({ title: item.title, description: rssDesc, bodyText });

          const payload = {
            source_id: source.id,
            source_name: source.name,
            source_country: source.country,
            original_title: item.title,
            translated_title: vi.titleVi,
            original_description: rssDesc.slice(0, 3000),
            summary_vi: vi.summaryVi,
            content_vi: vi.contentVi,
            image_url: image,
            original_url: item.link,
            category: vi.category,
            reliability: source.reliability,
            author_name: author,
            published_at: item.isoDate || item.pubDate || new Date().toISOString(),
            status: 'published',
            is_transfer_news: vi.isTransferNews,
          };

          const { error: insertError } = await db.from('articles').insert(payload);
          if (insertError) failed++;
          else inserted++;
        } catch {
          failed++;
        }
      }
    } catch {
      failed++;
    }
  }

  if (log) {
    await db
      .from('cron_logs')
      .update({
        total_found: found,
        total_inserted: inserted,
        total_skipped: skipped,
        total_failed: failed,
        status: failed ? 'completed_with_errors' : 'completed',
        finished_at: new Date().toISOString(),
      })
      .eq('id', log.id);
  }

  return { ok: true, sources: sources?.length || 0, found, inserted, skipped, failed };
}

/**
 * Lấy 1 bài viết bất kỳ theo URL do admin dán vào, tải toàn bộ nội dung + ảnh
 * và dịch sang tiếng Việt. Trả về bài viết ở trạng thái "draft" để admin xem lại
 * trước khi xuất bản.
 */
export async function ingestSingleUrl(url: string, sourceOverride?: { name: string; country?: string; reliability?: string }) {
  const full = await scrapeArticle(url);
  const vi = await translateArticle({ title: full.title, description: full.description, bodyText: full.bodyText });

  let hostname = '';
  try {
    hostname = new URL(url).hostname.replace('www.', '');
  } catch {
    // ignore
  }

  return {
    source_name: sourceOverride?.name || hostname || 'Không rõ',
    source_country: sourceOverride?.country || null,
    original_title: full.title,
    translated_title: vi.titleVi,
    original_description: full.description.slice(0, 3000),
    summary_vi: vi.summaryVi,
    content_vi: vi.contentVi,
    image_url: full.image,
    original_url: url,
    category: vi.category,
    reliability: sourceOverride?.reliability || 'Uy tín',
    author_name: full.author,
    published_at: full.publishedAt || new Date().toISOString(),
    status: 'draft' as const,
    is_transfer_news: vi.isTransferNews,
    is_featured: false,
  };
}
