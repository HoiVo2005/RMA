import Page from "@/components/Page";
import { getPlayer } from "@/lib/data";
import { notFound } from "next/navigation";
import { flagUrl } from "@/lib/flags";
import { parseClubStints, parseHonors, categorizeHonor } from "@/lib/career";
import { fetchHonorImages } from "@/lib/honor-images";
import { getTeamBadgeUrl } from "@/lib/sportsdb";
import { fetchPlayerImageUrl } from "@/lib/wikipedia";
import FollowPlayerButton from "@/components/FollowPlayerButton";
import TrophyIcon from "@/components/TrophyIcon";
import Link from "next/link";
import {
  ArrowLeft,
  Trophy,
  Shirt,
  Calendar,
  CalendarDays,
  MapPin,
  Ruler,
  Flag,
  Shield,
  Goal,
  Users,
} from "lucide-react";

export default async function PlayerProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const p = await getPlayer(id);
  if (!p) notFound();

  const playerImageUrl =
    p.image_url?.trim() || (await fetchPlayerImageUrl(p.name));

  const youthClubs = parseClubStints(p.youth_clubs);
  const seniorClubs = parseClubStints(p.career_clubs);
  const nationalTeam = parseClubStints(p.national_team);
  const honors = parseHonors(p.honors);
  const totalHonors = honors.reduce(
    (sum, h) => sum + (parseInt(h.count, 10) || 0),
    0,
  );
  // Nếu admin đã bấm "Lấy ảnh tự động" (hoặc dán ảnh thủ công) và lưu lại, ảnh
  // đó được dùng luôn — chỉ những danh hiệu CHƯA có ảnh lưu sẵn mới cần tự
  // tra Wikipedia lúc hiển thị trang này.
  const honorsMissingImage = honors.filter((h) => !h.image_url);
  const fetchedImages = await fetchHonorImages(
    honorsMissingImage.map((h) => h.title),
  );

  const age = p.date_of_birth
    ? Math.floor(
        (Date.now() - new Date(p.date_of_birth).getTime()) /
          (365.25 * 24 * 3600 * 1000),
      )
    : null;

  const clubNames = Array.from(
    new Set([
      ...youthClubs.map((c) => c.name.trim()).filter(Boolean),
      ...seniorClubs.map((c) => c.name.trim()).filter(Boolean),
      ...nationalTeam.map((c) => c.name.trim()).filter(Boolean),
    ]),
  );

  const badgeEntries = await Promise.all(
    clubNames.map(
      async (name) =>
        [name, await getTeamBadgeUrl(name).catch(() => null)] as const,
    ),
  );
  const teamBadgeByName = new Map<string, string | null>(badgeEntries);

  const manualLogoByName = new Map<string, string | null>();
  for (const stint of [...youthClubs, ...seniorClubs, ...nationalTeam]) {
    const trimmed = stint.name.trim();
    if (trimmed && stint.logo_url?.trim()) {
      manualLogoByName.set(trimmed, stint.logo_url.trim());
    }
  }

  function renderClubCell(name: string) {
    const logo = manualLogoByName.get(name) || teamBadgeByName.get(name);
    return (
      <div className="career-club-cell">
        {logo ? (
          <img
            className="career-club-badge"
            src={logo}
            alt={name}
            width={28}
            height={28}
          />
        ) : (
          <span className="career-club-fallback">
            <Shield size={12} />
          </span>
        )}
        <span className="career-club-name">{name}</span>
      </div>
    );
  }

  return (
    <Page>
      <div className="player-profile-wrap">
        <Link href="/doi-hinh" className="breadcrumb-back">
          <ArrowLeft size={14} /> Quay lại Đội hình
        </Link>

        <div className="player-profile-hero">
          {p.image_url ? (
            <img
              className="player-profile-photo"
              src={p.image_url}
              alt={p.name}
            />
          ) : (
            <div className="player-profile-photo-fallback">
              {p.shirt_number ?? "?"}
            </div>
          )}
          <div className="player-profile-info">
            <div className="player-profile-badges-row">
              {p.shirt_number != null && (
                <span className="player-profile-chip">
                  <Shirt size={13} /> Số {p.shirt_number}
                </span>
              )}
              {p.position && (
                <span className="player-profile-chip">{p.position}</span>
              )}
              {p.nationality && (
                <span className="player-profile-chip">
                  {flagUrl(p.nationality) && (
                    <img
                      src={flagUrl(p.nationality)!}
                      alt={p.nationality}
                      width={16}
                      height={12}
                      style={{ borderRadius: 2 }}
                    />
                  )}
                  {p.nationality}
                </span>
              )}
            </div>
            <h1>{p.name}</h1>
            {p.bio && <p className="player-profile-bio">{p.bio}</p>}
            <FollowPlayerButton
              player={{
                id: p.id,
                name: p.name,
                image: p.image_url,
                position: p.position,
              }}
            />
          </div>
        </div>

        {/* ===== Thông tin cá nhân — dạng bảng infobox ===== */}
        <section className="player-profile-section">
          <h2 className="section-title">Thông tin cá nhân</h2>
          <table className="info-table">
            <tbody>
              <tr>
                <th>Tên đầy đủ</th>
                <td>{p.name}</td>
              </tr>
              {p.date_of_birth && (
                <tr>
                  <th>
                    <Calendar size={13} /> Ngày sinh
                  </th>
                  <td>
                    {new Date(p.date_of_birth).toLocaleDateString("vi-VN")}
                    {age != null && ` (${age} tuổi)`}
                  </td>
                </tr>
              )}
              {p.birthplace && (
                <tr>
                  <th>
                    <MapPin size={13} /> Nơi sinh
                  </th>
                  <td>{p.birthplace}</td>
                </tr>
              )}
              {p.height_cm && (
                <tr>
                  <th>
                    <Ruler size={13} /> Chiều cao
                  </th>
                  <td>{(p.height_cm / 100).toFixed(2)} m</td>
                </tr>
              )}
              {p.position && (
                <tr>
                  <th>
                    <Shield size={13} /> Vị trí
                  </th>
                  <td>{p.position}</td>
                </tr>
              )}
              {p.nationality && (
                <tr>
                  <th>
                    <Flag size={13} /> Quốc tịch
                  </th>
                  <td>{p.nationality}</td>
                </tr>
              )}
              <tr>
                <th>
                  <Shield size={13} /> Đội hiện tại
                </th>
                <td>Real Madrid</td>
              </tr>
            </tbody>
          </table>
        </section>

        {youthClubs.length > 0 && (
          <section className="player-profile-section">
            <h2 className="section-title">Sự nghiệp cầu thủ trẻ</h2>
            <table className="info-table career-table">
              <thead>
                <tr>
                  <th>
                    <CalendarDays size={13} /> Năm
                  </th>
                  <th>
                    <Shield size={13} /> Đội
                  </th>
                </tr>
              </thead>
              <tbody>
                {youthClubs.map((c, i) => (
                  <tr key={i}>
                    <td className="career-table-years">
                      {c.fromYear || "?"}–{c.toYear || "nay"}
                    </td>
                    <td>{renderClubCell(c.name)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {seniorClubs.length > 0 && (
          <section className="player-profile-section">
            <h2 className="section-title">Sự nghiệp cầu thủ chuyên nghiệp</h2>
            <table className="info-table career-table">
              <thead>
                <tr>
                  <th>
                    <CalendarDays size={13} /> Năm
                  </th>
                  <th>
                    <Shield size={13} /> Đội
                  </th>
                  <th title="Số trận">
                    <Users size={13} /> ST
                  </th>
                  <th title="Số bàn">
                    <Goal size={13} /> BT
                  </th>
                </tr>
              </thead>
              <tbody>
                {seniorClubs.map((c, i) => {
                  const isRealMadrid = /real madrid/i.test(c.name);
                  return (
                    <tr key={i} className={isRealMadrid ? "is-current" : ""}>
                      <td className="career-table-years">
                        {c.fromYear || "?"}–{c.toYear || "nay"}
                      </td>
                      <td>{renderClubCell(c.name)}</td>
                      <td>{c.apps || "—"}</td>
                      <td>{c.goals ? `(${c.goals})` : "—"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </section>
        )}

        {nationalTeam.length > 0 && (
          <section className="player-profile-section">
            <h2 className="section-title">Sự nghiệp đội tuyển quốc gia</h2>
            <table className="info-table career-table">
              <thead>
                <tr>
                  <th>
                    <CalendarDays size={13} /> Năm
                  </th>
                  <th>
                    <Shield size={13} /> Đội
                  </th>
                  <th title="Số trận">
                    <Users size={13} /> ST
                  </th>
                  <th title="Số bàn">
                    <Goal size={13} /> BT
                  </th>
                </tr>
              </thead>
              <tbody>
                {nationalTeam.map((c, i) => (
                  <tr key={i}>
                    <td className="career-table-years">
                      {c.fromYear || "?"}–{c.toYear || "nay"}
                    </td>
                    <td>{renderClubCell(c.name)}</td>
                    <td>{c.apps || "—"}</td>
                    <td>{c.goals ? `(${c.goals})` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        )}

        {honors.length > 0 && (
          <section className="player-profile-section">
            <h2 className="section-title">
              <Trophy size={17} style={{ verticalAlign: -3, marginRight: 6 }} />
              Danh hiệu sự nghiệp
              {totalHonors > 0 && (
                <span className="honors-total">{totalHonors} danh hiệu</span>
              )}
            </h2>
            <div className="honors-grid">
              {honors.map((h, i) => {
                const category = categorizeHonor(h.title);
                const image = (
                  h.image_url ||
                  fetchedImages[h.title.trim()] ||
                  ""
                ).trim();
                return (
                  <div className={`honor-card honor-card--${category}`} key={i}>
                    <div className="honor-card-top">
                      <div className="honor-card-count">{h.count || "—"}</div>
                      {image ? (
                        <img
                          className="honor-card-photo"
                          src={image}
                          alt={h.title}
                          loading="lazy"
                        />
                      ) : (
                        <TrophyIcon category={category} size={40} />
                      )}
                    </div>
                    <div className="honor-card-title">{h.title}</div>
                    {h.years && (
                      <div className="honor-card-years">{h.years}</div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {honors.length === 0 &&
          seniorClubs.length === 0 &&
          youthClubs.length === 0 &&
          nationalTeam.length === 0 &&
          !p.bio && (
            <div className="empty" style={{ marginTop: 24 }}>
              Chưa có thông tin chi tiết về sự nghiệp cầu thủ này. Vào trang
              quản trị → Đội hình để bổ sung.
            </div>
          )}
      </div>
    </Page>
  );
}
