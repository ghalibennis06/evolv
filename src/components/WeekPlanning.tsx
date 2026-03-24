import { useState, useMemo, useEffect } from "react";
import { motion } from "framer-motion";
import { ChevronLeft, ChevronRight, Users, Calendar, Sun, Flame, ArrowRight, CreditCard } from "lucide-react";
import { Link } from "react-router-dom";
import { useSessions, SessionData } from "@/hooks/useSessions";
import { useNextSession } from "@/hooks/useNextSession";
import { getTypeColor } from "@/lib/schedule";
import { supabase } from "@/integrations/supabase/client";

const DAY_LABELS_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

type FocusFilter = "all" | "reformer" | "pilates" | "yoga" | "soft";
type MomentFilter = "all" | "morning" | "evening";
type PlanningView = "today" | "week";

const FOCUS_LABELS: Record<FocusFilter, string> = {
  all: "Tout",
  reformer: "Reformer",
  pilates: "Pilates",
  yoga: "Yoga",
  soft: "Doux",
};

const MOMENT_LABELS: Record<MomentFilter, string> = {
  all: "Toute la journée",
  morning: "Matin",
  evening: "Soir",
};

function getWeekDates(offset: number): string[] {
  const now = new Date();
  const start = new Date(now);
  start.setDate(now.getDate() - ((now.getDay() + 6) % 7) + offset * 7);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(start);
    d.setDate(start.getDate() + i);
    return d.toISOString().split("T")[0];
  });
}

function formatDayNum(d: string) {
  return new Date(d).getDate();
}

