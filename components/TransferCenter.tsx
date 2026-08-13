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
}
