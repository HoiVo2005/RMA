import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';

/**
 * Thanh phân trang dạng link (không cần JS phía client) — dùng cho các trang
 * danh sách dài như /tin-moi để tránh tải/kéo quá nhiều bài trong 1 trang.
 * Điều hướng qua query string (?trang=2), giữ nguyên các query khác nếu có.
 */
export default function Pagination({
  page,
  totalPages,
  basePath,
  pageParam = 'trang',
}: {
  page: number;
  totalPages: number;
  basePath: string;
  pageParam?: string;
}) {
  if (totalPages <= 1) return null;

  function href(p: number) {
    return p <= 1 ? basePath : `${basePath}?${pageParam}=${p}`;
  }

  // Hiện tối đa ~7 nút số trang, có dấu "..." khi danh sách trang quá dài.
  const items: (number | '...')[] = [];
  const add = (v: number | '...') => items.push(v);
  add(1);
  if (page > 3) add('...');
  for (let p = Math.max(2, page - 1); p <= Math.min(totalPages - 1, page + 1); p++) add(p);
  if (page < totalPages - 2) add('...');
  if (totalPages > 1) add(totalPages);

  return (
    <nav className="pagination" aria-label="Phân trang">
      <Link
        href={href(Math.max(1, page - 1))}
        className={`pagination-btn ${page <= 1 ? 'is-disabled' : ''}`}
        aria-disabled={page <= 1}
      >
        <ChevronLeft size={16} /> Trước
      </Link>

      <div className="pagination-pages">
        {items.map((it, i) =>
          it === '...' ? (
            <span key={`e${i}`} className="pagination-ellipsis">
              …
            </span>
          ) : (
            <Link key={it} href={href(it)} className={`pagination-page ${it === page ? 'is-active' : ''}`}>
              {it}
            </Link>
          )
        )}
      </div>

      <Link
        href={href(Math.min(totalPages, page + 1))}
        className={`pagination-btn ${page >= totalPages ? 'is-disabled' : ''}`}
        aria-disabled={page >= totalPages}
      >
        Sau <ChevronRight size={16} />
      </Link>
    </nav>
  );
}
