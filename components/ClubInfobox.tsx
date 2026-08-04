import { getStandings } from '@/lib/data';
import { getClubInfo, yearsSinceFounded } from '@/lib/club-info';
import { Trophy, Users2, MapPin, Calendar, Globe } from 'lucide-react';
import KitGallery from './KitGallery';

/**
 * Huy hiệu minh hoạ dạng khiên — KHÔNG sao chép logo chính thức của CLB (là
 * tài sản có bản quyền/thương hiệu), chỉ là hình khiên + vương miện cách điệu
 * cùng tinh thần với ký hiệu "♛" đã dùng ở Header, mang màu sắc của CLB.
 */
function ClubCrest() {
  return (
    <svg width="72" height="80" viewBox="0 0 72 80" aria-hidden>
      <defs>
        <linearGradient id="crest-shield" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffffff" />
          <stop offset="100%" stopColor="#e9ebf4" />
        </linearGradient>
        <linearGradient id="crest-crown" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#ffd25f" />
          <stop offset="100%" stopColor="#f2b807" />
        </linearGradient>
      </defs>
      <path d="M8 26h56v20c0 18-14 30-28 32-14-2-28-14-28-32V26z" fill="url(#crest-shield)" stroke="var(--navy-700)" strokeWidth="2" />
      <path
        d="M14 22l4-9 5 6 6-10 7 10 6-10 5 6 4-6v11H14z"
        fill="url(#crest-crown)"
        stroke="var(--navy-700)"
        strokeWidth="1.4"
        strokeLinejoin="round"
      />
      <text x="36" y="46" textAnchor="middle" fontFamily="var(--font-display)" fontWeight="800" fontSize="20" fill="var(--navy-800)">
        RM
      </text>
    </svg>
  );
}

export default async function ClubInfobox() {
  const [clubInfo, standings] = await Promise.all([getClubInfo(), getStandings()]);
  const row = standings?.table.find((r) => /real madrid/i.test(r.team));
  const totalTeams = standings?.table.length;

  const rows: { icon: any; label: string; value: React.ReactNode }[] = [
    { icon: Trophy, label: 'Tên đầy đủ', value: clubInfo.fullName },
    {
      icon: Users2,
      label: 'Biệt danh',
      value: (
        <>
          {clubInfo.nicknames.map((n, i) => (
            <span key={i} style={{ display: 'block', fontStyle: 'italic' }}>
              {n}
            </span>
          ))}
        </>
      ),
    },
    {
      icon: Calendar,
      label: 'Thành lập',
      value: (
        <>
          {clubInfo.foundedLabel}; {yearsSinceFounded(clubInfo.founded)} năm trước
          <span style={{ display: 'block', color: 'var(--ink-300)', fontSize: 12.5 }}>với tên "{clubInfo.foundedAs}"</span>
        </>
      ),
    },
    { icon: MapPin, label: 'Sân', value: clubInfo.stadium },
    { icon: Users2, label: 'Sức chứa', value: clubInfo.capacity.toLocaleString('vi-VN') },
    { icon: Trophy, label: 'Chủ tịch', value: clubInfo.president },
    { icon: Trophy, label: 'Huấn luyện viên trưởng', value: clubInfo.headCoach },
  ];

  if (row) {
    rows.push({
      icon: Trophy,
      label: `${standings!.season} La Liga`,
      value: `Thứ ${row.rank}${totalTeams ? ` trên ${totalTeams}` : ''}`,
    });
  }

  rows.push({
    icon: Globe,
    label: 'Website',
    value: (
      <a href={clubInfo.website} target="_blank" rel="noopener noreferrer">
        {clubInfo.website.replace('https://', '')}
      </a>
    ),
  });

  return (
    <aside className="club-infobox">
      <div className="club-infobox-head">
        {clubInfo.logoUrl ? (
          <img src={clubInfo.logoUrl} alt={clubInfo.name} className="club-infobox-logo" />
        ) : (
          <ClubCrest />
        )}
        <h2>{clubInfo.name}</h2>
      </div>

      <table className="club-infobox-table">
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <th>{r.label}</th>
              <td>{r.value}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <KitGallery kits={Object.values(clubInfo.colors)} />
    </aside>
  );
}
