'use client';
import type React from 'react';
import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import type { Player } from '@/lib/types';
import { flagUrl } from '@/lib/flags';
import FollowPlayerButton from './FollowPlayerButton';
import Link from 'next/link';

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

export default function PlayerCarousel({ players }: { players: Player[] }) {
  const trackRef = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  // Mobile: 2 thẻ/hàng, vuốt sang thẻ tiếp theo. Desktop: 4 thẻ/hàng.
  const [perSlide, setPerSlide] = useState(4);
  useEffect(() => {
    function updatePerSlide() {
      setPerSlide(window.innerWidth <= 640 ? 2 : 4);
    }
    updatePerSlide();
    window.addEventListener('resize', updatePerSlide);
    return () => window.removeEventListener('resize', updatePerSlide);
  }, []);
  const slides = chunk(players, perSlide);

  // Drag-to-scroll state (mouse/pointer), so desktop users can kéo track like on mobile.
  const dragRef = useRef({
    isDown: false,
    dragged: false,
    startX: 0,
    startScroll: 0,
  });

  function scrollToIndex(i: number) {
    const track = trackRef.current;
    if (!track) return;
    const clamped = Math.max(0, Math.min(i, slides.length - 1));
    track.scrollTo({ left: clamped * track.clientWidth, behavior: 'smooth' });
  }

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    track.scrollLeft = 0;
    setIndex(0);
  }, [perSlide]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    function onScroll() {
      if (!track) return;
      const i = Math.round(track.scrollLeft / track.clientWidth);
      setIndex(i);
    }
    track.addEventListener('scroll', onScroll, { passive: true });
    return () => track.removeEventListener('scroll', onScroll);
  }, []);

  function onPointerDown(e: React.PointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    if (!track) return;
    // Only handle mouse drag here; touch/pen keep native scrolling untouched.
    if (e.pointerType !== 'mouse') return;
    dragRef.current.isDown = true;
    dragRef.current.dragged = false;
    dragRef.current.startX = e.clientX;
    dragRef.current.startScroll = track.scrollLeft;
    // Don't add the 'dragging' class yet — a plain click must still reach the card link.
  }

  function onPointerMove(e: React.PointerEvent<HTMLDivElement>) {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!track || !drag.isDown) return;
    const delta = e.clientX - drag.startX;
    if (Math.abs(delta) > 4 && !drag.dragged) {
      drag.dragged = true;
      // Only now disable pointer-events on cards, once it's a real drag.
      track.classList.add('dragging');
    }
    if (drag.dragged) {
      track.scrollLeft = drag.startScroll - delta;
    }
  }

  function endDrag() {
    const track = trackRef.current;
    const drag = dragRef.current;
    if (!drag.isDown) return;
    drag.isDown = false;
    track?.classList.remove('dragging');
    // Snap to nearest slide after a free drag.
    if (drag.dragged && track) {
      const i = Math.round(track.scrollLeft / track.clientWidth);
      scrollToIndex(i);
    }
  }

  function onClickCapture(e: React.MouseEvent<HTMLDivElement>) {
    // Prevent a card/link click from firing right after a drag gesture.
    if (dragRef.current.dragged) {
      e.preventDefault();
      e.stopPropagation();
      dragRef.current.dragged = false;
    }
  }

  if (slides.length === 0) return null;

  return (
    <div className="player-carousel">
      {slides.length > 1 && (
        <button
          className="player-carousel-arrow prev"
          onClick={() => scrollToIndex(index - 1)}
          disabled={index === 0}
          aria-label="Xem trước"
        >
          <ChevronLeft size={18} />
        </button>
      )}

      <div
        className="player-carousel-track"
        ref={trackRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerLeave={endDrag}
        onPointerCancel={endDrag}
        onClickCapture={onClickCapture}
      >
        {slides.map((slide, si) => (
          <div className="player-carousel-slide" key={si}>
            {slide.map((p) => (
              <PlayerCard key={p.id} p={p} />
            ))}
          </div>
        ))}
      </div>

      {slides.length > 1 && (
        <button
          className="player-carousel-arrow next"
          onClick={() => scrollToIndex(index + 1)}
          disabled={index === slides.length - 1}
          aria-label="Xem tiếp"
        >
          <ChevronRight size={18} />
        </button>
      )}

      {slides.length > 1 && (
        <div className="player-carousel-dots">
          {slides.map((_, i) => (
            <button
              key={i}
              className={`player-carousel-dot ${i === index ? 'active' : ''}`}
              onClick={() => scrollToIndex(i)}
              aria-label={`Slide ${i + 1}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function formatDate(iso: string | null | undefined) {
  if (!iso) return null;
  const d = new Date(iso);
  return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
}

function calcAge(iso: string | null | undefined) {
  if (!iso) return null;
  return Math.floor((Date.now() - new Date(iso).getTime()) / (365.25 * 24 * 3600 * 1000));
}

function PlayerCard({ p }: { p: Player }) {
  const dob = formatDate(p.date_of_birth);
  const age = calcAge(p.date_of_birth);

  return (
    <Link href={`/doi-hinh/${p.slug || p.id}`} className="player-card">
      <div className="player-photo-wrap">
        {p.image_url ? (
          <img className="player-photo" src={p.image_url} alt={p.name} loading="lazy" />
        ) : (
          <div className="player-photo-fallback">{p.shirt_number ?? '?'}</div>
        )}

        <div className="player-card-overlay">
          <div className="player-card-overlay-rows">
            <div className="player-card-overlay-row">
              <span>Tên đầy đủ</span>
              <b>{p.name}</b>
            </div>
            {dob && (
              <div className="player-card-overlay-row">
                <span>Ngày sinh</span>
                <b>
                  {dob}
                  {age != null && ` (${age} tuổi)`}
                </b>
              </div>
            )}
            {p.birthplace && (
              <div className="player-card-overlay-row">
                <span>Nơi sinh</span>
                <b>{p.birthplace}</b>
              </div>
            )}
            {p.height_cm && (
              <div className="player-card-overlay-row">
                <span>Chiều cao</span>
                <b>{(p.height_cm / 100).toFixed(2)} m</b>
              </div>
            )}
            <div className="player-card-overlay-row">
              <span>Vị trí</span>
              <b>{p.position || '—'}</b>
            </div>
            <div className="player-card-overlay-row">
              <span>Đội hiện tại</span>
              <b>Real Madrid</b>
            </div>
          </div>
        </div>
      </div>

      <div className="num">#{p.shirt_number ?? '-'}</div>
      <h3>{p.name}</h3>
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <FollowPlayerButton player={{ id: p.id, name: p.name, image: p.image_url, position: p.position }} />
      </div>
      <p>
        {p.position || '—'}
        {p.nationality && (
          <>
            {' · '}
            {flagUrl(p.nationality) && (
              <img
                src={flagUrl(p.nationality)!}
                alt={p.nationality}
                width={16}
                height={12}
                style={{ display: 'inline-block', verticalAlign: -1, marginRight: 4, borderRadius: 2 }}
              />
            )}
            {p.nationality}
          </>
        )}
      </p>
    </Link>
  );
}
