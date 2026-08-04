import type { HonorCategory } from '@/lib/career';

const GRADIENTS: Record<HonorCategory, [string, string]> = {
  league: ['#ffe9a8', '#f2b807'],
  continental: ['#cbb8ff', '#7c5cff'],
  cup: ['#a7f3d0', '#10b981'],
  international: ['#bae6fd', '#38bdf8'],
  individual: ['#ffb4c2', '#ef1e46'],
  other: ['#d7dae3', '#9aa1ae'],
};

/** Cúp 2 quai cổ điển — dùng cho giải vô địch quốc nội. */
function ClassicCup({ id }: { id: string }) {
  return (
    <>
      <path d="M17 6h14v9c0 5-3.2 8-7 8s-7-3-7-8V6z" fill={`url(#${id})`} />
      <path d="M17 8H10c0 5 2 8 7 9" fill="none" stroke={`url(#${id})`} strokeWidth="2.4" strokeLinecap="round" />
      <path d="M31 8h7c0 5-2 8-7 9" fill="none" stroke={`url(#${id})`} strokeWidth="2.4" strokeLinecap="round" />
      <rect x="22" y="22" width="4" height="7" fill={`url(#${id})`} />
      <path d="M15 33h18l-2 4H17z" fill={`url(#${id})`} />
    </>
  );
}

/** Cúp cao, quai lớn — phong cách cúp châu lục (Champions League...). */
function TallEuroCup({ id }: { id: string }) {
  return (
    <>
      <path d="M20 5h8l1.5 12c0 4.5-2.7 7-5.5 7s-5.5-2.5-5.5-7L20 5z" fill={`url(#${id})`} />
      <path d="M20 7c-4 0-7 2-7 6s3 6 7 5.5" fill="none" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" />
      <path d="M28 7c4 0 7 2 7 6s-3 6-7 5.5" fill="none" stroke={`url(#${id})`} strokeWidth="2.2" strokeLinecap="round" />
      <rect x="22.5" y="24" width="3" height="6" fill={`url(#${id})`} />
      <path d="M17 32h14l-1.6 3.4H18.6z" fill={`url(#${id})`} />
    </>
  );
}

/** Cúp một khối nhỏ gọn — cúp quốc nội (Copa del Rey, FA Cup...). */
function SmallDomesticCup({ id }: { id: string }) {
  return (
    <>
      <path d="M18 7h12v8c0 4.4-2.7 7-6 7s-6-2.6-6-7V7z" fill={`url(#${id})`} />
      <path d="M18 9h-4.5c0 4 1.6 6.4 5 7.2" fill="none" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" />
      <path d="M30 9h4.5c0 4-1.6 6.4-5 7.2" fill="none" stroke={`url(#${id})`} strokeWidth="2" strokeLinecap="round" />
      <rect x="22.5" y="22" width="3" height="6" fill={`url(#${id})`} />
      <path d="M17.5 31h13l-1.4 3h-10.2z" fill={`url(#${id})`} />
    </>
  );
}

/** Huy hiệu tròn có ruy băng — danh hiệu đội tuyển quốc gia / thế vận hội. */
function MedalBadge({ id }: { id: string }) {
  return (
    <>
      <path d="M17 5l4 10-4 3-3-11z" fill={`url(#${id})`} opacity={0.85} />
      <path d="M31 5l-4 10 4 3 3-11z" fill={`url(#${id})`} opacity={0.85} />
      <circle cx="24" cy="26" r="10" fill={`url(#${id})`} />
      <circle cx="24" cy="26" r="6.2" fill="none" stroke="rgba(255,255,255,0.55)" strokeWidth="1.4" />
      <path d="M24 21.5l1.3 2.7 3 .4-2.2 2.1.5 3-2.6-1.4-2.6 1.4.5-3-2.2-2.1 3-.4z" fill="rgba(255,255,255,0.75)" />
    </>
  );
}

/** Huy chương ngôi sao — giải thưởng cá nhân (Quả bóng vàng, Cầu thủ xuất sắc...). */
function StarMedal({ id }: { id: string }) {
  return (
    <>
      <path
        d="M24 6l3.6 7.3 8 1.2-5.8 5.7 1.4 8-7.2-3.8-7.2 3.8 1.4-8-5.8-5.7 8-1.2z"
        fill={`url(#${id})`}
      />
      <circle cx="24" cy="17.5" r="4.2" fill="rgba(255,255,255,0.55)" />
    </>
  );
}

const RENDER: Record<HonorCategory, (props: { id: string }) => any> = {
  league: ClassicCup,
  continental: TallEuroCup,
  cup: SmallDomesticCup,
  international: MedalBadge,
  individual: StarMedal,
  other: ClassicCup,
};

export default function TrophyIcon({ category, size = 44 }: { category: HonorCategory; size?: number }) {
  const id = `trophy-grad-${category}`;
  const [from, to] = GRADIENTS[category];
  const Shape = RENDER[category];
  return (
    <svg width={size} height={size} viewBox="0 0 48 40" className="trophy-icon" aria-hidden>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={from} />
          <stop offset="100%" stopColor={to} />
        </linearGradient>
      </defs>
      <Shape id={id} />
    </svg>
  );
}
