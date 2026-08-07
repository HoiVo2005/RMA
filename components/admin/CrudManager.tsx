"use client";
import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useState,
} from "react";
import { adminJson } from "@/lib/admin-client";
import { Plus, Pencil, Trash2, X, Search } from "lucide-react";

export type FieldOption = string | { label: string; value: string };

export type FieldConfig = {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "select"
    | "checkbox"
    | "number"
    | "datetime"
    | "url"
    | "image"
    | "custom";
  options?: FieldOption[];
  required?: boolean;
  placeholder?: string;
  half?: boolean; // render bên cạnh field tiếp theo (2 cột)
  hint?: string;
  /**
   * Chỉ dùng khi type === 'custom' — tự vẽ giao diện nhập liệu riêng (vd. trình soạn dạng danh sách).
   * `ctx.values` là toàn bộ dữ liệu form hiện tại, `ctx.setMany` cho phép cập nhật nhiều field cùng lúc
   * (vd. nút "Điền từ Wikipedia" điền sẵn nhiều trường sau 1 lần bấm).
   */
  render?: (
    value: any,
    onChange: (value: any) => void,
    ctx: {
      values: Record<string, any>;
      setMany: (patch: Record<string, any>) => void;
    },
  ) => React.ReactNode;
};

export type ColumnConfig = {
  key: string;
  header: string;
  render?: (row: any) => React.ReactNode;
};

export type CrudManagerHandle = {
  openCreate: (prefill?: Record<string, any>) => void;
  reload: () => void;
};

type Props = {
  endpoint: string;
  entityLabel: string;
  columns: ColumnConfig[];
  fields: FieldConfig[];
  defaultValues: Record<string, any>;
  searchKeys?: string[];
  extraToolbar?: React.ReactNode;
  filters?: { key: string; label: string; options: FieldOption[] }[];
  onBeforeSave?: (values: Record<string, any>) => Record<string, any>;
  pageSize?: number;
};

