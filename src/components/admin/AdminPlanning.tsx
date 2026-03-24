import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Plus,
  Minus,
  Save,
  Trash2,
  X,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  Users,
  Ban,
  RefreshCw,
  Phone,
  Mail,
  ExternalLink,
  CalendarCheck,
  Sparkles,
  LayoutGrid,
  List,
  Settings2,
  CheckSquare,
  XCircle,
  ChevronDown,
} from "lucide-react";
import { adminCall } from "./AdminLayout";
import { STANDARD_WEEK, CLASS_TYPES, getTypeColor, type WeekTemplate } from "@/lib/schedule";
import { useClientProfile } from "./ClientProfileModal";

interface Session {
  id: string;
  title: string;
  date: string;
  time: string;
  duration: number;
  capacity: number;
  instructor: string;
  level: string;
  type: string;
  price: number;
  is_active: boolean;
  notes: string | null;
  created_at: string;
  enrolled: number;
}
interface Participant {
  id: string;
  session_id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string;
  payment_status: string;
  notes: string | null;
  registered_at: string;
}
interface Coach {
  id: string;
  name: string;
  role: string;
  is_active: boolean;
}

interface WaitlistCandidate {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  class_name: string;
  class_day: string;
  class_time: string;
  coach: string;
  status: string;
  created_at?: string;
}

const fmt = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { weekday: "short", day: "numeric", month: "short" });
const iCls =
  "w-full bg-secondary border border-border px-3 py-2.5 rounded-xl font-body text-[13px] text-foreground focus:border-terra outline-none";
const lCls = "font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-1.5 block";
const btn1 =
  "bg-terra text-warm-white px-5 py-2.5 rounded-full font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra-dark transition-colors";
const btnG = "text-muted-foreground font-body text-[11px] px-4 hover:text-foreground transition-colors";

const DAY_NAMES = ["Lun", "Mar", "Mer", "Jeu", "Ven", "Sam", "Dim"];
const DAY_NAMES_FULL = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

const WEEK_TYPE_KEY = "tc_standard_week";
function loadWeekTemplate(): WeekTemplate[] {
  try {
    return JSON.parse(localStorage.getItem(WEEK_TYPE_KEY) || "null") || STANDARD_WEEK;
  } catch {
    return STANDARD_WEEK;
  }
}
function saveWeekTemplate(w: WeekTemplate[]) {
  localStorage.setItem(WEEK_TYPE_KEY, JSON.stringify(w));
}

