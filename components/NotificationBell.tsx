'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { Bell, Check, CheckCheck, Trophy, Newspaper } from 'lucide-react';
import { timeAgo } from './Badges';
import { useSiteSettings } from './SiteSettingsProvider';

type NotificationItem = {
  id: string;
  type: 'article' | 'fixture';
  title: string;
  subtitle: string;
  time: string;
  href: string;
};

const STORAGE_KEY = 'mnvn_read_notifications';
const MAX_STORED = 200;

function loadRead(): Set<string> {
  if (typeof window === 'undefined') return new Set();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    return new Set(raw ? JSON.parse(raw) : []);
  } catch {
    return new Set();
  }
}

function saveRead(ids: Set<string>) {
  try {
    const arr = Array.from(ids).slice(-MAX_STORED);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(arr));
  } catch {
    // localStorage không khả dụng — bỏ qua, chỉ mất trạng thái đã đọc khi tải lại trang
  }
}

export default function NotificationBell() {
  const settings = useSiteSettings();
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  async function load() {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      setItems(json.data || []);
    } catch {
      // im lặng nếu lỗi mạng — không làm phiền người dùng
    }
  }

  useEffect(() => {
    setReadIds(loadRead());
    load();
    const interval = setInterval(load, 60_000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', onClickOutside);
    return () => document.removeEventListener('mousedown', onClickOutside);
  }, []);

  function markRead(id: string) {
    setReadIds((prev) => {
      const next = new Set(prev);
      next.add(id);
      saveRead(next);
      return next;
    });
  }

  function markAllRead() {
    setReadIds((prev) => {
      const next = new Set(prev);
      items.forEach((i) => next.add(i.id));
      saveRead(next);
      return next;
    });
  }

  const unreadCount = items.filter((i) => !readIds.has(i.id)).length;
  const fixtures = items.filter((i) => i.type === 'fixture');
  const articles = items.filter((i) => i.type === 'article');

  // Đặt SAU tất cả hook ở trên (không được return sớm trước hook) — tắt ở /admin/cai-dat thì ẩn hẳn chuông.
  if (!settings.features.notifications) return null;

  return (
    <div className="notif-box" ref={boxRef}>
      <button className="notif-bell" onClick={() => setOpen((o) => !o)} aria-label="Thông báo">
        <Bell size={18} />
        {unreadCount > 0 && <span className="notif-dot">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>

      {open && (
        <div className="notif-panel">
          <div className="notif-panel-head">
            <span>Thông báo</span>
            {unreadCount > 0 && (
              <button className="notif-mark-all" onClick={markAllRead}>
                <CheckCheck size={13} /> Đánh dấu tất cả đã đọc
              </button>
            )}
          </div>

          <div className="notif-list">
            {items.length === 0 && <div className="notif-empty">Chưa có thông báo mới.</div>}

            {fixtures.length > 0 && (
              <>
                <div className="notif-section-label">
                  <Trophy size={12} /> Trận đấu sắp diễn ra
                </div>
                {fixtures.map((i) => (
                  <NotifRow key={i.id} item={i} read={readIds.has(i.id)} onMarkRead={markRead} />
                ))}
              </>
            )}

            {articles.length > 0 && (
              <>
                <div className="notif-section-label">
                  <Newspaper size={12} /> Tin mới nhất
                </div>
                {articles.map((i) => (
                  <NotifRow key={i.id} item={i} read={readIds.has(i.id)} onMarkRead={markRead} />
                ))}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function NotifRow({
  item,
  read,
  onMarkRead,
}: {
  item: NotificationItem;
  read: boolean;
  onMarkRead: (id: string) => void;
}) {
  const isFuture = new Date(item.time).getTime() > Date.now();
  return (
    <div className={`notif-item ${read ? 'is-read' : ''}`}>
      <Link href={item.href} className="notif-item-link" onClick={() => onMarkRead(item.id)}>
        {!read && <span className="notif-item-dot" />}
        <div className="notif-item-body">
          <div className="notif-item-title">{item.title}</div>
          <div className="notif-item-sub">
            {item.subtitle} · {isFuture ? new Date(item.time).toLocaleString('vi-VN') : timeAgo(item.time)}
          </div>
        </div>
      </Link>
      {!read && (
        <button className="notif-item-check" title="Đánh dấu đã đọc" onClick={() => onMarkRead(item.id)}>
          <Check size={13} />
        </button>
      )}
    </div>
  );
}
