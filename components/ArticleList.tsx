import ArticleCard from './ArticleCard';
import Pagination from './Pagination';
import type { Article } from '@/lib/types';

export default function ArticleList({
  title,
  subtitle,
  items,
  pagination,
}: {
  title: string;
  subtitle?: string;
  items: Article[];
  pagination?: { page: number; totalPages: number; basePath: string };
}) {
  return (
    <>
      <div className="list-page-header">
        <h1>{title}</h1>
        {subtitle && <p>{subtitle}</p>}
      </div>
      <div className="page-content" style={{ gridTemplateColumns: '1fr' }}>
        <div className="article-grid article-grid-wide">
          {items.length ? (
            items.map((a) => <ArticleCard key={a.id} a={a} />)
          ) : (
            <div className="empty">Chưa có bài viết nào. Hãy vào trang quản trị để lấy tin mới.</div>
          )}
        </div>
      </div>
      {pagination && <Pagination page={pagination.page} totalPages={pagination.totalPages} basePath={pagination.basePath} />}
    </>
  );
}