export function AdminPlanning() {
  const { openProfile: openGlobalProfile } = useClientProfile();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [participants, setParticipants] = useState<Record<string, Participant[]>>({});
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [weekOffset, setWeekOffset] = useState(0);
  const [expandedSession, setExpandedSession] = useState<string | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [editSession, setEditSession] = useState<Partial<Session> | null>(null);
  const [showAddPart, setShowAddPart] = useState<string | null>(null);
  const [newPart, setNewPart] = useState({ first_name: "", last_name: "", email: "", phone: "" });
  const [waitlistCandidates, setWaitlistCandidates] = useState<WaitlistCandidate[]>([]);
  const [waitlistSearch, setWaitlistSearch] = useState("");
  const [selectedWaitlistId, setSelectedWaitlistId] = useState<string | null>(null);
  const [profilePart, setProfilePart] = useState<Participant | null>(null);
  const [partHistory, setPartHistory] = useState<any[]>([]);
  const [histLoading, setHistLoading] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [now, setNow] = useState(new Date());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [filterCoach, setFilterCoach] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string | null>(null);
  const [enrolledOnly, setEnrolledOnly] = useState(false);
  const [showWeekTypeEditor, setShowWeekTypeEditor] = useState(false);
  const [weekTemplate, setWeekTemplate] = useState<WeekTemplate[]>(loadWeekTemplate);
  const [editTpl, setEditTpl] = useState<WeekTemplate | null>(null);
  const [editTplIdx, setEditTplIdx] = useState<number | null>(null);
  const [weekSessionModal, setWeekSessionModal] = useState<Session | null>(null);
  const [slidePanel, setSlidePanel] = useState<Session | null>(null);
  const [slidePanelTab, setSlidePanelTab] = useState<"participants" | "config">("participants");
  const [slidePanelInlineEdit, setSlidePanelInlineEdit] = useState<Partial<Session> | null>(null);
  const [slidePanelInlineSaving, setSlidePanelInlineSaving] = useState(false);
  const [selectedSessions, setSelectedSessions] = useState<string[]>([]);
  const [bulkLoading, setBulkLoading] = useState(false);
  const [sessionDetailTab, setSessionDetailTab] = useState<Record<string, "participants" | "config">>({});
  const [inlineEdit, setInlineEdit] = useState<Partial<Session> | null>(null);
  const [inlineSaving, setInlineSaving] = useState(false);
  useEffect(() => {
    const i = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(i);
  }, []);

  const fetchSessions = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCall({ type: "sessions" });
      setSessions((res.data || []).map((s: any) => ({ ...s, enrolled: s.enrolled ?? 0 })));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCoaches = useCallback(async () => {
    try {
      const res = await adminCall({ type: "coaches" });
      setCoaches((res.data || []).filter((c: any) => c.is_active));
    } catch (e) {
      console.error(e);
    }
  }, []);

  const [disciplinePricing, setDisciplinePricing] = useState<Record<string, number>>({});

  useEffect(() => {
    fetchSessions();
    fetchCoaches();

    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("waitlist")
        .select("id,client_name,client_email,client_phone,class_name,class_day,class_time,coach,status,created_at")
        .in("status", ["pending", "contacted"])
        .order("created_at", { ascending: false })
        .then(({ data }) => setWaitlistCandidates((data as WaitlistCandidate[]) || []));

      // Load discipline pricing for auto-fill
      supabase
        .from("site_content")
        .select("content")
        .eq("section", "disciplines_config")
        .single()
        .then(({ data }) => {
          if (data?.content && Array.isArray((data.content as any).disciplines)) {
            const pricing: Record<string, number> = {};
            for (const disc of (data.content as any).disciplines) {
              for (const course of (disc.courses || [])) {
                if (course.name && course.price != null) {
                  pricing[course.name] = course.price;
                }
              }
            }
            setDisciplinePricing(pricing);
          }
        });
    });
  }, [fetchSessions, fetchCoaches]);

  const getWeekDates = useCallback(() => {
    const s = new Date();
    s.setDate(s.getDate() + weekOffset * 7 - ((s.getDay() + 6) % 7));
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(s);
      d.setDate(s.getDate() + i);
      return d.toISOString().split("T")[0];
    });
  }, [weekOffset]);

  const weekDates = useMemo(() => getWeekDates(), [getWeekDates]);
  const today = new Date().toISOString().split("T")[0];
  const weekLabel = `${fmt(weekDates[0])} — ${fmt(weekDates[6])}`;
  const coachList = coaches.map((c) => c.name).filter(Boolean);
  const coachFilterOptions = useMemo(() => coaches.map((c) => c.name).filter(Boolean), [coaches]);

  useEffect(() => {
    if (filterCoach && !coachFilterOptions.includes(filterCoach)) {
      setFilterCoach(null);
    }
  }, [filterCoach, coachFilterOptions]);

  const filteredSessions = useMemo(() => {
    let f = sessions.filter((s) => weekDates.includes(s.date));
    if (filterCoach) f = f.filter((s) => s.instructor === filterCoach);
    if (filterType) f = f.filter((s) => s.type === filterType);
    if (enrolledOnly) f = f.filter((s) => (s.enrolled || 0) > 0);
    return f.sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
  }, [sessions, weekDates, filterCoach, filterType, enrolledOnly]);

  const sessionsByDay = useMemo(() => {
    const map: Record<string, Session[]> = {};
    for (const d of weekDates) map[d] = [];
    for (const s of filteredSessions) {
      if (map[s.date]) map[s.date].push(s);
    }
    return map;
  }, [filteredSessions, weekDates]);

  const groupedListByDay = useMemo(
    () =>
      weekDates.map((date, i) => ({
        date,
        dayLabel: DAY_NAMES_FULL[i],
        sessions: filteredSessions.filter((s) => s.date === date),
      })),
    [filteredSessions, weekDates],
  );

  const nextId =
    sessions
      .filter((s) => new Date(`${s.date}T${s.time}`) > now && s.is_active)
      .sort((a, b) => new Date(`${a.date}T${a.time}`).getTime() - new Date(`${b.date}T${b.time}`).getTime())[0]?.id ||
    null;

  const generateStandardWeek = async () => {
    if (
      !confirm(
        `Générer la semaine type pour ${weekLabel} ?\n\nCeci crée ${weekTemplate.length} sessions (existantes non supprimées).`,
      )
    )
      return;
    setGenerating(true);
    try {
      // FIX : retire le champ "day" (pas une colonne en base) + bulk insert
      const sessionsToInsert = weekTemplate
        .map((tpl) => {
          const targetDate = weekDates.find((d) => new Date(d).getDay() === tpl.day);
          if (!targetDate) return null;
          const { day: _day, ...sessionData } = tpl; // ← supprime le champ "day"
          return { ...sessionData, date: targetDate, is_active: true, notes: "" };
        })
        .filter(Boolean);

      if (sessionsToInsert.length === 0) {
        alert("Aucune session à créer pour cette semaine.");
        setGenerating(false);
        return;
      }

      const res = await adminCall({ action: "bulk_create_sessions", sessions: sessionsToInsert });
      alert(`✅ ${res.count || sessionsToInsert.length} sessions créées`);
      fetchSessions();
    } catch (e: any) {
      alert(`❌ Erreur : ${e.message}`);
    } finally {
      setGenerating(false);
    }
  };

  const fetchParticipants = async (sid: string) => {
    try {
      const res = await adminCall({ type: "participants", sessionId: sid });
      setParticipants((p) => ({ ...p, [sid]: res.data || [] }));
    } catch (e) {
      console.error(e);
    }
  };

  const toggleSession = (id: string) => {
    if (expandedSession === id) {
      setExpandedSession(null);
      return;
    }
    setExpandedSession(id);
    if (!participants[id]) fetchParticipants(id);
  };

  const openProfile = async (part: Participant) => {
    setProfilePart(part);
    setHistLoading(true);
    try {
      const { supabase } = await import("@/integrations/supabase/client");
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("client_email", part.email)
        .order("created_at", { ascending: false });
      setPartHistory(data || []);
    } catch {
      setPartHistory([]);
    } finally {
      setHistLoading(false);
    }
  };

  const addParticipant = async (sid: string) => {
    if (!newPart.first_name || !newPart.email) return;
    try {
      await adminCall({
        action: "add_participant",
        waitlistId: selectedWaitlistId,
        participant: { ...newPart, session_id: sid, phone: newPart.phone || null },
      });
      setNewPart({ first_name: "", last_name: "", email: "", phone: "" });
      setSelectedWaitlistId(null);
      setWaitlistSearch("");
      if (selectedWaitlistId) {
        setWaitlistCandidates((p) => p.filter((w) => w.id !== selectedWaitlistId));
      }
      setShowAddPart(null);
      fetchParticipants(sid);
      setSessions((p) => p.map((s) => (s.id === sid ? { ...s, enrolled: s.enrolled + 1 } : s)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const removeParticipant = async (id: string, sid: string) => {
    if (!confirm("Retirer ce participant ?")) return;
    try {
      await adminCall({ action: "remove_participant", participantId: id });
      fetchParticipants(sid);
      setSessions((p) => p.map((s) => (s.id === sid ? { ...s, enrolled: Math.max(0, s.enrolled - 1) } : s)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const updateStatus = async (id: string, sid: string, status: string) => {
    try {
      await adminCall({ action: "update_participant", participantId: id, participant: { payment_status: status } });
      fetchParticipants(sid);
    } catch (e: any) {
      alert(e.message);
    }
  };

  const saveSession = async () => {
    if (!editSession) return;
    try {
      const payload = {
        title: editSession.title,
        date: editSession.date,
        time: editSession.time,
        duration: editSession.duration,
        capacity: editSession.capacity,
        instructor: editSession.instructor,
        level: editSession.level,
        type: editSession.type,
        price: editSession.price,
        is_active: editSession.is_active,
        notes: editSession.notes ?? null,
      };
      if (editSession.id) await adminCall({ action: "update_session", sessionId: editSession.id, session: payload });
      else await adminCall({ action: "create_session", session: payload });
      setShowModal(false);
      setEditSession(null);
      fetchSessions();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const deleteSession = async (id: string) => {
    if (!confirm("Supprimer définitivement cette session ?")) return;
    try {
      await adminCall({ action: "delete_session", sessionId: id });
      fetchSessions();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const cancelSession = async (s: Session) => {
    const hasParticipants = s.enrolled > 0;
    const msg = hasParticipants
      ? `Annuler "${s.title}" ?\n\n${s.enrolled} participant(s) seront transférés vers la liste d'attente avec leur statut de paiement conservé.`
      : `Annuler "${s.title}" ?`;
    if (!confirm(msg)) return;
    try {
      if (hasParticipants) {
        const res = await adminCall({ action: "cancel_session_transfer", sessionId: s.id });
        setSessions((p) => p.map((x) => (x.id === s.id ? { ...x, is_active: false } : x)));
        const transferred = res.transferred || [];
        alert(`✅ Session annulée\n${transferred.length} client(s) transférés en liste d'attente avec leur statut de paiement.`);
      } else {
        await adminCall({ action: "update_session", sessionId: s.id, session: { is_active: false } });
        setSessions((p) => p.map((x) => (x.id === s.id ? { ...x, is_active: false } : x)));
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const reactivate = async (s: Session) => {
    try {
      await adminCall({ action: "update_session", sessionId: s.id, session: { is_active: true } });
      setSessions((p) => p.map((x) => (x.id === s.id ? { ...x, is_active: true } : x)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const updateCap = async (s: Session, delta: number) => {
    const newCap = Math.max(1, Math.min(30, s.capacity + delta));
    try {
      await adminCall({ action: "update_session", sessionId: s.id, session: { capacity: newCap } });
      setSessions((p) => p.map((x) => (x.id === s.id ? { ...x, capacity: newCap } : x)));
    } catch (e: any) {
      alert(e.message);
    }
  };

  const toggleSelectSession = (id: string) =>
    setSelectedSessions((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]));

  const openSlidePanel = (session: Session) => {
    setSlidePanel(session);
    setSlidePanelTab("participants");
    setSlidePanelInlineEdit(null);
    if (!participants[session.id]) fetchParticipants(session.id);
  };

  const saveInlineSession = async (session: Session) => {
    if (!inlineEdit) return;
    setInlineSaving(true);
    try {
      await adminCall({ action: "update_session", sessionId: session.id, session: inlineEdit });
      setSessions(p => p.map(s => s.id === session.id ? { ...s, ...inlineEdit } : s));
      setInlineEdit(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setInlineSaving(false);
    }
  };

  const saveSlidePanelSession = async () => {
    if (!slidePanel || !slidePanelInlineEdit) return;
    setSlidePanelInlineSaving(true);
    try {
      await adminCall({ action: "update_session", sessionId: slidePanel.id, session: slidePanelInlineEdit });
      const updated = { ...slidePanel, ...slidePanelInlineEdit } as Session;
      setSessions(p => p.map(s => s.id === slidePanel.id ? updated : s));
      setSlidePanel(updated);
      setSlidePanelInlineEdit(null);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setSlidePanelInlineSaving(false);
    }
  };

  const selectAllWeek = () => {
    const ids = filteredSessions.map((s) => s.id);
    setSelectedSessions(ids);
  };

  const bulkCancelSessions = async () => {
    if (!confirm(`Annuler ${selectedSessions.length} session(s) ?`)) return;
    setBulkLoading(true);
    try {
      await adminCall({ action: "bulk_cancel_sessions", sessionIds: selectedSessions });
      setSessions((p) => p.map((s) => (selectedSessions.includes(s.id) ? { ...s, is_active: false } : s)));
      setSelectedSessions([]);
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const bulkDeleteSessions = async () => {
    if (!confirm(`Supprimer DÉFINITIVEMENT ${selectedSessions.length} session(s) ?`)) return;
    setBulkLoading(true);
    try {
      await adminCall({ action: "bulk_delete_sessions", sessionIds: selectedSessions });
      setSelectedSessions([]);
      fetchSessions();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  const duplicateWeek = async () => {
    const targetOffset = weekOffset + 1;
    const targetDates = (() => {
      const s = new Date();
      s.setDate(s.getDate() + targetOffset * 7 - ((s.getDay() + 6) % 7));
      return Array.from({ length: 7 }, (_, i) => {
        const d = new Date(s);
        d.setDate(s.getDate() + i);
        return d.toISOString().split("T")[0];
      });
    })();
    if (!confirm(`Dupliquer la semaine vers ${targetDates[0]} — ${targetDates[6]} ?`)) return;
    setBulkLoading(true);
    try {
      const res = await adminCall({ action: "duplicate_week", sourceWeekDates: weekDates, targetWeekDates: targetDates });
      alert(`✅ ${res.count || 0} sessions dupliquées`);
      setWeekOffset(targetOffset);
      fetchSessions();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBulkLoading(false);
    }
  };

  if (loading) return <p className="font-body text-muted-foreground text-center py-20">Chargement...</p>;

  const defaultSession = {
    title: "",
    date: weekDates[0],
    time: "09:00",
    duration: 55,
    capacity: 13,
    instructor: coachList[0] || "",
    level: "Tous niveaux",
    type: "Reformer",
    price: 350,
    is_active: true,
    notes: "",
  };

  const SessionCard = ({ session, compact = false }: { session: Session; compact?: boolean }) => {
    const isNext = session.id === nextId;
    const cancelled = !session.is_active;
    const spotsLeft = session.capacity - session.enrolled;
    const c = getTypeColor(session.type);
    const isExpanded = expandedSession === session.id;

    return (
      <div className={compact ? "mb-1" : "mb-2"}>
        <div
          className={`bg-card border cursor-pointer transition-all rounded-2xl relative overflow-hidden ${selectedSessions.includes(session.id) ? "ring-2 ring-terra/40" : ""} ${cancelled ? "border-destructive/30 opacity-60" : isNext ? "border-success/60 shadow-sm" : "border-border hover:border-terra/30"} ${compact ? "p-2" : "p-4"}`}
          onClick={() => {
            openSlidePanel(session);
          }}
        >
          <div
            className="absolute top-0 left-0 right-0 h-0.5"
            style={{ background: c.dot, opacity: cancelled ? 0.3 : 1 }}
          />

          {compact ? (
            <div>
              <div className="flex items-start justify-between gap-1">
                <input
                  type="checkbox"
                  checked={selectedSessions.includes(session.id)}
                  onChange={(e) => { e.stopPropagation(); toggleSelectSession(session.id); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-3.5 h-3.5 accent-[#B8634A] rounded shrink-0 cursor-pointer mt-0.5"
                />
                <div className="min-w-0">
                  <p className="font-body text-[11px] font-semibold truncate" style={{ color: c.dot }}>
                    {session.time}
                  </p>
                  <p
                    className={`font-display text-[12px] leading-tight truncate ${cancelled ? "line-through text-muted-foreground" : "text-foreground"}`}
                    style={{ fontWeight: 400 }}
                  >
                    {session.title}
                  </p>
                  <p className="font-body text-[9px] text-muted-foreground truncate">{session.instructor}</p>
                </div>
                <span
                  className={`font-body text-[10px] font-semibold shrink-0 ${spotsLeft <= 0 ? "text-destructive" : spotsLeft <= 2 ? "text-[#D4A853]" : "text-foreground/60"}`}
                >
                  {session.enrolled}/{session.capacity}
                </span>
              </div>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-3 flex-wrap">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  checked={selectedSessions.includes(session.id)}
                  onChange={(e) => { e.stopPropagation(); toggleSelectSession(session.id); }}
                  onClick={(e) => e.stopPropagation()}
                  className="w-4 h-4 accent-[#B8634A] rounded shrink-0 cursor-pointer"
                />
                {cancelled && (
                  <span
                    className="flex items-center gap-1 font-body text-[9px] tracking-widest uppercase text-destructive px-2 py-1 bg-destructive/10 rounded-full"
                    style={{ fontWeight: 600 }}
                  >
                    <Ban size={9} /> Annulé
                  </span>
                )}
                {isNext && !cancelled && (
                  <span
                    className="flex items-center gap-1 font-body text-[9px] tracking-widest uppercase text-success px-2 py-1 bg-success/10 rounded-full"
                    style={{ fontWeight: 600 }}
                  >
                    <span className="w-1.5 h-1.5 bg-success rounded-full animate-pulse" /> Prochaine
                  </span>
                )}
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-body text-sm font-semibold" style={{ color: c.dot }}>
                      {session.time}
                    </span>
                    <span
                      className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground px-1.5 py-0.5 bg-muted/30 rounded"
                      style={{ fontWeight: 500 }}
                    >
                      {session.type}
                    </span>
                  </div>
                  <p
                    className={`font-display text-[15px] ${cancelled ? "text-destructive line-through" : "text-foreground"}`}
                    style={{ fontWeight: 400 }}
                  >
                    {session.title}
                  </p>
                  <p className="font-body text-[11px] text-muted-foreground">
                    {fmt(session.date)} · <span className="text-foreground/70 font-semibold">{session.instructor}</span>{" "}
                    · {session.duration}min
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3 ml-auto">
                <span
                  className={`font-display text-base min-w-[44px] text-center ${spotsLeft <= 0 ? "text-destructive" : spotsLeft <= 2 ? "text-[#D4A853]" : "text-foreground"}`}
                  style={{ fontWeight: 400 }}
                >
                  {session.enrolled}/{session.capacity}
                </span>
                {cancelled ? (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      reactivate(session);
                    }}
                    className="font-body text-[10px] tracking-widest uppercase text-success border border-success/30 px-3 py-1 rounded-full hover:bg-success/10 transition-all"
                    style={{ fontWeight: 500 }}
                  >
                    Réactiver
                  </button>
                ) : (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      cancelSession(session);
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    title="Annuler"
                  >
                    <Ban size={14} />
                  </button>
                )}
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    openSlidePanel(session);
                  }}
                  className="text-muted-foreground hover:text-terra transition-colors"
                >
                  <MoreHorizontal size={16} />
                </button>
              </div>
            </div>
          )}
        </div>

      </div>
    );
  };

  return (
    <>
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <button
          onClick={() => setWeekOffset((p) => p - 1)}
          className="w-8 h-8 border border-border bg-card rounded-full flex items-center justify-center text-muted-foreground hover:border-terra hover:text-terra transition-all"
        >
          <ChevronLeft size={14} />
        </button>
        <p className="font-display text-base text-foreground flex-1 min-w-[160px]" style={{ fontWeight: 400 }}>
          {weekLabel}
        </p>
        <button
          onClick={() => setWeekOffset((p) => p + 1)}
          className="w-8 h-8 border border-border bg-card rounded-full flex items-center justify-center text-muted-foreground hover:border-terra hover:text-terra transition-all"
        >
          <ChevronRight size={14} />
        </button>
        {weekOffset !== 0 && (
          <button
            onClick={() => setWeekOffset(0)}
            className="font-body text-[10px] tracking-widest uppercase text-terra border border-terra/30 px-3 py-1.5 rounded-full hover:bg-terra hover:text-warm-white transition-all"
            style={{ fontWeight: 500 }}
          >
            Cette sem.
          </button>
        )}
        <button
          onClick={() => setEnrolledOnly((v) => !v)}
          className={`font-body text-[10px] tracking-widest uppercase px-3 py-1.5 rounded-full border transition-all ${enrolledOnly ? "bg-terra text-warm-white border-terra" : "border-border text-muted-foreground hover:text-terra hover:border-terra/40"}`}
          style={{ fontWeight: 500 }}
          title="Afficher uniquement les cours avec inscrits"
        >
          Avec inscrits
        </button>

        {/* Coach filter */}
        <div className="relative">
          <select
            value={filterCoach || ""}
            onChange={e => setFilterCoach(e.target.value || null)}
            className="appearance-none bg-card border border-border rounded-full pl-3 pr-7 py-1.5 font-body text-[10px] tracking-widest uppercase text-muted-foreground hover:border-terra/40 focus:outline-none focus:border-terra transition-all cursor-pointer"
            style={{ fontWeight: 500 }}
          >
            <option value="">Tous les coachs</option>
            {coachFilterOptions.map(c => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
          <ChevronDown size={10} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
        </div>

        <div className="flex items-center border border-border rounded-full overflow-hidden bg-card">
          <button
            onClick={() => setViewMode("grid")}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${viewMode === "grid" ? "bg-terra text-warm-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            <LayoutGrid size={13} />
          </button>
          <button
            onClick={() => setViewMode("list")}
            className={`w-8 h-8 flex items-center justify-center transition-colors ${viewMode === "list" ? "bg-terra text-warm-white" : "text-muted-foreground hover:text-foreground"}`}
          >
            <List size={13} />
          </button>
        </div>
        <button
          onClick={() => setShowWeekTypeEditor(true)}
          className="flex items-center gap-1.5 border border-border text-muted-foreground px-3 py-1.5 rounded-full font-body text-[10px] tracking-widest uppercase hover:border-terra hover:text-terra transition-all"
          style={{ fontWeight: 500 }}
        >
          <Settings2 size={12} /> Semaine type
        </button>
        <button
          onClick={generateStandardWeek}
          disabled={generating}
          className="flex items-center gap-2 border border-terra/40 text-terra px-4 py-2 rounded-full font-body text-[11px] tracking-[0.15em] uppercase hover:bg-terra hover:text-warm-white transition-all disabled:opacity-50"
          style={{ fontWeight: 500 }}
        >
          {generating ? <RefreshCw size={13} className="animate-spin" /> : <Sparkles size={13} />} Générer
        </button>
        <button
          onClick={() => {
            setEditSession(defaultSession);
            setShowModal(true);
          }}
          className={btn1 + " flex items-center gap-2"}
        >
          <Plus size={14} /> Ajouter
        </button>
      </div>

      {/* Bulk action bar */}
      <AnimatePresence>
        {selectedSessions.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-terra/10 border border-terra/30 rounded-2xl px-4 py-3 mb-4"
          >
            <span className="font-body text-[12px] text-terra font-medium">
              {selectedSessions.length} session(s) sélectionnée(s)
            </span>
            <div className="flex gap-2 ml-auto">
              <button
                onClick={bulkCancelSessions}
                disabled={bulkLoading}
                className="px-3 py-1.5 rounded-full font-body text-[10px] tracking-widest uppercase border border-terra/30 text-terra hover:bg-terra hover:text-warm-white transition-all disabled:opacity-50"
                style={{ fontWeight: 500 }}
              >
                <Ban size={10} className="inline mr-1" /> Annuler toutes
              </button>
              <button
                onClick={bulkDeleteSessions}
                disabled={bulkLoading}
                className="px-3 py-1.5 rounded-full font-body text-[10px] tracking-widest uppercase border border-destructive/30 text-destructive hover:bg-destructive hover:text-warm-white transition-all disabled:opacity-50"
                style={{ fontWeight: 500 }}
              >
                <Trash2 size={10} className="inline mr-1" /> Supprimer
              </button>
              <button
                onClick={() => setSelectedSessions([])}
                className="text-muted-foreground hover:text-foreground transition-colors ml-2"
              >
                <XCircle size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-wrap items-center gap-2 mb-5">
        <button
          onClick={selectAllWeek}
          className="px-3 py-1.5 rounded-full font-body text-[10px] tracking-widest uppercase transition-all border border-border text-muted-foreground hover:border-terra hover:text-terra"
          style={{ fontWeight: 500 }}
        >
          <CheckSquare size={10} className="inline mr-1" /> Tout sélect.
        </button>
        <p className="font-body text-[11px] text-muted-foreground ml-2">
          Vue simplifiée: focus sur la semaine, édition rapide et ajout participant depuis chaque session.
        </p>
      </div>

      {viewMode === "grid" && (
        <div className="overflow-x-auto -mx-1 px-1 pb-4">
          <div className="grid min-w-[700px]" style={{ gridTemplateColumns: `repeat(7, minmax(0, 1fr))`, gap: "6px" }}>
            {weekDates.map((date, i) => {
              const isToday = date === today;
              const daySessions = sessionsByDay[date] || [];
              return (
                <div key={date}>
                  <div
                    className={`text-center py-2 mb-2 rounded-xl ${isToday ? "bg-terra text-warm-white" : "bg-card border border-border"}`}
                  >
                    <p
                      className="font-body text-[9px] tracking-[0.2em] uppercase opacity-70"
                      style={{ fontWeight: 600 }}
                    >
                      {DAY_NAMES[i]}
                    </p>
                    <p className="font-display text-sm" style={{ fontWeight: 400 }}>
                      {new Date(date).getDate()}
                    </p>
                  </div>
                  <div className="space-y-1">
                    {daySessions.length === 0 && (
                      <div className="text-center py-3">
                        <button
                          onClick={() => {
                            setEditSession({ ...defaultSession, date });
                            setShowModal(true);
                          }}
                          className="text-[10px] text-muted-foreground/30 hover:text-terra transition-colors"
                        >
                          <Plus size={14} className="mx-auto" />
                        </button>
                      </div>
                    )}
                    {daySessions.map((s) => (
                      <SessionCard key={s.id} session={s} compact />
                    ))}
                    {daySessions.length > 0 && (
                      <button
                        onClick={() => {
                          setEditSession({ ...defaultSession, date });
                          setShowModal(true);
                        }}
                        className="w-full text-center py-1.5 text-[9px] text-muted-foreground/40 hover:text-terra border border-dashed border-border hover:border-terra/30 rounded-xl transition-colors"
                      >
                        +
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {viewMode === "list" && (
        <div className="space-y-4">
          {filteredSessions.length === 0 && (
            <div className="bg-card border border-border p-12 text-center rounded-2xl">
              <p className="font-body text-muted-foreground">Aucune session cette semaine</p>
              <button
                onClick={generateStandardWeek}
                className="mt-4 flex items-center gap-2 mx-auto text-terra font-body text-[11px] tracking-widest uppercase border border-terra/30 px-4 py-2 rounded-full hover:bg-terra hover:text-warm-white transition-all"
                style={{ fontWeight: 500 }}
              >
                <Sparkles size={13} /> Générer la semaine type
              </button>
            </div>
          )}
          {groupedListByDay.map((group) => (
            <div key={group.date} className="bg-card border border-border rounded-2xl p-3 md:p-4">
              <div className="flex items-center justify-between mb-3">
                <p className="font-display text-lg text-foreground" style={{ fontWeight: 400 }}>
                  {group.dayLabel}
                </p>
                <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground">
                  {new Date(group.date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" })} · {group.sessions.length} séance{group.sessions.length > 1 ? "s" : ""}
                </p>
              </div>

              {group.sessions.length === 0 ? (
                <p className="font-body text-[12px] text-muted-foreground py-3 text-center border border-dashed border-border rounded-xl">
                  Aucune session ce jour.
                </p>
              ) : (
                <div className="space-y-1">
                  {group.sessions.map((session) => (
                    <SessionCard key={session.id} session={session} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* ── CRM SLIDE PANEL ─────────────────────────────────────── */}
      <AnimatePresence>
        {slidePanel && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[199] bg-foreground/30 backdrop-blur-sm"
              onClick={() => { setSlidePanel(null); setSlidePanelInlineEdit(null); }}
            />
            {/* Panel */}
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 260 }}
              className="fixed top-0 right-0 h-full w-[480px] max-w-[95vw] z-[200] bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="px-6 py-5 border-b border-border bg-card/95 backdrop-blur-sm shrink-0">
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span
                        className="font-body text-[9px] uppercase tracking-[0.25em] px-2 py-0.5 rounded-full"
                        style={{ background: getTypeColor(slidePanel.type).bg, color: getTypeColor(slidePanel.type).dot, fontWeight: 600 }}
                      >
                        {slidePanel.type}
                      </span>
                      {!slidePanel.is_active && (
                        <span className="font-body text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full bg-destructive/10 text-destructive">Annulé</span>
                      )}
                    </div>
                    <p className="font-display text-xl text-foreground truncate" style={{ fontWeight: 400 }}>{slidePanel.title}</p>
                    <p className="font-body text-[12px] text-muted-foreground mt-0.5">
                      {fmt(slidePanel.date)} · {slidePanel.time.slice(0, 5)} · {slidePanel.duration}min · <span className="text-foreground/80 font-medium">{slidePanel.instructor}</span>
                    </p>
                  </div>
                  <button
                    onClick={() => { setSlidePanel(null); setSlidePanelInlineEdit(null); }}
                    className="text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5"
                  >
                    <X size={18} />
                  </button>
                </div>
                {/* Fill rate bar */}
                <div className="mt-2">
                  {(() => {
                    const pct = slidePanel.capacity > 0 ? Math.round((slidePanel.enrolled / slidePanel.capacity) * 100) : 0;
                    const color = pct >= 80 ? "#B8634A" : pct >= 50 ? "#D4A853" : "#4A8B6A";
                    return (
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-body text-[10px] text-muted-foreground">{slidePanel.enrolled}/{slidePanel.capacity} inscrits</span>
                          <span className="font-body text-[10px] font-semibold" style={{ color }}>{pct}%</span>
                        </div>
                        <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
                          <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(100, pct)}%`, background: color }} />
                        </div>
                      </div>
                    );
                  })()}
                </div>
                {/* Quick actions */}
                <div className="flex gap-2 mt-3">
                  {slidePanel.is_active ? (
                    <button
                      onClick={() => { cancelSession(slidePanel); setSlidePanel(null); }}
                      className="flex items-center gap-1 font-body text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                    >
                      <Ban size={9} /> Annuler
                    </button>
                  ) : (
                    <button
                      onClick={() => { reactivate(slidePanel); setSlidePanel({ ...slidePanel, is_active: true }); }}
                      className="flex items-center gap-1 font-body text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-success/30 text-success hover:bg-success/10 transition-colors"
                    >
                      Réactiver
                    </button>
                  )}
                  <button
                    onClick={() => { deleteSession(slidePanel.id); setSlidePanel(null); }}
                    className="flex items-center gap-1 font-body text-[9px] uppercase tracking-widest px-3 py-1.5 rounded-full border border-destructive/20 text-destructive/70 hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 size={9} /> Supprimer
                  </button>
                </div>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-border shrink-0 bg-card">
                {(["participants", "config"] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => { setSlidePanelTab(tab); setSlidePanelInlineEdit(null); }}
                    className={`flex-1 py-3 font-body text-[10px] uppercase tracking-[0.25em] transition-all border-b-2 ${slidePanelTab === tab ? "border-terra text-terra" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                    style={{ fontWeight: 600 }}
                  >
                    {tab === "participants" ? `Participants (${participants[slidePanel.id]?.length ?? slidePanel.enrolled})` : "Config"}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto">
                {/* Participants tab */}
                {slidePanelTab === "participants" && (
                  <div className="p-5 space-y-3">
                    <div className="flex items-center justify-between">
                      <p className="font-body text-[11px] tracking-widest uppercase text-terra flex items-center gap-2" style={{ fontWeight: 600 }}>
                        <Users size={12} /> Participants
                      </p>
                      <button
                        onClick={() => setShowAddPart(slidePanel.id)}
                        className="font-body text-[10px] tracking-widest uppercase text-terra border border-terra/30 px-3 py-1 rounded-full hover:bg-terra hover:text-warm-white transition-all"
                        style={{ fontWeight: 500 }}
                      >
                        + Ajouter
                      </button>
                    </div>

                    {showAddPart === slidePanel.id && (
                      <div className="bg-secondary border border-border p-4 space-y-2 rounded-xl">
                        <div className="border border-border rounded-xl p-3 bg-card/40">
                          <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
                            Depuis liste d'attente
                          </p>
                          <input
                            value={waitlistSearch}
                            onChange={(e) => setWaitlistSearch(e.target.value)}
                            className={iCls}
                            placeholder="Rechercher (nom, email, tél.)…"
                          />
                          <div className="mt-2 max-h-32 overflow-y-auto space-y-1">
                            {waitlistCandidates
                              .filter((w) => {
                                const q = waitlistSearch.toLowerCase();
                                if (!q) return true;
                                return w.client_name.toLowerCase().includes(q) || w.client_email.toLowerCase().includes(q) || (w.client_phone || "").includes(q);
                              })
                              .slice(0, 6)
                              .map((w) => (
                                <button
                                  type="button"
                                  key={w.id}
                                  onClick={() => {
                                    const [firstName, ...rest] = w.client_name.split(" ");
                                    setSelectedWaitlistId(w.id);
                                    setNewPart({ first_name: firstName || w.client_name, last_name: rest.join(" "), email: w.client_email, phone: w.client_phone || "" });
                                  }}
                                  className={`w-full text-left rounded-lg border px-2 py-1.5 transition-colors ${selectedWaitlistId === w.id ? "border-terra bg-terra/5" : "border-border bg-card hover:border-terra/40"}`}
                                >
                                  <p className="font-body text-[11px] text-foreground font-semibold">{w.client_name}</p>
                                  <p className="font-body text-[10px] text-muted-foreground truncate">{w.client_email}{w.client_phone ? ` · ${w.client_phone}` : ""}</p>
                                </button>
                              ))}
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <input value={newPart.first_name} onChange={(e) => setNewPart(p => ({ ...p, first_name: e.target.value }))} className={iCls} placeholder="Prénom *" />
                          <input value={newPart.last_name} onChange={(e) => setNewPart(p => ({ ...p, last_name: e.target.value }))} className={iCls} placeholder="Nom" />
                        </div>
                        <input value={newPart.email} onChange={(e) => setNewPart(p => ({ ...p, email: e.target.value }))} className={iCls} placeholder="Email *" />
                        <input value={newPart.phone} onChange={(e) => setNewPart(p => ({ ...p, phone: e.target.value }))} className={iCls} placeholder="+212 6XX XXX XXX" />
                        <div className="flex gap-2">
                          <button onClick={() => addParticipant(slidePanel.id)} className={btn1}>Ajouter</button>
                          <button type="button" onClick={() => { setShowAddPart(null); setSelectedWaitlistId(null); setWaitlistSearch(""); }} className={btnG}>Annuler</button>
                        </div>
                      </div>
                    )}

                    <div className="space-y-2">
                      {!participants[slidePanel.id] && (
                        <p className="font-body text-[12px] text-muted-foreground text-center py-6">Chargement…</p>
                      )}
                      {participants[slidePanel.id]?.length === 0 && (
                        <p className="font-body text-[12px] text-muted-foreground text-center py-6">Aucun participant inscrit</p>
                      )}
                      {participants[slidePanel.id]?.map((p) => (
                        <div key={p.id} className="bg-secondary border border-border px-4 py-3 flex items-center gap-3 rounded-xl">
                          <div className="w-9 h-9 bg-terra rounded-full flex items-center justify-center text-warm-white font-display text-sm shrink-0" style={{ fontWeight: 400 }}>
                            {p.first_name[0]?.toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <button
                              onClick={() => p.email && openGlobalProfile(p.email, `${p.first_name} ${p.last_name}`.trim(), p.phone || undefined)}
                              className="font-body text-[13px] text-foreground font-medium hover:text-terra transition-colors text-left"
                            >
                              {p.first_name} {p.last_name}
                            </button>
                            <div className="flex items-center gap-2 flex-wrap">
                              <a href={`mailto:${p.email}`} className="font-body text-[10px] text-muted-foreground hover:text-terra flex items-center gap-1"><Mail size={9} />{p.email}</a>
                              {p.phone && <a href={`tel:${p.phone}`} className="font-body text-[10px] text-muted-foreground hover:text-terra flex items-center gap-1"><Phone size={9} />{p.phone}</a>}
                            </div>
                          </div>
                          <select
                            value={p.payment_status}
                            onChange={(e) => updateStatus(p.id, slidePanel.id, e.target.value)}
                            className={`font-body text-[9px] tracking-widest uppercase px-2 py-1 rounded-full border-none outline-none cursor-pointer shrink-0 ${p.payment_status === "Payé" ? "bg-success/15 text-success" : p.payment_status === "Annulé" ? "bg-destructive/10 text-destructive" : "bg-terra/10 text-terra"}`}
                            style={{ fontWeight: 600 }}
                          >
                            <option value="En attente">En attente</option>
                            <option value="Payé">Payé</option>
                            <option value="Annulé">Annulé</option>
                          </select>
                          <button onClick={() => removeParticipant(p.id, slidePanel.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Config tab */}
                {slidePanelTab === "config" && (
                  <div className="p-5 space-y-3">
                    {!slidePanelInlineEdit ? (
                      <>
                        <div className="grid grid-cols-2 gap-3 text-[13px] font-body">
                          <div><span className={lCls}>Titre</span><p className="text-foreground">{slidePanel.title}</p></div>
                          <div><span className={lCls}>Instructeur</span><p className="text-foreground">{slidePanel.instructor}</p></div>
                          <div><span className={lCls}>Date</span><p className="text-foreground">{slidePanel.date}</p></div>
                          <div><span className={lCls}>Heure</span><p className="text-foreground">{slidePanel.time}</p></div>
                          <div><span className={lCls}>Durée (min)</span><p className="text-foreground">{slidePanel.duration}</p></div>
                          <div><span className={lCls}>Capacité</span><p className="text-foreground">{slidePanel.capacity}</p></div>
                          <div><span className={lCls}>Niveau</span><p className="text-foreground">{slidePanel.level || "—"}</p></div>
                          <div><span className={lCls}>Type</span><p className="text-foreground">{slidePanel.type || "—"}</p></div>
                          <div><span className={lCls}>Prix</span><p className="text-foreground">{slidePanel.price} DH</p></div>
                          {slidePanel.notes && <div className="col-span-2"><span className={lCls}>Notes</span><p className="text-foreground">{slidePanel.notes}</p></div>}
                        </div>
                        <button
                          onClick={() => setSlidePanelInlineEdit({ title: slidePanel.title, instructor: slidePanel.instructor, date: slidePanel.date, time: slidePanel.time, duration: slidePanel.duration, capacity: slidePanel.capacity, level: slidePanel.level, type: slidePanel.type, price: slidePanel.price, notes: slidePanel.notes ?? "" })}
                          className="font-body text-[10px] tracking-widest uppercase text-terra border border-terra/30 px-3 py-1.5 rounded-full hover:bg-terra hover:text-warm-white transition-all mt-1"
                          style={{ fontWeight: 500 }}
                        >
                          Modifier la séance
                        </button>
                      </>
                    ) : (
                      <div className="space-y-2">
                        <div className="grid grid-cols-2 gap-2">
                          <div><label className={lCls}>Titre</label><input value={slidePanelInlineEdit.title ?? ""} onChange={e => setSlidePanelInlineEdit(p => p ? { ...p, title: e.target.value } : p)} className={iCls} /></div>
                          <div>
                            <label className={lCls}>Instructeur</label>
                            <select value={slidePanelInlineEdit.instructor ?? ""} onChange={e => setSlidePanelInlineEdit(p => p ? { ...p, instructor: e.target.value } : p)} className={iCls}>
                              {coaches.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                            </select>
                          </div>
                          <div><label className={lCls}>Date</label><input type="date" value={slidePanelInlineEdit.date ?? ""} onChange={e => setSlidePanelInlineEdit(p => p ? { ...p, date: e.target.value } : p)} className={iCls} /></div>
                          <div><label className={lCls}>Heure</label><input type="time" value={slidePanelInlineEdit.time ?? ""} onChange={e => setSlidePanelInlineEdit(p => p ? { ...p, time: e.target.value } : p)} className={iCls} /></div>
                          <div><label className={lCls}>Durée (min)</label><input type="number" value={slidePanelInlineEdit.duration ?? 60} onChange={e => setSlidePanelInlineEdit(p => p ? { ...p, duration: +e.target.value } : p)} className={iCls} /></div>
                          <div><label className={lCls}>Capacité</label><input type="number" value={slidePanelInlineEdit.capacity ?? 13} onChange={e => setSlidePanelInlineEdit(p => p ? { ...p, capacity: +e.target.value } : p)} className={iCls} /></div>
                          <div><label className={lCls}>Niveau</label><input value={slidePanelInlineEdit.level ?? ""} onChange={e => setSlidePanelInlineEdit(p => p ? { ...p, level: e.target.value } : p)} className={iCls} placeholder="Tous niveaux" /></div>
                          <div><label className={lCls}>Type</label><input value={slidePanelInlineEdit.type ?? ""} onChange={e => setSlidePanelInlineEdit(p => p ? { ...p, type: e.target.value } : p)} className={iCls} /></div>
                          <div><label className={lCls}>Prix (DH)</label><input type="number" value={slidePanelInlineEdit.price ?? 350} onChange={e => setSlidePanelInlineEdit(p => p ? { ...p, price: +e.target.value } : p)} className={iCls} /></div>
                        </div>
                        <div><label className={lCls}>Notes</label><textarea value={slidePanelInlineEdit.notes ?? ""} onChange={e => setSlidePanelInlineEdit(p => p ? { ...p, notes: e.target.value } : p)} className={iCls + " resize-none"} rows={2} /></div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={saveSlidePanelSession} disabled={slidePanelInlineSaving} className={btn1 + " disabled:opacity-50"}>
                            {slidePanelInlineSaving ? <RefreshCw size={12} className="animate-spin inline mr-1" /> : <Save size={12} className="inline mr-1" />} Sauvegarder
                          </button>
                          <button onClick={() => setSlidePanelInlineEdit(null)} className={btnG}>Annuler</button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showModal && editSession && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setShowModal(false)}
          >
            <motion.div
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              exit={{ y: 16 }}
              className="bg-card w-[560px] max-w-[95vw] max-h-[88vh] overflow-y-auto shadow-2xl rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-card z-10 px-7 py-5 border-b border-border flex justify-between items-center rounded-t-3xl">
                <p className="font-display text-xl text-foreground" style={{ fontWeight: 400 }}>
                  {editSession.id ? "Modifier session" : "Nouvelle session"}
                </p>
                <button onClick={() => setShowModal(false)} className="text-muted-foreground hover:text-terra">
                  <X size={18} />
                </button>
              </div>
              <div className="px-7 py-5 space-y-4">
                <div>
                  <label className={lCls}>Titre</label>
                  <input
                    value={editSession.title || ""}
                    onChange={(e) => {
                      const title = e.target.value;
                      const suggestedPrice = disciplinePricing[title];
                      setEditSession((p) => ({
                        ...p!,
                        title,
                        ...(suggestedPrice != null && !p?.id ? { price: suggestedPrice } : {}),
                      }));
                    }}
                    className={iCls}
                    placeholder="Reformer Signature"
                    list="session-titles-list"
                  />
                  <datalist id="session-titles-list">
                    {[...new Set(sessions.map(s => s.title).filter(Boolean))].map(t => (
                      <option key={t} value={t} />
                    ))}
                    {["Reformer Classique", "Reformer Jumpboard", "Reformer Signature", "Reformer Flow", "Yoga Vinyasa", "Yoga Hatha", "Barre Fit", "Mat Pilates", "Post-natal Pilates", "Maternité Douce", "Reformer + Springwall"].map(t => (
                      <option key={`_${t}`} value={t} />
                    ))}
                  </datalist>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lCls}>Date</label>
                    <input
                      type="date"
                      value={editSession.date || ""}
                      onChange={(e) => setEditSession((p) => ({ ...p!, date: e.target.value }))}
                      className={iCls}
                    />
                  </div>
                  <div>
                    <label className={lCls}>Heure</label>
                    <input
                      type="time"
                      value={editSession.time || ""}
                      onChange={(e) => setEditSession((p) => ({ ...p!, time: e.target.value }))}
                      className={iCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className={lCls}>Durée (min)</label>
                    <input
                      type="number"
                      value={editSession.duration || 55}
                      onChange={(e) => setEditSession((p) => ({ ...p!, duration: +e.target.value }))}
                      className={iCls}
                    />
                  </div>
                  <div>
                    <label className={lCls}>Capacité</label>
                    <input
                      type="number"
                      value={editSession.capacity || 13}
                      onChange={(e) => setEditSession((p) => ({ ...p!, capacity: +e.target.value }))}
                      className={iCls}
                    />
                  </div>
                  <div>
                    <label className={lCls}>Prix (DH)</label>
                    <input
                      type="number"
                      value={editSession.price || 350}
                      onChange={(e) => setEditSession((p) => ({ ...p!, price: +e.target.value }))}
                      className={iCls}
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className={lCls}>Coach</label>
                    <select
                      value={editSession.instructor || ""}
                      onChange={(e) => setEditSession((p) => ({ ...p!, instructor: e.target.value }))}
                      className={iCls}
                    >
                      <option value="">Choisir...</option>
                      {coachList.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className={lCls}>Type de cours</label>
                    <select
                      value={editSession.type || "Reformer"}
                      onChange={(e) => setEditSession((p) => ({ ...p!, type: e.target.value }))}
                      className={iCls}
                    >
                      {CLASS_TYPES.map((t) => (
                        <option key={t} value={t}>
                          {t}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div>
                  <label className={lCls}>Niveau</label>
                  <select
                    value={editSession.level || "Tous niveaux"}
                    onChange={(e) => setEditSession((p) => ({ ...p!, level: e.target.value }))}
                    className={iCls}
                  >
                    {["Tous niveaux", "Débutant", "Intermédiaire", "Avancé"].map((l) => (
                      <option key={l}>{l}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className={lCls}>Notes</label>
                  <textarea
                    value={editSession.notes || ""}
                    onChange={(e) => setEditSession((p) => ({ ...p!, notes: e.target.value }))}
                    className={iCls + " min-h-[60px] resize-none"}
                  />
                </div>
              </div>
              <div className="px-7 py-5 border-t border-border flex justify-between">
                {editSession.id && (
                  <button
                    onClick={() => {
                      deleteSession(editSession.id!);
                      setShowModal(false);
                    }}
                    className="text-destructive font-body text-[11px] tracking-widest uppercase hover:opacity-70 flex items-center gap-1"
                    style={{ fontWeight: 500 }}
                  >
                    <Trash2 size={13} /> Supprimer
                  </button>
                )}
                <div className="flex gap-3 ml-auto">
                  <button onClick={() => setShowModal(false)} className={btnG}>
                    Annuler
                  </button>
                  <button onClick={saveSession} className={btn1}>
                    <Save size={13} className="inline mr-1" />
                    {editSession.id ? "Enregistrer" : "Créer"}
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {profilePart && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[210] flex items-center justify-center bg-foreground/50 backdrop-blur-sm p-4"
            onClick={() => setProfilePart(null)}
          >
            <motion.div
              initial={{ y: 20, scale: 0.97 }}
              animate={{ y: 0, scale: 1 }}
              exit={{ y: 20, scale: 0.97 }}
              className="bg-card w-full max-w-lg max-h-[85vh] overflow-y-auto rounded-3xl shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="px-6 py-5 border-b border-border flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="w-12 h-12 bg-terra rounded-full flex items-center justify-center text-warm-white font-display text-lg"
                    style={{ fontWeight: 400 }}
                  >
                    {profilePart.first_name[0]?.toUpperCase()}
                  </div>
                  <div>
                    <p className="font-display text-xl text-foreground" style={{ fontWeight: 400 }}>
                      {profilePart.first_name} {profilePart.last_name}
                    </p>
                    <p className="font-body text-[11px] text-muted-foreground">Membre</p>
                  </div>
                </div>
                <button onClick={() => setProfilePart(null)} className="text-muted-foreground hover:text-terra">
                  <X size={18} />
                </button>
              </div>
              <div className="px-6 py-4 border-b border-border space-y-2">
                <a
                  href={`mailto:${profilePart.email}`}
                  className="flex items-center gap-3 font-body text-[13px] text-foreground hover:text-terra transition-colors"
                >
                  <Mail size={15} className="text-muted-foreground" />
                  {profilePart.email}
                </a>
                {profilePart.phone && (
                  <a
                    href={`tel:${profilePart.phone}`}
                    className="flex items-center gap-3 font-body text-[13px] text-foreground hover:text-terra transition-colors"
                  >
                    <Phone size={15} className="text-muted-foreground" />
                    {profilePart.phone}
                  </a>
                )}
                {profilePart.registered_at && (
                  <p className="flex items-center gap-3 font-body text-[11px] text-muted-foreground">
                    <CalendarCheck size={13} />
                    Inscrit le{" "}
                    {new Date(profilePart.registered_at).toLocaleDateString("fr-FR", {
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                )}
              </div>
              <div className="px-6 py-4">
                <p
                  className="font-body text-[11px] tracking-widest uppercase text-muted-foreground mb-3"
                  style={{ fontWeight: 600 }}
                >
                  Historique ({partHistory.length})
                </p>
                {histLoading && (
                  <p className="font-body text-[13px] text-muted-foreground text-center py-6">Chargement...</p>
                )}
                {!histLoading && partHistory.length === 0 && (
                  <p className="font-body text-[13px] text-muted-foreground text-center py-6">
                    Aucune réservation trouvée
                  </p>
                )}
                <div className="space-y-2">
                  {partHistory.map((b: any) => (
                    <div key={b.id} className="bg-secondary border border-border rounded-xl px-4 py-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-body text-[13px] text-foreground font-medium">{b.class_name}</p>
                          <p className="font-body text-[10px] text-muted-foreground">
                            {b.class_day} · {b.class_time} · {b.coach}
                          </p>
                        </div>
                        <span
                          className={`font-body text-[9px] tracking-widest uppercase px-2 py-1 rounded-full ${b.payment_status === "paid" || b.payment_status === "pack" ? "bg-success/15 text-success" : "bg-terra/10 text-terra"}`}
                          style={{ fontWeight: 600 }}
                        >
                          {b.payment_status === "paid"
                            ? "Payé"
                            : b.payment_status === "pack"
                              ? "Pack"
                              : b.payment_status === "pay_on_site"
                                ? "Sur place"
                                : "En attente"}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showWeekTypeEditor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center bg-foreground/40 backdrop-blur-sm"
            onClick={() => setShowWeekTypeEditor(false)}
          >
            <motion.div
              initial={{ y: 16 }}
              animate={{ y: 0 }}
              exit={{ y: 16 }}
              className="bg-card w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl rounded-3xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="sticky top-0 bg-card z-10 px-7 py-5 border-b border-border flex justify-between items-center rounded-t-3xl">
                <div>
                  <p className="font-display text-xl text-foreground" style={{ fontWeight: 400 }}>
                    Semaine type
                  </p>
                  <p className="font-body text-[11px] text-muted-foreground">
                    Ce programme est utilisé pour générer chaque semaine automatiquement
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => {
                      setEditTpl({
                        day: 1,
                        time: "09:00",
                        title: "",
                        type: "Reformer",
                        instructor: coachList[0] || "",
                        duration: 55,
                        price: 350,
                        capacity: 13,
                        level: "Tous niveaux",
                      });
                      setEditTplIdx(null);
                    }}
                    className={btn1 + " flex items-center gap-2"}
                  >
                    <Plus size={13} /> Ajouter
                  </button>
                  <button
                    onClick={() => setShowWeekTypeEditor(false)}
                    className="text-muted-foreground hover:text-terra"
                  >
                    <X size={18} />
                  </button>
                </div>
              </div>
              <div className="p-7">
                {editTpl && (
                  <div className="bg-secondary border border-terra/20 rounded-2xl p-5 mb-6 space-y-4">
                    <p className="font-body text-[11px] tracking-widest uppercase text-terra font-semibold">
                      {editTplIdx !== null ? "Modifier le créneau" : "Nouveau créneau"}
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <label className={lCls}>Jour</label>
                        <select
                          value={editTpl.day}
                          onChange={(e) => setEditTpl((t) => ({ ...t!, day: +e.target.value }))}
                          className={iCls}
                        >
                          {DAY_NAMES_FULL.map((d, i) => (
                            <option key={i} value={(i + 1) % 7}>
                              {d}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={lCls}>Heure</label>
                        <input
                          type="time"
                          value={editTpl.time}
                          onChange={(e) => setEditTpl((t) => ({ ...t!, time: e.target.value }))}
                          className={iCls}
                        />
                      </div>
                      <div>
                        <label className={lCls}>Durée (min)</label>
                        <input
                          type="number"
                          value={editTpl.duration}
                          onChange={(e) => setEditTpl((t) => ({ ...t!, duration: +e.target.value }))}
                          className={iCls}
                        />
                      </div>
                      <div>
                        <label className={lCls}>Capacité</label>
                        <input
                          type="number"
                          value={editTpl.capacity}
                          onChange={(e) => setEditTpl((t) => ({ ...t!, capacity: +e.target.value }))}
                          className={iCls}
                        />
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                      <div>
                        <label className={lCls}>Titre</label>
                        <input
                          value={editTpl.title}
                          onChange={(e) => setEditTpl((t) => ({ ...t!, title: e.target.value }))}
                          className={iCls}
                          placeholder="Reformer Signature"
                        />
                      </div>
                      <div>
                        <label className={lCls}>Type</label>
                        <select
                          value={editTpl.type}
                          onChange={(e) => setEditTpl((t) => ({ ...t!, type: e.target.value }))}
                          className={iCls}
                        >
                          {CLASS_TYPES.map((tp) => (
                            <option key={tp} value={tp}>
                              {tp}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className={lCls}>Coach</label>
                        <select
                          value={editTpl.instructor}
                          onChange={(e) => setEditTpl((t) => ({ ...t!, instructor: e.target.value }))}
                          className={iCls}
                        >
                          {coachList.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={() => {
                          if (!editTpl.title) return;
                          if (editTplIdx !== null) {
                            const w = [...weekTemplate];
                            w[editTplIdx] = editTpl;
                            setWeekTemplate(w);
                            saveWeekTemplate(w);
                          } else {
                            const w = [...weekTemplate, editTpl].sort(
                              (a, b) => a.day - b.day || a.time.localeCompare(b.time),
                            );
                            setWeekTemplate(w);
                            saveWeekTemplate(w);
                          }
                          setEditTpl(null);
                          setEditTplIdx(null);
                        }}
                        className={btn1}
                      >
                        Enregistrer
                      </button>
                      <button
                        onClick={() => {
                          setEditTpl(null);
                          setEditTplIdx(null);
                        }}
                        className={btnG}
                      >
                        Annuler
                      </button>
                    </div>
                  </div>
                )}
                {DAY_NAMES_FULL.map((dayName, di) => {
                  const jsDay = (di + 1) % 7;
                  const dayTpls = weekTemplate.map((t, i) => ({ t, i })).filter(({ t }) => t.day === jsDay);
                  if (dayTpls.length === 0) return null;
                  return (
                    <div key={dayName} className="mb-6">
                      <p className="font-body text-[10px] tracking-[0.3em] uppercase text-terra mb-2 font-semibold">
                        {dayName}
                      </p>
                      <div className="space-y-2">
                        {dayTpls.map(({ t, i }) => {
                          const c = getTypeColor(t.type);
                          return (
                            <div
                              key={i}
                              className="bg-card border border-border rounded-xl px-4 py-3 flex items-center justify-between gap-3"
                            >
                              <div className="flex items-center gap-3">
                                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: c.dot }} />
                                <div>
                                  <p className="font-body text-sm text-foreground font-medium">
                                    {t.time} · {t.title}
                                  </p>
                                  <p className="font-body text-[11px] text-muted-foreground">
                                    {t.instructor} · {t.duration}min · {t.capacity} places · {t.price} DH
                                  </p>
                                </div>
                              </div>
                              <div className="flex gap-2 shrink-0">
                                <button
                                  onClick={() => {
                                    setEditTpl(t);
                                    setEditTplIdx(i);
                                  }}
                                  className="text-muted-foreground hover:text-terra transition-colors"
                                >
                                  <MoreHorizontal size={15} />
                                </button>
                                <button
                                  onClick={() => {
                                    if (!confirm("Supprimer ce créneau ?")) return;
                                    const w = weekTemplate.filter((_, idx) => idx !== i);
                                    setWeekTemplate(w);
                                    saveWeekTemplate(w);
                                  }}
                                  className="text-muted-foreground hover:text-destructive transition-colors"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
                <div className="mt-4 pt-4 border-t border-border">
                  <button
                    onClick={() => {
                      if (confirm("Réinitialiser aux valeurs par défaut ?")) {
                        setWeekTemplate(STANDARD_WEEK);
                        saveWeekTemplate(STANDARD_WEEK);
                      }
                    }}
                    className="font-body text-[10px] tracking-widest uppercase text-muted-foreground hover:text-destructive transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    Réinitialiser par défaut
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
