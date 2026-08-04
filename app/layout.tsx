import "./globals.css";
import Script from "next/script";
import type { Metadata, Viewport } from "next";
import PWAManager from "@/components/PWAManager";
import SiteSettingsProvider from "@/components/SiteSettingsProvider";
import { getSiteSettings } from "@/lib/site-settings";

// Tên/mô tả/favicon/SEO lấy động từ Cài đặt (site_settings.site_config) — sửa ở /admin/cai-dat,
// không cần build lại code. generateMetadata() chạy phía server nên vẫn tốt cho SEO.
export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const title = `${settings.siteName} — Tin tức Real Madrid 24/7`;
  const ogImage = settings.seo.ogImage || settings.logoUrl || undefined;
  return {
    title,
    description: settings.siteDescription,
    keywords: settings.seo.keywords
      ? settings.seo.keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean)
      : undefined,
    manifest: "/manifest.json",
    icons: {
      icon: settings.faviconUrl || "/icons/icon-192.png",
      apple: settings.faviconUrl || "/icons/icon-192.png",
    },
    openGraph: {
      title,
      description: settings.siteDescription,
      siteName: settings.siteName,
      locale: "vi_VN",
      type: "website",
      images: ogImage ? [{ url: ogImage }] : undefined,
    },
    twitter: {
      card: ogImage ? "summary_large_image" : "summary",
      title,
      description: settings.siteDescription,
      images: ogImage ? [ogImage] : undefined,
    },
  };
}

export const viewport: Viewport = {
  themeColor: "#0d1330",
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const settings = await getSiteSettings();

  const fontFamilies: Record<string, string> = {
    Inter: "'Inter', 'Segoe UI', system-ui, -apple-system, sans-serif",
    Sora: "'Sora', 'Inter', system-ui, -apple-system, sans-serif",
    Georgia: "Georgia, 'Times New Roman', serif",
    System: "system-ui, sans-serif",
  };
  const fontFamily = fontFamilies[settings.fontFamily] ?? fontFamilies.Inter;

  return (
    <html lang="vi">
      <head>
        {/* Màu chủ đạo và font cấu hình ở /admin/cai-dat, đè lên biến CSS mặc định trong globals.css */}
        <style>{`:root{--gold-500:${settings.primaryColor};--gold-400:${settings.primaryColorLight};--bg:${settings.backgroundColor};--font-sans:${fontFamily};--font-display:${fontFamily};}`}</style>
      </head>
      <body suppressHydrationWarning>
        <SiteSettingsProvider>{children}</SiteSettingsProvider>
        <PWAManager />

        {/* Google Analytics — chỉ nhúng khi có ID cấu hình ở /admin/cai-dat */}
        {settings.analytics.googleAnalyticsId && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${settings.analytics.googleAnalyticsId}`}
              strategy="afterInteractive"
            />
            <Script id="ga-init" strategy="afterInteractive">
              {`window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${settings.analytics.googleAnalyticsId}');`}
            </Script>
          </>
        )}

        {/* Facebook Pixel — chỉ nhúng khi có ID cấu hình ở /admin/cai-dat */}
        {settings.analytics.facebookPixelId && (
          <Script id="fb-pixel-init" strategy="afterInteractive">
            {`!function(f,b,e,v,n,t,s)
              {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
              n.callMethod.apply(n,arguments):n.queue.push(arguments)};
              if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
              n.queue=[];t=b.createElement(e);t.async=!0;
              t.src=v;s=b.getElementsByTagName(e)[0];
              s.parentNode.insertBefore(t,s)}(window, document,'script',
              'https://connect.facebook.net/en_US/fbevents.js');
              fbq('init', '${settings.analytics.facebookPixelId}');
              fbq('track', 'PageView');`}
          </Script>
        )}
      </body>
    </html>
  );
}
