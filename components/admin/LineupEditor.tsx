'use client';
import { useEffect, useMemo, useState } from 'react';
import { adminJson } from '@/lib/admin-client';
import { FORMATIONS, FORMATION_NAMES } from '@/lib/formations';
import type { Player } from '@/lib/types';
import { X, Save, Shirt } from 'lucide-react';

type Assignments = Record<string, string | null>;

export default function LineupEditor({ onClose }: { onClose: () => void }) {
  const [squad, setSquad] = useState<Player[]>([]);
  const [formation, setFormation] = useState('4-3-3');
  const [assignments, setAssignments] = useState<Assignments>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  const [autoSync, setAutoSync] = useState(true);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    (async () => {
      const [squadRes, lineupRes, syncRes] = await Promise.all([
        adminJson<Player[]>('/api/admin/players'),
        adminJson<{ formation: string; assignments: Assignments }>('/api/admin/lineup'),
        adminJson<{ enabled: boolean }>('/api/admin/lineup-sync'),
      ]);
      setSquad(squadRes.data || []);
      if (lineupRes.data?.formation && FORMATIONS[lineupRes.data.formation]) {
        setFormation(lineupRes.data.formation);
        setAssignments(lineupRes.data.assignments || {});
      }
      if (syncRes.data) setAutoSync(syncRes.data.enabled);
      setLoading(false);
    })();
  }, []);

  async function toggleAutoSync(next: boolean) {
    setAutoSync(next);
    await adminJson('/api/admin/lineup-sync', {
      method: 'PATCH',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ enabled: next }),
    });
  }

  async function syncNow() {
    setSyncing(true);
    setMsg('');
    const res = await adminJson<{
      ok: boolean;
      reason?: string;
      formation?: string;
      matchedCount?: number;
      totalCount?: number;
      unmatchedNames?: string[];
    }>('/api/admin/lineup-sync', { method: 'POST' });
    setSyncing(false);
    if (res.error) {
      setMsg('Lỗi: ' + res.error);
    } else if (!res.data?.ok) {
      setMsg(res.data?.reason || 'Chưa đồng bộ được — thử lại sau.');
    } else {
      setMsg(
        `Đã lấy đội hình thật (${res.data.formation}) — khớp ${res.data.matchedCount}/${res.data.totalCount} cầu thủ.` +
          (res.data.unmatchedNames?.length ? ` Không khớp: ${res.data.unmatchedNames.join(', ')}.` : '')
      );
      // Tải lại để hiển thị kết quả vừa đồng bộ trên sân
      const lineupRes = await adminJson<{ formation: string; assignments: Assignments }>('/api/admin/lineup');
      if (lineupRes.data?.formation && FORMATIONS[lineupRes.data.formation]) {
        setFormation(lineupRes.data.formation);
        setAssignments(lineupRes.data.assignments || {});
      }
    }
  }

  const slots = FORMATIONS[formation];
  const usedPlayerIds = useMemo(() => new Set(Object.values(assignments).filter(Boolean)), [assignments]);

  function changeFormation(next: string) {
    // Giữ lại cầu thủ ở các vị trí trùng id giữa 2 sơ đồ, xoá phần không khớp
    const nextSlotIds = new Set(FORMATIONS[next].map((s) => s.id));
    const kept: Assignments = {};
    for (const [slotId, playerId] of Object.entries(assignments)) {
      if (nextSlotIds.has(slotId)) kept[slotId] = playerId;
    }
    setFormation(next);
    setAssignments(kept);
  }

  function assign(slotId: string, playerId: string) {
    setAssignments((a) => ({ ...a, [slotId]: playerId || null }));
  }

  async function save() {
    setSaving(true);
    setMsg('');
    const res = await adminJson('/api/admin/lineup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ formation, assignments }),
    });
    setSaving(false);
    setMsg(res.error ? 'Lỗi: ' + res.error : 'Đã lưu đội hình chính!');
  }

  const filledCount = Object.values(assignments).filter(Boolean).length;

  return (
    <div className="lineup-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="lineup-modal">
        <div className="lineup-modal-head">
          <h2>
            <Shirt size={17} /> Đội hình chính
          </h2>
          <button className="close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {loading ? (
          <div className="empty-row" style={{ padding: 60 }}>
            Đang tải...
          </div>
        ) : (
          <div className="lineup-body">
            <div className="lineup-formation-picker">
              <span>Sơ đồ:</span>
              {FORMATION_NAMES.map((f) => (
                <button key={f} className={f === formation ? 'active' : ''} onClick={() => changeFormation(f)}>
                  {f}
                </button>
              ))}
              <span className="lineup-count">{filledCount}/{slots.length} vị trí đã xếp</span>
            </div>

            <div className="lineup-sync-row">
              <label className="lineup-sync-toggle">
                <input type="checkbox" checked={autoSync} onChange={(e) => toggleAutoSync(e.target.checked)} />
                Tự động lấy đội hình thật trước giờ bóng lăn (Highlightly, mỗi 10 phút)
              </label>
              <button type="button" className="btn btn-outline btn-sm" onClick={syncNow} disabled={syncing}>
                {syncing ? <span className="spinner" /> : null}
                {syncing ? 'Đang đồng bộ...' : 'Đồng bộ ngay'}
              </button>
            </div>

            <div className="pitch">
              <div className="pitch-stripes" />
              <div className="pitch-lines" />
              <div className="pitch-penalty pitch-penalty-top" />
              <div className="pitch-penalty pitch-penalty-bottom" />
              {slots.map((slot) => {
                const playerId = assignments[slot.id] || '';
                const player = squad.find((p) => p.id === playerId);
                return (
                  <div className="pitch-slot" key={slot.id} style={{ left: `${slot.x}%`, top: `${slot.y}%` }}>
                    {player ? (
                      <div className="pitch-player" title={player.name}>
                        <div className="pitch-player-frame">
                          {player.image_url ? (
                            <img src={player.image_url} alt={player.name} />
                          ) : (
                            <span className="pitch-player-fallback">{player.shirt_number ?? '?'}</span>
                          )}
                          {player.shirt_number != null && (
                            <span className="pitch-player-badge">{player.shirt_number}</span>
                          )}
                        </div>
                        <span className="pitch-player-name">{player.name.split(' ').slice(-1)[0]}</span>
                      </div>
                    ) : (
                      <div className="pitch-slot-empty">{slot.label}</div>
                    )}
                    <select value={playerId} onChange={(e) => assign(slot.id, e.target.value)} title={`Chọn cầu thủ cho vị trí ${slot.label}`}>
                      <option value="">— {slot.label} —</option>
                      {squad
                        .filter((p) => p.id === playerId || !usedPlayerIds.has(p.id))
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            #{p.shirt_number ?? '-'} {p.name}
                          </option>
                        ))}
                    </select>
                  </div>
                );
              })}
            </div>

            {msg && <div className={msg.startsWith('Lỗi') ? 'form-error' : 'form-success'}>{msg}</div>}

            <div className="form-actions">
              <button className="btn btn-primary" onClick={save} disabled={saving}>
                {saving ? <span className="spinner" /> : <Save size={15} />}
                {saving ? 'Đang lưu...' : 'Lưu đội hình'}
              </button>
              <button className="btn btn-outline" onClick={onClose}>
                Đóng
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
