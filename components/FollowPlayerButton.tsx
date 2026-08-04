'use client';
import { useEffect, useState } from 'react';
import { Star } from 'lucide-react';

export type FollowedPlayer = {
  id: string;
  name: string;
  image: string | null;
  position: string | null;
};

const KEY = 'mnvn_followed_players';

export function getFollowed(): FollowedPlayer[] {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(window.localStorage.getItem(KEY) || '[]');
  } catch {
    return [];
  }
}

function setFollowed(list: FollowedPlayer[]) {
  window.localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event('mnvn_followed_changed'));
}

export default function FollowPlayerButton({ player }: { player: FollowedPlayer }) {
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    setFollowing(getFollowed().some((p) => p.id === player.id));
  }, [player.id]);

  function toggle(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    const list = getFollowed();
    if (following) {
      setFollowed(list.filter((p) => p.id !== player.id));
      setFollowing(false);
    } else {
      setFollowed([player, ...list].slice(0, 100));
      setFollowing(true);
    }
  }

  return (
    <button
      className={`follow-player-btn ${following ? 'is-following' : ''}`}
      onClick={toggle}
      title={following ? 'Bỏ theo dõi cầu thủ' : 'Theo dõi cầu thủ'}
    >
      <Star size={13} fill={following ? 'currentColor' : 'none'} />
      {following ? 'Đang theo dõi' : 'Theo dõi'}
    </button>
  );
}
