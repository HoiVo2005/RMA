"use client";
import { useEffect, useState } from "react";
import { Plus, Trash2, GripVertical } from "lucide-react";
import {
  parseClubStints,
  serializeClubStints,
  type ClubStint,
} from "@/lib/career";

const EMPTY: ClubStint = {
  name: "",
  fromYear: "",
  toYear: "",
  apps: "",
  goals: "",
  logo_url: "",
};

export default function ClubStintsEditor({
  value,
  onChange,
  nameLabel = "Câu lạc bộ",
  namePlaceholder = "vd: Real Madrid",
  withStats = true,
  addLabel = "Thêm dòng",
}: {
  value: string;
  onChange: (v: string) => void;
  nameLabel?: string;
  namePlaceholder?: string;
  withStats?: boolean;
  addLabel?: string;
}) {
  // Giữ danh sách dòng ở state riêng để không làm mất dòng vừa thêm khi render lại.
  const [rows, setRows] = useState<ClubStint[]>(() => {
    const parsed = parseClubStints(value);
    return parsed.length > 0 ? parsed : [{ ...EMPTY }];
  });

  useEffect(() => {
    const parsed = parseClubStints(value);
    const normalizedValue = serializeClubStints(
      parsed.length > 0 ? parsed : [{ ...EMPTY }],
      withStats,
    );
    const currentValue = serializeClubStints(rows, withStats);
    if (normalizedValue !== currentValue) {
      setRows(parsed.length > 0 ? parsed : [{ ...EMPTY }]);
    }
  }, [value, withStats]);

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
            <div
              className="repeater-field repeater-field-wide"
              style={{ gridColumn: "1 / -1", marginTop: 8 }}
            >
              <span>Link icon / logo</span>
              <input
                type="url"
                placeholder="https://... (bỏ trống thì tự tìm icon)"
                value={row.logo_url || ""}
                onChange={(e) => updateRow(i, { logo_url: e.target.value })}
              />
            </div>
          </div>
          <button
            type="button"
            className="repeater-remove"
            onClick={() => removeRow(i)}
            title="Xoá dòng này"
          >
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
