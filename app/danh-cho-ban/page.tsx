'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import Page from '@/components/Page';
import ArticleCard from '@/components/ArticleCard';
import { getFollowed, type FollowedPlayer } from '@/components/FollowPlayerButton';
import type { Article } from '@/lib/types';
import { Sparkles, Star } from 'lucide-react';

export default function DanhChoBanPage() {
  const [followed, setFollowed] = useState<FollowedPlayer[] | null>(null);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function refresh() {
      const list = getFollowed();
      setFollowed(list);
      load(list);
    }
    refresh();
    window.addEventListener('mnvn_followed_changed', refresh);
    return () => window.removeEventListener('mnvn_followed_changed', refresh);
  }, []);

  async function load(list: FollowedPlayer[]) {
    setLoading(true);
    try {
      const q = list.map((p) => p.name).join(',');
      const res = await fetch(`/api/articles/recommend?players=${encodeURIComponent(q)}`);
      const json = await res.json();
      setArticles(json.data || []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Page>
      <div className="personalized-hero">
        <h1>
          <Sparkles size={22} style={{ verticalAlign: -4, marginRight: 8 }} />
          Dành cho bạn
        </h1>
        <p>
          {followed && followed.length > 0
            ? 'Tin tức được chọn dựa trên các cầu thủ bạn đang theo dõi.'
            : 'Theo dõi cầu thủ yêu thích ở trang Đội hình để nhận tin gợi ý riêng cho bạn.'}
        </p>
        {followed && followed.length > 0 && (
          <div className="followed-players-row">
            {followed.map((p) => (
              <span className="followed-player-chip" key={p.id}>
                {p.image ? <img src={p.image} alt={p.name} /> : <Star size={14} />}
                {p.name}
              </span>
            ))}
          </div>
        )}
      </div>

      {followed && followed.length === 0 && !loading && (
        <div className="personalized-empty">
          Bạn chưa theo dõi cầu thủ nào. <Link href="/doi-hinh">Khám phá đội hình Real Madrid →</Link>
        </div>
      )}

      <div className="container" style={{ paddingBottom: 60 }}>
        {loading ? (
          <div className="empty">Đang tải gợi ý...</div>
        ) : (
          <div className="article-grid article-grid-wide">
            {articles.map((a) => (
              <ArticleCard key={a.id} a={a} />
            ))}
          </div>
        )}
      </div>
    </Page>
  );
}
