'use client';
import { createContext, useContext, useEffect, useState } from 'react';
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from '@/lib/site-settings';

const SiteSettingsContext = createContext<SiteSettings>(DEFAULT_SITE_SETTINGS);

/**
 * Bọc quanh toàn bộ app (xem app/layout.tsx) để mọi component phía client (Header, SaveButton,
 * CommentSection, NotificationBell, PredictionWidget...) đều đọc được cấu hình website hiện tại
 * qua hook useSiteSettings() — không cần truyền props xuyên qua nhiều tầng.
 * Dùng giá trị mặc định trong lúc chờ tải xong nên không bị "nháy" giao diện.
 */
export default function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);

  useEffect(() => {
    let cancelled = false;
    fetch('/api/site-settings')
      .then((r) => r.json())
      .then((res) => {
        if (!cancelled && res?.data) setSettings(res.data);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  return <SiteSettingsContext.Provider value={settings}>{children}</SiteSettingsContext.Provider>;
}

export function useSiteSettings(): SiteSettings {
  return useContext(SiteSettingsContext);
}
