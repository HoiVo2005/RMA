"use client";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { FormEvent, useState } from "react";
import {
  Search,
  Sparkles,
  Bookmark,
  Home,
  Newspaper,
  CalendarDays,
  Users,
  ArrowLeftRight,
  Rss,
} from "lucide-react";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";
import UserAuthButton, { useUserSession } from "./UserAuthButton";
import { useSiteSettings } from "./SiteSettingsProvider";
import type { SiteMenu } from "@/lib/site-settings";

// Nguồn dữ liệu DUY NHẤT cho cả menu desktop và thanh tab mobile — "key" khớp với SiteMenu ở
// lib/site-settings.ts để lọc theo Cài đặt (/admin/cai-dat). "Trang chủ" luôn hiển thị (không có key).
const NAV_ITEMS: {
  key: keyof SiteMenu | "home";
  href: string;
  label: string;
  mobileLabel?: string;
  icon: any;
  onMobile: boolean;
}[] = [
  { key: "home", href: "/", label: "Trang chủ", icon: Home, onMobile: true },
  {
    key: "tinMoi",
    href: "/tin-moi",
    label: "Tin mới",
    icon: Newspaper,
    onMobile: true,
  },
  {
    key: "chuyenNhuong",
    href: "/chuyen-nhuong",
    label: "Chuyển nhượng",
    icon: ArrowLeftRight,
    onMobile: false,
  },
  {
    key: "lichThiDau",
    href: "/lich-thi-dau",
    label: "Lịch thi đấu",
    mobileLabel: "Lịch",
    icon: CalendarDays,
    onMobile: true,
  },
  {
    key: "doiHinh",
    href: "/doi-hinh",
    label: "Đội hình",
    icon: Users,
    onMobile: true,
  },
  {
    key: "danhChoBan",
    href: "/danh-cho-ban",
    label: "Dành cho bạn",
    icon: Sparkles,
    onMobile: false,
  },
  {
    key: "nguonTin",
    href: "/nguon-tin",
    label: "Nguồn tin",
    icon: Rss,
    onMobile: false,
  },
];

export default function Header() {
  const path = usePathname();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const settings = useSiteSettings();

  const { userEmail } = useUserSession();
  const visibleNav = NAV_ITEMS.filter(
    (item) => item.key === "home" || settings.menu[item.key],
  );
  const visibleMobile = visibleNav.filter((item) => item.onMobile);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (q.trim()) {
      router.push("/tim-kiem?q=" + encodeURIComponent(q.trim()));
      setMobileSearchOpen(false);
    }
  }

  return (
    <div className="site-header-wrap">
      <div className="site-header">
        <Link className="brand" href="/">
          {settings.logoUrl ? (
            <img
              src={settings.logoUrl}
              alt={settings.siteName}
              className="crest"
              style={{ objectFit: "contain" }}
            />
          ) : (
            <span className="crest">♛</span>
          )}
          <span>
            <b>{settings.siteName}</b>
            <small>{settings.tagline}</small>
          </span>
        </Link>

        <form className="search-form search-form-desktop" onSubmit={submit}>
          <Search size={16} />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Tìm tin tức, cầu thủ, trận đấu..."
          />
        </form>

        <button
          type="button"
          className="search-icon-btn"
          onClick={() => setMobileSearchOpen((o) => !o)}
          aria-label="Tìm kiếm"
          aria-expanded={mobileSearchOpen}
        >
          <Search size={18} />
        </button>

        <span className="ai-badge">
          <Sparkles size={13} /> Dịch &amp; tóm tắt bằng AI
        </span>

        {settings.features.saveArticles && userEmail ? (
          <Link
            className="theme-toggle"
            href="/da-luu"
            title="Bài viết đã lưu"
            aria-label="Bài viết đã lưu"
          >
            <Bookmark size={16} />
          </Link>
        ) : null}
        <ThemeToggle />
        <NotificationBell />
        <UserAuthButton />
      </div>

      {mobileSearchOpen && (
        <div className="mobile-search-row">
          <form className="search-form" onSubmit={submit}>
            <Search size={16} />
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="Tìm tin tức, cầu thủ, trận đấu..."
            />
          </form>
        </div>
      )}

      <div className="site-nav">
        <div className="site-nav-inner">
          {visibleNav.map(({ href, label, icon: Icon }) => (
            <Link
              className={path === href ? "active" : ""}
              href={href}
              key={href}
            >
              <Icon size={14} />
              {label}
            </Link>
          ))}
        </div>
      </div>

      <div className="mobile-tabbar">
        {visibleMobile.map(({ href, label, mobileLabel, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            className={path === href ? "active" : ""}
          >
            <Icon size={19} />
            {mobileLabel || label}
          </Link>
        ))}
        {settings.features.saveArticles && userEmail && (
          <Link href="/da-luu" className={path === "/da-luu" ? "active" : ""}>
            <Bookmark size={19} />
            Đã lưu
          </Link>
        )}
      </div>
    </div>
  );
}
