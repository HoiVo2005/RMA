"use client";
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
};

export default function CareerClubsEditor({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const list = parseClubStints(value);
  // Nếu cột đang trống hoàn toàn, luôn hiện sẵn 1 dòng để nhập cho dễ.
  const rows = list.length > 0 ? list : [EMPTY];

  function update(next: ClubStint[]) {
    onChange(serializeClubStints(next, true));
  }
  function updateRow(i: number, patch: Partial<ClubStint>) {
    const next = rows.map((r, idx) => (idx === i ? { ...r, ...patch } : r));
    update(next);
  }
  function addRow() {
    update([...rows, EMPTY]);
  }
  function removeRow(i: number) {
    update(rows.filter((_, idx) => idx !== i));
  }

  return (
    <div className="repeater">
      {rows.map((row, i) => (
        <div className="repeater-row" key={i}>
          <GripVertical size={14} className="repeater-drag" />
          <div className="repeater-fields">
            <div className="repeater-field repeater-field-wide">
              <span>Câu lạc bộ</span>
              <input
                type="text"
                placeholder="vd: Real Madrid"
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
        <Plus size={14} /> Thêm câu lạc bộ
      </button>
    </div>
  );
}
