import { NextResponse } from 'next/server';
import { getArticles, getFixtures } from '@/lib/data';
import { articleHref } from '@/lib/article-url';

export type NotificationItem = {
  id: string;
  type: 'article' | 'fixture';
  title: string;
  subtitle: string;
  time: string; // ISO — thời điểm đăng (bài viết) hoặc thời điểm thi đấu (trận đấu)
  href: string;
};

// API công khai, không cần đăng nhập — phục vụ chuông thông báo trên toàn trang.
export async function GET() {
  const [articles, fixtures] = await Promise.all([getArticles({ limit: 8 }), getFixtures()]);

  const now = Date.now();
  const upcomingFixtures = fixtures
    .filter((f) => new Date(f.match_time).getTime() >= now)
    .sort((a, b) => new Date(a.match_time).getTime() - new Date(b.match_time).getTime())
    .slice(0, 5);

  const items: NotificationItem[] = [
    ...upcomingFixtures.map((f) => ({
      id: `fixture-${f.id}`,
      type: 'fixture' as const,
      title: `${f.home_team} vs ${f.away_team}`,
      subtitle: `${f.competition}${f.stadium ? ' · ' + f.stadium : ''}`,
      time: f.match_time,
      href: '/lich-thi-dau',
    })),
    ...articles.map((a) => ({
      id: `article-${a.id}`,
      type: 'article' as const,
      title: a.translated_title,
      subtitle: a.source_name,
      time: a.published_at || new Date().toISOString(),
      href: articleHref(a),
    })),
  ];

  return NextResponse.json({ data: items });
}
