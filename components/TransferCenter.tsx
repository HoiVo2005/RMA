"use client";

import React, { useEffect, useState } from "react";

type TransferEvent = {
  id?: string;
  topic?: string;
  actor?: string;
  content?: string;
  url?: string;
  source?: string;
  stage?: string;
  confidence?: number;
  published_at?: string;
};

export default function TransferCenter({
  defaultTopic = "",
}: {
  defaultTopic?: string;
}) {
  const [topic, setTopic] = useState(defaultTopic);
  const [range, setRange] = useState<"1h" | "6h" | "24h" | "7d" | "all">("24h");
  const [events, setEvents] = useState<TransferEvent[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchEvents();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function fetchEvents() {
    setLoading(true);
    try {
      const q = new URLSearchParams();
      if (topic) q.set("topic", topic);
      if (range) q.set("range", range);
      const res = await fetch(`/api/transfers?${q.toString()}`);
      const json = await res.json();
      setEvents(json.events || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="transfer-widget">
      <div className="transfer-controls">
        <input
          className="transfer-input"
          value={topic}
          onChange={(e) => setTopic(e.target.value)}
          placeholder="Tìm cầu thủ / CLB (ví dụ: Rodri, Real Madrid)"
        />
        <div className="transfer-ranges">
          {(["1h", "6h", "24h", "7d", "all"] as const).map((r) => (
            <button
              key={r}
              className={r === range ? "active" : ""}
              onClick={() => setRange(r)}
            >
              {r}
            </button>
          ))}
          <button onClick={fetchEvents}>Tìm</button>
        </div>
      </div>

      <div className="transfer-list">
        {loading && <div className="transfer-empty">Đang tải...</div>}
        {!loading && events.length === 0 && (
          <div className="transfer-empty">Chưa có thông tin phù hợp.</div>
        )}
        {events.map((ev) => (
          <div className="transfer-row" key={ev.id || ev.url}>
            <div className="transfer-time">
              {ev.published_at
                ? new Date(ev.published_at).toLocaleString("vi-VN")
                : ""}
            </div>
            <div className="transfer-body">
              <div className="transfer-title">
                <a href={ev.url} target="_blank" rel="noreferrer">
                  {ev.topic || ev.actor}
                </a>
                <span className={`transfer-stage stage-${ev.stage}`}>
                  {ev.stage}
                </span>
              </div>
              <div className="transfer-source">
                {ev.source} ·{" "}
                {ev.confidence ? Math.round(ev.confidence * 100) + "%" : ""}
              </div>
              <p className="transfer-content">{ev.content}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
