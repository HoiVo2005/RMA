'use client';
import { useState } from 'react';
import { adminJson } from '@/lib/admin-client';
import { FIXTURE_EVENT_TYPES } from '@/lib/types';
import type { Fixture, FixtureEvent } from '@/lib/types';
import { X, Save, Plus, Trash2, Goal } from 'lucide-react';

function blankEvent(): FixtureEvent {
  return { minute: '', type: 'goal', team: 'home', player: '', note: '' };
}

export default function MatchEventsEditor({
  fixture,
  onClose,
  onSaved,
}: {
  fixture: Fixture;
  onClose: () => void;
  onSaved: () => void;
}) {
  const [events, setEvents] = useState<FixtureEvent[]>(fixture.events?.length ? fixture.events : []);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');

  function update(i: number, patch: Partial<FixtureEvent>) {
    setEvents((list) => list.map((e, idx) => (idx === i ? { ...e, ...patch } : e)));
  }

  function remove(i: number) {
    setEvents((list) => list.filter((_, idx) => idx !== i));
  }

  function add() {
    setEvents((list) => [...list, blankEvent()]);
  }

  async function save() {
    setSaving(true);
    setMsg('');
    const sorted = [...events]
      .filter((e) => e.player.trim())
      .sort((a, b) => parseInt(a.minute) - parseInt(b.minute));
    const res = await adminJson('/api/admin/fixtures', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ id: fixture.id, events: sorted }),
    });
    setSaving(false);
    if (res.error) {
      setMsg('Lỗi: ' + res.error);
    } else {
      setMsg('Đã lưu diễn biến trận đấu!');
      onSaved();
    }
  }

  return (
    <div className="lineup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lineup-modal">
        <div className="lineup-modal-head">
          <h2>
            <Goal size={17} /> Diễn biến: {fixture.home_team} vs {fixture.away_team}
          </h2>
          <button className="close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <div className="lineup-body">
          <div className="events-list">
            {events.map((ev, i) => (
              <div className="event-row" key={i}>
                <input
                  className="event-minute"
                  placeholder="45'"
                  value={ev.minute}
                  onChange={(e) => update(i, { minute: e.target.value })}
                />
                <select value={ev.type} onChange={(e) => update(i, { type: e.target.value as any })}>
                  {FIXTURE_EVENT_TYPES.map((t) => (
                    <option key={t.value} value={t.value}>
                      {t.label}
                    </option>
                  ))}
                </select>
                <select value={ev.team} onChange={(e) => update(i, { team: e.target.value as any })}>
                  <option value="home">{fixture.home_team}</option>
                  <option value="away">{fixture.away_team}</option>
                </select>
                <input
                  className="event-player"
                  placeholder="Tên cầu thủ"
                  value={ev.player}
                  onChange={(e) => update(i, { player: e.target.value })}
                />
                <input
                  className="event-note"
                  placeholder="Ghi chú (VD: phạt đền, kiến tạo...)"
                  value={ev.note || ''}
                  onChange={(e) => update(i, { note: e.target.value })}
                />
                <button className="event-remove" onClick={() => remove(i)} title="Xoá">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {!events.length && (
              <div className="empty-row" style={{ padding: 30 }}>
                Chưa có diễn biến nào. Bấm "Thêm sự kiện" để bắt đầu.
              </div>
            )}
          </div>

          <button className="btn btn-outline" onClick={add} style={{ alignSelf: 'flex-start' }}>
            <Plus size={15} /> Thêm sự kiện
          </button>

          {msg && <div className={msg.startsWith('Lỗi') ? 'form-error' : 'form-success'}>{msg}</div>}

          <div className="form-actions">
            <button className="btn btn-primary" onClick={save} disabled={saving}>
              {saving ? <span className="spinner" /> : <Save size={15} />}
              {saving ? 'Đang lưu...' : 'Lưu diễn biến'}
            </button>
            <button className="btn btn-outline" onClick={onClose}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
