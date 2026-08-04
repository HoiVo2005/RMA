'use client';
import { useEffect } from 'react';

// Component vô hình — tăng lượt xem bài viết 1 lần khi trang được tải.
export default function ViewTracker({ articleId }: { articleId: string }) {
  useEffect(() => {
    fetch(`/api/articles/${articleId}/view`, { method: 'POST' }).catch(() => {});
  }, [articleId]);
  return null;
}
