import { useState, useEffect, useMemo } from "react";
import { motion } from "framer-motion";
import { useTheme } from "next-themes";
import {
  TrendingUp,
  Users,
  Calendar,
  Ticket,
  BarChart3,
  Crown,
  Star,
  MessageCircle,
  Check,
  Clock,
  AlertCircle,
  DollarSign,
  UserPlus,
  UserMinus,
  Activity,
  AlertTriangle,
  Moon,
  Sun,
  Download,
} from "lucide-react";
import { adminCall } from "./AdminLayout";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import MeridianLogo from "@/components/brand/MeridianLogo";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { format, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, formatDistanceToNow } from "date-fns";
import { fr } from "date-fns/locale";
import { toast } from "sonner";

// ─────────────────────────────────────────────────────────────────

interface DashboardStats {
  totalSessions: number;
  totalCapacity: number;
  totalEnrolled: number;
  fillRate: number;
  weekBookings: number;
  bookingsToday: number;
  activePacks: number;
  revenueToday: number;
  revenueWeek: number;
  revenueMonth: number;
  packUsageWeek: number;
  noShowRate: number;
  cancelledCount: number;
  activeClients: number;
  newClients: number;
  returningClients: number;
  blackCardSales: number;
  shopSales: number;
  totalClients: number;
  churnRisk: Array<{ email: string; name: string; lastSeen: string; daysSince: number }>;
  dailyBookings: Array<{ date: string; count: number }>;
  coaches: string[];
  classTypes: string[];
  revenueByCoach: Array<{ coach: string; revenue: number }>;
  revenueByClassType: Array<{ classType: string; revenue: number }>;
  underperformingSessions: Array<{
    id: string;
    title: string;
    date: string;
    time: string;
    instructor: string;
    enrolled: number;
    capacity: number;
    fillRate: number;
  }>;
  bestSellingOffers: Array<{ label: string; sales: number; revenue: number; type: string }>;
}

interface Circler {
  email: string;
  name: string;
  phone: string | null;
  count: number;
  lastSeen: string;
}

interface TodaySession {
  id: string;
  title: string;
  time: string;
  date: string;
  capacity: number;
  instructor: string;
  participants: OpsParticipant[];
}

interface OpsParticipant {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  payment_status: string;
}

interface QuickSession {
  id: string;
  title: string;
  date: string;
  time: string;
  capacity: number;
  enrolled: number;
  instructor: string;
}

// ─────────────────────────────────────────────────────────────────

const WA_BASE = "https://wa.me/";
const fmt = (p: string | null) => (p || "").replace(/\D/g, "").replace(/^0/, "212");

function buildWAMsg(name: string, title: string, time: string) {
  return encodeURIComponent(
    `Bonjour ${name} 👋\nRappel pour votre séance *${title}* à *${time}* au Circle Studio !\nÀ tout à l'heure 🧘`,
  );
}
function buildWAMsgAll(participants: OpsParticipant[], title: string, time: string) {
  const names = participants.map((p) => p.name.split(" ")[0]).join(", ");
  return encodeURIComponent(
    `Bonjour à tous 👋\nRappel : *${title}* à *${time}* au Circle Studio — on vous attend !\n${names} 🙌`,
  );
}

function buildChurnWA(name: string) {
  return encodeURIComponent(
    `Bonjour ${name} 👋\nVous nous manquez au Circle Studio ! 🧘\nOn vous a réservé une offre spéciale — écrivez-nous pour en profiter ✨`,
  );
}

const medalEmoji = ["🥇", "🥈", "🥉"];
const medalColors = ["text-[hsl(var(--terra))]", "text-muted-foreground", "text-[hsl(var(--terra))]"];
const medalBgs = ["bg-terra/10", "bg-muted/40", "bg-terra/5"];

const fmtMAD = (v: number) => `${(v / 100).toLocaleString("fr-FR")} MAD`;
const fmtShortDate = (d: string) => {
  const dt = new Date(d);
  return dt.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
};

// ─────────────────────────────────────────────────────────────────

