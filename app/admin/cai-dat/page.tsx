"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import { adminJson } from "@/lib/admin-client";
import { DEFAULT_SITE_SETTINGS, type SiteSettings } from "@/lib/site-settings";
import { Save, AlertTriangle } from "lucide-react";

export default function SiteSettingsAdminPage() {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULT_SITE_SETTINGS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: "ok" | "err"; text: string } | null>(
    null,
  );

  useEffect(() => {
    (async () => {
      const res = await adminJson<SiteSettings>("/api/admin/site-settings");
      if (res.data) setSettings({ ...DEFAULT_SITE_SETTINGS, ...res.data });
      setLoading(false);
    })();
  }, []);

  function set<K extends keyof SiteSettings>(key: K, value: SiteSettings[K]) {
    setSettings((v) => ({ ...v, [key]: value }));
  }

  function setFeature<K extends keyof SiteSettings["features"]>(
    key: K,
    value: boolean,
  ) {
    setSettings((v) => ({ ...v, features: { ...v.features, [key]: value } }));
  }

  function setMenu<K extends keyof SiteSettings["menu"]>(
    key: K,
    value: boolean,
  ) {
    setSettings((v) => ({ ...v, menu: { ...v.menu, [key]: value } }));
  }

  function setMaintenance<K extends keyof SiteSettings["maintenance"]>(
    key: K,
    value: SiteSettings["maintenance"][K],
  ) {
    setSettings((v) => ({
      ...v,
      maintenance: { ...v.maintenance, [key]: value },
    }));
  }

  function setSocial<K extends keyof SiteSettings["socialLinks"]>(
    key: K,
    value: SiteSettings["socialLinks"][K],
  ) {
    setSettings((v) => ({
      ...v,
      socialLinks: { ...v.socialLinks, [key]: value },
    }));
  }

  function setFooter<K extends keyof SiteSettings["footer"]>(
    key: K,
    value: SiteSettings["footer"][K],
  ) {
    setSettings((v) => ({ ...v, footer: { ...v.footer, [key]: value } }));
  }

  function setSeo<K extends keyof SiteSettings["seo"]>(
    key: K,
    value: SiteSettings["seo"][K],
  ) {
    setSettings((v) => ({ ...v, seo: { ...v.seo, [key]: value } }));
  }

  function setAnalytics<K extends keyof SiteSettings["analytics"]>(
    key: K,
    value: SiteSettings["analytics"][K],
  ) {
    setSettings((v) => ({ ...v, analytics: { ...v.analytics, [key]: value } }));
  }

  async function save() {
    setSaving(true);
    setMsg(null);
    const res = await adminJson<SiteSettings>("/api/admin/site-settings", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(settings),
    });
    setSaving(false);
    if (res.error) setMsg({ type: "err", text: "Lỗi: " + res.error });
    else {
      setMsg({
        type: "ok",
        text: "Đã lưu cài đặt. Trang công khai sẽ áp dụng ngay (có thể cần tải lại trang).",
      });
      if (res.data) setSettings({ ...DEFAULT_SITE_SETTINGS, ...res.data });
    }
  }

  if (loading) {
    return (
      <AdminShell title="Cài đặt">
        <div className="empty-row">Đang tải...</div>
      </AdminShell>
    );
  }

  return (
    <AdminShell title="Cài đặt">
      <p
        style={{ margin: "0 0 18px", fontSize: 13.5, color: "var(--ink-500)" }}
      >
        Tuỳ chỉnh tên, logo, giao diện và bật/tắt tính năng cho toàn bộ website
        — không cần sửa code. Sửa xong bấm <b>Lưu cài đặt</b> ở cuối trang.
      </p>

      {/* ================= THÔNG TIN CHUNG ================= */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Thông tin chung</h2>
        </div>
        <div className="drawer-body" style={{ padding: 20 }}>
          <div className="field-row">
            <div className="field">
              <label>Tên website</label>
              <input
                value={settings.siteName}
                onChange={(e) => set("siteName", e.target.value)}
                placeholder="vd: Madridista News VN"
              />
            </div>
            <div className="field">
              <label>Câu tagline (cạnh tên, ở header)</label>
              <input
                value={settings.tagline}
                onChange={(e) => set("tagline", e.target.value)}
                placeholder="vd: Hala Madrid, tin tức 24/7"
              />
            </div>
          </div>

          <div className="field">
            <label>Mô tả SEO (thẻ meta description)</label>
            <textarea
              rows={2}
              value={settings.siteDescription}
              onChange={(e) => set("siteDescription", e.target.value)}
              placeholder="Mô tả ngắn hiển thị trên kết quả tìm kiếm Google, chia sẻ Facebook..."
            />
          </div>

          <div
            className="field-row"
            style={{ gridTemplateColumns: "1fr auto" }}
          >
            <div className="field">
              <label>Link logo</label>
              <input
                value={settings.logoUrl}
                onChange={(e) => set("logoUrl", e.target.value)}
                placeholder="https://... (bỏ trống thì dùng biểu tượng ♛ mặc định)"
              />
              <span className="hint">
                Hiển thị ở góc trái header thay cho biểu tượng ♛.
              </span>
            </div>
            <div style={{ paddingBottom: 2 }}>
              {settings.logoUrl ? (
                <img
                  src={settings.logoUrl}
                  alt="logo"
                  style={{
                    width: 56,
                    height: 56,
                    objectFit: "contain",
                    borderRadius: 8,
                    border: "1px solid var(--line)",
                    background: "var(--bg)",
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 56,
                    height: 56,
                    borderRadius: 8,
                    border: "1px dashed var(--line)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: 20,
                  }}
                >
                  ♛
                </div>
              )}
            </div>
          </div>

          <div className="field">
            <label>Link favicon</label>
            <input
              value={settings.faviconUrl}
              onChange={(e) => set("faviconUrl", e.target.value)}
              placeholder="/icons/icon-192.png hoặc https://..."
            />
            <span className="hint">
              Icon hiển thị trên tab trình duyệt. Nên dùng ảnh vuông, tối thiểu
              192×192px.
            </span>
          </div>
        </div>
      </div>

      {/* ================= GIAO DIỆN ================= */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Giao diện</h2>
        </div>
        <div className="drawer-body" style={{ padding: 20 }}>
          <div className="field-row">
            <div className="field">
              <label>Màu chủ đạo</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={settings.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  style={{ width: 44, height: 36, padding: 2 }}
                />
                <input
                  value={settings.primaryColor}
                  onChange={(e) => set("primaryColor", e.target.value)}
                  placeholder="#f2b807"
                />
              </div>
              <span className="hint">
                Dùng cho nút, viền nhấn, liên kết đang chọn...
              </span>
            </div>
            <div className="field">
              <label>Màu chủ đạo (sáng hơn, dùng khi hover)</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={settings.primaryColorLight}
                  onChange={(e) => set("primaryColorLight", e.target.value)}
                  style={{ width: 44, height: 36, padding: 2 }}
                />
                <input
                  value={settings.primaryColorLight}
                  onChange={(e) => set("primaryColorLight", e.target.value)}
                  placeholder="#ffd25f"
                />
              </div>
            </div>
          </div>

          <div className="field-row" style={{ marginTop: 16 }}>
            <div className="field">
              <label>Màu nền chính</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input
                  type="color"
                  value={settings.backgroundColor}
                  onChange={(e) => set("backgroundColor", e.target.value)}
                  style={{ width: 44, height: 36, padding: 2 }}
                />
                <input
                  value={settings.backgroundColor}
                  onChange={(e) => set("backgroundColor", e.target.value)}
                  placeholder="#eef7ff"
                />
              </div>
              <span className="hint">
                Dùng làm nền chính cho các khối, card và trang.
              </span>
            </div>
            <div className="field">
              <label>Font chữ</label>
              <select
                value={settings.fontFamily}
                onChange={(e) =>
                  set(
                    "fontFamily",
                    e.target.value as SiteSettings["fontFamily"],
                  )
                }
              >
                <option value="Inter">Inter (hiện đại)</option>
                <option value="Sora">Sora (hiệu ứng tiêu đề)</option>
                <option value="Georgia">Georgia (serif truyền thống)</option>
                <option value="System">System UI</option>
              </select>
              <span className="hint">
                Chọn font chữ dùng cho toàn bộ giao diện.
              </span>
            </div>
          </div>

          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--line)",
              margin: "18px 0",
            }}
          />

          <p
            style={{
              fontSize: 13,
              color: "var(--ink-500)",
              margin: "0 0 12px",
            }}
          >
            Banner quảng bá hiển thị phía trên cùng trang chủ — để trống{" "}
            <b>Link ảnh</b> thì ẩn hẳn banner.
          </p>
          <div className="field">
            <label>Link ảnh banner</label>
            <input
              value={settings.bannerUrl}
              onChange={(e) => set("bannerUrl", e.target.value)}
              placeholder="https://... (để trống để ẩn banner)"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Tiêu đề banner (tuỳ chọn)</label>
              <input
                value={settings.bannerTitle}
                onChange={(e) => set("bannerTitle", e.target.value)}
              />
            </div>
            <div className="field">
              <label>Mô tả phụ (tuỳ chọn)</label>
              <input
                value={settings.bannerSubtitle}
                onChange={(e) => set("bannerSubtitle", e.target.value)}
              />
            </div>
          </div>
          <div className="field">
            <label>Link khi bấm vào banner (tuỳ chọn)</label>
            <input
              value={settings.bannerLink}
              onChange={(e) => set("bannerLink", e.target.value)}
              placeholder="https://... hoặc /bai-viet/..."
            />
          </div>
        </div>
      </div>

      {/* ================= LIÊN HỆ & MẠNG XÃ HỘI ================= */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Liên hệ &amp; Mạng xã hội</h2>
        </div>
        <div className="drawer-body" style={{ padding: 20 }}>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-500)",
              margin: "0 0 12px",
            }}
          >
            Hiển thị ở footer cuối trang. Để trống mục nào thì icon/liên kết đó
            tự ẩn.
          </p>
          <div className="field">
            <label>Email liên hệ</label>
            <input
              value={settings.contactEmail}
              onChange={(e) => set("contactEmail", e.target.value)}
              placeholder="lienhe@vidu.com"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label>Facebook</label>
              <input
                value={settings.socialLinks.facebook}
                onChange={(e) => setSocial("facebook", e.target.value)}
                placeholder="https://facebook.com/..."
              />
            </div>
            <div className="field">
              <label>X (Twitter)</label>
              <input
                value={settings.socialLinks.x}
                onChange={(e) => setSocial("x", e.target.value)}
                placeholder="https://x.com/..."
              />
            </div>
          </div>
          <div className="field-row">
            <div className="field">
              <label>YouTube</label>
              <input
                value={settings.socialLinks.youtube}
                onChange={(e) => setSocial("youtube", e.target.value)}
                placeholder="https://youtube.com/@..."
              />
            </div>
            <div className="field">
              <label>Instagram</label>
              <input
                value={settings.socialLinks.instagram}
                onChange={(e) => setSocial("instagram", e.target.value)}
                placeholder="https://instagram.com/..."
              />
            </div>
          </div>
          <div className="field">
            <label>TikTok</label>
            <input
              value={settings.socialLinks.tiktok}
              onChange={(e) => setSocial("tiktok", e.target.value)}
              placeholder="https://tiktok.com/@..."
            />
          </div>
        </div>
      </div>

      {/* ================= NỘI DUNG FOOTER ================= */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Nội dung Footer</h2>
        </div>
        <div className="drawer-body" style={{ padding: 20 }}>
          <div className="field">
            <label>Đoạn giới thiệu (footer)</label>
            <textarea
              rows={3}
              value={settings.footer.aboutText}
              onChange={(e) => setFooter("aboutText", e.target.value)}
              placeholder="Đoạn giới thiệu ngắn hiển thị cuối mọi trang"
            />
          </div>
          <div className="field">
            <label>Dòng bản quyền</label>
            <input
              value={settings.footer.copyrightText}
              onChange={(e) => setFooter("copyrightText", e.target.value)}
              placeholder={`Để trống thì tự động hiện "© ${new Date().getFullYear()} ${settings.siteName || "Tên website"}"`}
            />
          </div>
        </div>
      </div>

      {/* ================= SEO & THỐNG KÊ TRUY CẬP ================= */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>SEO &amp; Thống kê truy cập</h2>
        </div>
        <div className="drawer-body" style={{ padding: 20 }}>
          <div className="field">
            <label>Từ khoá SEO (phân cách bằng dấu phẩy)</label>
            <input
              value={settings.seo.keywords}
              onChange={(e) => setSeo("keywords", e.target.value)}
              placeholder="real madrid, tin tức real madrid..."
            />
          </div>
          <div className="field">
            <label>Ảnh chia sẻ mạng xã hội (Open Graph)</label>
            <input
              value={settings.seo.ogImage}
              onChange={(e) => setSeo("ogImage", e.target.value)}
              placeholder="https://... (để trống thì dùng logo)"
            />
            <span className="hint">
              Ảnh hiện ra khi chia sẻ link website lên Facebook, Zalo, X... Nên
              dùng ảnh tỉ lệ 1200×630px.
            </span>
          </div>
          <hr
            style={{
              border: "none",
              borderTop: "1px solid var(--line)",
              margin: "18px 0",
            }}
          />
          <div className="field-row">
            <div className="field">
              <label>Google Analytics ID</label>
              <input
                value={settings.analytics.googleAnalyticsId}
                onChange={(e) =>
                  setAnalytics("googleAnalyticsId", e.target.value)
                }
                placeholder="G-XXXXXXXXXX (để trống thì không nhúng)"
              />
            </div>
            <div className="field">
              <label>Facebook Pixel ID</label>
              <input
                value={settings.analytics.facebookPixelId}
                onChange={(e) =>
                  setAnalytics("facebookPixelId", e.target.value)
                }
                placeholder="để trống thì không nhúng"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ================= HIỂN THỊ DANH SÁCH BÀI VIẾT ================= */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Danh sách bài viết &amp; tự động lấy tin</h2>
        </div>
        <div className="drawer-body" style={{ padding: 20 }}>
          <div className="field" style={{ maxWidth: 220 }}>
            <label>Số bài viết mỗi trang</label>
            <input
              type="number"
              min={5}
              max={100}
              value={settings.articlesPerPage}
              onChange={(e) =>
                set(
                  "articlesPerPage",
                  Math.max(
                    5,
                    Math.min(100, parseInt(e.target.value, 10) || 20),
                  ),
                )
              }
            />
            <span className="hint">
              Áp dụng cho trang "Tin mới" và các trang danh sách có phân trang.
            </span>
          </div>
          <div className="field">
            <label>Từ khoá lọc tin liên quan (phân cách bằng dấu phẩy)</label>
            <textarea
              rows={2}
              value={settings.ingestKeywords}
              onChange={(e) => set("ingestKeywords", e.target.value)}
              placeholder="real madrid, los blancos, bernabeu..."
            />
            <span className="hint">
              Khi hệ thống tự động lấy tin RSS từ các Nguồn tin, chỉ bài có tiêu
              đề/mô tả chứa 1 trong các từ khoá này mới được lấy về. Thêm bớt
              tại đây khi cần mà không phải sửa code.
            </span>
          </div>
        </div>
      </div>

      {/* ================= MENU HIỂN THỊ ================= */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Menu hiển thị</h2>
        </div>
        <div className="drawer-body" style={{ padding: 20 }}>
          <p
            style={{
              fontSize: 13,
              color: "var(--ink-500)",
              margin: "0 0 14px",
            }}
          >
            Chọn mục nào hiện trên thanh menu (cả bản desktop lẫn thanh tab
            mobile) — tắt bớt nếu bạn không dùng đến.
            <b> Trang chủ</b> luôn hiển thị nên không có trong danh sách.
          </p>
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            <FeatureToggle
              label="Tin mới"
              hint="Trang liệt kê toàn bộ tin theo thời gian."
              checked={settings.menu.tinMoi}
              onChange={(v) => setMenu("tinMoi", v)}
            />
            <FeatureToggle
              label="Chuyển nhượng"
              hint="Trang tổng hợp tin chuyển nhượng."
              checked={settings.menu.chuyenNhuong}
              onChange={(v) => setMenu("chuyenNhuong", v)}
            />
            <FeatureToggle
              label="Lịch thi đấu"
              hint="Lịch thi đấu, kết quả, bảng xếp hạng."
              checked={settings.menu.lichThiDau}
              onChange={(v) => setMenu("lichThiDau", v)}
            />
            <FeatureToggle
              label="Đội hình"
              hint="Đội hình ra sân, thông tin CLB."
              checked={settings.menu.doiHinh}
              onChange={(v) => setMenu("doiHinh", v)}
            />
            <FeatureToggle
              label="Dành cho bạn"
              hint="Trang gợi ý nội dung theo AI."
              checked={settings.menu.danhChoBan}
              onChange={(v) => setMenu("danhChoBan", v)}
            />
            <FeatureToggle
              label="Nguồn tin"
              hint="Danh sách các nguồn tin được tổng hợp."
              checked={settings.menu.nguonTin}
              onChange={(v) => setMenu("nguonTin", v)}
            />
          </div>
          <span className="hint" style={{ display: "block", marginTop: 12 }}>
            Mục "Đã lưu" ẩn/hiện theo công tắc <b>Lưu bài viết</b> ở phần Tính
            năng bên dưới.
          </span>
        </div>
      </div>

      {/* ================= TÍNH NĂNG ================= */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Bật / tắt tính năng</h2>
        </div>
        <div
          className="drawer-body"
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <FeatureToggle
            label="Bình luận"
            hint="Ẩn/hiện khung bình luận ở trang chi tiết bài viết."
            checked={settings.features.comments}
            onChange={(v) => setFeature("comments", v)}
          />
          <FeatureToggle
            label="Lưu bài viết"
            hint="Ẩn/hiện nút bookmark trên các thẻ bài viết và trang chi tiết."
            checked={settings.features.saveArticles}
            onChange={(v) => setFeature("saveArticles", v)}
          />
          <FeatureToggle
            label="Thông báo đẩy"
            hint="Ẩn/hiện chuông thông báo ở header."
            checked={settings.features.notifications}
            onChange={(v) => setFeature("notifications", v)}
          />
          <FeatureToggle
            label="Dự đoán tỷ số"
            hint="Ẩn/hiện widget dự đoán tỷ số trận sắp diễn ra ở trang chủ."
            checked={settings.features.predictions}
            onChange={(v) => setFeature("predictions", v)}
          />
        </div>
      </div>

      {/* ================= BẢO TRÌ ================= */}
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>Chế độ bảo trì</h2>
        </div>
        <div
          className="drawer-body"
          style={{
            padding: 20,
            display: "flex",
            flexDirection: "column",
            gap: 14,
          }}
        >
          <FeatureToggle
            label="Bật chế độ bảo trì"
            hint="Khi bật, TOÀN BỘ trang công khai sẽ hiện thông báo bảo trì. Trang /admin và /login vẫn dùng bình thường để bạn tự tắt lại."
            checked={settings.maintenance.enabled}
            onChange={(v) => setMaintenance("enabled", v)}
            danger
          />
          {settings.maintenance.enabled && (
            <div
              className="form-error"
              style={{ display: "flex", gap: 8, alignItems: "flex-start" }}
            >
              <AlertTriangle
                size={16}
                style={{ flexShrink: 0, marginTop: 2 }}
              />
              <span>
                Đang bật — người dùng bình thường sẽ KHÔNG vào được trang cho
                tới khi bạn tắt lại mục này và bấm Lưu.
              </span>
            </div>
          )}
          <div className="field">
            <label>Thông báo hiển thị cho người dùng</label>
            <textarea
              rows={2}
              value={settings.maintenance.message}
              onChange={(e) => setMaintenance("message", e.target.value)}
              placeholder="vd: Website đang bảo trì để nâng cấp, quay lại sau nhé!"
            />
          </div>
        </div>
      </div>

      {msg && (
        <div
          className={msg.type === "err" ? "form-error" : "form-success"}
          style={{ marginBottom: 16 }}
        >
          {msg.text}
        </div>
      )}

      <div className="form-actions" style={{ position: "static" }}>
        <button className="btn btn-gold" onClick={save} disabled={saving}>
          {saving ? (
            <span className="spinner spinner-dark" />
          ) : (
            <Save size={15} />
          )}
          {saving ? "Đang lưu..." : "Lưu cài đặt"}
        </button>
      </div>
    </AdminShell>
  );
}

function FeatureToggle({
  label,
  hint,
  checked,
  onChange,
  danger = false,
}: {
  label: string;
  hint: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  danger?: boolean;
}) {
  return (
    <div className="feature-toggle">
      <div>
        <b>{label}</b>
        <div className="hint" style={{ marginTop: 4 }}>
          {hint}
        </div>
      </div>
      <button
        type="button"
        className={`toggle-switch ${checked ? "checked" : ""} ${
          danger ? "danger" : ""
        }`}
        aria-pressed={checked}
        onClick={() => onChange(!checked)}
      >
        <span className="toggle-thumb" />
      </button>
    </div>
  );
}
