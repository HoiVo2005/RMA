import Page from "@/components/Page";
import ArticleCard from "@/components/ArticleCard";
import { ArticleBadges, timeAgo } from "@/components/Badges";
import {
  getArticles,
  getSources,
  getUpcomingFixture,
  getStartingLineup,
  getStandings,
  getTrendingArticles,
  getFixturePrediction,
  getLiveFixture,
  getFixtures,
} from "@/lib/data";
import { getSiteSettings } from "@/lib/site-settings";
import { articleHref } from "@/lib/article-url";
import LineupSection from "@/components/LineupSection";
import CountdownTimer from "@/components/CountdownTimer";
import PredictionWidget from "@/components/PredictionWidget";
import LiveMatchCenter from "@/components/LiveMatchCenter";
import RecommendedArticles from "@/components/RecommendedArticles";
import Link from "next/link";
import TimelineCenter from "@/components/TimelineCenter";
import TransferCenter from "@/components/TransferCenter";
import {
  ArrowRight,
  Newspaper,
  Radio,
  Trophy,
  ListOrdered,
  Repeat2,
  Users,
  CalendarDays,
  Flame,
  Eye,
} from "lucide-react";

export const dynamic = "force-dynamic";

const quickNav = [
  { href: "/tin-moi", label: "Tin mới", icon: Newspaper },
  { href: "/chuyen-nhuong", label: "Chuyển nhượng", icon: Repeat2 },
  { href: "/lich-thi-dau", label: "Lịch thi đấu", icon: CalendarDays },
  { href: "/doi-hinh", label: "Đội hình", icon: Users },
];

