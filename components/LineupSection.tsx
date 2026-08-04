'use client';
import { useState } from 'react';
import type { LineupSlot } from '@/lib/data';
import { Shirt, ChevronDown } from 'lucide-react';

export default function LineupSection({
  lineup,
  defaultOpen = false,
}: {
  lineup: { formation: string; slots: LineupSlot[]; source?: 'auto' | 'manual'; syncedAt?: string | null } | null;
  defaultOpen?: boolean;
}) {
  const [open, setOpen] = useState(defaultOpen);
  if (!lineup) return null;

  const syncedLabel =
    lineup.source === 'auto' && lineup.syncedAt
      ? `Tự động cập nhật lúc ${new Date(lineup.syncedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}`
      : null;

  return (
    <section className="lineup-section">
      <button className="lineup-toggle-btn" onClick={() => setOpen((o) => !o)} aria-expanded={open}>
        <span className="lineup-toggle-left">
          <Shirt size={17} />
          Đội hình ra sân
          <span className="lineup-toggle-formation">{lineup.formation}</span>
          {syncedLabel && <span className="lineup-toggle-synced">{syncedLabel}</span>}
        </span>
        <span className={`lineup-toggle-label ${open ? 'is-open' : ''}`}>
          {open ? 'Ẩn đội hình' : 'Xem đội hình'}
          <ChevronDown size={16} className="lineup-chevron" />
        </span>
      </button>

      <div className={`lineup-collapse ${open ? 'open' : ''}`}>
        <div className="lineup-collapse-inner">
          <div className="pitch">
            <div className="pitch-stripes" />
            <div className="pitch-lines" />
            <div className="pitch-penalty pitch-penalty-top" />
            <div className="pitch-penalty pitch-penalty-bottom" />
            {lineup.slots.map((slot) => (
              <div className="pitch-slot" key={slot.id} style={{ left: `${slot.x}%`, top: `${slot.y}%` }}>
                {slot.player ? (
                  <div className="pitch-player" title={slot.player.name}>
                    <div className="pitch-player-frame">
                      {slot.player.image_url ? (
                        <img src={slot.player.image_url} alt={slot.player.name} />
                      ) : (
                        <span className="pitch-player-fallback">{slot.player.shirt_number ?? '?'}</span>
                      )}
                      {slot.player.shirt_number != null && (
                        <span className="pitch-player-badge">{slot.player.shirt_number}</span>
                      )}
                    </div>
                    <span className="pitch-player-name">{slot.player.name.split(' ').slice(-1)[0]}</span>
                  </div>
                ) : (
                  <div className="pitch-slot-empty">{slot.label}</div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
