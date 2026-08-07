import Page from "@/components/Page";
import Link from "next/link";
import {
  getFixtureBySlugOrId,
  getFixtureLineup,
  getFixtureSlug,
} from "@/lib/data";
import { notFound, redirect } from "next/navigation";
import type { FixtureEvent } from "@/lib/types";
import LineupSection from "@/components/LineupSection";

export const dynamic = "force-dynamic";

const statusLabel: Record<string, string> = {
  scheduled: "Sắp diễn ra",
  live: "Đang diễn ra",
  finished: "Đã kết thúc",
  postponed: "Hoãn",
};

const EVENT_ICON: Record<string, string> = {
  goal: "⚽",
  yellow: "🟨",
  red: "🟥",
  sub: "⇅",
};

function TeamMark({ name, logo }: { name: string; logo: string | null }) {
  return (
    <div className="match-detail-team">
      {logo ? (
        <img src={logo} alt={name} />
      ) : (
        <div className="fallback">{name.slice(0, 2).toUpperCase()}</div>
      )}
      <span className="name">{name}</span>
    </div>
  );
}

export default async function MatchDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const f = await getFixtureBySlugOrId(slug);
  if (!f) notFound();

  if (slug !== getFixtureSlug(f)) {
    redirect(`/lich-thi-dau/${getFixtureSlug(f)}`);
  }

  const events = (f.events || []) as FixtureEvent[];
  const homeEvents = events.filter((e) => e.team === "home");
  const awayEvents = events.filter((e) => e.team === "away");
  const maxRows = Math.max(homeEvents.length, awayEvents.length, 1);
  const lineup = await getFixtureLineup(f);

  return (
    <Page>
      <div className="match-detail">
        <div className="breadcrumb">
          <Link href="/lich-thi-dau">Lịch thi đấu</Link> / {f.competition}
        </div>

        <div className="match-detail-header">
          <div className="match-detail-comp">{f.competition}</div>
          <div className="match-detail-scoreline">
            <TeamMark name={f.home_team} logo={f.home_logo_url} />
            <div className="match-detail-score">
              {f.home_score ?? "-"} : {f.away_score ?? "-"}
            </div>
            <TeamMark name={f.away_team} logo={f.away_logo_url} />
          </div>
          <div className="match-detail-sub">
            {new Date(f.match_time).toLocaleString("vi-VN")}
            {f.stadium ? ` · ${f.stadium}` : ""}
          </div>
          <div className="match-detail-status">
            <span className={`status-pill status-${f.status}`}>
              {statusLabel[f.status] || f.status}
            </span>
          </div>
        </div>

        <LineupSection lineup={lineup} defaultOpen />

        <div className="match-events">
          <h2>Diễn biến trận đấu</h2>
          {events.length ? (
            Array.from({ length: maxRows }).map((_, i) => {
              const h = homeEvents[i];
              const a = awayEvents[i];
              return (
                <div className="event-line" key={i}>
                  <div className="event-side home">
                    {h && (
                      <>
                        <span className="icon">{EVENT_ICON[h.type]}</span>
                        <span className="info">
                          <b>{h.player}</b>
                          {h.note && <small>{h.note}</small>}
                        </span>
                      </>
                    )}
                  </div>
                  <div className="event-minute-badge">
                    {h ? h.minute : a ? a.minute : ""}'
                  </div>
                  <div className="event-side away">
                    {a && (
                      <>
                        <span className="icon">{EVENT_ICON[a.type]}</span>
                        <span className="info">
                          <b>{a.player}</b>
                          {a.note && <small>{a.note}</small>}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          ) : (
            <div className="match-events-empty">
              Chưa có dữ liệu diễn biến trận đấu.
            </div>
          )}
        </div>
      </div>
    </Page>
  );
}
