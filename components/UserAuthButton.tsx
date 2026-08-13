"use client";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";
import { LogIn, LogOut, User, UserPlus } from "lucide-react";

export function useUserSession() {
  const [userEmail, setUserEmail] = useState<string | null>(null);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createSupabaseBrowser();
    supabase.auth.getSession().then(({ data }) => {
      setUserEmail(data.session?.user?.email ?? null);
      setUserName(data.session?.user?.user_metadata?.full_name ?? null);
    });

    const { data: listener } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setUserEmail(session?.user?.email ?? null);
        setUserName(session?.user?.user_metadata?.full_name ?? null);
      },
    );

    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return { userEmail, userName };
}

export default function UserAuthButton() {
  const { userEmail, userName } = useUserSession();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  async function signOut() {
    await createSupabaseBrowser().auth.signOut();
    setOpen(false);
  }

  const displayName = userName || (userEmail ? userEmail.split("@")[0] : "Tài khoản");

  return (
    <div className="user-auth-box" ref={boxRef}>
      <button
        type="button"
        className="user-auth-avatar"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={userEmail ? "Tài khoản" : "Đăng nhập / Đăng ký"}
        title={userEmail ? "Tài khoản" : "Đăng nhập / Đăng ký"}
      >
        <User size={18} />
        {userEmail && <span className="user-auth-dot" />}
      </button>

      {open && (
        <div className="user-auth-menu" role="menu">
          <div className="user-auth-menu-head">
            <b>{userEmail ? displayName : "Tài khoản"}</b>
            <span>
              {userEmail
                ? userEmail
                : "Đăng nhập để lưu bài & theo dõi cầu thủ yêu thích"}
            </span>
          </div>

          {userEmail ? (
            <>
              <button className="user-auth-menu-item is-danger" onClick={signOut} role="menuitem">
                <LogOut size={16} /> Đăng xuất
              </button>
            </>
          ) : (
            <>
              <Link
                className="user-auth-menu-item"
                href="/login"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <LogIn size={16} /> Đăng nhập
              </Link>
              <Link
                className="user-auth-menu-item"
                href="/register"
                role="menuitem"
                onClick={() => setOpen(false)}
              >
                <UserPlus size={16} /> Đăng ký
              </Link>
            </>
          )}
        </div>
      )}
    </div>
  );
}
