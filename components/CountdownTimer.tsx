'use client';
import { useEffect, useState } from 'react';

function diff(target: number) {
  const d = Math.max(0, target - Date.now());
  return {
    days: Math.floor(d / 86400000),
    hours: Math.floor((d / 3600000) % 24),
    minutes: Math.floor((d / 60000) % 60),
    seconds: Math.floor((d / 1000) % 60),
    done: d <= 0,
  };
}

export default function CountdownTimer({ target }: { target: string }) {
  const targetMs = new Date(target).getTime();
  const [t, setT] = useState(() => diff(targetMs));

  useEffect(() => {
    const id = setInterval(() => setT(diff(targetMs)), 1000);
    return () => clearInterval(id);
  }, [targetMs]);

  if (t.done) return <div className="countdown countdown-live">⚡ Trận đấu sắp/đang diễn ra</div>;

  return (
    <div className="countdown">
      <div className="countdown-cell">
        <b>{t.days}</b>
        <span>ngày</span>
      </div>
      <div className="countdown-cell">
        <b>{String(t.hours).padStart(2, '0')}</b>
        <span>giờ</span>
      </div>
      <div className="countdown-cell">
        <b>{String(t.minutes).padStart(2, '0')}</b>
        <span>phút</span>
      </div>
      <div className="countdown-cell">
        <b>{String(t.seconds).padStart(2, '0')}</b>
        <span>giây</span>
      </div>
    </div>
  );
}
