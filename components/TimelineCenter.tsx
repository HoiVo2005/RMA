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
}
