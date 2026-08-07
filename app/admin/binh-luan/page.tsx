"use client";
import { useEffect, useState } from "react";
import AdminShell from "@/components/admin/AdminShell";
import CrudManager, { FieldConfig } from "@/components/admin/CrudManager";
import { adminJson } from "@/lib/admin-client";
import { MessageCircle } from "lucide-react";

const defaultValues = {
  article_id: "",
  author_name: "",
  content: "",
  likes: 0,
  status: "pending",
};

const statusLabel: Record<string, string> = {
  pending: "Chờ duyệt",
  approved: "Đã duyệt",
  hidden: "Ẩn",
};

const fields: FieldConfig[] = [
  { name: "article_id", label: "ID bài viết", type: "text", required: true },
  {
    name: "author_name",
    label: "Tên người bình luận",
    type: "text",
    required: true,
  },
  { name: "content", label: "Nội dung", type: "textarea", required: true },
  { name: "likes", label: "Lượt thích", type: "number" },
  {
    name: "status",
    label: "Trạng thái",
    type: "select",
    options: [
      { label: "Chờ duyệt", value: "pending" },
      { label: "Đã duyệt", value: "approved" },
      { label: "Ẩn", value: "hidden" },
    ],
    required: true,
  },
];

export default function AdminCommentsPage() {
  const [pendingCount, setPendingCount] = useState(0);

  async function loadPending() {
    const res = await adminJson<any[]>(
      "/api/admin/comments?orderBy=created_at&asc=false",
    );
    if (res.data) {
      setPendingCount(
        res.data.filter((item: any) => item.status === "pending").length,
      );
    }
  }

  useEffect(() => {
    loadPending();
  }, []);

  return (
    <AdminShell title="Bình luận">
      <div className="panel" style={{ marginBottom: 20 }}>
        <div className="panel-head">
          <h2>
            <MessageCircle
              size={16}
              style={{ verticalAlign: -2, marginRight: 6 }}
            />
            Duyệt bình luận
          </h2>
          <div style={{ color: "var(--ink-500)", fontSize: 13 }}>
            Bình luận mới: {pendingCount}
          </div>
        </div>
        <div style={{ padding: "16px 20px", color: "var(--ink-600)" }}>
          Duyệt, ẩn hoặc cập nhật nội dung bình luận. Bình luận chỉ hiển thị khi
          trạng thái đã chuyển thành <strong>Đã duyệt</strong>.
        </div>
      </div>

      <CrudManager
        endpoint="/api/admin/comments"
        entityLabel="bình luận"
        defaultValues={defaultValues}
        fields={fields}
        searchKeys={["author_name", "content", "article_id"]}
        filters={[
          {
            key: "status",
            label: "Trạng thái",
            options: [
              { label: "Chờ duyệt", value: "pending" },
              { label: "Đã duyệt", value: "approved" },
              { label: "Ẩn", value: "hidden" },
            ],
          },
        ]}
        columns={[
          { key: "article_id", header: "ID bài viết" },
          { key: "author_name", header: "Người bình luận" },
          {
            key: "content",
            header: "Nội dung",
            render: (r: any) => (
              <div style={{ maxWidth: 320, whiteSpace: "normal" }}>
                {r.content}
              </div>
            ),
          },
          { key: "likes", header: "Lượt thích" },
          {
            key: "status",
            header: "Trạng thái",
            render: (r: any) => (
              <span className={`status-tag status-tag-${r.status}`}>
                {statusLabel[r.status] || r.status}
              </span>
            ),
          },
          {
            key: "created_at",
            header: "Thời gian",
            render: (r: any) => new Date(r.created_at).toLocaleString("vi-VN"),
          },
        ]}
      />
    </AdminShell>
  );
}
