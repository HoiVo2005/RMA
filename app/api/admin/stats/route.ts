import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/admin-api';

export async function GET(req: NextRequest) {
  const admin = await requireAdmin(req);
  if (!admin) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const [articles, published, draft, sources, fixtures, players, lastLogs] = await Promise.all([
    admin.from('articles').select('id', { count: 'exact', head: true }),
    admin.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'published'),
    admin.from('articles').select('id', { count: 'exact', head: true }).eq('status', 'draft'),
    admin.from('news_sources').select('id', { count: 'exact', head: true }),
    admin.from('fixtures').select('id', { count: 'exact', head: true }),
    admin.from('players').select('id', { count: 'exact', head: true }),
    admin.from('cron_logs').select('*').order('started_at', { ascending: false }).limit(5),
  ]);

  return NextResponse.json({
    data: {
      articles: articles.count || 0,
      published: published.count || 0,
      draft: draft.count || 0,
      sources: sources.count || 0,
      fixtures: fixtures.count || 0,
      players: players.count || 0,
      logs: lastLogs.data || [],
    },
  });
}
