'use client';
import { useEffect, useState } from 'react';
import type { FixturePrediction } from '@/lib/data';
import { useSiteSettings } from './SiteSettingsProvider';

export default function PredictionWidget({
  fixtureId,
  homeTeam,
  awayTeam,
  initial,
}: {
  fixtureId: string;
  homeTeam: string;
  awayTeam: string;
  initial: FixturePrediction;
}) {
  const settings = useSiteSettings();
  const [votes, setVotes] = useState(initial);
  const [voted, setVoted] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setVoted(window.localStorage.getItem(`mnvn_predict_${fixtureId}`));
  }, [fixtureId]);

  if (!settings.features.predictions) return null; // đặt sau tất cả hook — tắt ở Cài đặt thì ẩn hẳn widget

  async function vote(choice: 'home' | 'draw' | 'away') {
    if (voted || loading) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/fixtures/${fixtureId}/predict`, {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ choice }),
      });
      const json = await res.json();
      if (json.data) setVotes(json.data);
      window.localStorage.setItem(`mnvn_predict_${fixtureId}`, choice);
      setVoted(choice);
    } catch {
      // bỏ qua lỗi mạng, không chặn trải nghiệm người dùng
    } finally {
      setLoading(false);
    }
  }

  const total = votes.home_votes + votes.draw_votes + votes.away_votes;
  const pct = (n: number) => (total > 0 ? Math.round((n / total) * 100) : 0);

  return (
    <div className="predict-widget">
      <h3>🔮 Dự đoán kết quả</h3>
      <div className="predict-options">
        <PredictOption
          label={homeTeam}
          pct={pct(votes.home_votes)}
          showResult={Boolean(voted)}
          active={voted === 'home'}
          onClick={() => vote('home')}
          disabled={Boolean(voted) || loading}
        />
        <PredictOption
          label="Hòa"
          pct={pct(votes.draw_votes)}
          showResult={Boolean(voted)}
          active={voted === 'draw'}
          onClick={() => vote('draw')}
          disabled={Boolean(voted) || loading}
        />
        <PredictOption
          label={awayTeam}
          pct={pct(votes.away_votes)}
          showResult={Boolean(voted)}
          active={voted === 'away'}
          onClick={() => vote('away')}
          disabled={Boolean(voted) || loading}
        />
      </div>
      <p className="predict-total">{total} lượt dự đoán{voted ? ' · Cảm ơn bạn đã bình chọn!' : ''}</p>
    </div>
  );
}

function PredictOption({
  label,
  pct,
  showResult,
  active,
  onClick,
  disabled,
}: {
  label: string;
  pct: number;
  showResult: boolean;
  active: boolean;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <button className={`predict-option ${active ? 'is-active' : ''}`} onClick={onClick} disabled={disabled}>
      <span className="predict-option-label">{label}</span>
      {showResult && (
        <>
          <span className="predict-option-bar">
            <span className="predict-option-fill" style={{ width: `${pct}%` }} />
          </span>
          <span className="predict-option-pct">{pct}%</span>
        </>
      )}
    </button>
  );
}
