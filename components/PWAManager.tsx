'use client';
import { useEffect, useState } from 'react';
import { Download, Bell, X } from 'lucide-react';

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

const DISMISS_KEY = 'mnvn_pwa_banner_dismissed';

export default function PWAManager() {
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [mode, setMode] = useState<'install' | 'push' | null>(null);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {
        // im lặng nếu môi trường không hỗ trợ (vd. dev qua http không phải localhost)
      });
    }

    const dismissed = window.localStorage.getItem(DISMISS_KEY) === '1';

    function onBeforeInstall(e: any) {
      e.preventDefault();
      setInstallPrompt(e);
      if (!dismissed) {
        setMode('install');
        setShowBanner(true);
      }
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // Nếu trình duyệt không hỗ trợ cài đặt (vd. iOS Safari) nhưng có hỗ trợ Push, gợi ý bật thông báo thay thế.
    const canInstall = 'onbeforeinstallprompt' in window;
    if (!canInstall && !dismissed && 'PushManager' in window && Notification.permission === 'default') {
      const t = setTimeout(() => {
        setMode('push');
        setShowBanner(true);
      }, 4000);
      return () => {
        clearTimeout(t);
        window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      };
    }

    return () => window.removeEventListener('beforeinstallprompt', onBeforeInstall);
  }, []);

  async function handlePrimary() {
    if (mode === 'install' && installPrompt) {
      installPrompt.prompt();
      await installPrompt.userChoice;
      setInstallPrompt(null);
      setShowBanner(false);
      return;
    }
    if (mode === 'push') {
      await subscribeToPush();
      setShowBanner(false);
    }
  }

  async function subscribeToPush() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey || !('serviceWorker' in navigator)) return;
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') return;
      const reg = await navigator.serviceWorker.ready;
      const sub = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(vapidKey),
      });
      await fetch('/api/push/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subscription: sub }),
      });
    } catch {
      // im lặng — người dùng có thể đã từ chối hoặc trình duyệt không hỗ trợ
    }
  }

  function dismiss() {
    window.localStorage.setItem(DISMISS_KEY, '1');
    setShowBanner(false);
  }

  if (!showBanner || !mode) return null;

  return (
    <div className="pwa-banner">
      <div className="pwa-banner-icon">
        {mode === 'install' ? <Download size={18} /> : <Bell size={18} />}
      </div>
      <div className="pwa-banner-text">
        <b>{mode === 'install' ? 'Cài ứng dụng Madridista News VN' : 'Bật thông báo trận đấu & tin mới'}</b>
        {mode === 'install'
          ? 'Truy cập nhanh hơn, xem cả khi mất mạng.'
          : 'Nhận thông báo ngay khi có bàn thắng hoặc tin nóng.'}
      </div>
      <div className="pwa-banner-actions">
        <button className="pwa-banner-btn primary" onClick={handlePrimary}>
          {mode === 'install' ? 'Cài đặt' : 'Bật ngay'}
        </button>
        <button className="pwa-banner-btn secondary" onClick={dismiss} aria-label="Đóng">
          <X size={14} />
        </button>
      </div>
    </div>
  );
}
