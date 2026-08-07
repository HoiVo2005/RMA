"use client";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
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
      router.push("/admin");
      router.refresh();
    } catch (e: any) {
      setMsg(e.message || "Đăng nhập thất bại");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="crest">♛</div>
        <h1>Đăng nhập quản trị</h1>
        <p className="sub">Truy cập trang quản trị Madridista News VN</p>
        <form onSubmit={submit}>
          <input
            placeholder="Email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
          <input
            placeholder="Mật khẩu"
            type="password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button disabled={loading}>
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </button>
          {msg && <p className="error">{msg}</p>}
        </form>
        <div className="auth-links">
          <Link href="/login">Đăng nhập người dùng</Link>
          <Link href="/">← Về trang chủ</Link>
        </div>
      </div>
    </main>
  );
}
