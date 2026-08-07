"use client";
import { useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import CrudManager, {
  CrudManagerHandle,
  FieldConfig,
} from "@/components/admin/CrudManager";
import { adminJson } from "@/lib/admin-client";
import { FIXTURE_STATUSES, COMPETITIONS } from "@/lib/types";
import { RefreshCcw, Image as ImageIcon, Goal, Link2 } from "lucide-react";
import MatchEventsEditor from "@/components/admin/MatchEventsEditor";
import type { Fixture } from "@/lib/types";

const fields: FieldConfig[] = [
  {
    name: "competition",
    label: "Giải đấu",
    type: "select",
    options: [...COMPETITIONS],
    required: true,
  },
  {
    name: "home_team",
    label: "Đội nhà",
    type: "text",
    required: true,
    half: true,
  },
  {
    name: "away_team",
    label: "Đội khách",
    type: "text",
    required: true,
    half: true,
  },
  {
    name: "home_logo_url",
    label: "Logo đội nhà (URL)",
    type: "url",
    half: true,
  },
  {
    name: "away_logo_url",
    label: "Logo đội khách (URL)",
    type: "url",
    half: true,
  },
  { name: "stadium", label: "Sân vận động", type: "text" },
  {
    name: "match_time",
    label: "Thời gian thi đấu",
    type: "datetime",
    required: true,
    half: true,
  },
  {
    name: "status",
    label: "Trạng thái",
    type: "select",
    options: [...FIXTURE_STATUSES],
    half: true,
  },
  {
    name: "home_score",
    label: "Bàn thắng đội nhà",
    type: "number",
    half: true,
  },
  {
    name: "away_score",
    label: "Bàn thắng đội khách",
    type: "number",
    half: true,
  },
];

const defaultValues = {
  competition: "La Liga",
  home_team: "Real Madrid",
  away_team: "",
  home_logo_url: "",
  away_logo_url: "",
  stadium: "Santiago Bernabéu",
  match_time: "",
  status: "scheduled",
  home_score: null,
  away_score: null,
};

const statusLabel: Record<string, string> = {
  scheduled: "Sắp diễn ra",
  live: "Đang đá",
  finished: "Kết thúc",
  postponed: "Hoãn",
};

export default function FixturesAdminPage() {
  const crudRef = useRef<CrudManagerHandle>(null);
  const [syncing, setSyncing] = useState(false);
  const [fillingLogos, setFillingLogos] = useState(false);
  const [syncingStandings, setSyncingStandings] = useState(false);
  const [msg, setMsg] = useState("");
  const [standingsMsg, setStandingsMsg] = useState("");
  const [eventsFixture, setEventsFixture] = useState<Fixture | null>(null);
  const [fixtureUrl, setFixtureUrl] = useState("");
  const [fetchingFixtureUrl, setFetchingFixtureUrl] = useState(false);
  const [fixtureUrlError, setFixtureUrlError] = useState("");

  async function sync() {
    setSyncing(true);
    setMsg("");
    const res = await adminJson("/api/admin/sync-fixtures", { method: "POST" });
    setSyncing(false);
    if (res.error) {
      setMsg("Lỗi: " + res.error);
    } else {
      const d: any = res.data;
      const suffix = d.errors?.length ? ` Lỗi: ${d.errors[0]}` : "";
      const source = d.apiFootballConfigured
        ? "API-Football"
        : "TheSportsDB (dự phòng, có thể thiếu/không khớp)";
      const eventsMsg = d.eventsFilled
        ? ` Đã tự động điền cầu thủ ghi bàn cho ${d.eventsFilled} trận (nguồn: ${source}).`
        : "";
      setMsg(
        `Đã lấy ${d.fetched} trận từ TheSportsDB, cập nhật ${d.upserted} bản ghi.${eventsMsg}${suffix}`,
      );
      crudRef.current?.reload();
    }
  }

  async function fillLogos() {
    setFillingLogos(true);
    setMsg("");
    const res = await adminJson("/api/admin/fill-logos", { method: "POST" });
    setFillingLogos(false);
    if (res.error) {
      setMsg("Lỗi: " + res.error);
    } else {
      const d: any = res.data;
      setMsg(
        `Đã tra ${d.teamsChecked} đội, tìm thấy logo cho ${d.teamsFound} đội, cập nhật ${d.rowsUpdated} trận.`,
      );
      crudRef.current?.reload();
    }
  }

  async function syncStandings() {
    setSyncingStandings(true);
    setStandingsMsg("");
    const res = await adminJson("/api/admin/sync-standings", {
      method: "POST",
    });
    setSyncingStandings(false);
    if (res.error) {
      setStandingsMsg("Lỗi: " + res.error);
    } else {
      const d: any = res.data;
      setStandingsMsg(
        `Đã cập nhật bảng xếp hạng mùa ${d.season} — ${d.teams} đội.`,
      );
    }
  }

  async function fetchFixtureFromUrl() {
    if (!fixtureUrl.trim()) return;
    setFetchingFixtureUrl(true);
    setFixtureUrlError("");
    const res = await adminJson("/api/admin/fetch-fixture-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: fixtureUrl.trim() }),
    });
    setFetchingFixtureUrl(false);
    if (res.error) {
      setFixtureUrlError(res.error);
      return;
    }
    setFixtureUrl("");
    crudRef.current?.openCreate(res.data as any);
  }

  return (
    <AdminShell title="Lịch thi đấu">
      <div className="fetch-url-box">
        <p>
          <b>Đồng bộ lịch thi đấu tự động:</b> lấy các trận gần nhất và sắp tới
          từ TheSportsDB (miễn phí) — tự chống trùng nên có thể chạy lại nhiều
          lần. Với các trận đã kết thúc mà chưa có ai nhập tay "Diễn biến", hệ
          thống sẽ tự tra và điền cầu thủ ghi bàn (kèm kiến tạo nếu có), thẻ
          phạt, thay người — ưu tiên API-Football nếu đã cấu hình{" "}
          <code>API_FOOTBALL_KEY</code>/<code>API_FOOTBALL_TEAM_ID</code> (miễn
          phí 100 request/ngày, dữ liệu thật theo từng trận), nếu chưa thì dùng
          TheSportsDB dự phòng (có thể thiếu hoặc không khớp — hệ thống đã lọc
          bớt tên giữ chỗ rõ ràng sai). Gói miễn phí giới hạn số trận mỗi lần
          lấy; chạy lại thường xuyên để có dữ liệu mới nhất, hoặc bấm "Diễn
          biến" để nhập/sửa tay.
        </p>
        <div className="row">
          <button
            className="btn btn-gold"
            onClick={sync}
            disabled={syncing}
            style={{ flex: "none" }}
          >
            {syncing ? (
              <span className="spinner spinner-dark" />
            ) : (
              <RefreshCcw size={15} />
            )}
            {syncing ? "Đang đồng bộ..." : "Đồng bộ lịch thi đấu ngay"}
          </button>
          <button
            className="btn btn-outline"
            onClick={fillLogos}
            disabled={fillingLogos}
            style={{ flex: "none" }}
          >
            {fillingLogos ? (
              <span className="spinner spinner-dark" />
            ) : (
              <ImageIcon size={15} />
            )}
            {fillingLogos ? "Đang tra logo..." : "Điền logo còn thiếu"}
          </button>
        </div>
        {msg && (
          <div
            className={
              msg.startsWith("Lỗi") || msg.includes(" Lỗi:")
                ? "form-error"
                : "form-success"
            }
          >
            {msg}
          </div>
        )}
      </div>

      <div className="fetch-url-box">
        <p>
          <b>Nhập trận đấu từ liên kết TheSportsDB:</b> dán URL sự kiện trận đấu
          TheSportsDB, hệ thống sẽ lấy tên đội, giờ thi đấu, tỷ số, địa điểm và
          logo nếu có. Nếu đã có cùng <code>external_id</code> trong cơ sở dữ
          liệu, hệ thống sẽ mở lại bản ghi đó để bạn kiểm tra và cập nhật.
        </p>
        <div className="row">
          <input
            placeholder="https://www.thesportsdb.com/event/123456"
            value={fixtureUrl}
            onChange={(e) => setFixtureUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchFixtureFromUrl()}
          />
          <button
            className="btn btn-gold"
            onClick={fetchFixtureFromUrl}
            disabled={fetchingFixtureUrl}
          >
            {fetchingFixtureUrl ? (
              <span className="spinner spinner-dark" />
            ) : (
              <Link2 size={15} />
            )}
            {fetchingFixtureUrl ? "Đang tải..." : "Lấy trận đấu"}
          </button>
        </div>
        {fixtureUrlError && <div className="form-error">{fixtureUrlError}</div>}
      </div>

      <div className="fetch-url-box">
        <p>
          <b>Bảng xếp hạng La Liga:</b> lấy trực tiếp từ TheSportsDB, hiển thị ở
          trang Lịch thi đấu công khai (đội Real Madrid được tô sáng). Chạy lại
          để cập nhật điểm số mới nhất.
        </p>
        <div className="row">
          <button
            className="btn btn-gold"
            onClick={syncStandings}
            disabled={syncingStandings}
            style={{ flex: "none" }}
          >
            {syncingStandings ? (
              <span className="spinner spinner-dark" />
            ) : (
              <RefreshCcw size={15} />
            )}
            {syncingStandings ? "Đang đồng bộ..." : "Đồng bộ bảng xếp hạng"}
          </button>
        </div>
        {standingsMsg && (
          <div
            className={
              standingsMsg.startsWith("Lỗi") ? "form-error" : "form-success"
            }
          >
            {standingsMsg}
          </div>
        )}
      </div>

      <CrudManager
        ref={crudRef}
        endpoint="/api/admin/fixtures"
        entityLabel="trận đấu"
        defaultValues={defaultValues}
        fields={fields}
        searchKeys={["home_team", "away_team", "competition"]}
        filters={[
          {
            key: "status",
            label: "Trạng thái",
            options: [...FIXTURE_STATUSES],
          },
          { key: "competition", label: "Giải đấu", options: [...COMPETITIONS] },
        ]}
        columns={[
          {
            key: "match",
            header: "Trận đấu",
            render: (r) => (
              <div className="title-cell">
                {r.home_logo_url ? (
                  <img
                    src={r.home_logo_url}
                    alt=""
                    style={{ width: 22, height: 22, objectFit: "contain" }}
                  />
                ) : null}
                <div className="t">
                  {r.home_team} vs {r.away_team}
                </div>
                {r.away_logo_url ? (
                  <img
                    src={r.away_logo_url}
                    alt=""
                    style={{ width: 22, height: 22, objectFit: "contain" }}
                  />
                ) : null}
              </div>
            ),
          },
          { key: "competition", header: "Giải đấu" },
          {
            key: "match_time",
            header: "Thời gian",
            render: (r) => new Date(r.match_time).toLocaleString("vi-VN"),
          },
          {
            key: "status",
            header: "Trạng thái",
            render: (r) => statusLabel[r.status] || r.status,
          },
          {
            key: "events",
            header: "Diễn biến",
            render: (r) => (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => setEventsFixture(r)}
              >
                <Goal size={13} />{" "}
                {r.events?.length ? `${r.events.length} sự kiện` : "Thêm"}
              </button>
            ),
          },
        ]}
      />

      {eventsFixture && (
        <MatchEventsEditor
          fixture={eventsFixture}
          onClose={() => setEventsFixture(null)}
          onSaved={() => {
            setEventsFixture(null);
            crudRef.current?.reload();
          }}
        />
      )}
    </AdminShell>
  );
}
