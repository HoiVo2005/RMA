'use client';
import { FormEvent, useEffect, useState } from 'react';
import { Heart, MessageCircle, Send } from 'lucide-react';
import type { Comment } from '@/lib/types';
import { timeAgo } from './Badges';
import { useSiteSettings } from './SiteSettingsProvider';

const LIKED_KEY = 'mnvn_liked_comments';
const NAME_KEY = 'mnvn_comment_name';

function loadLiked(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    return new Set(JSON.parse(window.localStorage.getItem(LIKED_KEY) || '[]'));
  } catch {
    return new Set();
  }
}

export default function CommentSection({ articleId }: { articleId: string }) {
  const settings = useSiteSettings();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [name, setName] = useState('');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [liked, setLiked] = useState<Set<string>>(new Set());

  useEffect(() => {
    setLiked(loadLiked());
    setName(window.localStorage.getItem(NAME_KEY) || '');
    load();
  }, [articleId]);

  async function load() {
    try {
      const res = await fetch(`/api/comments?article_id=${articleId}`);
      const json = await res.json();
      setComments(json.data || []);
    } catch {
      // im lặng
    } finally {
      setLoading(false);
    }
  }

  async function submit(e: FormEvent) {
    e.preventDefault();
    if (!content.trim()) return;
    setSubmitting(true);
    try {
      window.localStorage.setItem(NAME_KEY, name);
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ article_id: articleId, author_name: name, content }),
      });
      const json = await res.json();
      if (json.data) {
        setComments((prev) => [json.data, ...prev]);
        setContent('');
      }
    } catch {
      // im lặng
    } finally {
      setSubmitting(false);
    }
  }

  async function like(id: string) {
    if (liked.has(id)) return;
    setComments((prev) => prev.map((c) => (c.id === id ? { ...c, likes: c.likes + 1 } : c)));
    const next = new Set(liked);
    next.add(id);
    setLiked(next);
    window.localStorage.setItem(LIKED_KEY, JSON.stringify(Array.from(next)));
    try {
      await fetch(`/api/comments/${id}/like`, { method: 'POST' });
    } catch {
      // im lặng — số like đã cập nhật tạm ở giao diện
    }
  }

  // Đặt sau tất cả hook ở trên — tắt "Bình luận" ở Cài đặt thì ẩn hẳn cả khung.
  if (!settings.features.comments) return null;

  return (
    <div className="comments-section">
      <h2 className="section-title">
        <MessageCircle size={18} style={{ verticalAlign: -3, marginRight: 8 }} />
        Bình luận <span className="comments-count">({comments.length})</span>
      </h2>

      <form className="comment-form" onSubmit={submit}>
        <div className="comment-form-row">
          <input
            placeholder="Tên của bạn (không bắt buộc)"
            value={name}
            maxLength={60}
            onChange={(e) => setName(e.target.value)}
          />
        </div>
        <textarea
          placeholder="Chia sẻ suy nghĩ của bạn về bài viết này..."
          value={content}
          maxLength={1000}
          onChange={(e) => setContent(e.target.value)}
        />
        <button className="comment-submit" type="submit" disabled={submitting || !content.trim()}>
          <Send size={14} /> {submitting ? 'Đang gửi...' : 'Gửi bình luận'}
        </button>
      </form>

      <div className="comment-list">
        {loading && <div className="comment-empty">Đang tải bình luận...</div>}
        {!loading && comments.length === 0 && (
          <div className="comment-empty">Chưa có bình luận nào. Hãy là người đầu tiên chia sẻ ý kiến!</div>
        )}
        {comments.map((c) => (
          <div className="comment-item" key={c.id}>
            <div className="comment-avatar">{(c.author_name || '?').trim().charAt(0).toUpperCase()}</div>
            <div className="comment-body">
              <div className="comment-head">
                <span className="comment-author">{c.author_name}</span>
                <span className="comment-time">· {timeAgo(c.created_at)}</span>
              </div>
              <p className="comment-text">{c.content}</p>
              <button
                className={`comment-like ${liked.has(c.id) ? 'is-liked' : ''}`}
                onClick={() => like(c.id)}
                disabled={liked.has(c.id)}
              >
                <Heart size={13} fill={liked.has(c.id) ? 'currentColor' : 'none'} /> {c.likes}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
