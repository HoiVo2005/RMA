"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminJson } from "@/lib/admin-client";
import { Users, Clock11 } from "lucide-react";

type SessionRow = {
  id: string;
  userId: string;
  email: string | null;
  fullName: string | null;
  createdAt: string;
  expiresAt: string;
  ipAddress: string | null;
  userAgent: string | null;
};

export default function AdminActiveSessionsPage() {
  const [sessions, setSessions] = useState<SessionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      setLoading(true);
      setError("");
      const res = await adminJson<SessionRow[]>("/api/admin/sessions");
      if (res.error) {
        setError(res.error);
      } else {
        setSessions(res.data || []);
      }
      setLoading(false);
    }
    load();
  }, []);

  return (
    <AdminShell title="Phiên đăng nhập">
      <div className="panel">
        <div className="panel-head">
          <h2>Danh sách phiên đang hoạt động</h2>
        </div>
        <div style={{ padding: 18 }}>
          {loading ? (
            <div>Đang tải...</div>
          ) : error ? (
            <div className="form-error">{error}</div>
          ) : sessions.length === 0 ? (
            <div>Không có phiên đang hoạt động.</div>
          ) : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>Người dùng</th>
                    <th>Email</th>
                    <th>IP</th>
                    <th>Thiết bị / Trình duyệt</th>
                    <th>Đăng nhập lúc</th>
                    <th>Hết hạn</th>
                    <th>Thời gian còn lại</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((session) => {
                    const createdAt = new Date(session.createdAt);
                    const expiresAt = new Date(session.expiresAt);
                    const remaining = Math.max(
                      0,
                      expiresAt.getTime() - Date.now(),
                    );
                    const remainingHours = Math.floor(remaining / 3600000);
                    const remainingMinutes = Math.floor(
                      (remaining % 3600000) / 60000,
                    );
                    return (
                      <tr key={session.id}>
                        <td>
                          {session.fullName || session.email || session.userId}
                        </td>
                        <td>{session.email || "—"}</td>
                        <td>{session.ipAddress || "—"}</td>
                        <td title={session.userAgent || ""}>
                          {session.userAgent
                            ? session.userAgent.slice(0, 50) +
                              (session.userAgent.length > 50 ? "…" : "")
                            : "—"}
                        </td>
                        <td>{createdAt.toLocaleString("vi-VN")}</td>
                        <td>{expiresAt.toLocaleString("vi-VN")}</td>
                        <td>
                          {remaining > 0
                            ? `${remainingHours}h ${remainingMinutes}m`
                            : "Hết hạn"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AdminShell>
  );
}
