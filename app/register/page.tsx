"use client";
import Link from "next/link";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (password !== confirmPassword) {
      setMsg("Mật khẩu và xác nhận mật khẩu không trùng nhau.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await createSupabaseBrowser().auth.signUp({
        email,
        password,
      });
      if (error) throw error;
      setMsg(
        "Đăng ký thành công! Vui lòng kiểm tra email nếu cần xác nhận, sau đó đăng nhập.",
      );
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      router.push("/login");
    } catch (e: any) {
      setMsg(e.message || "Đăng ký thất bại.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="auth-page">
      <div className="auth-card">
        <div className="crest">♛</div>
        <h1>Đăng ký tài khoản đọc giả</h1>
        <p className="sub">
          Tài khoản đọc giả chỉ dùng để bình luận và trải nghiệm người dùng.
          Không dùng để truy cập quản trị.
        </p>
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
          <input
            placeholder="Xác nhận mật khẩu"
            type="password"
            required
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
          <button disabled={loading}>
            {loading ? "Đang tạo tài khoản..." : "Đăng ký"}
          </button>
          {msg && <p className="error">{msg}</p>}
        </form>
        <div className="auth-links">
          <Link href="/login">Đã có tài khoản? Đăng nhập</Link>
          <Link href="/">← Về trang chủ</Link>
        </div>
      </div>
    </main>
  );
}
