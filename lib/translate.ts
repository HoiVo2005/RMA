import { aiConfig } from './ai';

export type TranslatedArticle = {
  titleVi: string;
  summaryVi: string;
  contentVi: string;
  category: string;
  isTransferNews: boolean;
};

const CATEGORY_OPTIONS = ['Tin mới', 'Chuyển nhượng', 'Đội hình', 'Chấn thương', 'Phỏng vấn'];

/**
 * Dịch + biên tập lại tin tức sang tiếng Việt bằng AI.
 * Nguyên tắc: PARAPHRASE, không dịch nguyên văn từng câu — giữ đúng sự kiện,
 * viết lại theo văn phong báo chí tiếng Việt, độ dài vừa phải (không sao chép
 * toàn bộ bài gốc) để tôn trọng bản quyền nguồn tin gốc.
 */
export async function translateArticle(input: {
  title: string;
  description: string;
  bodyText: string;
}): Promise<TranslatedArticle> {
  const cfg = aiConfig();

  if (!cfg) {
    // Không có API key AI — trả về bản gốc để admin tự biên tập thủ công.
    return {
      titleVi: input.title,
      summaryVi: (input.description || input.bodyText).slice(0, 400),
      contentVi: input.bodyText.slice(0, 1500) || input.description,
      category: 'Tin mới',
      isTransferNews: /transfer|chuyển nhượng|mercato|fichaje|rumor|rumour/i.test(
        input.title + ' ' + input.description
      ),
    };
  }

  const prompt = `Bạn là biên tập viên thể thao tiếng Việt, chuyên viết lại đầy đủ (không dịch nguyên văn từng câu) tin tức bóng đá về Real Madrid từ báo nước ngoài, giữ trọn thông tin quan trọng của bài gốc.

Yêu cầu bắt buộc:
- KHÔNG dịch nguyên văn từng câu, KHÔNG bám sát cấu trúc câu/đoạn của bản gốc. Hãy đọc hiểu toàn bộ nội dung rồi VIẾT LẠI hoàn toàn bằng lời văn của bạn, giữ đúng sự kiện, số liệu, trích dẫn phát biểu (nếu có), tên riêng.
- "summaryVi": 2-3 câu tóm tắt ngắn gọn (hiển thị ở đầu bài và trên thẻ bài viết).
- "contentVi": bài viết ĐẦY ĐỦ, chi tiết — viết lại toàn bộ thông tin quan trọng trong bài gốc (không chỉ 1 đoạn tóm tắt sơ sài), khoảng 6-10 đoạn văn tuỳ độ dài bài gốc, mỗi đoạn 2-5 câu, văn phong báo chí Việt Nam tự nhiên, mạch lạc.
- "titleVi": tiêu đề tiếng Việt hấp dẫn, chính xác, không giật tít sai sự thật.
- "category": chọn đúng 1 trong các giá trị sau: ${CATEGORY_OPTIONS.join(', ')}.
- "isTransferNews": true/false — có phải tin chuyển nhượng/tin đồn chuyển nhượng không.
- Chỉ trả về JSON hợp lệ, không thêm chữ nào khác, đúng khoá: titleVi, summaryVi, contentVi, category, isTransferNews.

Tiêu đề gốc: ${input.title}
Mô tả gốc: ${input.description}
Nội dung gốc (trích): ${input.bodyText.slice(0, 6000)}`;

  const res = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature: 0.4,
    }),
  });
  if (!res.ok) throw new Error(`Lỗi dịch AI (HTTP ${res.status})`);
  const json = await res.json();
  const parsed = JSON.parse(json.choices[0].message.content);

  return {
    titleVi: parsed.titleVi || input.title,
    summaryVi: parsed.summaryVi || '',
    contentVi: parsed.contentVi || '',
    category: CATEGORY_OPTIONS.includes(parsed.category) ? parsed.category : 'Tin mới',
    isTransferNews: Boolean(parsed.isTransferNews),
  };
}
