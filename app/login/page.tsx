"use client";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    setLoading(true);
    try {
      const { error } = await createSupabaseBrowser().auth.signInWithPassword({
        email,
        password,
      });
      if (error) throw error;
      router.push("/");
      router.refresh();
    } catch (e: any) {
      const text = e?.message?.toLowerCase?.() ?? "";
      if (
        text.includes("invalid login credentials") ||
        text.includes("invalid email or password")
      ) {
        setMsg("Email hoặc mật khẩu không đúng.");
      } else if (text.includes("invalid email")) {
        setMsg("Email không hợp lệ.");
      } else if (text.includes("password")) {
        setMsg("Mật khẩu không đúng hoặc quá ngắn.");
      } else {
        setMsg(e.message || "Đăng nhập thất bại.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="crest">♛</div>
        <h1>Đăng nhập người dùng</h1>
        <p className="sub">
          Sử dụng để bình luận và truy cập các tính năng người dùng.
        </p>
        <form onSubmit={submit}>
          <input
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <div className="password-wrapper">
            <input
              placeholder="Mật khẩu"
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowPassword((prev) => !prev)}
              aria-label={showPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
          <button disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
          {msg && <p className="error">{msg}</p>}
        </form>
        <div className="auth-links">
          <Link href="/register">Tạo tài khoản đọc giả</Link>
          <Link href="/admin/login">Đăng nhập quản trị</Link>
          <Link href="/">← Về trang chủ</Link>
        </div>
      </div>
    </main>
  );
}
