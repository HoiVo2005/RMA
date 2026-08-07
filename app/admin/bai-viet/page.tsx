"use client";
import { useRef, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import CrudManager, {
  CrudManagerHandle,
  FieldConfig,
} from "@/components/admin/CrudManager";
import { adminJson } from "@/lib/admin-client";
import { CATEGORIES, RELIABILITY_LEVELS } from "@/lib/types";
import { Link2 } from "lucide-react";

const fields: FieldConfig[] = [
  {
    name: "translated_title",
    label: "Tiêu đề tiếng Việt",
    type: "text",
    required: true,
  },
  {
    name: "slug",
    label: "Slug (đường dẫn URL, để trống thì tự tạo từ tiêu đề)",
    type: "text",
    hint: "vd: mbappe-lap-cu-dup-vong-3 — chỉ dùng chữ thường, số và dấu gạch ngang",
  },
  { name: "original_title", label: "Tiêu đề gốc", type: "text" },
  {
    name: "summary_vi",
    label: "Tóm tắt (tiếng Việt)",
    type: "textarea",
    required: true,
  },
  {
    name: "content_vi",
    label: "Nội dung chi tiết (tiếng Việt)",
    type: "textarea",
    hint: "mỗi đoạn 1 dòng",
  },
  { name: "image_url", label: "Ảnh đại diện (URL)", type: "image" },
  {
    name: "original_url",
    label: "Liên kết bài gốc",
    type: "url",
    required: true,
  },
  {
    name: "source_name",
    label: "Nguồn",
    type: "text",
    half: true,
    required: true,
  },
  { name: "source_country", label: "Quốc gia nguồn", type: "text", half: true },
  {
    name: "category",
    label: "Danh mục",
    type: "select",
    options: [...CATEGORIES],
    half: true,
    required: true,
  },
  {
    name: "reliability",
    label: "Độ tin cậy",
    type: "select",
    options: [...RELIABILITY_LEVELS],
    half: true,
  },
  {
    name: "status",
    label: "Trạng thái",
    type: "select",
    options: [
      { label: "Nháp", value: "draft" },
      { label: "Đã đăng", value: "published" },
      { label: "Đã ẩn", value: "hidden" },
      { label: "Từ chối", value: "rejected" },
    ],
    half: true,
    required: true,
  },
  { name: "author_name", label: "Tác giả", type: "text", half: true },
  {
    name: "is_featured",
    label: "Bài nổi bật (hiển thị ở banner trang chủ)",
    type: "checkbox",
  },
  { name: "is_transfer_news", label: "Tin chuyển nhượng", type: "checkbox" },
];

const defaultValues = {
  translated_title: "",
  slug: "",
  original_title: "",
  summary_vi: "",
  content_vi: "",
  image_url: "",
  original_url: "",
  source_name: "",
  source_country: "",
  category: "Tin mới",
  reliability: "Uy tín",
  status: "draft",
  author_name: "",
  is_featured: false,
  is_transfer_news: false,
};

const statusLabel: Record<string, string> = {
  draft: "Nháp",
  published: "Đã đăng",
  hidden: "Đã ẩn",
  rejected: "Từ chối",
};

export default function ArticlesAdminPage() {
  const crudRef = useRef<CrudManagerHandle>(null);
  const [url, setUrl] = useState("");
  const [fetching, setFetching] = useState(false);
  const [fetchError, setFetchError] = useState("");

  async function fetchFromUrl() {
    if (!url.trim()) return;
    setFetching(true);
    setFetchError("");
    const res = await adminJson("/api/admin/ingest-url", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ url: url.trim() }),
    });
    setFetching(false);
    if (res.error) {
      setFetchError(res.error);
      return;
    }
    setUrl("");
    crudRef.current?.openCreate(res.data as any);
  }

  return (
    <AdminShell title="Bài viết">
      <div className="fetch-url-box">
        <p>
          <b>Lấy bài viết tự động từ liên kết:</b> dán URL bài báo bất kỳ
          (Marca, AS, L'Équipe, Kicker...), hệ thống sẽ tải toàn bộ nội dung,
          ảnh đại diện và dịch sang tiếng Việt bằng AI. Bài sẽ mở ra ở dạng nháp
          để bạn xem lại trước khi lưu.
        </p>
        <div className="row">
          <input
            placeholder="https://www.marca.com/..."
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchFromUrl()}
          />
          <button
            className="btn btn-gold"
            onClick={fetchFromUrl}
            disabled={fetching}
          >
            {fetching ? (
              <span className="spinner spinner-dark" />
            ) : (
              <Link2 size={15} />
            )}
            {fetching ? "Đang lấy..." : "Lấy & dịch"}
          </button>
        </div>
        {fetchError && <div className="form-error">{fetchError}</div>}
      </div>

      <CrudManager
        ref={crudRef}
        endpoint="/api/admin/articles"
        entityLabel="bài viết"
        defaultValues={defaultValues}
        fields={fields}
        searchKeys={["translated_title", "source_name", "original_title"]}
        filters={[
          {
            key: "status",
            label: "Trạng thái",
            options: [
              { label: "Nháp", value: "draft" },
              { label: "Đã đăng", value: "published" },
              { label: "Đã ẩn", value: "hidden" },
              { label: "Từ chối", value: "rejected" },
            ],
          },
          { key: "category", label: "Danh mục", options: [...CATEGORIES] },
        ]}
        columns={[
          {
            key: "translated_title",
            header: "Bài viết",
            render: (r) => (
              <div className="title-cell">
                {r.image_url ? (
                  <img src={r.image_url} alt="" />
                ) : (
                  <div
                    style={{
                      width: 44,
                      height: 32,
                      background: "var(--line)",
                      borderRadius: 5,
                    }}
                  />
                )}
                <div>
                  <div className="t">{r.translated_title}</div>
                  <div className="s">{r.source_name}</div>
                </div>
              </div>
            ),
          },
          { key: "category", header: "Danh mục" },
          {
            key: "status",
            header: "Trạng thái",
            render: (r) => (
              <span className={`status-tag status-tag-${r.status}`}>
                {statusLabel[r.status] || r.status}
              </span>
            ),
          },
          {
            key: "published_at",
            header: "Ngày đăng",
            render: (r) =>
              r.published_at
                ? new Date(r.published_at).toLocaleDateString("vi-VN")
                : "—",
          },
        ]}
      />
    </AdminShell>
  );
}
