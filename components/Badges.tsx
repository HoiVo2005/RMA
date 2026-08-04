import type { Article } from '@/lib/types';

function reliabilityClass(r: string) {
  const s = r.toLowerCase();
  if (s.includes('uy tín') && !s.includes('khá')) return 'badge-reliability-uy-tin';
  if (s.includes('khá')) return 'badge-reliability-kha-uy-tin';
  return 'badge-reliability-tin-don';
}

export function ArticleBadges({ a }: { a: Pick<Article, 'category' | 'reliability' | 'is_transfer_news' | 'is_featured'> }) {
  return (
    <div className="badges-row">
      <span className="badge badge-category">{a.category}</span>
      {a.is_transfer_news && a.category !== 'Chuyển nhượng' && (
        <span className="badge badge-transfer">Chuyển nhượng</span>
      )}
      <span className={`badge ${reliabilityClass(a.reliability)}`}>{a.reliability}</span>
      {a.is_featured && <span className="badge badge-featured">Nổi bật</span>}
    </div>
  );
}

export function timeAgo(iso: string | null) {
  if (!iso) return '';
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return 'Vừa xong';
  if (min < 60) return `${min} phút trước`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} giờ trước`;
  const day = Math.floor(hr / 24);
  if (day < 7) return `${day} ngày trước`;
  return new Date(iso).toLocaleDateString('vi-VN');
}
