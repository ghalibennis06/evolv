import { useState, useEffect } from "react";

interface SessionLike {
  id: string;
  date: string;
  time: string;
  is_active: boolean;
}

export function useNextSession<T extends SessionLike>(sessions: T[]): T | null {
  const [nextSession, setNextSession] = useState<T | null>(null);

  useEffect(() => {
    const compute = () => {
      const now = new Date();
      const next = sessions
        .filter(s => s.is_active && new Date(`${s.date}T${s.time}`) > now)
        .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0];
      setNextSession(next || null);
    };
    compute();
    const interval = setInterval(compute, 60_000);
    return () => clearInterval(interval);
  }, [sessions]);

  return nextSession;
}
