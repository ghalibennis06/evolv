import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Bell, CheckCircle, XCircle, Mail, Phone, Clock,
  Search, Trash2, MessageCircle, RefreshCw, Star, Plus,
  ChevronDown, ChevronUp, Users, Calendar,
  Send, Timer, Filter, X,
  ExternalLink, User, CalendarCheck, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface WaitlistEntry {
  id: string;
  client_name: string;
  client_email: string;
  client_phone: string | null;
  class_name: string;
  class_day: string;
  class_time: string;
  coach: string;
  status: string;
  created_at: string;
  payment_status: string | null;
  original_session_id: string | null;
  notes: string | null;
}

interface SessionOption {
  id: string;
  title: string;
  date: string;
  time: string;
  instructor: string;
  capacity: number;
  enrolled: number;
  is_active: boolean;
}

interface CoachOption {
  id: string;
  name: string;
  is_active: boolean;
}

const iCls = "w-full bg-secondary border border-border px-3 py-2.5 rounded-xl font-body text-[13px] text-foreground focus:border-terra outline-none";
const btn1 = "bg-terra text-warm-white px-5 py-2 rounded-full font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra/90 transition-colors";

const STATUS = {
  pending:   { label: "En attente",  color: "text-[#D4A853]",      bg: "bg-[#D4A853]/10",   dot: "bg-[#D4A853]"  },
  contacted: { label: "Contacté",    color: "text-[#6B8F9E]",      bg: "bg-[#6B8F9E]/10",   dot: "bg-[#6B8F9E]"  },
  confirmed: { label: "Confirmé",    color: "text-[#4E9E7A]",      bg: "bg-[#4E9E7A]/10",   dot: "bg-[#4E9E7A]"  },
  cancelled: { label: "Annulé",      color: "text-muted-foreground", bg: "bg-muted/20",      dot: "bg-muted"      },
};

const PAYMENT_STATUS: Record<string, { label: string; color: string; bg: string }> = {
  paid:        { label: "Payé",      color: "text-[#4E9E7A]", bg: "bg-[#4E9E7A]/10 border-[#4E9E7A]/20" },
  Payé:        { label: "Payé",      color: "text-[#4E9E7A]", bg: "bg-[#4E9E7A]/10 border-[#4E9E7A]/20" },
  pack:        { label: "Pack",      color: "text-[#6B8F9E]", bg: "bg-[#6B8F9E]/10 border-[#6B8F9E]/20" },
  pay_on_site: { label: "Sur place", color: "text-[#D4A853]", bg: "bg-[#D4A853]/10 border-[#D4A853]/20" },
  pending:     { label: "En attente", color: "text-muted-foreground", bg: "bg-muted/20 border-border" },
  cancelled:   { label: "Annulé",    color: "text-destructive", bg: "bg-destructive/10 border-destructive/20" },
};

const getPriorityScore = (entry: WaitlistEntry): number => {
  const ageHours = (Date.now() - new Date(entry.created_at).getTime()) / 3600000;
  let score = Math.min(ageHours / 24, 10); // up to 10 pts for age
  if (entry.payment_status === "paid" || entry.payment_status === "Payé") score += 5;
  if (entry.payment_status === "pack") score += 4;
  return Math.round(score);
};

const getWaitTime = (iso: string): string => {
  const hours = (Date.now() - new Date(iso).getTime()) / 3600000;
  if (hours < 1) return `${Math.round(hours * 60)} min`;
  if (hours < 24) return `${Math.round(hours)}h`;
  const days = Math.floor(hours / 24);
  return `${days} jour${days > 1 ? "s" : ""}`;
};

const buildNotifyMsg = (entry: WaitlistEntry) =>
  encodeURIComponent(
    `Bonjour ${entry.client_name} 👋\n\nUne place vient de se libérer pour "${entry.class_name}"${entry.class_day !== "—" ? ` le ${entry.class_day}` : ""}${entry.class_time !== "—" ? ` à ${entry.class_time}` : ""}.\n\nRépondez rapidement pour confirmer votre place sur https://thecirclestudio.vercel.app/planning ✨\n\n— The Circle Studio`
  );

const buildContactMsg = (entry: WaitlistEntry) =>
  encodeURIComponent(
    `Bonjour ${entry.client_name} 👋 Merci de votre intérêt pour The Circle Studio ! Nous revenons vers vous concernant "${entry.class_name}".`
  );

