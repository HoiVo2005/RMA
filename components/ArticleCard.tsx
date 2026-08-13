import Link from "next/link";
import type { Article } from "@/lib/types";
import { ArticleBadges, timeAgo } from "./Badges";
import SaveButton from "./SaveButton";
import { articleHref } from "@/lib/article-url";

export default function ArticleCard({ a }: { a: Article }) {
  return (
    <article className="card">
      {a.image_url ? (
        <img
          className="card-img"
          src={a.image_url}
          alt={a.translated_title}
          loading="lazy"
        />
      ) : (
        <div className="card-img" />
      )}
      <SaveButton
        floating
        article={{
          id: a.id,
          slug: a.slug,
          title: a.translated_title,
          image: a.image_url,
          category: a.category,
          savedAt: "",
        }}
      />
      <div className="card-body">
        <ArticleBadges a={a} />
        <h3>
          <Link href={articleHref(a)}>{a.translated_title}</Link>
        </h3>
        <p>{a.summary_vi}</p>
        <div className="card-meta">
          <span>{a.source_name}</span>
          {a.source_country && <span>· {a.source_country}</span>}
          <span>· {timeAgo(a.published_at)}</span>
        </div>
      </div>
    </article>
  );
}
