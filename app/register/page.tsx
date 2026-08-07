"use client";
import Link from "next/link";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function RegisterPage() {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setMsg("");
    if (!fullName.trim()) {
      setMsg("Vui lòng nhập họ tên.");
      return;
    }
    if (password !== confirmPassword) {
      setMsg("Mật khẩu và xác nhận mật khẩu không trùng nhau.");
      return;
    }

    setLoading(true);
    try {
      const { error } = await createSupabaseBrowser().auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName.trim(),
          },
        },
      });
      if (error) throw error;
      setMsg(
        "Đăng ký thành công! Vui lòng kiểm tra email nếu cần xác nhận, sau đó đăng nhập.",
      );
      setFullName("");
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      router.push("/login");
    } catch (e: any) {
      const text = e?.message?.toLowerCase?.() ?? "";
      if (text.includes("invalid email")) {
        setMsg("Email không hợp lệ.");
      } else if (
        text.includes("user already registered") ||
        text.includes("already registered")
      ) {
        setMsg("Email này đã được đăng ký.");
      } else if (text.includes("password")) {
        setMsg("Mật khẩu phải có độ dài đủ và hợp lệ.");
      } else {
        setMsg(e.message || "Đăng ký thất bại.");
      }
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
            placeholder="Họ và tên"
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
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
          <div className="password-wrapper">
            <input
              placeholder="Xác nhận mật khẩu"
              type={showConfirmPassword ? "text" : "password"}
              required
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />
            <button
              type="button"
              className="password-toggle"
              onClick={() => setShowConfirmPassword((prev) => !prev)}
              aria-label={showConfirmPassword ? "Ẩn mật khẩu" : "Hiện mật khẩu"}
            >
              {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
            </button>
          </div>
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
