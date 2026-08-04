'use client';

import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import type { ClubKit } from '@/lib/club-info';

export default function KitGallery({ kits }: { kits: ClubKit[] }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);

  useEffect(() => {
    if (activeIndex === null) return;
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveIndex(null);
    };
    document.addEventListener('keydown', onKeyDown);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      document.body.style.overflow = prevOverflow;
    };
  }, [activeIndex]);

  const active = activeIndex !== null ? kits[activeIndex] : null;

  return (
    <>
      <div className="club-infobox-kits">
        {kits.map((kit, i) => (
          <button
            type="button"
            className="club-kit-swatch club-kit-swatch-btn"
            key={i}
            onClick={() => kit.image_url && setActiveIndex(i)}
            aria-label={`Xem ảnh lớn: ${kit.label}`}
            disabled={!kit.image_url}
          >
            {kit.image_url ? (
              <img src={kit.image_url} alt={kit.label} className="club-kit-shirt-photo" />
            ) : (
              <div className="club-kit-shirt" style={{ background: kit.primary, borderColor: kit.secondary }}>
                <div className="club-kit-shirt-trim" style={{ background: kit.secondary }} />
              </div>
            )}
            <span>{kit.label}</span>
          </button>
        ))}
      </div>

      {active && active.image_url && (
        <div
          className="kit-modal-backdrop"
          role="dialog"
          aria-modal="true"
          aria-label={active.label}
          onClick={() => setActiveIndex(null)}
        >
          <div className="kit-modal-content" onClick={(e) => e.stopPropagation()}>
            <button
              type="button"
              className="kit-modal-close"
              onClick={() => setActiveIndex(null)}
              aria-label="Đóng"
            >
              <X size={20} />
            </button>
            <img src={active.image_url} alt={active.label} className="kit-modal-image" />
            <span className="kit-modal-label">{active.label}</span>
          </div>
        </div>
      )}
    </>
  );
}
