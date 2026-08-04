import Page from "@/components/Page";
import ArticleCard from "@/components/ArticleCard";
import { ArticleBadges, timeAgo } from "@/components/Badges";
import { getArticle, getRelatedArticles } from "@/lib/data";
import { articleHref } from "@/lib/article-url";
import { slugify } from "@/lib/slug";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import { ExternalLink, Eye, Clock } from "lucide-react";
import ViewTracker from "@/components/ViewTracker";
import SaveButton from "@/components/SaveButton";
import ShareButtons from "@/components/ShareButtons";
import CommentSection from "@/components/CommentSection";
import { estimateReadingMinutes } from "@/lib/reading-time";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const a = await getArticle(slug);
  if (!a) notFound();

  // Bài đã có slug đẹp nhưng người dùng/link cũ vào bằng id thẳng -> chuyển hướng sang URL slug
  // chuẩn để không lộ UUID và tránh nội dung trùng lặp (SEO).
  // Nếu bài không có slug, tạo từ title tự động.
  const effectiveSlug = a.slug || slugify(a.translated_title);
  if (slug !== effectiveSlug) redirect(`/bai-viet/${effectiveSlug}`);

  const related = await getRelatedArticles(a, 4);
  const readingMinutes = estimateReadingMinutes(a.content_vi || a.summary_vi);
  const pageUrl = `${process.env.NEXT_PUBLIC_SITE_URL || ""}${articleHref(a)}`;

  return (
    <Page>
      <ViewTracker articleId={a.id} />
      <div className="detail-wrap">
        <div className="breadcrumb">
          <Link href="/">Trang chủ</Link> /{" "}
          <Link href={`/tin-moi`}>{a.category}</Link>
        </div>

        <article className="detail">
          <div
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: "space-between",
              gap: 12,
            }}
          >
            <ArticleBadges a={a} />
            <SaveButton
              article={{
                id: a.id,
                slug: a.slug,
                title: a.translated_title,
                image: a.image_url,
                category: a.category,
                savedAt: "",
              }}
            />
          </div>
          <h1>{a.translated_title}</h1>
          <p className="lead">{a.summary_vi}</p>

          <div className="byline">
            <span>{a.source_name}</span>
            {a.source_country && <span>· {a.source_country}</span>}
            {a.author_name && <span>· {a.author_name}</span>}
            <span>· {timeAgo(a.published_at)}</span>
            <span className="reading-time">
              <Clock size={12} /> {readingMinutes} phút đọc
            </span>
            {typeof a.view_count === "number" && (
              <span className="reading-time">
                <Eye size={12} /> {a.view_count.toLocaleString("vi-VN")} lượt
                xem
              </span>
            )}
          </div>

          {a.image_url && (
            <img
              className="hero-img"
              src={a.image_url}
              alt={a.translated_title}
            />
          )}

          <div className="body">
            {(a.content_vi || a.summary_vi || "")
              .split("\n")
              .filter((p) => p.trim())
              .map((p, i) => (
                <p key={i}>{p}</p>
              ))}
          </div>

          <ShareButtons title={a.translated_title} url={pageUrl} />

          <div className="source-note">
            Bài viết được biên soạn và dịch lại từ <b>{a.source_name}</b>. Đọc
            bản gốc đầy đủ tại:{" "}
            <a href={a.original_url} target="_blank" rel="noopener noreferrer">
              {a.original_url}{" "}
              <ExternalLink size={12} style={{ verticalAlign: -1 }} />
            </a>
          </div>

          <CommentSection articleId={a.id} />
        </article>
      </div>

      {related.length > 0 && (
        <div className="container">
          <section className="related-section">
            <h2 className="section-title">Bài viết liên quan</h2>
            <div className="article-grid article-grid-wide">
              {related.map((r) => (
                <ArticleCard key={r.id} a={r} />
              ))}
            </div>
          </section>
        </div>
      )}
    </Page>
  );
}
