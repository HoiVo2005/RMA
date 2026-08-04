'use client';
import { useEffect, useState } from 'react';
import Page from '@/components/Page';
import Link from 'next/link';
import { getSaved, type SavedArticle } from '@/components/SaveButton';
import { articleHref } from '@/lib/article-url';
import { Bookmark, Trash2 } from 'lucide-react';

export default function SavedArticlesPage() {
  const [list, setList] = useState<SavedArticle[]>([]);

  useEffect(() => {
    setList(getSaved());
  }, []);

  function removeOne(id: string) {
    const next = list.filter((s) => s.id !== id);
    setList(next);
    window.localStorage.setItem('mnvn_saved_articles', JSON.stringify(next));
  }

  return (
    <Page>
      <div className="list-page-header">
        <h1>
          <Bookmark size={22} style={{ verticalAlign: -3, marginRight: 8 }} />
          Bài viết đã lưu
        </h1>
        <p>Lưu tại trình duyệt này — nhấn biểu tượng bookmark trên bài viết để lưu lại đọc sau</p>
      </div>

      <div className="page-content" style={{ gridTemplateColumns: '1fr' }}>
        {list.length ? (
          <div className="saved-list">
            {list.map((s) => (
              <div className="saved-item" key={s.id}>
                <Link href={articleHref(s)} className="saved-item-link">
                  {s.image ? <img src={s.image} alt={s.title} /> : <div className="saved-item-noimg" />}
                  <div>
                    <span className="badge badge-category">{s.category}</span>
                    <h3>{s.title}</h3>
                    <span className="card-meta">Đã lưu {new Date(s.savedAt).toLocaleDateString('vi-VN')}</span>
                  </div>
                </Link>
                <button className="event-remove" onClick={() => removeOne(s.id)} title="Bỏ lưu">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty">Bạn chưa lưu bài viết nào. Nhấn biểu tượng 🔖 trên bất kỳ bài viết nào để lưu lại.</div>
        )}
      </div>
    </Page>
  );
}
