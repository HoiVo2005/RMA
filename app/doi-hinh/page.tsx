import Page from '@/components/Page';
import { getPlayers, getStartingLineup } from '@/lib/data';
import type { Player } from '@/lib/types';
import LineupSection from '@/components/LineupSection';
import PlayerCarousel from '@/components/PlayerCarousel';
import ClubInfobox from '@/components/ClubInfobox';

export const revalidate = 300;

const POSITION_ORDER = ['Thủ môn', 'Hậu vệ', 'Tiền vệ', 'Tiền đạo'] as const;

function groupByPosition(players: Player[]) {
  const groups = new Map<string, Player[]>();
  for (const label of POSITION_ORDER) groups.set(label, []);
  const other: Player[] = [];

  for (const p of players) {
    const key = POSITION_ORDER.find((l) => l === p.position);
    if (key) groups.get(key)!.push(p);
    else other.push(p);
  }

  for (const list of groups.values()) {
    list.sort((a, b) => (a.shirt_number ?? 999) - (b.shirt_number ?? 999));
  }
  other.sort((a, b) => (a.shirt_number ?? 999) - (b.shirt_number ?? 999));

  return { groups, other };
}

export default async function DoiHinhPage() {
  const [players, lineup] = await Promise.all([getPlayers(), getStartingLineup()]);
  const { groups, other } = groupByPosition(players);

  return (
    <Page>
      <div className="list-page-header">
        <h1>Đội hình Real Madrid</h1>
        <p>Danh sách cầu thủ hiện tại của đội một, sắp xếp theo vị trí thi đấu</p>
      </div>

      <div className="container club-info-row" style={{ marginTop: 24 }}>
        <LineupSection lineup={lineup} defaultOpen />
        <ClubInfobox />
      </div>

      {players.length ? (
        <>
          {POSITION_ORDER.map((label) => {
            const list = groups.get(label)!;
            if (!list.length) return null;
            return (
              <section key={label}>
                <h2 className="section-title" style={{ maxWidth: 1200, margin: '28px auto 0', padding: '0 0 0 12px' }}>
                  {label} <span style={{ color: 'var(--ink-300)', fontWeight: 600, fontSize: 14 }}>({list.length})</span>
                </h2>
                <PlayerCarousel players={list} />
              </section>
            );
          })}

          {other.length > 0 && (
            <section>
              <h2 className="section-title" style={{ maxWidth: 1200, margin: '28px auto 0', padding: '0 0 0 12px' }}>
                Khác
              </h2>
              <PlayerCarousel players={other} />
            </section>
          )}
        </>
      ) : (
        <div className="player-grid">
          <div className="empty">Chưa có dữ liệu cầu thủ.</div>
        </div>
      )}
    </Page>
  );
}
