// src/hooks/useSessions.ts
// FIX BUG 13 — Stale closure corrigé avec valeurs stables
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface SessionData {
  id: string;
  title: string;
  type: string;
  level: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  instructor: string;
  price: number;
  is_active: boolean;
  notes: string | null;
  enrolled: number;
}

export function useSessions(options?: { limit?: number; fromToday?: boolean; activeOnly?: boolean }) {
  const [sessions, setSessions] = useState<SessionData[]>([]);
  const [loading, setLoading] = useState(true);

  const limit = options?.limit;
  const fromToday = options?.fromToday ?? false;
  const activeOnly = options?.activeOnly ?? true;

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      let query = supabase
        .from("sessions")
        .select("*, session_participants(count)")
        .order("date", { ascending: true })
        .order("time", { ascending: true });

      if (activeOnly) {
        query = query.eq("is_active", true);
      }
      if (fromToday) {
        query = query.gte("date", new Date().toISOString().split("T")[0]);
      }
      if (limit) {
        query = query.limit(limit);
      }

      const { data } = await query;
      if (!cancelled) {
        setSessions(
          (data || []).map((s: any) => ({
            ...s,
            enrolled: s.session_participants?.[0]?.count ?? 0,
          })),
        );
        setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [limit, fromToday, activeOnly]);

  return { sessions, loading };
}
