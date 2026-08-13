"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import ArticleCard from "@/components/ArticleCard";
import {
  getFollowed,
  type FollowedPlayer,
} from "@/components/FollowPlayerButton";
import type { Article } from "@/lib/types";
import { Sparkles, Star } from "lucide-react";

export default function RecommendedArticles() {
  const [followed, setFollowed] = useState<FollowedPlayer[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    function refresh() {
      const list = getFollowed();
      setFollowed(list);
      load(list);
    }

    refresh();
    window.addEventListener("mnvn_followed_changed", refresh);
    return () => window.removeEventListener("mnvn_followed_changed", refresh);
  }, []);

  async function load(list: FollowedPlayer[]) {
    setLoading(true);
    try {
      if (list.length === 0) {
        setArticles([]);
        return;
      }

      const q = list.map((p) => p.name).join(",");
      const res = await fetch(
        `/api/articles/recommend?players=${encodeURIComponent(q)}`,
      );
      const json = await res.json();
      setArticles(json.data || []);
    } catch {
      setArticles([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <section className="container recommended-articles-section">
      <div className="section-title-row">
        <h2 className="section-title">
          <Sparkles size={17} style={{ verticalAlign: -3, marginRight: 6 }} />
          Tin gợi ý cho bạn
        </h2>
        {followed.length > 0 && (
          <span className="section-note">
            Dựa trên cầu thủ bạn đang theo dõi.
          </span>
        )}
      </div>

      {loading ? (
        <div className="empty">Đang tải tin gợi ý...</div>
      ) : followed.length === 0 ? (
        <div className="recommended-empty">
          <p>Bạn chưa theo dõi cầu thủ nào, nên chưa có đề xuất tin cá nhân.</p>
          <Link
            href="/doi-hinh"
            className="btn btn-outline"
            style={{ marginTop: 12 }}
          >
            Xem đội hình và theo dõi cầu thủ
          </Link>
        </div>
      ) : articles.length === 0 ? (
        <div className="recommended-empty">
          <p>
            Chưa có bài gợi ý mới cho cầu thủ bạn đang theo dõi. Vui lòng thử
            lại sau.
          </p>
        </div>
      ) : (
        <div className="article-grid article-grid-wide">
          {articles.slice(0, 6).map((a) => (
            <ArticleCard key={a.id} a={a} />
          ))}
        </div>
      )}

    </section>
  );
}
