"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase";

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

  async function signOut() {
    await createSupabaseBrowser().auth.signOut();
  }

  if (userEmail) {
    return (
      <div className="header-auth-group">
        <span className="header-auth-badge">
          Xin chào, {userName || userEmail.split("@")[0]}
        </span>
        <button
          className="header-auth-button"
          type="button"
          onClick={signOut}
          title="Đăng xuất"
        >
          Đăng xuất
        </button>
      </div>
    );
  }

  return (
    <div className="header-auth-group">
      <Link className="header-auth-link" href="/login">
        Đăng nhập
      </Link>
      <Link className="header-auth-button" href="/register">
        Đăng ký
      </Link>
    </div>
  );
}
