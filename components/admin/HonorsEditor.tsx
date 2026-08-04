'use client';
import { useState } from 'react';
import { Plus, Trash2, GripVertical, ImageDown } from 'lucide-react';
import { parseHonors, serializeHonors, type Honor } from '@/lib/career';
import { adminJson } from '@/lib/admin-client';

const EMPTY: Honor = { title: '', count: '', years: '', image_url: '' };

export default function HonorsEditor({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  // Xem giải thích ở ClubStintsEditor.tsx — giữ state riêng để nút "Thêm danh hiệu" không bị mất
  // dòng trống ngay lập tức (vì chuỗi đã lưu luôn lọc bỏ dòng chưa nhập gì).
  const [rows, setRows] = useState<Honor[]>(() => {
    const parsed = parseHonors(value);
    return parsed.length > 0 ? parsed : [{ ...EMPTY }];
  });
  // Trạng thái loading/lỗi riêng cho từng dòng khi bấm "Lấy ảnh tự động".
  const [fetching, setFetching] = useState<Record<number, boolean>>({});
  const [fetchError, setFetchError] = useState<Record<number, string>>({});

  function update(next: Honor[]) {
    setRows(next);
    onChange(serializeHonors(next));
  }
  function updateRow(i: number, patch: Partial<Honor>) {
    update(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    update([...rows, { ...EMPTY }]);
  }
  function removeRow(i: number) {
    const next = rows.filter((_, idx) => idx !== i);
    update(next.length > 0 ? next : [{ ...EMPTY }]);
  }

  async function autoFetchImage(i: number) {
    const title = rows[i].title.trim();
    if (!title) {
      setFetchError((s) => ({ ...s, [i]: 'Nhập tên danh hiệu trước đã.' }));
      return;
    }
    setFetching((s) => ({ ...s, [i]: true }));
    setFetchError((s) => ({ ...s, [i]: '' }));
    const res = await adminJson<{ image_url: string }>('/api/admin/honor-image', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ title }),
    });
    setFetching((s) => ({ ...s, [i]: false }));
    if (res.error || !res.data?.image_url) {
      setFetchError((s) => ({ ...s, [i]: res.error || 'Không tìm được ảnh phù hợp.' }));
      return;
    }
    updateRow(i, { image_url: res.data.image_url });
  }

  return (
    <div className="repeater">
      {rows.map((row, i) => (
        <div className="repeater-row" key={i}>
          <GripVertical size={14} className="repeater-drag" />
          <div className="repeater-fields">
            <div className="repeater-field repeater-field-wide">
              <span>Tên danh hiệu</span>
              <input
                type="text"
                placeholder="vd: La Liga"
                value={row.title}
                onChange={(e) => updateRow(i, { title: e.target.value })}
              />
            </div>
            <div className="repeater-field">
              <span>Số lần</span>
              <input
                type="text"
                placeholder="2"
                value={row.count}
                onChange={(e) => updateRow(i, { count: e.target.value })}
              />
            </div>
            <div className="repeater-field repeater-field-wide">
              <span>Các năm</span>
              <input
                type="text"
                placeholder="2024, 2025"
                value={row.years}
                onChange={(e) => updateRow(i, { years: e.target.value })}
              />
            </div>
            <div className="repeater-field repeater-field-wide">
              <span>Ảnh danh hiệu</span>
              <div className="honor-image-field">
                {row.image_url ? (
                  <img src={row.image_url} alt={row.title} className="honor-image-preview" />
                ) : (
                  <div className="honor-image-preview honor-image-preview--empty" />
                )}
                <input
                  type="text"
                  placeholder="Dán URL ảnh, hoặc bấm nút bên phải để tự lấy từ Wikipedia"
                  value={row.image_url || ''}
                  onChange={(e) => updateRow(i, { image_url: e.target.value })}
                />
                <button
                  type="button"
                  className="btn btn-gold"
                  onClick={() => autoFetchImage(i)}
                  disabled={fetching[i]}
                  title="Tự động tìm ảnh cúp/huy chương thật trên Wikipedia theo tên danh hiệu"
                >
                  {fetching[i] ? <span className="spinner spinner-dark" /> : <ImageDown size={14} />}
                  {fetching[i] ? 'Đang tìm...' : 'Lấy ảnh tự động'}
                </button>
              </div>
              {fetchError[i] && <div className="form-error">{fetchError[i]}</div>}
            </div>
          </div>
          <button type="button" className="repeater-remove" onClick={() => removeRow(i)} title="Xoá dòng này">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="repeater-add" onClick={addRow}>
        <Plus size={14} /> Thêm danh hiệu
      </button>
    </div>
  );
}
