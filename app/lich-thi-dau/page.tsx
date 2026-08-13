import Page from "@/components/Page";
import Link from "next/link";
import { getFixtures, getFixtureSlug, getStandings } from "@/lib/data";
import type { Fixture } from "@/lib/types";
import { COMPETITIONS } from "@/lib/types";
import { CalendarDays, ListOrdered } from "lucide-react";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  scheduled: "Sắp diễn ra",
  live: "Đang diễn ra",
  finished: "Đã kết thúc",
  postponed: "Hoãn",
};

function initials(name: string) {
  return (
    name
      .split(" ")
      .filter((w) => w.length > 2 || /^[A-ZÀ-Ỹ]/.test(w))
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase()
      .slice(0, 2) || name.slice(0, 2).toUpperCase()
  );
}

function TeamBadge({ name, logo }: { name: string; logo: string | null }) {
  return logo ? (
    <img className="team-badge" src={logo} alt={name} />
  ) : (
    <span className="team-badge team-badge-fallback">{initials(name)}</span>
  );
}

export default async function LichThiDauPage({
  searchParams,
}: {
  searchParams: Promise<{ comp?: string; view?: string }>;
}) {
  const { comp, view } = await searchParams;
  const activeView = view === "bxh" ? "bxh" : "fixtures";
  const [all, standings] = await Promise.all([getFixtures(), getStandings()]);
  const fixtures = comp ? all.filter((f) => f.competition === comp) : all;

  return (
    <Page>
      <div className="list-page-header">
        <h1>Lịch thi đấu</h1>
        <p>
          Các trận đấu của Real Madrid — La Liga, Champions League, Cúp Nhà Vua
          &amp; giao hữu
        </p>
      </div>

      <div className="view-tabs">
        <Link
          href="/lich-thi-dau"
          className={activeView === "fixtures" ? "active" : ""}
        >
          <CalendarDays size={15} /> Trận đấu
        </Link>
        <Link
          href="/lich-thi-dau?view=bxh"
          className={activeView === "bxh" ? "active" : ""}
        >
          <ListOrdered size={15} /> Bảng xếp hạng
        </Link>
      </div>

      {activeView === "fixtures" ? (
        <>
          <div className="comp-tabs">
            <Link href="/lich-thi-dau" className={!comp ? "active" : ""}>
              Tất cả
            </Link>
            {COMPETITIONS.map((c) => (
              <Link
                key={c}
                href={`/lich-thi-dau?comp=${encodeURIComponent(c)}`}
                className={comp === c ? "active" : ""}
              >
                {c}
              </Link>
            ))}
          </div>

          <div className="fixtures-list">
            {fixtures.length ? (
              fixtures.map((f: Fixture) => (
                <Link
                  className="fixture-card"
                  href={`/lich-thi-dau/${getFixtureSlug(f)}`}
                  key={f.id}
                >
                  <div className="fixture-main">
                    <div className="fixture-top">
                      <span className="comp-tag">{f.competition}</span>
                      <span className={`status-pill status-${f.status}`}>
                        {statusLabel[f.status] || f.status}
                      </span>
                    </div>
                    <div className="match-line-teams">
                      <div className="match-team">
                        <TeamBadge name={f.home_team} logo={f.home_logo_url} />
                        <span className="match-team-name">{f.home_team}</span>
                      </div>
                      <div className="match-score">
                        <span className="match-score-num">
                          {f.home_score ?? "-"}
                        </span>
                        <span className="match-score-sep">–</span>
                        <span className="match-score-num">
                          {f.away_score ?? "-"}
                        </span>
                      </div>
                      <div className="match-team away">
                        <TeamBadge name={f.away_team} logo={f.away_logo_url} />
                        <span className="match-team-name">{f.away_team}</span>
                      </div>
                    </div>
                    <div className="match-sub">
                      {new Date(f.match_time).toLocaleString("vi-VN")}
                      {f.stadium ? ` · ${f.stadium}` : ""}
                    </div>
                  </div>
                </Link>
              ))
            ) : (
              <div className="empty">
                Chưa có lịch thi đấu{comp ? ` cho ${comp}` : ""}.
              </div>
            )}
          </div>
        </>
      ) : (
        <section
          style={{ maxWidth: 860, margin: "0 auto 60px", padding: "0 20px" }}
        >
          {standings ? (
            <>
              <div className="standings-head">
                <span>Vô địch Quốc gia Tây Ban Nha</span>
                <span className="standings-season">{standings.season}</span>
              </div>
              <div className="panel" style={{ overflowX: "auto" }}>
                <table className="standings-table">
                  <thead>
                    <tr>
                      <th>#</th>
                      <th className="st-team">Câu lạc bộ</th>
                      <th>ĐĐ</th>
                      <th>Thắng</th>
                      <th>H</th>
                      <th>Thua</th>
                      <th>HS</th>
                      <th>Đ</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.table.map((row) => (
                      <tr
                        key={row.rank}
                        className={
                          /real madrid/i.test(row.team) ? "st-highlight" : ""
                        }
                      >
                        <td>{row.rank}</td>
                        <td className="st-team">
                          {row.badge && <img src={row.badge} alt="" />}
                          {row.team}
                        </td>
                        <td>{row.played}</td>
                        <td>{row.win}</td>
                        <td>{row.draw}</td>
                        <td>{row.loss}</td>
                        <td>{row.gd > 0 ? `+${row.gd}` : row.gd}</td>
                        <td className="st-points">{row.points}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          ) : (
            <div className="empty">
              Chưa có dữ liệu bảng xếp hạng. Vào trang quản trị để đồng bộ.
            </div>
          )}
        </section>
      )}
    </Page>
  );
}