const CrudManager = forwardRef<CrudManagerHandle, Props>(function CrudManager(
  {
    endpoint,
    entityLabel,
    columns,
    fields,
    defaultValues,
    searchKeys = [],
    extraToolbar,
    filters = [],
    onBeforeSave,
    pageSize = 12,
  },
  ref,
) {
  const [rows, setRows] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");
  const [activeFilters, setActiveFilters] = useState<Record<string, string>>(
    {},
  );
  const [editing, setEditing] = useState<Record<string, any> | null>(null);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [page, setPage] = useState(1);

  async function load() {
    setLoading(true);
    const res = await adminJson<any[]>(endpoint);
    setRows(res.data || []);
    setLoading(false);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [endpoint]);

  useImperativeHandle(ref, () => ({
    openCreate: (prefill) => {
      setError("");
      setEditing({ ...defaultValues, ...(prefill || {}) });
    },
    reload: () => load(),
  }));

  const filtered = useMemo(() => {
    let list = rows;
    if (q.trim() && searchKeys.length) {
      const s = q.trim().toLowerCase();
      list = list.filter((r) =>
        searchKeys.some((k) =>
          String(r[k] ?? "")
            .toLowerCase()
            .includes(s),
        ),
      );
    }
    for (const f of filters) {
      const v = activeFilters[f.key];
      if (v) list = list.filter((r) => String(r[f.key]) === v);
    }
    return list;
  }, [rows, q, searchKeys, filters, activeFilters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const pagedRows = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [q, activeFilters, rows.length]);

  useEffect(() => {
    if (page > totalPages) {
      setPage(totalPages);
    }
  }, [page, totalPages]);

  const pageItems = useMemo(() => {
    const items: (number | "...")[] = [];
    items.push(1);
    if (page > 3) items.push("...");
    for (
      let p = Math.max(2, page - 1);
      p <= Math.min(totalPages - 1, page + 1);
      p++
    ) {
      items.push(p);
    }
    if (page < totalPages - 2) items.push("...");
    if (totalPages > 1) items.push(totalPages);
    return items;
  }, [page, totalPages]);

  function openEdit(row: any) {
    setError("");
    setEditing({ ...row });
  }

  function closeDrawer() {
    setEditing(null);
    setError("");
  }

  function setField(name: string, value: any) {
    setEditing((e) => (e ? { ...e, [name]: value } : e));
  }

  function setMany(patch: Record<string, any>) {
    setEditing((e) => (e ? { ...e, ...patch } : e));
  }

  async function save() {
    if (!editing) return;
    setSaving(true);
    setError("");
    const isNew = !editing.id;
    const payload = onBeforeSave
      ? onBeforeSave({ ...editing })
      : { ...editing };
    const res = await adminJson(endpoint, {
      method: isNew ? "POST" : "PATCH",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
    setSaving(false);
    if (res.error) {
      setError(res.error);
      return;
    }
    closeDrawer();
    load();
  }

  async function remove(id: string) {
    if (!confirm(`Xóa ${entityLabel} này? Hành động không thể hoàn tác.`))
      return;
    setDeletingId(id);
    await adminJson(endpoint + "?id=" + id, { method: "DELETE" });
    setDeletingId(null);
    load();
  }

  return (
    <div className="panel">
      <div className="panel-head">
        <h2>
          {entityLabel} ({filtered.length})
        </h2>
        <div className="panel-toolbar">
          {searchKeys.length > 0 && (
            <div className="search-box">
              <input
                placeholder="Tìm kiếm..."
                value={q}
                onChange={(e) => setQ(e.target.value)}
              />
            </div>
          )}
          {filters.map((f) => (
            <select
              key={f.key}
              className="filter-select"
              value={activeFilters[f.key] || ""}
              onChange={(e) =>
                setActiveFilters((s) => ({ ...s, [f.key]: e.target.value }))
              }
            >
              <option value="">{f.label}: Tất cả</option>
              {f.options.map((o) => {
                const value = typeof o === "string" ? o : o.value;
                const label = typeof o === "string" ? o : o.label;
                return (
                  <option key={value} value={value}>
                    {label}
                  </option>
                );
              })}
            </select>
          ))}
          {extraToolbar}
          <button
            className="btn btn-primary"
            onClick={() => setEditing({ ...defaultValues })}
          >
            <Plus size={15} /> Thêm mới
          </button>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c.key}>{c.header}</th>
              ))}
              <th style={{ textAlign: "right" }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={columns.length + 1} className="empty-row">
                  Đang tải...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={columns.length + 1} className="empty-row">
                  Chưa có dữ liệu.
                </td>
              </tr>
            ) : (
              pagedRows.map((row) => (
                <tr key={row.id}>
                  {columns.map((c) => (
                    <td key={c.key}>
                      {c.render ? c.render(row) : String(row[c.key] ?? "")}
                    </td>
                  ))}
                  <td>
                    <div className="row-actions">
                      <button
                        className="btn btn-outline btn-sm"
                        onClick={() => openEdit(row)}
                      >
                        <Pencil size={13} /> Sửa
                      </button>
                      <button
                        className="btn btn-danger btn-sm"
                        disabled={deletingId === row.id}
                        onClick={() => remove(row.id)}
                      >
                        <Trash2 size={13} /> Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="crud-pagination">
          <button
            className="pagination-btn"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Trước
          </button>
          <div className="pagination-pages">
            {pageItems.map((item, index) =>
              item === "..." ? (
                <span key={`sep-${index}`} className="pagination-ellipsis">
                  …
                </span>
              ) : (
                <button
                  key={item}
                  type="button"
                  className={`pagination-page ${item === page ? "is-active" : ""}`}
                  onClick={() => setPage(item)}
                >
                  {item}
                </button>
              ),
            )}
          </div>
          <button
            className="pagination-btn"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Sau
          </button>
        </div>
      )}

      {editing && (
        <div
          className="overlay"
          onClick={(e) => e.target === e.currentTarget && closeDrawer()}
        >
          <div className="drawer">
            <div className="drawer-head">
              <h2>
                {editing.id ? `Sửa ${entityLabel}` : `Thêm ${entityLabel}`}
              </h2>
              <button className="close" onClick={closeDrawer}>
                <X size={20} />
              </button>
            </div>
            <div className="drawer-body">
              {error && <div className="form-error">{error}</div>}

              {fields.some((f) => f.type === "image") &&
                (() => {
                  const imgField = fields.find((f) => f.type === "image")!;
                  const val = editing[imgField.name];
                  return val ? (
                    <img className="img-preview" src={val} alt="" />
                  ) : null;
                })()}

              {renderFields(fields, editing, setField, setMany)}
            </div>
            <div className="form-actions" style={{ padding: "0 24px 24px" }}>
              <button
                className="btn btn-primary"
                disabled={saving}
                onClick={save}
              >
                {saving ? <span className="spinner" /> : null}{" "}
                {saving ? "Đang lưu..." : "Lưu lại"}
              </button>
              <button className="btn btn-outline" onClick={closeDrawer}>
                Hủy
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
});

function renderFields(
  fields: FieldConfig[],
  values: Record<string, any>,
  setField: (n: string, v: any) => void,
  setMany: (patch: Record<string, any>) => void,
) {
  const out: React.ReactNode[] = [];
  for (let i = 0; i < fields.length; i++) {
    const f = fields[i];
    if (f.half && fields[i + 1]?.half) {
      const f2 = fields[i + 1];
      out.push(
        <div className="field-row" key={f.name + f2.name}>
          {renderOne(f, values, setField, setMany)}
          {renderOne(f2, values, setField, setMany)}
        </div>,
      );
      i++;
      continue;
    }
    out.push(renderOne(f, values, setField, setMany));
  }
  return out;
}

function renderOne(
  f: FieldConfig,
  values: Record<string, any>,
  setField: (n: string, v: any) => void,
  setMany: (patch: Record<string, any>) => void,
) {
  const v = values[f.name];
  if (f.type === "checkbox") {
    return (
      <div className="field field-check" key={f.name}>
        <input
          type="checkbox"
          id={f.name}
          checked={Boolean(v)}
          onChange={(e) => setField(f.name, e.target.checked)}
        />
        <label htmlFor={f.name}>{f.label}</label>
      </div>
    );
  }
  if (f.type === "custom") {
    return (
      <div className="field" key={f.name}>
        {f.label && (
          <label>
            {f.label} {f.hint && <span className="hint"> — {f.hint}</span>}
          </label>
        )}
        {f.render?.(v, (nv) => setField(f.name, nv), { values, setMany })}
      </div>
    );
  }
  return (
    <div className="field" key={f.name}>
      <label>
        {f.label} {f.hint && <span className="hint"> — {f.hint}</span>}
      </label>
      {f.type === "textarea" ? (
        <textarea
          required={f.required}
          placeholder={f.placeholder}
          value={v ?? ""}
          onChange={(e) => setField(f.name, e.target.value)}
        />
      ) : f.type === "select" ? (
        <select
          value={v ?? ""}
          onChange={(e) => setField(f.name, e.target.value)}
          required={f.required}
        >
          <option value="" disabled>
            Chọn...
          </option>
          {f.options?.map((o) => {
            const value = typeof o === "string" ? o : o.value;
            const label = typeof o === "string" ? o : o.label;
            return (
              <option key={value} value={value}>
                {label}
              </option>
            );
          })}
        </select>
      ) : (
        <input
          type={
            f.type === "number"
              ? "number"
              : f.type === "datetime"
                ? "datetime-local"
                : f.type === "url"
                  ? "url"
                  : "text"
          }
          required={f.required}
          placeholder={f.placeholder}
          value={v ?? ""}
          onChange={(e) =>
            setField(
              f.name,
              f.type === "number"
                ? e.target.value === ""
                  ? null
                  : Number(e.target.value)
                : e.target.value,
            )
          }
        />
      )}
    </div>
  );
}

export default CrudManager;
