"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminJson } from "@/lib/admin-client";
import {
  Newspaper,
  CheckCircle2,
  FileEdit,
  Radio,
  Trophy,
  Users,
  RefreshCcw,
  MessageCircle,
} from "lucide-react";

type Stats = {
  articles: number;
  published: number;
  draft: number;
  sources: number;
  fixtures: number;
  players: number;
  pendingComments: number;
  logs: any[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [running, setRunning] = useState(false);
  const [result, setResult] = useState("");

  async function load() {
    const res = await adminJson<Stats>("/api/admin/stats");
    if (res.data) setStats(res.data as any);
  }

  useEffect(() => {
    load();
  }, []);

  async function runIngest() {
    setRunning(true);
    setResult("");
    const res = await adminJson("/api/admin/run-ingest", { method: "POST" });
    setRunning(false);
    if (res.error) {
      setResult("Lỗi: " + res.error);
    } else {
      const d: any = res.data;
      setResult(
        `Xong: quét ${d.sources} nguồn, tìm ${d.found}, thêm mới ${d.inserted}, bỏ qua ${d.skipped}, lỗi ${d.failed}.`,
      );
    }
    load();
  }

  return (
    <AdminShell title="Tổng quan">
      <div className="stat-grid">
        <div className="stat-card">
          <div className="n">{stats?.articles ?? "—"}</div>
          <div className="l">
            <Newspaper size={13} style={{ verticalAlign: -2 }} /> Tổng bài viết
          </div>
        </div>
        <div className="stat-card">
          <div className="n">{stats?.published ?? "—"}</div>
          <div className="l">
            <CheckCircle2 size={13} style={{ verticalAlign: -2 }} /> Đã xuất bản
          </div>
        </div>
        <div className="stat-card">
          <div className="n">{stats?.draft ?? "—"}</div>
          <div className="l">
            <FileEdit size={13} style={{ verticalAlign: -2 }} /> Bản nháp
          </div>
        </div>
        <div className="stat-card">
          <div className="n">{stats?.pendingComments ?? "—"}</div>
          <div className="l">
            <MessageCircle size={13} style={{ verticalAlign: -2 }} /> Bình luận
            chờ duyệt
          </div>
        </div>
        <div className="stat-card">
          <div className="n">{stats?.sources ?? "—"}</div>
          <div className="l">
            <Radio size={13} style={{ verticalAlign: -2 }} /> Nguồn tin
          </div>
        </div>
        <div className="stat-card">
          <div className="n">{stats?.fixtures ?? "—"}</div>
          <div className="l">
            <Trophy size={13} style={{ verticalAlign: -2 }} /> Lịch thi đấu
          </div>
        </div>
        <div className="stat-card">
          <div className="n">{stats?.players ?? "—"}</div>
          <div className="l">
            <Users size={13} style={{ verticalAlign: -2 }} /> Cầu thủ
          </div>
        </div>
      </div>

      <div className="panel" style={{ marginBottom: 24 }}>
        <div className="panel-head">
          <h2>Lấy tin tự động (RSS)</h2>
          <button
            className="btn btn-gold"
            onClick={runIngest}
            disabled={running}
          >
            {running ? (
              <span className="spinner spinner-dark" />
            ) : (
              <RefreshCcw size={15} />
            )}
            {running ? "Đang lấy tin..." : "Lấy tin ngay"}
          </button>
        </div>
        <div style={{ padding: 20 }}>
          <p
            style={{
              margin: "0 0 10px",
              fontSize: 13.5,
              color: "var(--ink-500)",
            }}
          >
            Quét toàn bộ nguồn tin đã bật RSS, lọc bài liên quan Real Madrid,
            tải nội dung + ảnh từ trang gốc và dịch sang tiếng Việt bằng AI. Bài
            mới sẽ được xuất bản tự động. Bạn cũng có thể lấy 1 bài viết bất kỳ
            theo liên kết trong trang <b>Bài viết</b>.
          </p>
          {result && <div className="form-success">{result}</div>}
        </div>
      </div>

      {stats?.logs && stats.logs.length > 0 && (
        <div className="panel">
          <div className="panel-head">
            <h2>Nhật ký lấy tin gần đây</h2>
          </div>
          <div style={{ padding: 18 }}>
            <div className="log-list">
              {stats.logs.map((l: any) => (
                <div className="log-item" key={l.id}>
                  <span
                    style={{ display: "flex", alignItems: "center", gap: 8 }}
                  >
                    <span
                      className={`dot ${
                        l.status === "completed"
                          ? "log-ok"
                          : l.status === "running"
                            ? "log-run"
                            : "log-warn"
                      }`}
                    />
                    {new Date(l.started_at).toLocaleString("vi-VN")}
                  </span>
                  <span>
                    Tìm {l.total_found} · Thêm {l.total_inserted} · Bỏ qua{" "}
                    {l.total_skipped} · Lỗi {l.total_failed}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </AdminShell>
  );
}
