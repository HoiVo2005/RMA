'use client';
import { useState } from 'react';
import { Plus, Trash2, GripVertical } from 'lucide-react';
import { parseClubStints, serializeClubStints, type ClubStint } from '@/lib/career';

const EMPTY: ClubStint = { name: '', fromYear: '', toYear: '', apps: '', goals: '' };

export default function ClubStintsEditor({
  value,
  onChange,
  nameLabel = 'Câu lạc bộ',
  namePlaceholder = 'vd: Real Madrid',
  withStats = true,
  addLabel = 'Thêm dòng',
}: {
  value: string;
  onChange: (v: string) => void;
  nameLabel?: string;
  namePlaceholder?: string;
  withStats?: boolean;
  addLabel?: string;
}) {
  // Giữ danh sách dòng ở state riêng (chỉ khởi tạo 1 lần từ giá trị ban đầu) — KHÔNG tính lại từ
  // chuỗi đã lưu mỗi lần render, vì chuỗi đã lưu luôn lọc bỏ dòng trống nên dòng vừa "Thêm" sẽ biến
  // mất ngay lập tức nếu tính lại theo cách đó.
  const [rows, setRows] = useState<ClubStint[]>(() => {
    const parsed = parseClubStints(value);
    return parsed.length > 0 ? parsed : [{ ...EMPTY }];
  });

  function update(next: ClubStint[]) {
    setRows(next);
    onChange(serializeClubStints(next, withStats));
  }
  function updateRow(i: number, patch: Partial<ClubStint>) {
    update(rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));
  }
  function addRow() {
    update([...rows, { ...EMPTY }]);
  }
  function removeRow(i: number) {
    const next = rows.filter((_, idx) => idx !== i);
    update(next.length > 0 ? next : [{ ...EMPTY }]);
  }

  return (
    <div className="repeater">
      {rows.map((row, i) => (
        <div className="repeater-row" key={i}>
          <GripVertical size={14} className="repeater-drag" />
          <div className="repeater-fields">
            <div className="repeater-field repeater-field-wide">
              <span>{nameLabel}</span>
              <input
                type="text"
                placeholder={namePlaceholder}
                value={row.name}
                onChange={(e) => updateRow(i, { name: e.target.value })}
              />
            </div>
            <div className="repeater-field">
              <span>Từ năm</span>
              <input
                type="text"
                placeholder="2023"
                value={row.fromYear}
                onChange={(e) => updateRow(i, { fromYear: e.target.value })}
              />
            </div>
            <div className="repeater-field">
              <span>Đến năm</span>
              <input
                type="text"
                placeholder="nay"
                value={row.toYear}
                onChange={(e) => updateRow(i, { toYear: e.target.value })}
              />
            </div>
            {withStats && (
              <>
                <div className="repeater-field repeater-field-narrow">
                  <span>Số trận</span>
                  <input
                    type="text"
                    placeholder="63"
                    value={row.apps}
                    onChange={(e) => updateRow(i, { apps: e.target.value })}
                  />
                </div>
                <div className="repeater-field repeater-field-narrow">
                  <span>Số bàn</span>
                  <input
                    type="text"
                    placeholder="18"
                    value={row.goals}
                    onChange={(e) => updateRow(i, { goals: e.target.value })}
                  />
                </div>
              </>
            )}
          </div>
          <button type="button" className="repeater-remove" onClick={() => removeRow(i)} title="Xoá dòng này">
            <Trash2 size={14} />
          </button>
        </div>
      ))}
      <button type="button" className="repeater-add" onClick={addRow}>
        <Plus size={14} /> {addLabel}
      </button>
    </div>
  );
}
