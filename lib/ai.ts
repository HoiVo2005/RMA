export type AiConfig = { key: string; endpoint: string; model: string };

/**
 * Đọc cấu hình AI (OpenAI hoặc Groq) từ biến môi trường.
 * Trả về null nếu chưa cấu hình API key nào — các tính năng dùng AI sẽ tự
 * chuyển sang chế độ dự phòng (không dịch/không trích xuất, để admin tự nhập).
 */
export function aiConfig(): AiConfig | null {
  const key = process.env.OPENAI_API_KEY || process.env.GROQ_API_KEY;
  if (!key) return null;
  const isGroq = Boolean(process.env.GROQ_API_KEY) && !process.env.OPENAI_API_KEY;
  return {
    key,
    endpoint: isGroq ? 'https://api.groq.com/openai/v1/chat/completions' : 'https://api.openai.com/v1/chat/completions',
    model: process.env.AI_MODEL || (isGroq ? 'llama-3.3-70b-versatile' : 'gpt-4.1-mini'),
  };
}

/**
 * Gọi AI với 1 prompt, yêu cầu trả về JSON hợp lệ, và parse sẵn kết quả.
 * Ném lỗi nếu gọi API thất bại hoặc JSON không hợp lệ — bên gọi tự quyết định
 * cách xử lý (vd. bắt lỗi để trả về dữ liệu thô cho admin tự biên tập).
 */
export async function aiCompleteJson<T = any>(cfg: AiConfig, prompt: string, temperature = 0.3): Promise<T> {
  const res = await fetch(cfg.endpoint, {
    method: 'POST',
    headers: { authorization: `Bearer ${cfg.key}`, 'content-type': 'application/json' },
    body: JSON.stringify({
      model: cfg.model,
      messages: [{ role: 'user', content: prompt }],
      response_format: { type: 'json_object' },
      temperature,
    }),
  });
  if (!res.ok) throw new Error(`Lỗi gọi AI (HTTP ${res.status})`);
  const json = await res.json();
  return JSON.parse(json.choices[0].message.content);
}
