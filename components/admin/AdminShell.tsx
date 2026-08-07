"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase";
import {
  LayoutDashboard,
  Newspaper,
  Radio,
  Trophy,
  Users,
  Clock11,
  LogOut,
  ExternalLink,
  Shield,
  Settings,
  Menu,
  X,
  MessageCircle,
} from "lucide-react";

const links = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/bai-viet", label: "Bài viết", icon: Newspaper },
  { href: "/admin/binh-luan", label: "Bình luận", icon: MessageCircle },
  { href: "/admin/nguon-tin", label: "Nguồn tin", icon: Radio },
  { href: "/admin/lich-thi-dau", label: "Lịch thi đấu", icon: Trophy },
  { href: "/admin/doi-hinh", label: "Đội hình", icon: Users },
  { href: "/admin/active-sessions", label: "Phiên đăng nhập", icon: Clock11 },
  { href: "/admin/thong-tin-clb", label: "Thông tin CLB", icon: Shield },
  { href: "/admin/cai-dat", label: "Cài đặt", icon: Settings },
];

export default function AdminShell({
  children,
  title,
}: {
  children: React.ReactNode;
  title: string;
}) {
  const path = usePathname();
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [checked, setChecked] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        router.replace("/admin/login");
        return;
      }
      setEmail(data.session.user.email ?? null);
      setChecked(true);
    });
  }, [router]);

  // Đóng menu mobile mỗi khi chuyển trang.
  useEffect(() => {
    setMobileOpen(false);
  }, [path]);

  async function logout() {
    await createSupabaseBrowser().auth.signOut();
    router.push("/admin/login");
  }

  if (!checked) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "var(--ink-500)",
        }}
      >
        Đang kiểm tra đăng nhập...
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {mobileOpen && (
        <div
          className="admin-sidebar-overlay"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={`admin-sidebar${mobileOpen ? " open" : ""}`}>
        <div className="brand">
          <span
            className="crest"
            style={{ width: 32, height: 32, fontSize: 15 }}
          >
            ♛
          </span>
          <div style={{ marginTop: 8 }}>
            <b>Madridista News VN</b>
            <br />
            <small style={{ color: "var(--gold-400)", fontSize: 11 }}>
              Trang quản trị
            </small>
          </div>
        </div>
        <nav>
          {links.map((l) => {
            const Icon = l.icon;
            const active = path === l.href;
            return (
              <Link
                key={l.href}
                href={l.href}
                className={active ? "active" : ""}
              >
                <Icon size={16} /> {l.label}
              </Link>
            );
          })}
          <div className="nav-sep" />
          <Link href="/" target="_blank">
            <ExternalLink size={16} /> Xem trang web
          </Link>
          <button onClick={logout}>
            <LogOut size={16} /> Đăng xuất
          </button>
        </nav>
        <div className="foot-link">
          <span className="admin-user-avatar">
            {(email ?? "?").slice(0, 1)}
          </span>
          <span className="admin-user-email">{email}</span>
        </div>
      </aside>

      <div className="admin-main">
        <div className="admin-topbar">
          <button
            type="button"
            className="admin-menu-btn"
            onClick={() => setMobileOpen((o) => !o)}
            aria-label="Mở menu quản trị"
            aria-expanded={mobileOpen}
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <h1>{title}</h1>
          <div className="user-chip">{email}</div>
        </div>
        <div className="admin-body">{children}</div>
      </div>
    </div>
  );
}
