'use client';
import { useEffect, useState } from 'react';
import { Moon, Sun } from 'lucide-react';

export default function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    const saved = window.localStorage.getItem('mnvn_theme');
    const isDark = saved === 'dark';
    setDark(isDark);
    document.documentElement.setAttribute('data-theme', isDark ? 'dark' : 'light');
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
    window.localStorage.setItem('mnvn_theme', next ? 'dark' : 'light');
  }

  return (
    <button className="theme-toggle" onClick={toggle} aria-label="Đổi giao diện sáng/tối" title="Chế độ sáng/tối">
      {dark ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
