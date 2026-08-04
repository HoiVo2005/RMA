'use client';
import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import type { Fixture } from '@/lib/types';

/**
 * Live Match Center — thăm dò (poll) API mỗi 15 giây để lấy tỉ số trận đấu đang diễn ra
 * (fixtures.status = 'live') và phát hiệu ứng "nổ tung" khi có bàn thắng mới.
 * Chỉ hiển thị khi có trận đang live — nếu không có thì component không render gì cả.
 */
export default function LiveMatchCenter({ initial }: { initial: Fixture | null }) {
  const [fixture, setFixture] = useState<Fixture | null>(initial);
  const [flashHome, setFlashHome] = useState(false);
  const [flashAway, setFlashAway] = useState(false);
  const prevScore = useRef<{ home: number | null; away: number | null }>({
    home: initial?.home_score ?? null,
    away: initial?.away_score ?? null,
  });

  useEffect(() => {
    let cancelled = false;
    async function poll() {
      try {
        const res = await fetch('/api/fixtures/live', { cache: 'no-store' });
        const json = await res.json();
        if (cancelled) return;
        const next: Fixture | null = json.data;
        if (next) {
          if (prevScore.current.home !== null && (next.home_score ?? 0) > (prevScore.current.home ?? 0)) {
            triggerFlash(setFlashHome);
          }
          if (prevScore.current.away !== null && (next.away_score ?? 0) > (prevScore.current.away ?? 0)) {
            triggerFlash(setFlashAway);
          }
          prevScore.current = { home: next.home_score, away: next.away_score };
        }
        setFixture(next);
      } catch {
        // im lặng nếu lỗi mạng — giữ dữ liệu cũ, thử lại ở lần tiếp theo
      }
    }
    function triggerFlash(setter: (v: boolean) => void) {
      setter(true);
      setTimeout(() => setter(false), 700);
    }
    const interval = setInterval(poll, 15_000);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  if (!fixture) return null;

  return (
    <Link href="/lich-thi-dau" className="live-center">
      <div className={`live-center-flash ${flashHome || flashAway ? 'is-flashing' : ''}`} />
      <div className="live-center-head">
        <span className="live-center-tag">
          <span className="live-center-dot" /> TRỰC TIẾP
        </span>
        <span className="live-center-comp">{fixture.competition}</span>
      </div>
      <div className="live-center-body">
        <div className="live-center-team">
          {fixture.home_logo_url ? (
            <img src={fixture.home_logo_url} alt={fixture.home_team} />
          ) : (
            <span className="team-badge team-badge-fallback">{fixture.home_team.slice(0, 2)}</span>
          )}
          <span>{fixture.home_team}</span>
        </div>
        <div className="live-center-score">
          <span className={flashHome ? 'goal-pop' : ''}>{fixture.home_score ?? 0}</span>
          <span>–</span>
          <span className={flashAway ? 'goal-pop' : ''}>{fixture.away_score ?? 0}</span>
        </div>
        <div className="live-center-team">
          {fixture.away_logo_url ? (
            <img src={fixture.away_logo_url} alt={fixture.away_team} />
          ) : (
            <span className="team-badge team-badge-fallback">{fixture.away_team.slice(0, 2)}</span>
          )}
          <span>{fixture.away_team}</span>
        </div>
      </div>
      <div className="live-center-minute">Xem diễn biến trận đấu →</div>
    </Link>
  );
}