export function AdminDashboard({ onTabChange }: { onTabChange?: (tab: string) => void } = {}) {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [circlers, setCirclers] = useState<Circler[]>([]);
  const [today, setToday] = useState<TodaySession[]>([]);
  const [tomorrow, setTomorrow] = useState<TodaySession[]>([]);
  const [loading, setLoading] = useState(true);
  const [opsTab, setOpsTab] = useState<"today" | "tomorrow">("today");
  const [dateRange, setDateRange] = useState("7d");
  const [startDate, setStartDate] = useState(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState(new Date());
  const [allBookingsRaw, setAllBookingsRaw] = useState<any[]>([]);
  const [filterCoach, setFilterCoach] = useState<string>("all");
  const [filterClassType, setFilterClassType] = useState<string>("all");
  const [filterSegment, setFilterSegment] = useState<string>("all");
  const { theme, setTheme } = useTheme();
  const [quickSessions, setQuickSessions] = useState<QuickSession[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [waitlistPending, setWaitlistPending] = useState<any[]>([]);
  const [unpaidParticipants, setUnpaidParticipants] = useState<any[]>([]);
  const [wlExpandedId, setWlExpandedId] = useState<string | null>(null);
  const [paymentExpandedId, setPaymentExpandedId] = useState<string | null>(null);
  const [dashSessions, setDashSessions] = useState<QuickSession[]>([]);
  const [inlineLoading, setInlineLoading] = useState(false);
  const [showAnalytics, setShowAnalytics] = useState(false);

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];

    // Sessions query is fully independent — runs immediately, not blocked by other queries
    supabase
      .from("sessions")
      .select("*")
      .eq("is_active", true)
      .gte("date", todayStr)
      .order("date").order("time")
      .limit(20)
      .then(({ data, error }) => {
        if (error) console.warn("Sessions query error:", error);
        const rows = (data || []) as QuickSession[];
        setQuickSessions(rows);
        setDashSessions(rows);
      });

    // Other priority data — errors in one don't block others
    Promise.allSettled([
      supabase
        .from("code_creation_requests")
        .select("id,client_name,client_email,client_phone,offer_name,credits_total,payment_method,created_at")
        .eq("request_status", "pending")
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("waitlist")
        .select("id,client_name,client_email,client_phone,class_name,class_day,class_time,status,created_at")
        .in("status", ["pending", "contacted"])
        .order("created_at", { ascending: false })
        .limit(10),
      supabase
        .from("session_participants")
        .select("id,first_name,last_name,email,phone,payment_status,registered_at,session_id")
        .not("payment_status", "eq", "Payé")
        .order("registered_at", { ascending: false })
        .limit(15),
    ]).then(([requestsRes, waitlistRes, unpaidRes]) => {
      if (requestsRes.status === "fulfilled") setPendingRequests(requestsRes.value.data || []);
      if (waitlistRes.status === "fulfilled") setWaitlistPending(waitlistRes.value.data || []);
      if (unpaidRes.status === "fulfilled") setUnpaidParticipants(unpaidRes.value.data || []);
    });
  }, []);

  useEffect(() => {
    async function load() {
      setLoading(true);
      try {
        // 1. Stats
        const [statsRes, bookingsRes] = await Promise.all([
          adminCall({
            type: "dashboard_stats",
            startDate: startDate.toISOString(),
            endDate: endDate.toISOString(),
            coach: filterCoach === "all" ? null : filterCoach,
            classType: filterClassType === "all" ? null : filterClassType,
            segment: filterSegment,
          }),
          adminCall({ type: "bookings" }),
        ]);
        setStats(statsRes as any);
        const allBookings = bookingsRes.data || [];
        setAllBookingsRaw(allBookings);

        // 2. Build Circlers from bookings
        const map = new Map<string, Circler>();
        for (const b of allBookings) {
          const key = b.client_email?.toLowerCase().trim();
          if (!key) continue;
          const ex = map.get(key);
          if (!ex) {
            map.set(key, { email: key, name: b.client_name, phone: b.client_phone || null, count: 1, lastSeen: b.created_at });
          } else {
            ex.count++;
            if (b.created_at > ex.lastSeen) { ex.lastSeen = b.created_at; ex.name = b.client_name; }
          }
        }
        const { data: sp } = await supabase.from("session_participants").select("*").order("registered_at", { ascending: false });
        for (const p of sp || []) {
          const key = p.email?.toLowerCase().trim();
          if (!key) continue;
          const name = `${p.first_name} ${p.last_name}`.trim();
          const ex = map.get(key);
          if (!ex) map.set(key, { email: key, name, phone: p.phone || null, count: 1, lastSeen: p.registered_at });
          else { ex.count++; if (!ex.phone && p.phone) ex.phone = p.phone; }
        }
        setCirclers([...map.values()].sort((a, b) => b.count - a.count));

        // 3. Ops view
        const todayStr = new Date().toISOString().split("T")[0];
        const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
        const { data: sessions } = await supabase.from("sessions").select("*").in("date", [todayStr, tomorrowStr]).eq("is_active", true).order("time");

        const buildOps = async (dateStr: string): Promise<TodaySession[]> => {
          const daySessions = (sessions || []).filter((s) => s.date === dateStr);
          return Promise.all(
            daySessions.map(async (s) => {
              const { data: parts } = await supabase.from("session_participants").select("*").eq("session_id", s.id);
              return {
                id: s.id, title: s.title, time: s.time, date: s.date, capacity: s.capacity, instructor: s.instructor,
                participants: (parts || []).map((p) => ({ id: p.id, name: `${p.first_name} ${p.last_name}`.trim(), email: p.email, phone: p.phone || null, payment_status: p.payment_status })),
              };
            }),
          );
        };
        const [td, tm] = await Promise.all([buildOps(todayStr), buildOps(tomorrowStr)]);
        setToday(td);
        setTomorrow(tm);
      } catch (err) {
        console.error("Dashboard error:", err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [startDate, endDate, filterCoach, filterClassType, filterSegment]);

  const topCirclers = useMemo(() => circlers.slice(0, 10), [circlers]);
  const top3 = useMemo(() => circlers.slice(0, 3), [circlers]);
  const opsData = opsTab === "today" ? today : tomorrow;
  const opsLabel = opsTab === "today" ? "Aujourd'hui" : "Demain";

  useEffect(() => {
    if (!stats) return;
    if (filterCoach !== "all" && !stats.coaches.includes(filterCoach)) {
      setFilterCoach("all");
    }
    if (filterClassType !== "all" && !stats.classTypes.includes(filterClassType)) {
      setFilterClassType("all");
    }
  }, [stats, filterCoach, filterClassType]);

  const filteredBookings = useMemo(
    () => allBookingsRaw.filter((b) => b.created_at >= startDate.toISOString() && b.created_at <= endDate.toISOString()),
    [allBookingsRaw, startDate, endDate],
  );

  const bookingsByDay = useMemo(() => {
    const map: Record<string, number> = {};
    filteredBookings.forEach((b) => {
      const day = format(new Date(b.created_at), "yyyy-MM-dd");
      map[day] = (map[day] || 0) + 1;
    });
    return map;
  }, [filteredBookings]);

  const acquisitionData = useMemo(() => {
    if (!allBookingsRaw.length) return { newUsers: 0, returningUsers: 0 };
    const firstBookingMap = new Map<string, string>();
    [...allBookingsRaw]
      .sort((a, b) => a.created_at.localeCompare(b.created_at))
      .forEach((b) => {
        const email = (b.client_email || "").toLowerCase();
        if (email && !firstBookingMap.has(email)) firstBookingMap.set(email, b.created_at);
      });

    const newUsers = Array.from(firstBookingMap.values()).filter(
      (first) => first >= startDate.toISOString() && first <= endDate.toISOString(),
    ).length;

    const periodUnique = new Set(filteredBookings.map((b) => (b.client_email || "").toLowerCase()).filter(Boolean));
    return { newUsers, returningUsers: Math.max(0, periodUnique.size - newUsers) };
  }, [allBookingsRaw, filteredBookings, startDate, endDate]);

  const retentionCandidates = useMemo(() => {
    const phoneByEmail = new Map(circlers.map((c) => [c.email, c.phone] as const));
    const source = stats?.churnRisk || [];
    return source.slice(0, 10).map((c) => ({ ...c, phone: phoneByEmail.get(c.email) || null }));
  }, [stats, circlers]);

  const periodMetrics = useMemo(() => {
    const totalBookings = filteredBookings.length;
    const avgPerDay = dateRange === "7d" ? totalBookings / 7 : dateRange === "30d" ? totalBookings / 30 : dateRange === "90d" ? totalBookings / 90 : totalBookings / Math.max(1, Object.keys(bookingsByDay).length);
    return {
      totalBookings,
      avgPerDay,
      churnRiskCount: stats?.churnRisk.length || 0,
      activeClients: stats?.activeClients || 0,
      revenueMonth: stats?.revenueMonth || 0,
    };
  }, [filteredBookings, dateRange, bookingsByDay, stats]);

  const handleDateRangeChange = (value: string) => {
    setDateRange(value);
    const now = new Date();
    switch (value) {
      case "7d":
        setStartDate(subDays(now, 7));
        setEndDate(now);
        break;
      case "30d":
        setStartDate(subDays(now, 30));
        setEndDate(now);
        break;
      case "90d":
        setStartDate(subDays(now, 90));
        setEndDate(now);
        break;
      case "week":
        setStartDate(startOfWeek(now, { weekStartsOn: 1 }));
        setEndDate(endOfWeek(now, { weekStartsOn: 1 }));
        break;
      case "month":
        setStartDate(startOfMonth(now));
        setEndDate(endOfMonth(now));
        break;
      default:
        break;
    }
  };

  const sendRetentionMessage = (name: string, phone?: string | null) => {
    if (!phone) return;
    const firstName = name.split(" ")[0];
    const message = encodeURIComponent(
      `Bonjour ${firstName}, ça fait un moment qu'on ne vous a pas vu ! 🎯 On vous offre -20% sur votre prochain cours avec le code COMEBACK20. À très vite ! 💪`,
    );
    window.open(`${WA_BASE}${fmt(phone)}?text=${message}`, "_blank");
  };

  const registerWaitlistClient = async (entry: any, session: QuickSession) => {
    setInlineLoading(true);
    try {
      const nameParts = (entry.client_name || "").trim().split(" ");
      const { error } = await supabase.from("session_participants").insert({
        session_id: session.id,
        first_name: nameParts[0] || entry.client_name,
        last_name: nameParts.slice(1).join(" ") || "—",
        email: entry.client_email,
        phone: entry.client_phone || null,
        payment_status: "En attente",
        notes: `Reprogrammé depuis liste d'attente (${entry.class_name})`,
        registered_at: new Date().toISOString(),
      });
      if (error) throw error;
      const { data: sesRow } = await supabase.from("sessions").select("enrolled").eq("id", session.id).single();
      await supabase.from("sessions").update({ enrolled: (sesRow?.enrolled ?? 0) + 1 }).eq("id", session.id);
      await supabase.from("waitlist").update({ status: "confirmed" }).eq("id", entry.id);
      setWaitlistPending(p => p.filter(w => w.id !== entry.id));
      setWlExpandedId(null);
      toast.success(`${entry.client_name} inscrit à "${session.title}" ✓`);
    } catch (err: any) {
      toast.error(`Erreur : ${err?.message ?? err}`);
    } finally {
      setInlineLoading(false);
    }
  };

  const updateParticipantPayment = async (pid: string, status: string) => {
    await supabase.from("session_participants").update({ payment_status: status }).eq("id", pid);
    setUnpaidParticipants(p =>
      status === "Payé" ? p.filter(x => x.id !== pid) : p.map(x => x.id === pid ? { ...x, payment_status: status } : x)
    );
  };

  const approveCodeRequest = async (rid: string) => {
    await supabase.from("code_creation_requests").update({ request_status: "processing" }).eq("id", rid);
    setPendingRequests(p => p.filter(r => r.id !== rid));
    toast.success("Demande marquée en traitement — finalisez dans l'onglet Packs.");
    if (typeof onTabChange === "function") onTabChange("packs");
  };

  const exportQuickSessionsCSV = () => {
    const todayStr = new Date().toISOString().split("T")[0];
    const tomorrowStr = new Date(Date.now() + 86400000).toISOString().split("T")[0];
    const dayLabel = (d: string) => d === todayStr ? "Aujourd'hui" : "Demain";
    const header = ["Jour", "Date", "Heure", "Titre", "Instructeur", "Inscrits", "Capacité", "Remplissage (%)"];
    const rows = quickSessions.map((s) => [
      dayLabel(s.date),
      s.date,
      s.time,
      s.title,
      s.instructor,
      String(s.enrolled),
      String(s.capacity),
      s.capacity > 0 ? String(Math.round((s.enrolled / s.capacity) * 100)) : "0",
    ]);
    const csv = [header, ...rows].map((r) => r.map((v) => `"${v}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `seances-2jours-${todayStr}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  if (loading)
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-6 h-6 border-2 border-terra border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      {/* ── PRIORITY BLOCK ─────────────────────────── */}
      <div className="mb-8 space-y-5">
        <div className="flex items-center justify-between">
          <div>
            <p className="font-body text-[10px] tracking-[0.4em] uppercase text-terra mb-1" style={{ fontWeight: 500 }}>Actions prioritaires</p>
            <h2 className="font-display text-foreground text-xl" style={{ fontWeight: 300 }}>À traiter maintenant</h2>
          </div>
          <button
            onClick={() => {
              const csv = ["Date,Heure,Cours,Coach,Inscrits,Capacité,Taux"].concat(
                quickSessions.map(s => `${s.date},${s.time},"${s.title}","${s.instructor}",${s.enrolled},${s.capacity},${Math.round(s.enrolled/s.capacity*100)}%`)
              ).join("\n");
              const a = document.createElement("a");
              a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
              a.download = "seances-48h.csv";
              a.click();
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full border border-border text-muted-foreground hover:border-terra/40 hover:text-terra font-body text-[10px] tracking-[0.2em] uppercase transition-colors"
          >
            <Download size={11} /> Export CSV
          </button>
        </div>

        {/* Pending black card requests */}
        {pendingRequests.length > 0 && (
          <div className="rounded-2xl border-2 border-red-600/50 bg-red-600/[0.06] overflow-hidden">
            <div className="px-5 py-3 border-b border-red-600/20 flex items-center gap-3 bg-red-600/10">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-red-500 font-semibold">
                ⚠ {pendingRequests.length} Carte{pendingRequests.length > 1 ? "s" : ""} Black en attente
              </p>
            </div>
            <div className="divide-y divide-red-600/10">
              {pendingRequests.map(r => (
                <div key={r.id} className="px-5 py-3 flex items-center gap-4 border-l-4 border-l-red-500">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[13px] text-foreground font-semibold">{r.client_name || "Client"}</p>
                    <p className="font-body text-[11px] text-terra">{r.offer_name || "Pack"} · {r.credits_total} crédit{r.credits_total > 1 ? "s" : ""}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{r.client_email}{r.client_phone ? ` · ${r.client_phone}` : ""}</p>
                  </div>
                  <button
                    onClick={() => approveCodeRequest(r.id)}
                    className="px-3 py-1.5 rounded-full bg-red-500 text-white font-body text-[10px] tracking-[0.15em] uppercase hover:bg-red-600 transition-colors shrink-0"
                  >
                    Valider →
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waitlist to handle */}
        {waitlistPending.length > 0 && (
          <div className="rounded-2xl border-2 border-amber-500/50 bg-amber-500/[0.06] overflow-hidden">
            <div className="px-5 py-3 border-b border-amber-500/20 flex items-center gap-3 bg-amber-500/10">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-amber-600 font-semibold">
                {waitlistPending.length} Liste{waitlistPending.length > 1 ? "s" : ""} d'attente à inscrire
              </p>
            </div>
            <div className="divide-y divide-amber-500/10">
              {waitlistPending.slice(0, 5).map(w => (
                <div key={w.id}>
                  <div className="px-5 py-3 flex items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="font-body text-[13px] text-foreground font-semibold">{w.client_name}</p>
                      <p className="font-body text-[11px] text-muted-foreground">{w.class_name} · {w.class_day}{w.class_time && w.class_time !== "—" ? ` · ${w.class_time}` : ""}</p>
                      <span className={`font-body text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full ${w.status === "contacted" ? "bg-sky-500/15 text-sky-600" : "bg-amber-500/15 text-amber-600"}`}>
                        {w.status === "contacted" ? "Contacté" : "En attente"}
                      </span>
                    </div>
                    <button
                      onClick={() => setWlExpandedId(wlExpandedId === w.id ? null : w.id)}
                      className={`px-3 py-1.5 rounded-full font-body text-[10px] tracking-[0.15em] uppercase transition-colors shrink-0 ${wlExpandedId === w.id ? "bg-amber-500 text-white" : "border border-amber-500/40 text-amber-600 hover:bg-amber-500/10"}`}
                    >
                      {wlExpandedId === w.id ? "Fermer ↑" : "Inscrire ↓"}
                    </button>
                  </div>
                  {wlExpandedId === w.id && (
                    <div className="px-5 pb-4 bg-amber-500/5">
                      <p className="font-body text-[9px] tracking-[0.25em] uppercase text-amber-600 mb-2" style={{ fontWeight: 600 }}>Choisir une séance</p>
                      <div className="space-y-1.5 max-h-52 overflow-y-auto">
                        {dashSessions.map(s => {
                          const isFull = s.capacity > 0 && (s.enrolled ?? 0) >= s.capacity;
                          return (
                            <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-card border border-border">
                              <div className="flex-1 min-w-0">
                                <p className="font-body text-[12px] text-foreground font-medium">{s.title}</p>
                                <p className="font-body text-[10px] text-muted-foreground">
                                  {new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })} · {(s.time || "").slice(0, 5)} · {s.instructor}
                                </p>
                              </div>
                              <span className={`font-body text-[9px] px-2 py-0.5 rounded-full shrink-0 ${isFull ? "bg-destructive/10 text-destructive" : "bg-terra/10 text-terra"}`}>
                                {s.capacity ? `${s.enrolled ?? 0}/${s.capacity}` : "—"}
                              </span>
                              <button
                                onClick={() => registerWaitlistClient(w, s)}
                                disabled={inlineLoading}
                                className="shrink-0 px-3 py-1.5 rounded-full bg-terra text-warm-white font-body text-[9px] tracking-[0.1em] uppercase hover:bg-terra/90 transition-colors disabled:opacity-50"
                              >
                                Inscrire
                              </button>
                            </div>
                          );
                        })}
                        {dashSessions.length === 0 && (
                          <p className="font-body text-[11px] text-muted-foreground text-center py-3">Aucune séance à venir chargée</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Unpaid participants */}
        {unpaidParticipants.length > 0 && (
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <div className="px-5 py-3 border-b border-border flex items-center gap-3">
              <AlertTriangle size={13} className="text-muted-foreground" />
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground font-semibold">
                {unpaidParticipants.length} Paiement{unpaidParticipants.length > 1 ? "s" : ""} en attente
              </p>
            </div>
            <div className="divide-y divide-border">
              {unpaidParticipants.slice(0, 5).map(p => (
                <div key={p.id} className="px-5 py-3 flex items-center gap-3 flex-wrap">
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[13px] text-foreground font-semibold">{p.first_name} {p.last_name}</p>
                    <p className="font-body text-[11px] text-muted-foreground">{p.email}</p>
                  </div>
                  <select
                    defaultValue={p.payment_status || "En attente"}
                    onChange={ev => updateParticipantPayment(p.id, ev.target.value)}
                    className="px-3 py-1.5 rounded-full border border-border bg-card font-body text-[10px] tracking-widest uppercase text-foreground focus:border-terra outline-none cursor-pointer shrink-0"
                    style={{ fontWeight: 500 }}
                  >
                    <option value="En attente">En attente</option>
                    <option value="Sur place">Sur place</option>
                    <option value="Pack">Pack</option>
                    <option value="Payé">Payé ✓</option>
                    <option value="Annulé">Annulé</option>
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Prochaines séances — compact rows */}
        <div className="rounded-2xl border border-border bg-card overflow-hidden">
          <div className="px-4 py-2.5 border-b border-border flex items-center justify-between">
            <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 500 }}>
              Prochaines séances
            </p>
            <button
              onClick={() => typeof onTabChange === "function" && onTabChange("planning")}
              className="font-body text-[9px] tracking-[0.15em] uppercase text-terra hover:underline"
            >
              Voir planning →
            </button>
          </div>
          {quickSessions.length === 0 ? (
            <p className="font-body text-muted-foreground text-sm text-center py-5">Aucune séance programmée à venir.</p>
          ) : (
            <div className="divide-y divide-border">
              {quickSessions.slice(0, 10).map(s => {
                const pct = s.capacity > 0 ? Math.round(s.enrolled / s.capacity * 100) : 0;
                const statusColor = pct >= 100 ? "#B8634A" : pct >= 70 ? "#C09A5E" : "#4A8B6A";
                const todayStr = new Date().toISOString().slice(0, 10);
                const tomorrowStr = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
                const dayTag = s.date === todayStr ? "Auj" : s.date === tomorrowStr ? "Dem" : new Date(s.date + "T12:00:00").toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
                return (
                  <div key={s.id} className="flex items-center gap-3 px-4 py-2 hover:bg-secondary/40 transition-colors">
                    <span className="font-body text-[10px] text-muted-foreground w-7 shrink-0">{dayTag}</span>
                    <span className="font-body text-[11px] font-bold text-terra w-10 shrink-0">{s.time.slice(0, 5)}</span>
                    <span className="font-body text-[12px] text-foreground flex-1 truncate">{s.title}</span>
                    <span className="font-body text-[10px] text-muted-foreground truncate hidden sm:block w-20 shrink-0">{s.instructor}</span>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <div className="w-16 h-1 bg-secondary rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${Math.min(100, pct)}%`, background: statusColor }} />
                      </div>
                      <span className="font-body text-[10px] w-8 text-right" style={{ color: statusColor, fontWeight: 600 }}>{s.enrolled}/{s.capacity}</span>
                    </div>
                    <span className="font-body text-[9px] px-1.5 py-0.5 rounded-full shrink-0" style={{
                      background: pct >= 100 ? "rgba(184,99,74,0.15)" : pct >= 70 ? "rgba(192,154,94,0.15)" : "rgba(74,139,106,0.15)",
                      color: statusColor, fontWeight: 600,
                    }}>
                      {pct >= 100 ? "Complet" : pct >= 70 ? "~Plein" : "Dispo"}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {stats && (
        <div className="bg-card border border-border rounded-2xl p-4 flex flex-col md:flex-row gap-3 md:items-end md:justify-between">
          <div>
            <p className="font-body text-[9px] tracking-[0.35em] uppercase text-muted-foreground" style={{ fontWeight: 400 }}>Filtres business</p>
            <p className="font-body text-[12px] text-muted-foreground mt-1">Tous les KPI et widgets se recalculent selon les filtres ci-dessous.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2">
            <Select value={filterCoach} onValueChange={setFilterCoach}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Coach" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les coachs</SelectItem>
                {stats.coaches.map((c) => (<SelectItem key={c} value={c}>{c}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterClassType} onValueChange={setFilterClassType}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Type" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les types</SelectItem>
                {stats.classTypes.map((t) => (<SelectItem key={t} value={t}>{t}</SelectItem>))}
              </SelectContent>
            </Select>
            <Select value={filterSegment} onValueChange={setFilterSegment}>
              <SelectTrigger className="w-[180px]"><SelectValue placeholder="Segment" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous segments</SelectItem>
                <SelectItem value="acquisition">Acquisition</SelectItem>
                <SelectItem value="retention">Rétention</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" className="w-[180px] justify-between" onClick={() => setTheme(theme === "dark" ? "light" : "dark")}>
              {theme === "dark" ? "Mode clair" : "Mode sombre"}
              {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
            </Button>
          </div>
        </div>
      )}

      {/* ── KPIs compacts ── */}
      {stats && (
        <>
          <div className="grid grid-cols-3 lg:grid-cols-6 gap-2">
            {[
              { icon: DollarSign, label: "CA mois", value: fmtMAD(stats.revenueMonth), accent: true },
              { icon: DollarSign, label: "CA semaine", value: fmtMAD(stats.revenueWeek), accent: true },
              { icon: BarChart3, label: "Remplissage", value: `${stats.fillRate}%`, sub: `${stats.totalEnrolled}/${stats.totalCapacity}`, accent: false },
              { icon: Calendar, label: "Résa aujourd'hui", value: stats.bookingsToday, accent: false },
              { icon: Ticket, label: "Packs actifs", value: stats.activePacks, accent: true },
              { icon: Users, label: "Clients actifs", value: stats.activeClients, accent: false },
            ].map(({ icon: Icon, label, value, sub, accent }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.03 }}
                className="bg-card border border-border p-3 rounded-xl"
              >
                <Icon size={12} className={`mb-1.5 ${accent ? "text-terra" : "text-muted-foreground"}`} />
                <p className={`font-display text-lg leading-none ${accent ? "text-terra" : "text-foreground"}`} style={{ fontWeight: 300 }}>{value}</p>
                {sub && <p className="font-body text-[9px] text-muted-foreground/60 mt-0.5">{sub}</p>}
                <p className="font-body text-[9px] tracking-[0.15em] uppercase text-muted-foreground mt-1" style={{ fontWeight: 300 }}>{label}</p>
              </motion.div>
            ))}
          </div>

          {/* ── Analytiques (repliable) ── */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button
              onClick={() => setShowAnalytics(v => !v)}
              className="w-full flex items-center justify-between px-5 py-3 hover:bg-secondary/40 transition-colors"
            >
              <div className="flex items-center gap-2">
                <BarChart3 size={13} className="text-muted-foreground" />
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 500 }}>Analytiques & rétention</p>
              </div>
              <span className="font-body text-[10px] text-muted-foreground">{showAnalytics ? "Réduire ↑" : "Voir ↓"}</span>
            </button>

            {showAnalytics && (
              <div className="border-t border-border p-5 space-y-5">
                {/* Segmentation + 7j chart */}
                <div className="grid lg:grid-cols-2 gap-4">
                  <div>
                    <p className="font-body text-[9px] tracking-[0.4em] uppercase text-muted-foreground mb-3" style={{ fontWeight: 400 }}>Segmentation clients (30j)</p>
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      {[
                        { icon: UserPlus, label: "Nouveaux", value: stats.newClients, color: "text-terra", bg: "bg-terra/10" },
                        { icon: Users, label: "Fidèles", value: stats.returningClients, color: "text-foreground", bg: "bg-secondary" },
                        { icon: UserMinus, label: "À risque", value: stats.churnRisk.length, color: "text-destructive", bg: "bg-destructive/10" },
                      ].map(({ icon: Icon, label, value, color, bg }) => (
                        <div key={label} className={`text-center p-2.5 ${bg} rounded-xl`}>
                          <Icon size={13} className={`${color} mx-auto mb-1`} />
                          <p className={`font-display text-xl ${color}`} style={{ fontWeight: 300 }}>{value}</p>
                          <p className="font-body text-[9px] text-muted-foreground mt-0.5" style={{ fontWeight: 300 }}>{label}</p>
                        </div>
                      ))}
                    </div>
                    <div className="flex justify-between font-body text-[10px] text-muted-foreground mb-1">
                      <span>Clients actifs</span><span>{stats.activeClients}/{stats.totalClients}</span>
                    </div>
                    <Progress value={stats.totalClients > 0 ? Math.round((stats.activeClients / stats.totalClients) * 100) : 0} className="h-1.5" />
                  </div>

                  <div>
                    <p className="font-body text-[9px] tracking-[0.4em] uppercase text-muted-foreground mb-3" style={{ fontWeight: 400 }}>Réservations — 7 derniers jours</p>
                    <div className="h-[120px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.dailyBookings}>
                          <XAxis dataKey="date" tickFormatter={fmtShortDate} tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis hide allowDecimals={false} />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} labelFormatter={fmtShortDate} formatter={(v: number) => [v, "Réservations"]} />
                          <Bar dataKey="count" fill="hsl(var(--terra))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Revenue charts */}
                <div className="grid lg:grid-cols-2 gap-4">
                  <div>
                    <p className="font-body text-[9px] tracking-[0.4em] uppercase text-muted-foreground mb-3" style={{ fontWeight: 400 }}>Revenu par coach</p>
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.revenueByCoach || []}>
                          <XAxis dataKey="coach" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [fmtMAD(v), "Revenu"]} />
                          <Bar dataKey="revenue" fill="hsl(var(--terra))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div>
                    <p className="font-body text-[9px] tracking-[0.4em] uppercase text-muted-foreground mb-3" style={{ fontWeight: 400 }}>Revenu par type de cours</p>
                    <div className="h-[140px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={stats.revenueByClassType || []}>
                          <XAxis dataKey="classType" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis hide />
                          <Tooltip contentStyle={{ backgroundColor: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "8px", fontSize: "12px" }} formatter={(v: number) => [fmtMAD(v), "Revenu"]} />
                          <Bar dataKey="revenue" fill="hsl(var(--foreground))" radius={[4, 4, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>

                {/* Acquisition & rétention tabs */}
                <div>
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-3">
                    <p className="font-body text-[9px] tracking-[0.35em] uppercase text-muted-foreground" style={{ fontWeight: 400 }}>Acquisition & rétention</p>
                    <Select value={dateRange} onValueChange={handleDateRangeChange}>
                      <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Période" /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="7d">7 derniers jours</SelectItem>
                        <SelectItem value="30d">30 derniers jours</SelectItem>
                        <SelectItem value="90d">90 derniers jours</SelectItem>
                        <SelectItem value="week">Cette semaine</SelectItem>
                        <SelectItem value="month">Ce mois</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <Tabs defaultValue="overview" className="space-y-3">
                    <TabsList className="grid grid-cols-4 w-full">
                      <TabsTrigger value="overview">Vue</TabsTrigger>
                      <TabsTrigger value="acquisition">Acquisition</TabsTrigger>
                      <TabsTrigger value="retention">Rétention</TabsTrigger>
                      <TabsTrigger value="performance">Perf</TabsTrigger>
                    </TabsList>
                    <TabsContent value="overview" className="space-y-3">
                      <div className="grid md:grid-cols-2 gap-3">
                        <div className="bg-secondary rounded-xl p-3 border border-border"><p className="font-body text-[10px] text-muted-foreground">Réservations période</p><p className="font-display text-2xl text-foreground" style={{ fontWeight: 300 }}>{periodMetrics.totalBookings}</p></div>
                        <div className="bg-secondary rounded-xl p-3 border border-border"><p className="font-body text-[10px] text-muted-foreground">Moy. / jour</p><p className="font-display text-2xl text-foreground" style={{ fontWeight: 300 }}>{periodMetrics.avgPerDay.toFixed(1)}</p></div>
                      </div>
                    </TabsContent>
                    <TabsContent value="acquisition" className="space-y-3">
                      <div className="grid md:grid-cols-3 gap-3">
                        <div className="bg-secondary rounded-xl p-3 border border-border"><p className="text-[10px] text-muted-foreground">Nouveaux</p><p className="font-display text-2xl text-terra">{acquisitionData.newUsers}</p></div>
                        <div className="bg-secondary rounded-xl p-3 border border-border"><p className="text-[10px] text-muted-foreground">Récurrents</p><p className="font-display text-2xl text-foreground">{acquisitionData.returningUsers}</p></div>
                        <div className="bg-secondary rounded-xl p-3 border border-border"><p className="text-[10px] text-muted-foreground">Ratio retour</p><p className="font-display text-2xl text-foreground">{acquisitionData.newUsers > 0 ? ((acquisitionData.returningUsers / acquisitionData.newUsers) * 100).toFixed(0) : 0}%</p></div>
                      </div>
                    </TabsContent>
                    <TabsContent value="retention" className="space-y-2">
                      <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-foreground">Clients à réactiver</p>
                        <Badge variant="outline" className="text-destructive border-destructive/30">{retentionCandidates.length} à risque</Badge>
                      </div>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {retentionCandidates.map((c) => (
                          <div key={c.email} className="p-2.5 rounded-xl border border-border bg-secondary flex items-center justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-sm text-foreground truncate">{c.name}</p>
                              <p className="text-[11px] text-muted-foreground">{formatDistanceToNow(new Date(c.lastSeen), { addSuffix: true, locale: fr })}</p>
                            </div>
                            <Button size="sm" variant="outline" disabled={!c.phone} onClick={() => sendRetentionMessage(c.name, c.phone)}>
                              <MessageCircle size={12} className="mr-1" /> WA
                            </Button>
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    <TabsContent value="performance" className="space-y-3">
                      <div className="grid md:grid-cols-3 gap-3">
                        <div className="bg-secondary rounded-xl p-3 border border-border"><p className="text-[10px] text-muted-foreground">CA mois</p><p className="font-display text-2xl text-terra">{fmtMAD(periodMetrics.revenueMonth)}</p></div>
                        <div className="bg-secondary rounded-xl p-3 border border-border"><p className="text-[10px] text-muted-foreground">Clients actifs</p><p className="font-display text-2xl text-foreground">{periodMetrics.activeClients}</p></div>
                        <div className="bg-secondary rounded-xl p-3 border border-border"><p className="text-[10px] text-muted-foreground">Churn risk</p><p className="font-display text-2xl text-destructive">{periodMetrics.churnRiskCount}</p></div>
                      </div>
                      <div className="grid lg:grid-cols-2 gap-3">
                        <div className="bg-card border border-border rounded-xl p-3">
                          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Séances sous-performantes</p>
                          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                            {(stats.underperformingSessions || []).length === 0 ? (
                              <p className="text-[12px] text-muted-foreground">Aucune séance critique.</p>
                            ) : (stats.underperformingSessions || []).map((s) => (
                              <div key={s.id} className="bg-secondary border border-border rounded-lg p-2.5">
                                <p className="text-sm text-foreground">{s.title}</p>
                                <p className="text-[11px] text-muted-foreground">{fmtShortDate(s.date)} · {s.instructor}</p>
                                <p className="text-[11px] text-destructive">{s.enrolled}/{s.capacity} — {s.fillRate}%</p>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div className="bg-card border border-border rounded-xl p-3">
                          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Offres les plus vendues</p>
                          <div className="space-y-1.5 max-h-[180px] overflow-y-auto">
                            {(stats.bestSellingOffers || []).length === 0 ? (
                              <p className="text-[12px] text-muted-foreground">Pas encore de ventes.</p>
                            ) : (stats.bestSellingOffers || []).map((o) => (
                              <div key={`${o.type}-${o.label}`} className="bg-secondary border border-border rounded-lg p-2.5 flex items-center justify-between gap-2">
                                <div><p className="text-sm text-foreground">{o.label}</p><p className="text-[11px] text-muted-foreground">{o.type === "pack" ? "Pack" : "Boutique"}</p></div>
                                <div className="text-right shrink-0"><p className="text-sm text-foreground">{o.sales}×</p><p className="text-[11px] text-terra">{fmtMAD(o.revenue || 0)}</p></div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    </TabsContent>
                  </Tabs>
                </div>

                {/* Churn risk */}
                {stats.churnRisk.length > 0 && (
                  <div className="rounded-xl border border-destructive/20 overflow-hidden">
                    <div className="px-4 py-2.5 border-b border-border flex items-center justify-between bg-destructive/5">
                      <div className="flex items-center gap-2">
                        <AlertTriangle size={12} className="text-destructive" />
                        <p className="font-body text-[10px] tracking-[0.3em] uppercase text-destructive" style={{ fontWeight: 400 }}>Clients à risque de churn</p>
                      </div>
                      <span className="font-body text-[10px] text-muted-foreground">{stats.churnRisk.length}</span>
                    </div>
                    <div className="divide-y divide-border max-h-[200px] overflow-y-auto">
                      {stats.churnRisk.map((c) => (
                        <div key={c.email} className="px-4 py-2.5 flex items-center gap-3 hover:bg-secondary/40 transition-colors">
                          <div className="w-7 h-7 rounded-full bg-destructive/10 flex items-center justify-center shrink-0">
                            <span className="font-display text-xs text-destructive">{c.name[0]?.toUpperCase()}</span>
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-body text-[12px] text-foreground truncate" style={{ fontWeight: 500 }}>{c.name}</p>
                            <p className="font-body text-[10px] text-muted-foreground">{c.email}</p>
                          </div>
                          <span className="font-body text-[10px] text-destructive shrink-0">{c.daysSince}j</span>
                          <a href={c.email ? `mailto:${c.email}` : "#"} target="_blank" rel="noopener noreferrer"
                            className="w-6 h-6 bg-[#25D366]/10 rounded-full flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors shrink-0">
                            <MessageCircle size={10} />
                          </a>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TWO columns: Circlers + Ops ── */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* ── CIRCLERS community ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="bg-card border border-border rounded-2xl overflow-hidden">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-3">
              <MeridianLogo size={28} variant="sand" animate spinDuration={10} />
              <div>
                <p className="font-display text-base text-foreground" style={{ fontWeight: 400 }}>Circlers</p>
                <p className="font-body text-[9px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 300 }}>Notre communauté</p>
              </div>
            </div>
            <span className="font-display text-2xl text-terra" style={{ fontWeight: 300 }}>{circlers.length}</span>
          </div>

          <div className="px-6 py-4 bg-terra/3 border-b border-border">
            <p className="font-body text-[9px] tracking-[0.4em] uppercase text-terra mb-3 flex items-center gap-2" style={{ fontWeight: 600 }}>
              <Crown size={11} /> Top 3 Circlers du mois
            </p>
            <div className="space-y-2">
              {top3.map((c, i) => (
                <div key={c.email} className={`flex items-center gap-3 p-2.5 rounded-xl ${medalBgs[i]}`}>
                  <span className="text-lg">{medalEmoji[i]}</span>
                  <div className="w-8 h-8 rounded-full bg-card flex items-center justify-center border border-border shrink-0">
                    <span className={`font-display text-sm ${medalColors[i]}`} style={{ fontWeight: 400 }}>{c.name[0]?.toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-body text-[12px] text-foreground font-medium truncate">{c.name}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{c.email}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-display text-lg ${medalColors[i]}`} style={{ fontWeight: 300 }}>{c.count}</p>
                    <p className="font-body text-[9px] text-muted-foreground">séances</p>
                  </div>
                  {c.phone && (
                    <a href={`${WA_BASE}${fmt(c.phone)}?text=${buildWAMsg(c.name, "séance", "")}`} target="_blank" rel="noopener noreferrer"
                      className="w-7 h-7 bg-[#25D366]/10 rounded-full flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors shrink-0">
                      <MessageCircle size={12} />
                    </a>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="divide-y divide-border max-h-[280px] overflow-y-auto">
            {topCirclers.slice(3).map((c) => (
              <div key={c.email} className="px-6 py-3 flex items-center gap-3 hover:bg-secondary/40 transition-colors">
                <div className="w-8 h-8 rounded-full bg-terra/10 flex items-center justify-center shrink-0">
                  <span className="font-display text-sm text-terra" style={{ fontWeight: 400 }}>{c.name[0]?.toUpperCase()}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13px] text-foreground font-medium truncate">{c.name}</p>
                  <p className="font-body text-[10px] text-muted-foreground truncate">{c.email}</p>
                </div>
                <span className="font-display text-base text-muted-foreground" style={{ fontWeight: 300 }}>{c.count}</span>
                {c.phone && (
                  <a href={`${WA_BASE}${fmt(c.phone)}?text=${buildWAMsg(c.name, "séance", "")}`} target="_blank" rel="noopener noreferrer"
                    className="w-7 h-7 bg-[#25D366]/10 rounded-full flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors shrink-0">
                    <MessageCircle size={12} />
                  </a>
                )}
              </div>
            ))}
            {topCirclers.length === 0 && (
              <div className="px-6 py-8 text-center">
                <p className="font-body text-[13px] text-muted-foreground" style={{ fontWeight: 300 }}>Aucun circler pour l'instant</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* ── OPS J / J+1 ── */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }} className="bg-card border border-border rounded-2xl overflow-hidden flex flex-col">
          <div className="px-6 py-4 border-b border-border flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock size={14} className="text-terra" />
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 300 }}>Opérationnel</p>
            </div>
            <div className="flex gap-1 bg-secondary rounded-full p-0.5">
              {(["today", "tomorrow"] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => setOpsTab(t)}
                  className={`font-body text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full transition-all ${opsTab === t ? "bg-terra text-warm-white" : "text-muted-foreground hover:text-foreground"}`}
                  style={{ fontWeight: 500 }}
                >
                  {t === "today" ? "Aujourd'hui" : "Demain"}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto max-h-[480px]">
            {opsData.length === 0 ? (
              <div className="px-6 py-12 text-center">
                <MeridianLogo size={36} variant="sand" animate className="mx-auto mb-3 opacity-30" />
                <p className="font-body text-[13px] text-muted-foreground">Aucune session {opsLabel.toLowerCase()}</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {opsData.map((session) => {
                  const paid = session.participants.filter(p => ["Payé", "paid", "pack"].includes(p.payment_status));
                  const unpaid = session.participants.filter(p => !["Payé", "paid", "pack"].includes(p.payment_status));
                  return (
                    <div key={session.id} className="px-5 py-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-body text-[13px] font-bold text-terra">{session.time}</span>
                            <span className="font-display text-[15px] text-foreground" style={{ fontWeight: 400 }}>{session.title}</span>
                          </div>
                          <p className="font-body text-[11px] text-muted-foreground">{session.instructor} · {session.participants.length}/{session.capacity}</p>
                        </div>
                        {session.participants.length > 0 && (
                          <a href={`${WA_BASE}?text=${buildWAMsgAll(session.participants, session.title, session.time)}`} target="_blank" rel="noopener noreferrer"
                            className="flex items-center gap-1.5 bg-[#25D366]/10 text-[#25D366] px-3 py-1.5 rounded-full font-body text-[10px] tracking-widest uppercase hover:bg-[#25D366]/20 transition-colors" style={{ fontWeight: 600 }}>
                            <MessageCircle size={11} /> Push tous
                          </a>
                        )}
                      </div>
                      {session.participants.length === 0 ? (
                        <p className="font-body text-[11px] text-muted-foreground italic">Aucun inscrit</p>
                      ) : (
                        <div className="space-y-1.5">
                          {session.participants.map((p) => {
                            const isPaid = ["Payé", "paid", "pack"].includes(p.payment_status);
                            return (
                              <div key={p.id} className={`flex items-center gap-2.5 px-3 py-2 rounded-xl ${isPaid ? "bg-[#4E9E7A]/5 border border-[#4E9E7A]/15" : "bg-[#D4A853]/5 border border-[#D4A853]/15"}`}>
                                <div className={`w-2 h-2 rounded-full shrink-0 ${isPaid ? "bg-[#4E9E7A]" : "bg-[#D4A853]"}`} />
                                <p className="font-body text-[12px] text-foreground font-medium flex-1 min-w-0 truncate">{p.name}</p>
                                <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full shrink-0 ${isPaid ? "bg-[#4E9E7A]/15 text-[#4E9E7A]" : "bg-[#D4A853]/15 text-[#D4A853]"}`} style={{ fontWeight: 600 }}>
                                  {isPaid ? "Payé" : "À payer"}
                                </span>
                                {p.phone && (
                                  <a href={`${WA_BASE}${fmt(p.phone)}?text=${buildWAMsg(p.name, session.title, session.time)}`} target="_blank" rel="noopener noreferrer"
                                    className="w-6 h-6 bg-[#25D366]/10 rounded-full flex items-center justify-center text-[#25D366] hover:bg-[#25D366]/20 transition-colors shrink-0">
                                    <MessageCircle size={10} />
                                  </a>
                                )}
                              </div>
                            );
                          })}
                          <div className="flex gap-3 pt-1">
                            <span className="font-body text-[10px] text-[#4E9E7A] flex items-center gap-1" style={{ fontWeight: 500 }}>
                              <Check size={10} /> {paid.length} payé{paid.length > 1 ? "s" : ""}
                            </span>
                            {unpaid.length > 0 && (
                              <span className="font-body text-[10px] text-[#D4A853] flex items-center gap-1" style={{ fontWeight: 500 }}>
                                <AlertCircle size={10} /> {unpaid.length} à encaisser
                              </span>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
