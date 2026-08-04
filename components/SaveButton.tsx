'use client';
import { useEffect, useState } from 'react';
import { Bookmark } from 'lucide-react';
import { useSiteSettings } from './SiteSettingsProvider';

export type SavedArticle = { id: string; slug?: string | null; title: string; image: string | null; category: string; savedAt: string };

const KEY = 'mnvn_saved_articles';

export function getSaved(): SavedArticle[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function setSaved(list: SavedArticle[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
}

export default function SaveButton({ article, floating = false }: { article: SavedArticle; floating?: boolean }) {
  const settings = useSiteSettings();
  const [saved, setSavedState] = useState(false);

  useEffect(() => {
    setSavedState(getSaved().some((s) => s.id === article.id));
  }, [article.id]);

  if (!settings.features.saveArticles) return null; // đặt sau tất cả hook — tắt ở Cài đặt thì ẩn hẳn nút Lưu

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const list = getSaved();
    if (saved) {
      setSaved(list.filter((s) => s.id !== article.id));
      setSavedState(false);
    } else {
      setSaved([{ ...article, savedAt: new Date().toISOString() }, ...list].slice(0, 200));
      setSavedState(true);
    }
  }

  return (
    <button
      className={`save-btn ${floating ? 'save-btn-floating' : ''} ${saved ? 'is-saved' : ''}`}
      onClick={toggle}
      title={saved ? 'Bỏ lưu' : 'Lưu bài viết'}
      aria-label={saved ? 'Bỏ lưu' : 'Lưu bài viết'}
    >
      <Bookmark size={floating ? 15 : 16} fill={saved ? 'currentColor' : 'none'} />
    </button>
  );
}