/** ISO week number */
function getISOWeekNumber(dateStr: string): number {
  const date = new Date(dateStr);
  const temp = new Date(date.getTime());
  temp.setHours(0, 0, 0, 0);
  temp.setDate(temp.getDate() + 3 - ((temp.getDay() + 6) % 7));
  const week1 = new Date(temp.getFullYear(), 0, 4);
  return 1 + Math.round(((temp.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
}

/** "Semaine 11 (du 10 au 16 mars)" */
function formatWeekLabel(dates: string[]): string {
  const weekNum = getISOWeekNumber(dates[0]);
  const d1 = new Date(dates[0]);
  const d2 = new Date(dates[6]);
  const day1 = d1.getDate();
  const day2 = d2.getDate();
  const m1 = d1.toLocaleDateString("fr-FR", { month: "long" });
  const m2 = d2.toLocaleDateString("fr-FR", { month: "long" });
  const range = m1 === m2 ? `du ${day1} au ${day2} ${m1}` : `du ${day1} ${m1} au ${day2} ${m2}`;
  return `Semaine ${weekNum} (${range})`;
}

function getSlotInfo(s: SessionData) {
  const left = Math.max(0, s.capacity - s.enrolled);
  if (left === 0) return { text: "Complet", isFull: true, urgency: "full" as const };
  if (left <= 2) return { text: `${left} place${left > 1 ? "s" : ""}`, isFull: false, urgency: "low" as const };
  return { text: `${left} places`, isFull: false, urgency: "ok" as const };
}

function matchesFocus(s: SessionData, focus: FocusFilter) {
  if (focus === "all") return true;
  const t = `${s.type} ${s.title}`.toLowerCase();
  if (focus === "reformer") return t.includes("reformer") || t.includes("jumpboard") || t.includes("springwall");
  if (focus === "pilates") return t.includes("pilates") || t.includes("pilate") || t.includes("barre fit");
  if (focus === "yoga") return t.includes("yoga") || t.includes("flow");
  if (focus === "soft") return t.includes("post-natal") || t.includes("maman") || t.includes("bébé") || t.includes("slow");
  return true;
}

function matchesMoment(s: SessionData, moment: MomentFilter) {
  if (moment === "all") return true;
  const hour = Number((s.time || "00:00").split(":")[0] || "0");
  if (moment === "morning") return hour < 14;
  if (moment === "evening") return hour >= 17;
  return true;
}

function getSessionAccentClass(type: string) {
  const t = type.toLowerCase();
  if (t.includes("reformer") || t.includes("jumpboard") || t.includes("springwall")) return "border-l-[#C4622A]";
  if (t.includes("yoga") || t.includes("flow")) return "border-l-[#3E8A50]";
  if (t.includes("post") || t.includes("maman") || t.includes("bébé") || t.includes("slow")) return "border-l-[#6B67C0]";
  return "border-l-[#C48F10]";
}

interface Props {
  showFilters?: boolean;
  onSessionSelect?: (s: SessionData) => void;
}

export default function WeekPlanning({ showFilters = true, onSessionSelect }: Props) {
  const [weekOffset, setWeekOffset] = useState(0);
  const [planningView, setPlanningView] = useState<PlanningView>("today");
  const [focusFilter, setFocusFilter] = useState<FocusFilter>("all");
  const [momentFilter, setMomentFilter] = useState<MomentFilter>("all");
  const [coachFilter, setCoachFilter] = useState("all");
  const [coaches, setCoaches] = useState<{id: string; name: string}[]>([]);

  useEffect(() => {
    supabase
      .from("coaches")
      .select("id, name")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        if (data && data.length > 0) setCoaches(data);
      });
  }, []);

  const { sessions, loading } = useSessions({ fromToday: false });
  const nextSession = useNextSession(sessions);
  const weekDates = useMemo(() => getWeekDates(weekOffset), [weekOffset]);
  const today = new Date().toISOString().split("T")[0];

  const weekSessions = useMemo(() => {
    const dateSet = new Set(weekDates);
    return sessions
      .filter((s) => dateSet.has(s.date))
      .filter((s) => matchesFocus(s, focusFilter))
      .filter((s) => matchesMoment(s, momentFilter))
      .filter((s) => coachFilter === "all" || s.instructor === coachFilter);
  }, [sessions, weekDates, focusFilter, momentFilter, coachFilter]);

  const sessionsByDay = useMemo(() => {
    const map: Record<string, SessionData[]> = {};
    for (const d of weekDates) map[d] = [];
    for (const s of weekSessions) if (map[s.date]) map[s.date].push(s);
    for (const d of weekDates) map[d].sort((a, b) => a.time.localeCompare(b.time));
    return map;
  }, [weekSessions, weekDates]);

  const todaySessions = sessionsByDay[today] || [];
  const weekSections = weekDates.map((date, i) => ({
    date,
    dayLabel: DAY_LABELS_FULL[i],
    sessions: sessionsByDay[date] || [],
    isToday: date === today,
  }));
  const todayMorning = todaySessions.filter((s) => Number((s.time || "00:00").split(":")[0] || "0") < 14);
  const todayEvening = todaySessions.filter((s) => Number((s.time || "00:00").split(":")[0] || "0") >= 14);
  const remainingToday = (sessionsByDay[today] || []).reduce((sum, s) => sum + Math.max(0, s.capacity - s.enrolled), 0);

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-terra border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-5">
      <div className="bg-card border border-border rounded-2xl p-4 md:p-5">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex p-1 rounded-full border border-border bg-secondary mr-1">
              <button
                onClick={() => setPlanningView("today")}
                className={`px-3 h-8 rounded-full text-[10px] tracking-[0.12em] uppercase transition-all ${
                  planningView === "today" ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
                style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
              >
                <Sun size={12} className="inline mr-1" /> Today
              </button>
              <button
                onClick={() => setPlanningView("week")}
                className={`px-3 h-8 rounded-full text-[10px] tracking-[0.12em] uppercase transition-all ${
                  planningView === "week" ? "bg-foreground text-background" : "text-muted-foreground"
                }`}
                style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
              >
                <Calendar size={12} className="inline mr-1" /> Semaine
              </button>
            </div>

            <button
              onClick={() => setWeekOffset((p) => p - 1)}
              disabled={planningView === "today"}
              className="w-9 h-9 border border-border bg-secondary rounded-full flex items-center justify-center text-foreground/60 hover:border-terra hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft size={16} />
            </button>

            <p
              className="text-sm text-foreground capitalize min-w-[260px] text-center"
              style={{ fontWeight: 500, fontFamily: "'DM Sans', Inter, sans-serif" }}
            >
              {formatWeekLabel(weekDates)}
            </p>

            <button
              onClick={() => setWeekOffset((p) => p + 1)}
              disabled={planningView === "today"}
              className="w-9 h-9 border border-border bg-secondary rounded-full flex items-center justify-center text-foreground/60 hover:border-terra hover:text-foreground disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronRight size={16} />
            </button>

            <button
              onClick={() => {
                setWeekOffset(0);
                setPlanningView("today");
              }}
              className="ml-1 px-3 h-9 border border-border bg-secondary rounded-full text-[10px] tracking-[0.14em] uppercase text-foreground/60 hover:text-foreground hover:border-terra/40 transition-all"
              style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
            >
              Aujourd'hui
            </button>
          </div>

          <div className="flex items-center gap-2 flex-wrap">
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary/40 text-terra text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>
              <Calendar size={11} /> {weekSessions.length} séances
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-foreground/70 text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>
              <Users size={11} /> {remainingToday} places restantes aujourd'hui
            </span>
            {nextSession && (
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-secondary text-foreground/70 text-[10px] uppercase tracking-[0.12em]" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>
                <Flame size={11} /> Prochaine : {nextSession.time}
              </span>
            )}
            <Link
              to="/carte-black"
              className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full border border-terra/40 text-terra text-[10px] uppercase tracking-[0.12em] hover:bg-secondary/50 transition-colors"
              style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
            >
              <CreditCard size={11} /> Recharger mes crédits
            </Link>
          </div>
        </div>

        {showFilters && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] tracking-[0.24em] uppercase text-foreground/70 font-medium" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>Objectif</span>
              {(Object.keys(FOCUS_LABELS) as FocusFilter[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setFocusFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.14em] border ${
                    focusFilter === key ? "bg-foreground text-background border-foreground" : "border-border bg-secondary text-foreground/60"
                  }`}
                  style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                >
                  {FOCUS_LABELS[key]}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] tracking-[0.24em] uppercase text-foreground/70 font-medium" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>Moment</span>
              {(Object.keys(MOMENT_LABELS) as MomentFilter[]).map((key) => (
                <button
                  key={key}
                  onClick={() => setMomentFilter(key)}
                  className={`px-3 py-1.5 rounded-full text-[10px] uppercase tracking-[0.14em] border ${
                    momentFilter === key ? "bg-foreground text-background border-foreground" : "border-border bg-secondary text-foreground/60"
                  }`}
                  style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}
                >
                  {MOMENT_LABELS[key]}
                </button>
              ))}
            </div>

            {coaches.length > 0 && (
              <div className="flex gap-2 overflow-x-auto scrollbar-none pb-1">
                <button
                  onClick={() => setCoachFilter("all")}
                  className={`px-3 py-1.5 rounded-full font-body text-[10px] tracking-[0.2em] uppercase border flex-shrink-0 transition-all ${coachFilter === "all" ? "bg-terra text-white border-terra" : "border-border text-foreground/60 hover:border-foreground/20"}`}
                  style={{ fontWeight: coachFilter === "all" ? 500 : 400 }}
                >
                  Tous les coachs
                </button>
                {coaches.map(c => (
                  <button
                    key={c.id}
                    onClick={() => setCoachFilter(c.name)}
                    className={`px-3 py-1.5 rounded-full font-body text-[10px] tracking-[0.2em] uppercase border flex-shrink-0 transition-all ${coachFilter === c.name ? "bg-terra text-white border-terra" : "border-border text-foreground/60 hover:border-foreground/20"}`}
                    style={{ fontWeight: coachFilter === c.name ? 500 : 400 }}
                  >
                    {c.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-3 md:p-4">
        <div className="flex items-center justify-between mb-3 px-1">
          <p className="text-xl text-foreground" style={{ fontWeight: 700, fontFamily: "'DM Sans', Inter, sans-serif" }}>
            {planningView === "today" ? "Today · Disponibilités en direct" : "Semaine complète · Tous les jours"}
          </p>
          <p className="text-[11px] text-foreground/70" style={{ fontWeight: 600, fontFamily: "'DM Sans', Inter, sans-serif" }}>
            {planningView === "today"
              ? `${todaySessions.length} créneau${todaySessions.length > 1 ? "x" : ""} aujourd'hui`
              : `${weekSessions.length} créneau${weekSessions.length > 1 ? "x" : ""} cette semaine`}
          </p>
        </div>

        {planningView === "today" ? (
          <div className="space-y-4">
            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/70 font-medium mb-2" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>Matin</p>
              {todayMorning.length === 0 ? (
                <p className="text-sm text-foreground/60" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>Aucun créneau ce matin.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-2.5">
                  {todayMorning.map((session) => (
                    <SessionCard key={session.id} session={session} isNext={nextSession?.id === session.id} slot={getSlotInfo(session)} isPast={false} onSessionSelect={onSessionSelect} />
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-secondary/30 p-4">
              <p className="text-[11px] uppercase tracking-[0.18em] text-foreground/70 font-medium mb-2" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>Après-midi & soir</p>
              {todayEvening.length === 0 ? (
                <p className="text-sm text-foreground/60" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>Aucun créneau cet après-midi.</p>
              ) : (
                <div className="grid md:grid-cols-2 gap-2.5">
                  {todayEvening.map((session) => (
                    <SessionCard key={session.id} session={session} isNext={nextSession?.id === session.id} slot={getSlotInfo(session)} isPast={false} onSessionSelect={onSessionSelect} />
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {weekSections.map((group) => (
              <div key={group.date} className="rounded-2xl border border-border bg-secondary/20 p-3 md:p-4">
                <div className="flex items-center justify-between mb-2.5">
                  <p className="text-sm text-foreground uppercase tracking-[0.12em]" style={{ fontWeight: 700, fontFamily: "'DM Sans', Inter, sans-serif" }}>
                    {group.dayLabel} {formatDayNum(group.date)}
                    {group.isToday ? " · aujourd'hui" : ""}
                  </p>
                  <p className="text-[10px] text-foreground/70" style={{ fontWeight: 600, fontFamily: "'DM Sans', Inter, sans-serif" }}>
                    {group.sessions.length} séance{group.sessions.length > 1 ? "s" : ""}
                  </p>
                </div>

                {group.sessions.length === 0 ? (
                  <p className="text-sm text-foreground/60 border border-dashed border-border rounded-xl px-4 py-3 text-center" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>
                    Aucun créneau ce jour.
                  </p>
                ) : (
                  <div className="grid md:grid-cols-2 gap-2.5">
                    {group.sessions.map((session) => (
                      <SessionCard
                        key={session.id}
                        session={session}
                        isNext={nextSession?.id === session.id}
                        slot={getSlotInfo(session)}
                        isPast={group.date < today}
                        onSessionSelect={onSessionSelect}
                      />
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function SessionCard({
  session,
  isNext,
  slot,
  isPast,
  onSessionSelect,
}: {
  session: SessionData;
  isNext: boolean;
  slot: ReturnType<typeof getSlotInfo>;
  isPast: boolean;
  onSessionSelect?: (s: SessionData) => void;
}) {
  const colors = getTypeColor(session.type);

  return (
    <motion.button
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.99 }}
      onClick={() => onSessionSelect?.(session)}
      disabled={isPast}
      className={`w-full text-left p-3 rounded-xl border-l-[5px] border transition-all ${getSessionAccentClass(session.type)} ${
        isPast ? "opacity-45 cursor-not-allowed border-border bg-background" : isNext ? "border-terra shadow-[0_0_0_2px_rgba(184,99,74,0.2)] bg-background" : "border-border hover:border-terra/40 bg-background"
      }`}
    >
      <div className="flex items-start justify-between gap-2 mb-1.5">
        <div>
          <p className="text-[10px] tracking-[0.15em] uppercase text-terra" style={{ fontWeight: 700, fontFamily: "'DM Sans', Inter, sans-serif" }}>{session.time}</p>
          <h4 className="text-[13px] text-foreground leading-tight" style={{ fontWeight: 600, fontFamily: "'DM Sans', Inter, sans-serif" }}>
            {session.title}
          </h4>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[9px] uppercase tracking-[0.1em] border ${colors.bg} ${colors.text} ${colors.border}`} style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>
          {session.type}
        </span>
      </div>

      <div className="flex items-center justify-between">
        <p className="text-[11px] text-foreground/70" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>{session.instructor}</p>
        <span className={`text-[10px] ${slot.urgency === "full" ? "text-destructive" : slot.urgency === "low" ? "text-amber-600" : "text-muted-foreground"}`} style={{ fontWeight: 600, fontFamily: "'DM Sans', Inter, sans-serif" }}>
          {slot.urgency !== "full" && <><Users size={10} className="inline mr-0.5" />{session.enrolled}/{session.capacity} · </>}{slot.text}
        </span>
      </div>

      {!isPast && (
        <div className="mt-2 pt-2 border-t border-border/50 flex items-center justify-end">
          <span className="inline-flex items-center gap-1 text-terra text-[9px] tracking-[0.12em] uppercase" style={{ fontFamily: "'DM Sans', Inter, sans-serif" }}>
            Réserver <ArrowRight size={10} />
          </span>
        </div>
      )}
    </motion.button>
  );
}