export default async function Home() {
  const [
    articles,
    sources,
    nextFixture,
    lineup,
    standings,
    trending,
    liveFixture,
    settings,
    fixtures,
  ] = await Promise.all([
    getArticles({ limit: 13 }),
    getSources(),
    getUpcomingFixture(),
    getStartingLineup(),
    getStandings(),
    getTrendingArticles(5),
    getLiveFixture(),
    getSiteSettings(),
    getFixtures(),
  ]);
  const prediction = nextFixture
    ? await getFixturePrediction(nextFixture.id)
    : null;

  const hero = articles.find((a) => a.is_featured) || articles[0];
  const rest = articles.filter((a) => a.id !== hero?.id);
  const secondary = rest.slice(0, 3);
  const feed = rest.slice(3, 9);
  const quickReads = rest.slice(9, 13);
  const rmRank = standings?.table.find((r) => /real madrid/i.test(r.team));

  return (
    <Page>
      {settings.bannerUrl && (
        <section className="container" style={{ marginTop: 16 }}>
          {settings.bannerLink ? (
            <Link href={settings.bannerLink} className="home-promo-banner">
              <img
                src={settings.bannerUrl}
                alt={settings.bannerTitle || "Banner"}
              />
              {(settings.bannerTitle || settings.bannerSubtitle) && (
                <div className="home-promo-banner-body">
                  {settings.bannerTitle && <b>{settings.bannerTitle}</b>}
                  {settings.bannerSubtitle && (
                    <span>{settings.bannerSubtitle}</span>
                  )}
                </div>
              )}
            </Link>
          ) : (
            <div className="home-promo-banner">
              <img
                src={settings.bannerUrl}
                alt={settings.bannerTitle || "Banner"}
              />
              {(settings.bannerTitle || settings.bannerSubtitle) && (
                <div className="home-promo-banner-body">
                  {settings.bannerTitle && <b>{settings.bannerTitle}</b>}
                  {settings.bannerSubtitle && (
                    <span>{settings.bannerSubtitle}</span>
                  )}
                </div>
              )}
            </div>
          )}
        </section>
      )}
      {hero && (
        <section className="home-hero">
          <div className="container home-hero-grid">
            <Link href={articleHref(hero)} className="hero hero-main">
              <div
                className="hero-bg"
                style={{ backgroundImage: `url(${hero.image_url || ""})` }}
              />
              <div className="hero-inner">
                <span className="hero-tag">
                  <Radio size={12} /> TIN NỔI BẬT
                </span>
                <h1>{hero.translated_title}</h1>
                <p>{hero.summary_vi}</p>
                <div className="meta-row">
                  <span>{hero.source_name}</span>
                  <span>· {timeAgo(hero.published_at)}</span>
                </div>
                <span className="cta">
                  Đọc chi tiết <ArrowRight size={15} />
                </span>
              </div>
            </Link>

            {secondary.length > 0 && (
              <div className="hero-secondary">
                {secondary.map((a) => (
                  <Link
                    className="hero-secondary-item"
                    href={articleHref(a)}
                    key={a.id}
                  >
                    {a.image_url ? (
                      <img src={a.image_url} alt={a.translated_title} />
                    ) : (
                      <div className="hero-secondary-noimg" />
                    )}
                    <div className="hero-secondary-body">
                      <ArticleBadges a={a} />
                      <h3>{a.translated_title}</h3>
                      <span className="card-meta">
                        {a.source_name} · {timeAgo(a.published_at)}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      <div className="container">
        <LiveMatchCenter initial={liveFixture} />

        <RecommendedArticles />

        <div style={{ marginTop: 18 }} className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 12 }}>
            <div>
              <TransferCenter defaultTopic="Rodri" />
            </div>
            <div>
              <TimelineCenter defaultTopic="Rodri" />
            </div>
          </div>
        </div>

        <nav className="quick-nav">
          {quickNav.map((n) => {
            const Icon = n.icon;
            return (
              <Link key={n.href} href={n.href} className="quick-nav-item">
                <Icon size={16} /> {n.label}
              </Link>
            );
          })}
        </nav>

        <LineupSection lineup={lineup} />
      </div>

      <div className="page-content">
        <section>
          <div className="section-title-row">
            <h2 className="section-title">
              <Newspaper
                size={17}
                style={{ verticalAlign: -3, marginRight: 6 }}
              />
              Tin mới nhất
            </h2>
            <Link href="/tin-moi" className="section-more">
              Xem tất cả <ArrowRight size={13} />
            </Link>
          </div>
          <div className="article-grid">
            {feed.length ? (
              feed.map((a) => <ArticleCard key={a.id} a={a} />)
            ) : (
              <div className="empty">
                Chưa có bài viết nào. Vào trang quản trị để lấy tin tự động hoặc
                dán liên kết bài viết.
              </div>
            )}
          </div>
        </section>

        <aside className="sidebar">
          {nextFixture && (
            <div className="widget">
              <h3>
                <Trophy size={15} /> Trận đấu sắp tới
              </h3>
              <span
                className="badge badge-category"
                style={{ marginBottom: 10, display: "inline-flex" }}
              >
                {nextFixture.competition}
              </span>
              <div className="next-fixture-teams">
                <div className="next-fixture-team">
                  {nextFixture.home_logo_url ? (
                    <img
                      src={nextFixture.home_logo_url}
                      alt={nextFixture.home_team}
                    />
                  ) : (
                    <span className="team-badge team-badge-fallback">
                      {nextFixture.home_team.slice(0, 2)}
                    </span>
                  )}
                  <span>{nextFixture.home_team}</span>
                </div>
                <span className="next-fixture-vs">vs</span>
                <div className="next-fixture-team">
                  {nextFixture.away_logo_url ? (
                    <img
                      src={nextFixture.away_logo_url}
                      alt={nextFixture.away_team}
                    />
                  ) : (
                    <span className="team-badge team-badge-fallback">
                      {nextFixture.away_team.slice(0, 2)}
                    </span>
                  )}
                  <span>{nextFixture.away_team}</span>
                </div>
              </div>
              <CountdownTimer target={nextFixture.match_time} />
              <p className="next-fixture-time">
                {new Date(nextFixture.match_time).toLocaleString("vi-VN")}
                {nextFixture.stadium ? ` · ${nextFixture.stadium}` : ""}
              </p>
              <Link href="/lich-thi-dau" className="widget-link">
                Xem lịch thi đấu <ArrowRight size={12} />
              </Link>
            </div>
          )}

          {nextFixture && prediction && (
            <PredictionWidget
              fixtureId={nextFixture.id}
              homeTeam={nextFixture.home_team}
              awayTeam={nextFixture.away_team}
              initial={prediction}
            />
          )}

          {trending.length > 0 && (
            <div className="widget">
              <h3>
                <Flame size={15} /> Đọc nhiều nhất
              </h3>
              {trending.map((a, i) => (
                <Link
                  className="trending-item"
                  href={articleHref(a)}
                  key={a.id}
                >
                  <span className="trending-rank">{i + 1}</span>
                  <div className="trending-body">
                    <h4>{a.translated_title}</h4>
                    <span>
                      <Eye size={11} />{" "}
                      {(a.view_count || 0).toLocaleString("vi-VN")} lượt xem
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}

          {rmRank && (
            <div className="widget">
              <h3>
                <ListOrdered size={15} /> Bảng xếp hạng
              </h3>
              <div className="mini-standing">
                <span className="mini-standing-rank">#{rmRank.rank}</span>
                <div>
                  <div className="mini-standing-team">Real Madrid</div>
                  <div className="mini-standing-sub">
                    {rmRank.played} trận · {rmRank.points} điểm · HS{" "}
                    {rmRank.gd > 0 ? `+${rmRank.gd}` : rmRank.gd}
                  </div>
                </div>
              </div>
              <Link href="/lich-thi-dau?view=bxh" className="widget-link">
                Xem toàn bảng <ArrowRight size={12} />
              </Link>
            </div>
          )}

          <div className="widget">
            <h3>Nguồn uy tín</h3>
            {sources.slice(0, 8).map((s) => (
              <div className="source-item" key={s.id}>
                <b>{s.name}</b>
                <span>{s.country}</span>
              </div>
            ))}
          </div>

          {quickReads.length > 0 && (
            <div className="widget">
              <h3>Đọc nhanh</h3>
              {quickReads.map((a, i) => (
                <Link
                  className="quick-read-item"
                  href={articleHref(a)}
                  key={a.id}
                >
                  <span className="quick-read-num">{i + 1}</span>
                  <span className="quick-read-title">{a.translated_title}</span>
                </Link>
              ))}
            </div>
          )}
        </aside>
      </div>
    </Page>
  );
}
