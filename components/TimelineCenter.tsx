"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type EventItem = {
  id: string;
  translated_title: string;
  summary_vi: string | null;
  source_name: string;
  source_country: string | null;
  published_at: string | null;
  original_url: string;
};

const ranges = [
  { key: "1h", label: "1 giờ" },
  { key: "6h", label: "6 giờ" },
  { key: "24h", label: "24 giờ" },
  { key: "7d", label: "7 ngày" },
  { key: "all", label: "Tất cả" },
];

export default function TimelineCenter({
  defaultTopic = "",
}: {
  defaultTopic?: string;
}) {
  const [topic, setTopic] = useState(defaultTopic);
  const [range, setRange] = useState("24h");
  const [loading, setLoading] = useState(false);
  const [events, setEvents] = useState<EventItem[]>([]);

  useEffect(() => {
    if (!topic) return;
    setLoading(true);
    fetch(`/api/timeline?topic=${encodeURIComponent(topic)}&range=${range}`)
      .then((r) => r.json())
      .then((d) => {
        setEvents(d.events || []);
      })
      .catch((e) => console.error(e))
      .finally(() => setLoading(false));
  }, [topic, range]);

  return (
    <div className="timeline-widget widget">
      <div className="timeline-controls">
        <input
          placeholder="Nhập chủ đề (ví dụ: Rodri, Real Madrid)"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          className="timeline-input"
        />
        <div className="timeline-ranges">
          {ranges.map((r) => (
            <button
              key={r.key}
              className={`timeline-range-btn ${r.key === range ? "active" : ""}`}
              onClick={() => setRange(r.key)}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      <div className="timeline-list">
        {loading && <div className="timeline-empty">Đang tải...</div>}
        {!loading && !events.length && (
          <div className="timeline-empty">Không có sự kiện</div>
        )}
        {events.map((ev) => (
          <div key={ev.id} className="timeline-row">
            <div className="timeline-time">
              {ev.published_at
                ? new Date(ev.published_at).toLocaleTimeString("vi-VN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "--:--"}
            </div>
            <div className="timeline-body">
              <div className="timeline-source">
                {ev.source_name}
                {ev.source_country ? ` · ${ev.source_country}` : ""}
              </div>
              <h4 className="timeline-title">
                <Link href={ev.original_url}>{ev.translated_title}</Link>
              </h4>
              {ev.summary_vi && (
                <div className="timeline-summary">{ev.summary_vi}</div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