export function AdminWaitlist() {
  const [entries,   setEntries]   = useState<WaitlistEntry[]>([]);
  const [loading,   setLoading]   = useState(true);
  const [search,    setSearch]    = useState("");
  const [profileEntry, setProfileEntry] = useState<WaitlistEntry | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [typeFilter,   setTypeFilter]   = useState<string>("all");
  const [coachFilter, setCoachFilter] = useState<string>("all");
  const [selected, setSelected]   = useState<string[]>([]);
  const [expanded, setExpanded]   = useState<string | null>(null);
  const [sessionsOptions, setSessionsOptions] = useState<SessionOption[]>([]);
  const [coachesOptions, setCoachesOptions] = useState<CoachOption[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [notifiedIds, setNotifiedIds] = useState<Set<string>>(new Set());
  const [sortBy, setSortBy] = useState<"date" | "priority">("date");
  const [bookingEntry, setBookingEntry] = useState<WaitlistEntry | null>(null);
  const [bookingLoading, setBookingLoading] = useState(false);
  const [bookingDone, setBookingDone] = useState<string | null>(null); // entry id
  const [manual, setManual] = useState({
    client_name: "",
    client_email: "",
    client_phone: "",
    selected_date: "",
    selected_session_id: "",
    class_name: "Intérêt général",
    class_day: "—",
    class_time: "—",
    coach: "",
    notes: "",
  });

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("waitlist")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setEntries(data || []);
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  useEffect(() => {
    supabase
      .from("coaches")
      .select("id,name,is_active")
      .eq("is_active", true)
      .order("display_order", { ascending: true })
      .then(({ data }) => setCoachesOptions((data as CoachOption[]) || []));

    supabase
      .from("sessions")
      .select("id,title,date,time,instructor,capacity,is_active")
      .eq("is_active", true)
      .gte("date", new Date().toISOString().split("T")[0])
      .order("date", { ascending: true })
      .order("time", { ascending: true })
      .then(async ({ data: sesData }) => {
        if (!sesData) return;
        // Get enrollment counts
        const ids = sesData.map((s: any) => s.id);
        const { data: partData } = await supabase
          .from("session_participants")
          .select("session_id")
          .in("session_id", ids)
          .eq("status", "confirmed");
        const countMap: Record<string, number> = {};
        (partData || []).forEach((p: any) => {
          countMap[p.session_id] = (countMap[p.session_id] || 0) + 1;
        });
        setSessionsOptions(
          sesData.map((s: any) => ({ ...s, enrolled: countMap[s.id] || 0 })) as SessionOption[]
        );
      });
  }, []);

  // Realtime
  useEffect(() => {
    const ch = supabase.channel("waitlist-admin")
      .on("postgres_changes", { event: "*", schema: "public", table: "waitlist" }, load)
      .subscribe();
    return () => { supabase.removeChannel(ch); };
  }, [load]);

  const updateStatus = async (id: string, status: string) => {
    await supabase.from("waitlist").update({ status }).eq("id", id);
    setEntries(p => p.map(e => e.id === id ? { ...e, status } : e));
  };

  const bulkUpdateStatus = async (status: string) => {
    for (const id of selected) {
      await supabase.from("waitlist").update({ status }).eq("id", id);
    }
    setEntries(p => p.map(e => selected.includes(e.id) ? { ...e, status } : e));
    setSelected([]);
  };

  const deleteEntry = async (id: string) => {
    if (!confirm("Supprimer cette entrée ?")) return;
    await supabase.from("waitlist").delete().eq("id", id);
    setEntries(p => p.filter(e => e.id !== id));
  };

  const bookDirectly = async (entry: WaitlistEntry) => {
    if (!entry.original_session_id) return;
    setBookingLoading(true);
    try {
      // 1. Insert into session_participants
      const nameParts = entry.client_name.trim().split(" ");
      const firstName = nameParts[0] ?? entry.client_name;
      const lastName = nameParts.slice(1).join(" ") || "—";
      // Map waitlist payment_status to session_participants vocabulary
      const mapPayment = (ps: string | null) => {
        if (!ps) return "En attente";
        if (ps === "paid" || ps === "Payé") return "Payé";
        if (ps === "pack") return "Pack";
        return "En attente";
      };
      const { error: insertError } = await supabase
        .from("session_participants")
        .insert({
          session_id: entry.original_session_id,
          first_name: firstName,
          last_name: lastName,
          email: entry.client_email,
          phone: entry.client_phone ?? "",
          payment_status: mapPayment(entry.payment_status),
          notes: `Converti depuis liste d'attente${entry.notes ? ` — ${entry.notes}` : ""}`,
          registered_at: new Date().toISOString(),
        });
      if (insertError) throw insertError;

      // 2. Increment sessions.enrolled
      const { data: sesRow } = await supabase
        .from("sessions")
        .select("enrolled")
        .eq("id", entry.original_session_id)
        .single();
      await supabase
        .from("sessions")
        .update({ enrolled: (sesRow?.enrolled ?? 0) + 1 })
        .eq("id", entry.original_session_id);

      // 3. Mark waitlist entry as confirmed
      await supabase.from("waitlist").update({ status: "confirmed" }).eq("id", entry.id);
      setEntries(p => p.map(e => e.id === entry.id ? { ...e, status: "confirmed" } : e));
      setBookingDone(entry.id);
      setBookingEntry(null);

      // Send confirmation email (non-blocking)
      if (entry.client_email) {
        supabase.functions.invoke("send-email", {
          body: {
            to: entry.client_email,
            subject: `Réservation confirmée — ${entry.class_name} · The Circle Studio`,
            html: `<div style="font-family:Montserrat,sans-serif;max-width:520px;margin:0 auto;background:#FBF7F2;padding:0"><div style="background:#B8634A;padding:32px"><p style="color:rgba(251,247,242,0.7);font-size:10px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 8px">The Circle Studio</p><h1 style="color:#FBF7F2;font-size:28px;font-weight:200;margin:0;font-family:Georgia,serif">Réservation confirmée ✓</h1></div><div style="padding:32px"><p style="color:#3D2318;font-size:15px;margin:0 0 20px">Bonjour <strong>${entry.client_name}</strong>,</p><div style="background:#FFF8F5;border:1px solid rgba(184,99,74,0.2);border-radius:12px;padding:20px;margin:0 0 24px"><p style="color:#B8634A;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 10px">Votre séance</p><p style="color:#3D2318;font-size:22px;font-weight:300;margin:0;font-family:Georgia,serif">${entry.class_name}</p><p style="color:#7A3040;font-size:14px;margin:6px 0 0">${entry.class_day} · ${entry.class_time}</p></div><p style="color:#5A4538;font-size:14px;line-height:1.9;margin:0 0 8px">Nous vous attendons ! Pensez à arriver 5 minutes avant.</p><p style="color:#5A4538;font-size:14px;margin:0 0 32px">Annulation gratuite jusqu'à 2h avant le début.</p><p style="color:#9D8070;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">The Circle Studio · El Menzeh, Rabat</p></div></div>`,
          },
        }).catch(() => {});
      }

      // WhatsApp quick-send toast action
      if (entry.client_phone) {
        const phone = (entry.client_phone || "").replace(/\D/g, "");
        if (phone) {
          const waMsg = encodeURIComponent(`Bonjour ${entry.client_name} 👋\n\nVotre réservation pour *${entry.class_name}* est confirmée ✓\n\nNous vous attendons — The Circle Studio 🌿`);
          toast("WhatsApp de confirmation", {
            description: `Envoyer à ${entry.client_name}`,
            action: { label: "Envoyer →", onClick: () => window.open(`https://wa.me/${phone}?text=${waMsg}`, "_blank") },
            duration: 10000,
          });
        }
      }
    } catch (err: any) {
      alert(`Erreur lors de la réservation : ${err?.message ?? err}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const bookIntoSession = async (entry: WaitlistEntry, session: SessionOption) => {
    setBookingLoading(true);
    try {
      const nameParts = entry.client_name.trim().split(" ");
      const firstName = nameParts[0] ?? entry.client_name;
      const lastName = nameParts.slice(1).join(" ") || "—";
      const mapPayment = (ps: string | null) => {
        if (!ps) return "En attente";
        if (ps === "paid" || ps === "Payé") return "Payé";
        if (ps === "pack") return "Pack";
        return "En attente";
      };
      const { error: insertError } = await supabase
        .from("session_participants")
        .insert({
          session_id: session.id,
          first_name: firstName,
          last_name: lastName,
          email: entry.client_email,
          phone: entry.client_phone ?? "",
          payment_status: mapPayment(entry.payment_status),
          notes: `Reprogrammé depuis liste d'attente (${entry.class_name})${entry.notes ? ` — ${entry.notes}` : ""}`,
          registered_at: new Date().toISOString(),
        });
      if (insertError) throw insertError;

      const { data: sesRow } = await supabase.from("sessions").select("enrolled").eq("id", session.id).single();
      await supabase.from("sessions").update({ enrolled: (sesRow?.enrolled ?? 0) + 1 }).eq("id", session.id);

      await supabase.from("waitlist").update({ status: "confirmed" }).eq("id", entry.id);
      setEntries(p => p.map(e => e.id === entry.id ? { ...e, status: "confirmed" } : e));
      setBookingDone(entry.id);
      setProfileEntry(null);

      toast.success(`${entry.client_name} inscrit(e) à "${session.title}" ✓`);

      if (entry.client_phone) {
        const phone = (entry.client_phone || "").replace(/\D/g, "");
        if (phone) {
          const dayStr = new Date(session.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" });
          const waMsg = encodeURIComponent(`Bonjour ${entry.client_name} 👋\n\nVotre réservation pour *${session.title}* est confirmée ✓\n📅 ${dayStr} à ${session.time}\n\nNous vous attendons — The Circle Studio 🌿`);
          toast("WhatsApp de confirmation", {
            description: `Envoyer à ${entry.client_name}`,
            action: { label: "Envoyer →", onClick: () => window.open(`https://wa.me/${phone}?text=${waMsg}`, "_blank") },
            duration: 10000,
          });
        }
      }
    } catch (err: any) {
      toast.error(`Erreur : ${err?.message ?? err}`);
    } finally {
      setBookingLoading(false);
    }
  };

  const updatePaymentStatus = async (id: string, payment_status: string) => {
    await supabase.from("waitlist").update({ payment_status }).eq("id", id);
    setEntries(p => p.map(e => e.id === id ? { ...e, payment_status } : e));
  };

  const reschedule = async (entry: WaitlistEntry, session: SessionOption) => {
    const update = {
      class_name: session.title,
      class_day: new Date(session.date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "2-digit" }),
      class_time: session.time,
      coach: session.instructor,
      original_session_id: session.id,
      status: "contacted",
    };
    await supabase.from("waitlist").update(update).eq("id", entry.id);
    setEntries(p => p.map(e => e.id === entry.id ? { ...e, ...update } : e));
  };

  const toggleSelect = (id: string) =>
    setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const addManualEntry = async () => {
    if (!manual.client_name || !manual.client_email) return;
    const { selected_date: _sd, selected_session_id: _ss, ...fields } = manual;
    const payload = {
      ...fields,
      client_phone: manual.client_phone || null,
      notes: manual.notes || "Ajouté manuellement depuis l'admin",
      status: "pending",
    };
    const { data, error } = await supabase.from("waitlist").insert(payload).select("*").single();
    if (error) return alert("Erreur lors de l'ajout.");
    setEntries((p) => [data as WaitlistEntry, ...p]);
    setManual({ client_name: "", client_email: "", client_phone: "", selected_date: "", selected_session_id: "", class_name: "Intérêt général", class_day: "—", class_time: "—", coach: "", notes: "" });
    setShowAddForm(false);
  };

  const isGeneral = (e: WaitlistEntry) =>
    e.class_name === "Intérêt général" || e.class_name === "—" || e.class_time === "—";

  // Build bulk WhatsApp message (opens individually — no batch API)
  const bulkWhatsApp = () => {
    const targets = entries.filter(e => selected.includes(e.id) && e.client_phone);
    if (targets.length === 0) return alert("Aucun numéro disponible parmi la sélection.");
    targets.forEach((e, i) => {
      setTimeout(() => {
        window.open(`https://wa.me/${e.client_phone!.replace(/\D/g, "")}?text=${buildNotifyMsg(e)}`, "_blank");
      }, i * 800);
    });
  };

  const filtered = entries.filter(e => {
    const q = search.toLowerCase();
    const matchSearch = !q || e.client_name.toLowerCase().includes(q) || e.client_email.toLowerCase().includes(q) || e.class_name.toLowerCase().includes(q);
    const matchStatus = statusFilter === "all" || e.status === statusFilter;
    const matchCoach  = coachFilter === "all" || e.coach === coachFilter;
    const matchType   = typeFilter === "all"
      || (typeFilter === "general" && isGeneral(e))
      || (typeFilter === "session" && !isGeneral(e));
    return matchSearch && matchStatus && matchCoach && matchType;
  });

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "priority") return getPriorityScore(b) - getPriorityScore(a);
    return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
  });

  const availableSessionsForDate = manual.selected_date
    ? sessionsOptions.filter((s) => s.date === manual.selected_date)
    : [];

  const counts = {
    all: entries.length,
    pending:   entries.filter(e => e.status === "pending").length,
    contacted: entries.filter(e => e.status === "contacted").length,
    confirmed: entries.filter(e => e.status === "confirmed").length,
    cancelled: entries.filter(e => e.status === "cancelled").length,
  };

  // Find session availability for an entry
  const getSessionAvailability = (entry: WaitlistEntry) => {
    if (!entry.original_session_id) return null;
    const s = sessionsOptions.find(s => s.id === entry.original_session_id);
    if (!s || !s.capacity) return null;
    const available = s.capacity - s.enrolled;
    return { available, capacity: s.capacity, enrolled: s.enrolled };
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={20} className="animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-4">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="font-body text-[9px] tracking-[0.4em] uppercase text-terra mb-0.5" style={{ fontWeight: 500 }}>Gestion</p>
          <h2 className="font-display text-xl text-foreground" style={{ fontWeight: 300 }}>Liste d'attente</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="hidden sm:flex items-center gap-0 text-[10px] font-body divide-x divide-border">
            <span className="pr-3 text-muted-foreground">{counts.all} total</span>
            <span className="px-3 text-[#D4A853]">{counts.pending} en attente</span>
            <span className="pl-3 text-[#4E9E7A]">{counts.confirmed} confirmés</span>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full font-body text-[10px] tracking-[0.2em] uppercase transition-all border ${showAddForm ? "bg-foreground text-background border-foreground" : "bg-terra text-warm-white border-terra hover:bg-terra/90"}`}
            style={{ fontWeight: 500 }}
          >
            <Plus size={12} /> Ajouter
          </button>
        </div>
      </div>

      {/* ── Filters ── */}
      <div className="bg-card border border-border rounded-2xl p-4 space-y-3">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-secondary border border-border pl-9 pr-4 py-2.5 rounded-xl font-body text-[13px] text-foreground focus:border-terra outline-none"
            placeholder="Nom, email, cours…"
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {([
            { key: "all",       label: "Tous",       count: counts.all,       cls: "bg-terra border-terra" },
            { key: "pending",   label: "En attente", count: counts.pending,   cls: "bg-[#D4A853] border-[#D4A853]" },
            { key: "contacted", label: "Contactés",  count: counts.contacted, cls: "bg-[#6B8F9E] border-[#6B8F9E]" },
            { key: "confirmed", label: "Confirmés",  count: counts.confirmed, cls: "bg-[#4E9E7A] border-[#4E9E7A]" },
            { key: "cancelled", label: "Annulés",    count: counts.cancelled, cls: "bg-muted-foreground border-muted-foreground" },
          ] as const).map(({ key, label, count, cls }) => (
            <button key={key} onClick={() => setStatusFilter(key)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full font-body text-[10px] tracking-widest uppercase border transition-all ${statusFilter === key ? cls + " text-white" : "border-border text-muted-foreground hover:border-terra/30"}`}
              style={{ fontWeight: 500 }}>
              {label}
              <span className={`min-w-[16px] text-center text-[9px] rounded-full ${statusFilter === key ? "opacity-70" : "bg-secondary px-1"}`}>{count}</span>
            </button>
          ))}
          <div className="flex-1" />
          <select value={coachFilter} onChange={e => setCoachFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl font-body text-[10px] tracking-widest uppercase border border-border bg-card text-muted-foreground focus:border-terra outline-none cursor-pointer">
            <option value="all">Tous coachs</option>
            {coachesOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
          </select>
          <select value={sortBy} onChange={e => setSortBy(e.target.value as "date" | "priority")}
            className="px-3 py-1.5 rounded-xl font-body text-[10px] tracking-widest uppercase border border-border bg-card text-muted-foreground focus:border-terra outline-none cursor-pointer">
            <option value="date">Par date</option>
            <option value="priority">Par priorité</option>
          </select>
          <button onClick={() => setTypeFilter(typeFilter === "general" ? "all" : "general")}
            className={`px-3 py-1.5 rounded-xl font-body text-[10px] tracking-widest uppercase border transition-all ${typeFilter === "general" ? "bg-foreground text-background border-foreground" : "border-border text-muted-foreground hover:border-terra/30"}`}
            style={{ fontWeight: 500 }}>
            <Star size={9} className="inline mr-1" />Général
          </button>
        </div>
      </div>

      {/* ── Add form ── */}
      <AnimatePresence>
        {showAddForm && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="overflow-hidden"
          >
            <div className="bg-card border border-terra/20 rounded-2xl p-5">
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-terra mb-4" style={{ fontWeight: 600 }}>
                Ajouter manuellement
              </p>
              <div className="grid md:grid-cols-3 gap-2 mb-2">
                <input className={iCls} placeholder="Nom complet *" value={manual.client_name} onChange={e => setManual(m => ({ ...m, client_name: e.target.value }))} />
                <input className={iCls} placeholder="Email *" value={manual.client_email} onChange={e => setManual(m => ({ ...m, client_email: e.target.value }))} />
                <input className={iCls} placeholder="Téléphone (ex: +212...)" value={manual.client_phone} onChange={e => setManual(m => ({ ...m, client_phone: e.target.value }))} />
              </div>
              <div className="grid md:grid-cols-2 gap-2 mb-2">
                <input type="date" className={iCls} value={manual.selected_date}
                  onChange={e => setManual(m => ({ ...m, selected_date: e.target.value, selected_session_id: "" }))} />
                <select className={iCls} value={manual.selected_session_id}
                  onChange={e => {
                    const id = e.target.value;
                    const found = availableSessionsForDate.find(s => s.id === id);
                    if (!found) { setManual(m => ({ ...m, selected_session_id: "" })); return; }
                    setManual(m => ({
                      ...m, selected_session_id: id,
                      class_name: found.title,
                      class_day: new Date(found.date).toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "2-digit" }),
                      class_time: found.time,
                      coach: found.instructor || m.coach,
                    }));
                  }}>
                  <option value="">Séance (optionnel)</option>
                  {availableSessionsForDate.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.time} · {s.title} · {s.instructor}
                      {s.capacity ? ` (${s.enrolled}/${s.capacity})` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid md:grid-cols-2 gap-2 mb-3">
                {!manual.selected_session_id && (
                  <select className={iCls} value={manual.coach} onChange={e => setManual(m => ({ ...m, coach: e.target.value }))}>
                    <option value="">Coach (optionnel)</option>
                    {coachesOptions.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                  </select>
                )}
                <input className={iCls} placeholder="Note interne (optionnel)" value={manual.notes} onChange={e => setManual(m => ({ ...m, notes: e.target.value }))} />
              </div>
              <div className="flex gap-2">
                <button onClick={addManualEntry} className={btn1 + " inline-flex items-center gap-2"}>
                  <Plus size={12} /> Ajouter
                </button>
                <button onClick={() => setShowAddForm(false)} className="px-4 py-2 rounded-full font-body text-[11px] border border-border text-muted-foreground hover:border-terra/30 transition-colors">
                  Annuler
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Bulk actions ── */}
      <AnimatePresence>
        {selected.length > 0 && (
          <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
            className="flex items-center gap-3 bg-terra/10 border border-terra/30 rounded-2xl px-4 py-3 flex-wrap">
            <span className="font-body text-[12px] text-terra font-medium">{selected.length} sélectionné(s)</span>
            <div className="flex gap-2 flex-wrap ml-auto">
              {(["contacted", "confirmed", "cancelled"] as const).map(s => (
                <button key={s} onClick={() => bulkUpdateStatus(s)}
                  className="px-3 py-1.5 rounded-full font-body text-[10px] tracking-widest uppercase border border-terra/30 text-terra hover:bg-terra hover:text-warm-white transition-all"
                  style={{ fontWeight: 500 }}>
                  → {STATUS[s].label}
                </button>
              ))}
              <button onClick={bulkWhatsApp}
                className="px-3 py-1.5 rounded-full font-body text-[10px] tracking-widest uppercase border border-[#25D366]/30 text-[#128C7E] hover:bg-[#25D366]/10 transition-all flex items-center gap-1"
                style={{ fontWeight: 500 }}>
                <Send size={9} /> WhatsApp notif.
              </button>
              <button onClick={() => setSelected([])} className="text-muted-foreground hover:text-foreground transition-colors ml-1">
                <XCircle size={16} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Profile slide-over ── */}
      <AnimatePresence>
        {profileEntry && (() => {
          const pe = profileEntry;
          const ps = STATUS[pe.status as keyof typeof STATUS] ?? STATUS.pending;
          const pmt = pe.payment_status ? PAYMENT_STATUS[pe.payment_status] ?? { label: pe.payment_status, color: "text-muted-foreground", bg: "bg-muted/20 border-border" } : null;
          const av = getSessionAvailability(pe);
          const prio = getPriorityScore(pe);
          const wait = getWaitTime(pe.created_at);
          return (
            <>
              {/* Backdrop */}
              <motion.div
                key="backdrop"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                onClick={() => setProfileEntry(null)}
                className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40"
              />
              {/* Panel */}
              <motion.div
                key="panel"
                initial={{ x: "100%" }}
                animate={{ x: 0 }}
                exit={{ x: "100%" }}
                transition={{ type: "spring", stiffness: 320, damping: 32 }}
                className="fixed top-0 right-0 h-full w-full max-w-[480px] bg-card border-l border-border z-50 flex flex-col overflow-hidden"
              >
                {/* Header */}
                <div className="px-6 py-5 border-b border-border flex items-start justify-between gap-4 shrink-0">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-terra/10 flex items-center justify-center shrink-0">
                      <span className="font-display text-terra text-xl" style={{ fontWeight: 300 }}>
                        {pe.client_name[0]?.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <h3 className="font-display text-lg text-foreground" style={{ fontWeight: 300 }}>{pe.client_name}</h3>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className={`w-1.5 h-1.5 rounded-full ${ps.dot}`} />
                        <span className={`font-body text-[10px] tracking-widest uppercase ${ps.color}`} style={{ fontWeight: 600 }}>{ps.label}</span>
                        {pmt && (
                          <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${pmt.bg} ${pmt.color}`} style={{ fontWeight: 600 }}>
                            {pmt.label}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                  <button onClick={() => setProfileEntry(null)} className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors shrink-0 mt-0.5">
                    <X size={14} />
                  </button>
                </div>

                {/* Scrollable body */}
                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">

                  {/* Stats row */}
                  <div className="grid grid-cols-3 gap-3">
                    <div className="bg-secondary/50 rounded-xl p-3 text-center">
                      <p className="font-display text-xl text-terra" style={{ fontWeight: 300 }}>{prio}</p>
                      <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">Priorité</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-3 text-center">
                      <p className="font-display text-xl text-foreground" style={{ fontWeight: 300 }}>{wait}</p>
                      <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">Attente</p>
                    </div>
                    <div className="bg-secondary/50 rounded-xl p-3 text-center">
                      <p className="font-display text-xl text-foreground" style={{ fontWeight: 300 }}>
                        {new Date(pe.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                      </p>
                      <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground mt-0.5">Inscrit</p>
                    </div>
                  </div>

                  {/* Contact */}
                  <div>
                    <p className="font-body text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 600 }}>Contact</p>
                    <div className="space-y-2">
                      <a href={`mailto:${pe.client_email}`}
                        className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 text-foreground hover:text-terra hover:bg-secondary transition-colors group">
                        <Mail size={14} className="text-muted-foreground group-hover:text-terra transition-colors shrink-0" />
                        <span className="font-body text-[13px] truncate">{pe.client_email}</span>
                        <ExternalLink size={11} className="text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                      </a>
                      {pe.client_phone ? (
                        <a href={`tel:${pe.client_phone}`}
                          className="flex items-center gap-3 bg-secondary/50 rounded-xl px-4 py-3 text-foreground hover:text-terra hover:bg-secondary transition-colors group">
                          <Phone size={14} className="text-muted-foreground group-hover:text-terra transition-colors shrink-0" />
                          <span className="font-body text-[13px]">{pe.client_phone}</span>
                          <ExternalLink size={11} className="text-muted-foreground ml-auto shrink-0 opacity-0 group-hover:opacity-100 transition-opacity" />
                        </a>
                      ) : (
                        <div className="flex items-center gap-3 bg-secondary/30 rounded-xl px-4 py-3 text-muted-foreground">
                          <Phone size={14} className="shrink-0" />
                          <span className="font-body text-[12px] italic">Aucun numéro</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Session */}
                  <div>
                    <p className="font-body text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 600 }}>Séance demandée</p>
                    <div className="bg-secondary/50 rounded-xl px-4 py-3 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-terra shrink-0" />
                        <span className="font-body text-[13px] text-foreground">{pe.class_name}</span>
                      </div>
                      {pe.class_day !== "—" && (
                        <p className="font-body text-[12px] text-muted-foreground pl-5">{pe.class_day}{pe.class_time !== "—" ? ` · ${pe.class_time}` : ""}</p>
                      )}
                      {pe.coach && (
                        <p className="font-body text-[12px] text-muted-foreground pl-5 flex items-center gap-1.5">
                          <User size={10} />Coach: {pe.coach}
                        </p>
                      )}
                      {av !== null && (
                        <div className={`flex items-center gap-1.5 mt-1.5 font-body text-[11px] rounded-lg px-2.5 py-1.5 ${av.available > 0 ? "bg-[#4E9E7A]/10 text-[#4E9E7A]" : "bg-muted text-muted-foreground"}`}>
                          <Users size={10} />
                          {av.available > 0 ? `${av.available} place(s) libre(s)` : "Complet"} · {av.enrolled}/{av.capacity}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Notes */}
                  {pe.notes && (
                    <div>
                      <p className="font-body text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 600 }}>Note interne</p>
                      <p className="font-body text-[12px] text-muted-foreground italic bg-secondary/50 rounded-xl px-4 py-3">{pe.notes}</p>
                    </div>
                  )}

                  {/* Status updaters */}
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="font-body text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-1.5" style={{ fontWeight: 600 }}>Statut liste</p>
                      <select
                        value={pe.status}
                        onChange={ev => { updateStatus(pe.id, ev.target.value); setProfileEntry(p => p ? { ...p, status: ev.target.value } : p); }}
                        className="w-full bg-secondary border border-border px-3 py-2.5 rounded-xl font-body text-[12px] text-foreground focus:border-terra outline-none"
                      >
                        {Object.entries(STATUS).map(([val, { label }]) => (
                          <option key={val} value={val}>{label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <p className="font-body text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-1.5" style={{ fontWeight: 600 }}>Statut paiement</p>
                      <select
                        value={pe.payment_status || ""}
                        onChange={ev => { updatePaymentStatus(pe.id, ev.target.value); setProfileEntry(p => p ? { ...p, payment_status: ev.target.value } : p); }}
                        className="w-full bg-secondary border border-border px-3 py-2.5 rounded-xl font-body text-[12px] text-foreground focus:border-terra outline-none"
                      >
                        <option value="">— Non renseigné</option>
                        <option value="pending">En attente</option>
                        <option value="pay_on_site">Sur place</option>
                        <option value="pack">Pack / carte</option>
                        <option value="paid">Payé en ligne</option>
                        <option value="cancelled">Annulé</option>
                      </select>
                    </div>
                  </div>

                  {/* Reprogrammer sur une séance */}
                  <div>
                    <p className="font-body text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 600 }}>Reprogrammer sur une séance</p>
                    <div className="space-y-1.5 max-h-64 overflow-y-auto">
                      {sessionsOptions.map(s => {
                        const isFull = s.capacity > 0 && s.enrolled >= s.capacity;
                        return (
                          <div key={s.id} className="flex items-center gap-2 p-3 rounded-xl bg-secondary/50 border border-border hover:border-terra/20 transition-colors">
                            <div className="flex-1 min-w-0">
                              <p className="font-body text-[12px] text-foreground">{s.title}</p>
                              <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                                {new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })} · {s.time.slice(0,5)} · {s.instructor}
                              </p>
                            </div>
                            <span className={`font-body text-[9px] px-2 py-0.5 rounded-full shrink-0 ${isFull ? "bg-destructive/10 text-destructive" : "bg-terra/10 text-terra"}`}>
                              {s.capacity ? `${s.enrolled}/${s.capacity}` : "—"}
                            </span>
                            <button
                              onClick={() => bookIntoSession(pe, s)}
                              disabled={bookingLoading}
                              className="shrink-0 px-3 py-1.5 rounded-full bg-terra text-warm-white font-body text-[9px] tracking-[0.15em] uppercase hover:bg-terra/90 transition-colors disabled:opacity-50"
                              style={{ fontWeight: 600 }}
                            >
                              {bookingLoading ? "…" : "Inscrire →"}
                            </button>
                          </div>
                        );
                      })}
                      {sessionsOptions.length === 0 && (
                        <p className="font-body text-[12px] text-muted-foreground text-center py-4">Aucune séance à venir</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Footer actions */}
                <div className="px-6 py-4 border-t border-border bg-background/50 shrink-0 space-y-2">
                  {/* Primary CTA — book internally */}
                  {pe.original_session_id && pe.status !== "confirmed" && (
                    <button
                      onClick={() => bookDirectly(pe)}
                      disabled={bookingLoading}
                      className="w-full inline-flex items-center justify-center gap-2 bg-terra text-warm-white px-4 py-3 rounded-xl font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra/90 transition-colors disabled:opacity-60"
                      style={{ fontWeight: 600 }}
                    >
                      {bookingLoading ? (
                        <Loader2 size={13} className="animate-spin" />
                      ) : (
                        <CalendarCheck size={13} />
                      )}
                      {bookingLoading ? "Réservation en cours…" : "Confirmer la réservation"}
                    </button>
                  )}
                  {pe.status === "confirmed" && (
                    <div className="w-full inline-flex items-center justify-center gap-2 bg-[#4E9E7A]/10 text-[#4E9E7A] border border-[#4E9E7A]/30 px-4 py-3 rounded-xl font-body text-[11px] tracking-[0.2em] uppercase"
                      style={{ fontWeight: 600 }}>
                      <CheckCircle size={13} /> Réservation confirmée
                    </div>
                  )}
                  {/* Secondary: notify */}
                  <div className="flex gap-2">
                    {pe.client_phone && (
                      <a
                        href={`https://wa.me/${pe.client_phone.replace(/\D/g, "")}?text=${buildNotifyMsg(pe)}`}
                        onClick={() => { updateStatus(pe.id, "contacted"); setNotifiedIds(p => new Set([...p, pe.id])); }}
                        target="_blank" rel="noopener noreferrer"
                        className="flex-1 inline-flex items-center justify-center gap-1.5 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 px-3 py-2.5 rounded-full font-body text-[10px] tracking-[0.15em] uppercase hover:bg-[#25D366]/20 transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        <Send size={10} /> WhatsApp
                      </a>
                    )}
                    <a
                      href={`mailto:${pe.client_email}?subject=Place disponible — The Circle&body=Bonjour ${pe.client_name},%0D%0A%0D%0AUne place vient de se libérer pour "${pe.class_name}". Merci de nous contacter rapidement.%0D%0A%0D%0AThe Circle Studio`}
                      className="flex-1 inline-flex items-center justify-center gap-1.5 bg-secondary text-muted-foreground border border-border px-3 py-2.5 rounded-full font-body text-[10px] tracking-[0.15em] uppercase hover:border-terra/30 hover:text-terra transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <Mail size={10} /> Email
                    </a>
                  </div>
                  <button
                    onClick={() => { deleteEntry(pe.id); setProfileEntry(null); }}
                    className="w-full inline-flex items-center justify-center gap-1.5 bg-destructive/5 text-destructive border border-destructive/15 px-3 py-2.5 rounded-full font-body text-[10px] tracking-[0.15em] uppercase hover:bg-destructive/10 transition-colors"
                    style={{ fontWeight: 500 }}
                  >
                    <Trash2 size={10} /> Supprimer de la liste
                  </button>
                </div>
              </motion.div>
            </>
          );
        })()}
      </AnimatePresence>

      {/* ── Table ── */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        {sorted.length === 0 ? (
          <div className="p-12 text-center">
            <Bell size={28} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-body text-muted-foreground">Aucune entrée</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {sorted.map(e => {
              const s = STATUS[e.status as keyof typeof STATUS] ?? STATUS.pending;
              const general = isGeneral(e);
              const priority = getPriorityScore(e);
              const waitTime = getWaitTime(e.created_at);
              const availability = getSessionAvailability(e);
              const isExpanded = expanded === e.id;
              const isNotified = notifiedIds.has(e.id);

              return (
                <div key={e.id} className={`transition-colors ${selected.includes(e.id) ? "bg-terra/5" : "hover:bg-secondary/30"}`}>
                  {/* Main row */}
                  <div className="px-4 py-3 flex items-center gap-3">
                    <input type="checkbox" checked={selected.includes(e.id)} onChange={() => toggleSelect(e.id)}
                      className="w-4 h-4 accent-[#B8634A] rounded shrink-0 cursor-pointer" />

                    {/* Avatar */}
                    <button onClick={() => setProfileEntry(e)} className="relative shrink-0 group" title="Voir le profil">
                      <div className="w-8 h-8 rounded-full bg-terra/10 group-hover:bg-terra/20 flex items-center justify-center transition-colors">
                        <span className="font-display text-terra text-sm" style={{ fontWeight: 400 }}>
                          {e.client_name[0]?.toUpperCase()}
                        </span>
                      </div>
                      {priority >= 8 && (
                        <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#D4A853] rounded-full flex items-center justify-center">
                          <span className="text-[6px] text-white font-bold">!</span>
                        </div>
                      )}
                    </button>

                    {/* Name + info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setProfileEntry(e)}
                          className="font-body text-[13px] text-foreground hover:text-terra transition-colors text-left truncate max-w-[160px]">
                          {e.client_name}
                        </button>
                        {general && (
                          <span className="font-body text-[8px] tracking-widest uppercase text-[#D4A853] bg-[#D4A853]/10 px-1.5 py-0.5 rounded-full shrink-0" style={{ fontWeight: 600 }}>
                            <Star size={7} className="inline" /> Gén.
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2 mt-0.5 text-[11px] text-muted-foreground">
                        {!general && e.class_name && (
                          <span className="truncate max-w-[200px]">{e.class_name}{e.class_time !== "—" ? ` · ${e.class_time}` : ""}</span>
                        )}
                        <span className="flex items-center gap-1 shrink-0"><Timer size={9} />{waitTime}</span>
                      </div>
                    </div>

                    {/* Availability badge */}
                    {availability !== null && (
                      <span className={`hidden sm:inline font-body text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full shrink-0 ${availability.available > 0 ? "bg-[#4E9E7A]/10 text-[#4E9E7A]" : "bg-muted text-muted-foreground"}`} style={{ fontWeight: 600 }}>
                        {availability.available > 0 ? `${availability.available}p libre` : "Complet"}
                      </span>
                    )}

                    {/* Status badge */}
                    <span className={`font-body text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full shrink-0 ${s.bg} ${s.color}`} style={{ fontWeight: 600 }}>
                      {s.label}
                    </span>

                    {/* Payment badge */}
                    {e.payment_status && (() => {
                      const ps = PAYMENT_STATUS[e.payment_status] ?? { label: e.payment_status, color: "text-muted-foreground", bg: "bg-muted/20 border-border" };
                      return (
                        <span className={`hidden md:inline font-body text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full border ${ps.bg} ${ps.color} shrink-0`} style={{ fontWeight: 600 }}>
                          {ps.label}
                        </span>
                      );
                    })()}

                    {/* Quick actions */}
                    <div className="flex items-center gap-1 shrink-0">
                      {e.client_phone && (
                        <a
                          href={`https://wa.me/${e.client_phone.replace(/\D/g, "")}?text=${buildContactMsg(e)}`}
                          onClick={() => setNotifiedIds(p => new Set([...p, e.id]))}
                          target="_blank" rel="noopener noreferrer"
                          title="WhatsApp"
                          className={`w-7 h-7 rounded-full flex items-center justify-center transition-colors ${isNotified ? "bg-[#25D366]/20 text-[#25D366]" : "bg-secondary text-muted-foreground hover:bg-[#25D366]/10 hover:text-[#25D366]"}`}
                        >
                          <MessageCircle size={12} />
                        </a>
                      )}
                      <button onClick={() => setExpanded(isExpanded ? null : e.id)}
                        className="w-7 h-7 rounded-full bg-secondary flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors">
                        {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      </button>
                    </div>
                  </div>

                  {/* Expanded panel */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden border-t border-border"
                      >
                        <div className="px-5 py-4 bg-secondary/30 space-y-3">
                          {/* Contact + session + meta */}
                          <div className="grid sm:grid-cols-3 gap-3 text-[12px]">
                            <div>
                              <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Contact</p>
                              <a href={`mailto:${e.client_email}`} className="flex items-center gap-1.5 text-foreground hover:text-terra transition-colors font-body">
                                <Mail size={11} />{e.client_email}
                              </a>
                              {e.client_phone && (
                                <a href={`tel:${e.client_phone}`} className="flex items-center gap-1.5 text-foreground hover:text-terra transition-colors font-body mt-1">
                                  <Phone size={11} />{e.client_phone}
                                </a>
                              )}
                            </div>
                            <div>
                              <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Séance demandée</p>
                              <p className="font-body text-foreground">{e.class_name}</p>
                              {e.class_day !== "—" && <p className="font-body text-muted-foreground">{e.class_day}{e.class_time !== "—" ? ` · ${e.class_time}` : ""}</p>}
                              {e.coach && <p className="font-body text-muted-foreground">Coach: {e.coach}</p>}
                            </div>
                            <div>
                              <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Méta</p>
                              <p className="font-body text-muted-foreground">Priorité: <span className="text-terra">{priority}/15</span></p>
                              <p className="font-body text-muted-foreground">Inscrit le: {new Date(e.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}</p>
                            </div>
                          </div>
                          {e.notes && (
                            <p className="font-body text-[11px] text-muted-foreground italic bg-secondary rounded-xl px-3 py-2">
                              📝 {e.notes}
                            </p>
                          )}

                          {/* Status + payment selects */}
                          <div className="grid sm:grid-cols-2 gap-3">
                            <div>
                              <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Statut liste</p>
                              <select value={e.status} onChange={ev => updateStatus(e.id, ev.target.value)}
                                className="w-full bg-secondary border border-border px-3 py-2 rounded-xl font-body text-[12px] text-foreground focus:border-terra outline-none">
                                {Object.entries(STATUS).map(([val, { label }]) => (
                                  <option key={val} value={val}>{label}</option>
                                ))}
                              </select>
                            </div>
                            <div>
                              <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-1">Statut paiement</p>
                              <select value={e.payment_status || ""} onChange={ev => updatePaymentStatus(e.id, ev.target.value)}
                                className="w-full bg-secondary border border-border px-3 py-2 rounded-xl font-body text-[12px] text-foreground focus:border-terra outline-none">
                                <option value="">— Non renseigné</option>
                                <option value="pending">En attente</option>
                                <option value="pay_on_site">Sur place</option>
                                <option value="pack">Pack / carte</option>
                                <option value="paid">Payé en ligne</option>
                                <option value="cancelled">Annulé</option>
                              </select>
                            </div>
                          </div>

                          {/* Reprogrammer */}
                          <div>
                            <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground mb-2">Reprogrammer sur une séance</p>
                            <div className="grid gap-1.5 max-h-48 overflow-y-auto">
                              {sessionsOptions.slice(0, 8).map(s => {
                                const isFull = s.capacity > 0 && s.enrolled >= s.capacity;
                                return (
                                  <div key={s.id} className="flex items-center gap-2 p-2.5 rounded-xl bg-secondary border border-border">
                                    <div className="flex-1 min-w-0">
                                      <p className="font-body text-[12px] text-foreground">{s.title}</p>
                                      <p className="font-body text-[10px] text-muted-foreground">{new Date(s.date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })} · {s.time.slice(0,5)} · {s.instructor}</p>
                                    </div>
                                    <span className={`font-body text-[9px] px-2 py-0.5 rounded-full shrink-0 ${isFull ? "bg-destructive/10 text-destructive" : "bg-terra/10 text-terra"}`}>
                                      {s.capacity ? `${s.enrolled}/${s.capacity}` : "—"}
                                    </span>
                                    <button onClick={() => bookIntoSession(e, s)} disabled={bookingLoading}
                                      className="shrink-0 px-2.5 py-1.5 rounded-full bg-terra text-warm-white font-body text-[9px] tracking-[0.1em] uppercase hover:bg-terra/90 transition-colors disabled:opacity-50"
                                      style={{ fontWeight: 600 }}>
                                      Inscrire
                                    </button>
                                  </div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Availability */}
                          {availability !== null && (
                            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 font-body text-[12px] ${availability.available > 0 ? "bg-[#4E9E7A]/10 text-[#4E9E7A]" : "bg-muted text-muted-foreground"}`}>
                              <Users size={12} />
                              {availability.available > 0
                                ? `${availability.available} place(s) disponible(s) dans cette séance (${availability.enrolled}/${availability.capacity})`
                                : `Séance complète (${availability.enrolled}/${availability.capacity})`}
                            </div>
                          )}

                          {/* Actions */}
                          <div className="flex flex-wrap gap-2 pt-1">
                            {e.client_phone && (
                              <a href={`https://wa.me/${e.client_phone.replace(/\D/g, "")}?text=${buildNotifyMsg(e)}`}
                                onClick={() => { updateStatus(e.id, "contacted"); setNotifiedIds(p => new Set([...p, e.id])); }}
                                target="_blank" rel="noopener noreferrer"
                                className="inline-flex items-center gap-1.5 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 px-3 py-1.5 rounded-full font-body text-[10px] tracking-[0.15em] uppercase hover:bg-[#25D366]/20 transition-colors"
                                style={{ fontWeight: 500 }}>
                                <Send size={10} /> Notifier place libre
                              </a>
                            )}
                            <a href={`mailto:${e.client_email}?subject=Place disponible — The Circle&body=Bonjour ${e.client_name},%0D%0A%0D%0AUne place vient de se libérer pour "${e.class_name}". Merci de nous contacter rapidement.%0D%0A%0D%0AThe Circle Studio`}
                              className="inline-flex items-center gap-1.5 bg-secondary text-muted-foreground border border-border px-3 py-1.5 rounded-full font-body text-[10px] tracking-[0.15em] uppercase hover:border-terra/30 hover:text-terra transition-colors"
                              style={{ fontWeight: 500 }}>
                              <Mail size={10} /> Email notif.
                            </a>
                            <button onClick={() => deleteEntry(e.id)}
                              className="inline-flex items-center gap-1.5 bg-destructive/5 text-destructive border border-destructive/15 px-3 py-1.5 rounded-full font-body text-[10px] tracking-[0.15em] uppercase hover:bg-destructive/10 transition-colors ml-auto"
                              style={{ fontWeight: 500 }}>
                              <Trash2 size={10} /> Supprimer
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
