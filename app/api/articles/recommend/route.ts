import { NextRequest, NextResponse } from 'next/server';
import { getArticles } from '@/lib/data';

// Gợi ý tin tức "Dành cho bạn" — dựa trên tên cầu thủ người dùng đang theo dõi (lưu ở trình duyệt).
// Đơn giản hoá: so khớp từ khoá tên cầu thủ trong tiêu đề/tóm tắt bài viết, ưu tiên bài có nhắc tới
// nhiều cầu thủ theo dõi nhất và mới nhất. Nếu chưa theo dõi cầu thủ nào, trả về tin mới nhất.
export async function GET(req: NextRequest) {
  const playersParam = req.nextUrl.searchParams.get('players') || '';
  const playerNames = playersParam
    .split(',')
    .map((n) => n.trim())
    .filter(Boolean);

  const articles = await getArticles({ limit: 60 });

  if (playerNames.length === 0) {
    return NextResponse.json({ data: articles.slice(0, 12), matched: false });
  }

  // So khớp theo họ/tên cuối của cầu thủ để tránh tên đệm gây trùng lặp không mong muốn.
  const lastNames = playerNames.map((n) => n.split(' ').slice(-1)[0].toLowerCase());

  const scored = articles.map((a) => {
    const haystack = `${a.translated_title} ${a.summary_vi || ''}`.toLowerCase();
    const score = lastNames.reduce((acc, name) => acc + (name.length > 2 && haystack.includes(name) ? 1 : 0), 0);
    return { a, score };
  });

  const matched = scored.filter((s) => s.score > 0).sort((x, y) => y.score - x.score);

  const result = matched.length > 0 ? matched.map((s) => s.a) : articles;
  return NextResponse.json({ data: result.slice(0, 12), matched: matched.length > 0 });
}
