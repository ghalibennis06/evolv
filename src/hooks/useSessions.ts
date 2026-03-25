import { useEffect, useState } from "react";

export interface SessionData {
  id: string;
  title: string;
  type: string;
  level: string;
  session_date: string;
  session_time: string;
  duration: number;
  capacity: number;
  instructor: string;
  price: number;
  is_active: boolean;
  notes: string | null;
  enrolled: number;
  // Legacy aliases for backward compat
  date?: string;
  time?: string;
}

export function useSessions(options?: { limit?: number; fromToday?: boolean; activeOnly?: boolean }) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  const limit = options?.limit;
  const fromToday = options?.fromToday ?? false;
  const activeOnly = options?.activeOnly ?? true;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);

    const params = new URLSearchParams();
    if (fromToday) params.set("fromToday", "1");
    if (activeOnly) params.set("activeOnly", "1");
    if (limit) params.set("limit", String(limit));

    fetch(`/api/sessions?${params}`)
      .then(r => r.json())
      .then(data => {
        if (!cancelled) {
          setSessions((data || []).map((s: any) => ({
            ...s,
            date: s.session_date,
            time: s.session_time,
          })));
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });

    return () => { cancelled = true; };
  }, [limit, fromToday, activeOnly]);

  return { sessions, loading };
}
