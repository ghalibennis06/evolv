import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Users, Mail, Phone, Search, Calendar, CreditCard,
  TrendingUp, Star, X, RefreshCw, Download, ExternalLink,
  MessageCircle, Clock, Send, Trash2, FileText, Ticket,
  Activity, UserPlus,
} from "lucide-react";
import { api } from "@/lib/api";
import { adminCall } from "./AdminLayout";
import { toast } from "sonner";

interface Contact {
  email: string;
  name: string;
  phone: string | null;
  totalSessions: number;
  totalSpend: number;
  firstSeen: string;
  lastSeen: string;
  paymentMethods: string[];
  classes: string[];
  status: "active" | "returning" | "new" | "churned";
  retentionStatus: "new" | "active" | "warming" | "inactive" | "churn_risk" | "lost";
  daysSinceLastVisit: number;
  noShowCount: number;
  cancellationCount: number;
  activePackCount: number;
  remainingCredits: number;
  totalOrders: number;
  hasActivePack: boolean;
  highValue: boolean;
  sources: string[];
  bookings: any[];
}

const iCls = "w-full bg-secondary border border-border px-3 py-2.5 rounded-xl font-body text-[13px] text-foreground focus:border-terra outline-none";

function statusLabel(s: Contact["status"]) {
  const map = {
    active:    { label: "Actif",   color: "text-[#4E9E7A]",        bg: "bg-[#4E9E7A]/10" },
    returning: { label: "Fidèle",  color: "text-terra",            bg: "bg-terra/10" },
    new:       { label: "Nouveau", color: "text-[#6B8F9E]",        bg: "bg-[#6B8F9E]/10" },
    churned:   { label: "Inactif", color: "text-muted-foreground", bg: "bg-muted/20" },
  };
  return map[s] || map.new;
}

function getStatus(c: { totalSessions: number; lastSeen: string }): Contact["status"] {
  const daysSince = (Date.now() - new Date(c.lastSeen).getTime()) / 86400000;
  if (c.totalSessions === 1) return "new";
  if (daysSince > 60) return "churned";
  if (c.totalSessions >= 5) return "active";
  return "returning";
}

function getRetentionStatus(firstSeen: string, daysSinceLastVisit: number) {
  const daysSinceFirst = Math.round((Date.now() - new Date(firstSeen).getTime()) / 86400000);
  if (daysSinceFirst <= 14) return "new" as const;
  if (daysSinceLastVisit <= 7) return "active" as const;
  if (daysSinceLastVisit <= 14) return "warming" as const;
  if (daysSinceLastVisit <= 30) return "inactive" as const;
  if (daysSinceLastVisit <= 45) return "churn_risk" as const;
  return "lost" as const;
}

const fmt = (p: string | null) => (p || "").replace(/\D/g, "").replace(/^0/, "212");
const WA_BASE = "https://wa.me/";

// ─────────────────────────────────────────────────────────────────
// Profile Drawer Component
// ─────────────────────────────────────────────────────────────────

type ProfileTab = "overview" | "bookings" | "packs" | "timeline" | "notes";

function ProfileDrawer({ profile, onClose }: { profile: Contact; onClose: () => void }) {
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [activity, setActivity] = useState<any>(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);
  const [newTag, setNewTag] = useState("");
  const [creatingOffer, setCreatingOffer] = useState(false);

  useEffect(() => {
    loadActivity();
  }, [profile.email]);

  const loadActivity = async () => {
    setLoadingActivity(true);
    try {
      const res = await adminCall({ action: "get_client_activity", client_email: profile.email });
      setActivity(res);
      setNotes(res.notes || []);
    } catch (e) { console.error(e); }
    finally { setLoadingActivity(false); }
  };

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      const res = await adminCall({ action: "add_client_note", client_email: profile.email, note: newNote.trim() });
      setNotes(prev => [res.data || res, ...prev]);
      setNewNote("");
      toast.success("Note ajoutée");
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingNote(false); }
  };

  const deleteNote = async (id: string) => {
    try {
      await adminCall({ action: "delete_client_note", note_id: id });
      setNotes(prev => prev.filter(n => n.id !== id));
      toast.success("Note supprimée");
    } catch (e: any) { toast.error(e.message); }
  };

  const sl = statusLabel(profile.status);
  const packs = activity?.packs || [];
  const packUsage = activity?.packUsage || [];
  const orders = activity?.orders || [];
  const tags = activity?.tags || [];
  const offers = activity?.offers || [];
  const followups = activity?.followups || [];
  const activityLog = activity?.activityLog || [];
  const participants = activity?.participants || [];
  const daysSinceLastVisit = Math.round((Date.now() - new Date(profile.lastSeen).getTime()) / 86400000);

  // Build timeline
  const timeline = (() => {
    if (!activity) return [];
    const items: Array<{ date: string; type: string; label: string; detail: string; color: string }> = [];

    for (const b of activity.bookings || []) {
      items.push({
        date: b.created_at,
        type: "booking",
        label: "Réservation",
        detail: `${b.class_name} — ${b.class_day} ${b.class_time}`,
        color: b.status === "cancelled" ? "text-destructive" : "text-terra",
      });
    }
    for (const p of participants) {
      const s = (p as any).sessions;
      if (s) {
        items.push({
          date: p.registered_at,
          type: "session",
          label: "Séance",
          detail: `${s.title} — ${s.date} ${s.time} (${s.instructor})`,
          color: "text-[#4E9E7A]",
        });
      }
    }
    for (const p of packs) {
      items.push({
        date: p.created_at,
        type: "pack",
        label: "Pack acheté",
        detail: `${p.pack_code} — ${p.credits_total} crédits`,
        color: "text-terra",
      });
    }
    for (const u of packUsage) {
      items.push({
        date: u.used_at || u.cancelled_at,
        type: u.cancelled_at ? "cancel" : "usage",
        label: u.cancelled_at ? "Annulation" : "Crédit utilisé",
        detail: `${u.pack_code} — ${u.session_title || ""}`,
        color: u.cancelled_at ? "text-destructive" : "text-muted-foreground",
      });
    }
    for (const n of notes) {
      items.push({
        date: n.created_at,
        type: "note",
        label: "Note admin",
        detail: n.note,
        color: "text-[#6B8F9E]",
      });
    }

    for (const o of orders) {
      items.push({
        date: o.created_at,
        type: "order",
        label: "Achat boutique",
        detail: `${((o.total_amount || 0) / 100).toFixed(2)} MAD`,
        color: "text-terra",
      });
    }
    for (const ev of activityLog) {
      items.push({
        date: ev.created_at,
        type: "activity",
        label: ev.action,
        detail: JSON.stringify(ev.metadata || {}),
        color: "text-muted-foreground",
      });
    }

    return items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  })();

  const addTag = async () => {
    if (!newTag.trim()) return;
    try {
      await adminCall({ action: "add_client_tag", client_email: profile.email, tag: newTag.trim() });
      setNewTag("");
      loadActivity();
      toast.success("Tag ajouté");
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    }
  };

  const generateOffer = async () => {
    setCreatingOffer(true);
    try {
      const res = await adminCall({ action: "create_retention_offer", client_email: profile.email, offer_type: "comeback", discount_percent: 20 });
      toast.success(`Offre créée: ${res.offer_code || res.data?.offer_code || "OK"}`);
      loadActivity();
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    } finally {
      setCreatingOffer(false);
    }
  };

  const markFollowUp = async () => {
    try {
      await adminCall({ action: "mark_follow_up", client_email: profile.email, reason: "followup_from_profile" });
      toast.success("Client marqué pour suivi");
      loadActivity();
    } catch (e: any) {
      toast.error(e.message || "Erreur");
    }
  };

  const tabs: { key: ProfileTab; label: string; icon: any }[] = [
    { key: "overview", label: "Profil", icon: Users },
    { key: "bookings", label: "Réservations", icon: Calendar },
    { key: "packs", label: "Packs", icon: Ticket },
    { key: "timeline", label: "Timeline", icon: Activity },
    { key: "notes", label: "Notes", icon: FileText },
  ];

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
      className="fixed inset-0 z-[210] flex items-end sm:items-center justify-center sm:justify-end bg-foreground/40 backdrop-blur-sm"
      onClick={onClose}>
      <motion.div
        initial={{ x: 80, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 80, opacity: 0 }}
        transition={{ type: "spring", stiffness: 320, damping: 30 }}
        className="bg-card w-full sm:w-[460px] h-full sm:h-screen overflow-y-auto shadow-2xl flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="sticky top-0 bg-card border-b border-border px-6 py-4 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-terra/10 flex items-center justify-center">
              <span className="font-display text-terra text-lg" style={{ fontWeight: 400 }}>{profile.name[0]?.toUpperCase()}</span>
            </div>
            <div>
              <p className="font-display text-lg text-foreground" style={{ fontWeight: 400 }}>{profile.name}</p>
              <div className="flex items-center gap-2">
                <span className={`font-body text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full ${sl.bg} ${sl.color}`} style={{ fontWeight: 600 }}>{sl.label}</span>
                <span className="font-body text-[10px] text-muted-foreground">{daysSinceLastVisit}j depuis dernière visite</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors"><X size={18} /></button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-border px-4 gap-1 overflow-x-auto">
          {tabs.map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-1.5 px-3 py-2.5 font-body text-[10px] tracking-widest uppercase border-b-2 transition-all whitespace-nowrap ${tab === t.key ? "border-terra text-terra" : "border-transparent text-muted-foreground hover:text-foreground"}`}
              style={{ fontWeight: 500 }}>
              <t.icon size={12} /> {t.label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">

          {/* ── OVERVIEW ── */}
          {tab === "overview" && (
            <>
              {/* Contact */}
              <div className="space-y-2">
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 500 }}>Contact</p>
                <a href={`mailto:${profile.email}`} className="flex items-center gap-3 font-body text-[13px] text-foreground hover:text-terra transition-colors p-3 bg-secondary rounded-xl">
                  <Mail size={14} className="text-muted-foreground shrink-0" />{profile.email}
                </a>
                {profile.phone && (
                  <a href={`tel:${profile.phone}`} className="flex items-center gap-3 font-body text-[13px] text-foreground hover:text-terra transition-colors p-3 bg-secondary rounded-xl">
                    <Phone size={14} className="text-muted-foreground shrink-0" />{profile.phone}
                  </a>
                )}
                {profile.phone && (
                  <a href={`${WA_BASE}${fmt(profile.phone)}`} target="_blank" rel="noopener noreferrer"
                    onClick={() => adminCall({ action: "log_whatsapp_action", client_email: profile.email, template: "crm_profile" })}
                    className="flex items-center gap-3 font-body text-[13px] text-[#25D366] p-3 bg-[#25D366]/10 rounded-xl hover:bg-[#25D366]/20 transition-colors">
                    <MessageCircle size={14} /> WhatsApp
                  </a>
                )}
                <div className="grid grid-cols-2 gap-2">
                  <button onClick={generateOffer} disabled={creatingOffer} className="px-3 py-2 rounded-xl border border-terra text-terra text-[10px] uppercase tracking-widest hover:bg-terra hover:text-warm-white transition-all disabled:opacity-50">
                    Offre rétention
                  </button>
                  <button onClick={markFollowUp} className="px-3 py-2 rounded-xl border border-border text-muted-foreground text-[10px] uppercase tracking-widest hover:border-terra hover:text-terra transition-all">
                    Marquer suivi
                  </button>
                </div>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-3">
                <div className="bg-secondary rounded-2xl p-3 text-center">
                  <p className="font-display text-2xl text-foreground" style={{ fontWeight: 300 }}>{profile.totalSessions}</p>
                  <p className="font-body text-[9px] tracking-widest uppercase text-muted-foreground" style={{ fontWeight: 400 }}>sessions</p>
                </div>
                <div className="bg-secondary rounded-2xl p-3 text-center">
                  <p className="font-display text-2xl text-terra" style={{ fontWeight: 300 }}>{profile.totalSpend.toLocaleString("fr-FR")}</p>
                  <p className="font-body text-[9px] tracking-widest uppercase text-muted-foreground" style={{ fontWeight: 400 }}>DH</p>
                </div>
                <div className="bg-secondary rounded-2xl p-3 text-center">
                  <p className="font-body text-[11px] text-foreground font-medium">{new Date(profile.firstSeen).toLocaleDateString("fr-FR", { month: "short", year: "2-digit" })}</p>
                  <p className="font-body text-[9px] tracking-widest uppercase text-muted-foreground" style={{ fontWeight: 400 }}>depuis</p>
                </div>
              </div>

              {/* Classes */}
              {profile.classes.length > 0 && (
                <div>
                  <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 500 }}>Cours fréquentés</p>
                  <div className="flex flex-wrap gap-2">
                    {profile.classes.map(cl => (
                      <span key={cl} className="font-body text-[10px] text-terra bg-terra/10 px-3 py-1 rounded-full" style={{ fontWeight: 500 }}>{cl}</span>
                    ))}
                  </div>
                </div>
              )}

              <div>
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 500 }}>Tags CRM</p>
                <div className="flex flex-wrap gap-2 mb-2">
                  {tags.map((t: any) => (
                    <span key={t.id} className="font-body text-[10px] text-terra bg-terra/10 px-2 py-1 rounded-full">{t.tag}</span>
                  ))}
                  {tags.length === 0 && <span className="text-[11px] text-muted-foreground">Aucun tag</span>}
                </div>
                <div className="flex gap-2">
                  <input value={newTag} onChange={(e) => setNewTag(e.target.value)} className={iCls + " text-[11px] py-2"} placeholder="Ajouter un tag" />
                  <button onClick={addTag} className="px-3 py-2 rounded-xl border border-border text-[10px] uppercase tracking-widest hover:border-terra hover:text-terra">Ajouter</button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="bg-secondary rounded-2xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">No-show</p>
                  <p className="font-display text-xl">{profile.noShowCount}</p>
                </div>
                <div className="bg-secondary rounded-2xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Annulations</p>
                  <p className="font-display text-xl">{profile.cancellationCount}</p>
                </div>
                <div className="bg-secondary rounded-2xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Packs actifs</p>
                  <p className="font-display text-xl">{profile.activePackCount}</p>
                </div>
                <div className="bg-secondary rounded-2xl p-3">
                  <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Crédits restants</p>
                  <p className="font-display text-xl">{profile.remainingCredits}</p>
                </div>
              </div>

              {(offers.length > 0 || followups.length > 0) && (
                <div className="space-y-2">
                  {offers.slice(0, 3).map((o: any) => (
                    <div key={o.id} className="bg-secondary border border-border rounded-xl p-2 text-[11px]">
                      Offre {o.offer_code} · {o.offer_type} · {o.status}
                    </div>
                  ))}
                  {followups.slice(0, 3).map((f: any) => (
                    <div key={f.id} className="bg-secondary border border-border rounded-xl p-2 text-[11px]">
                      Follow-up {f.status} · {f.reason || "-"}
                    </div>
                  ))}
                </div>
              )}

              {/* Active packs */}
              {packs.length > 0 && (
                <div>
                  <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 500 }}>Packs actifs</p>
                  <div className="space-y-2">
                    {packs.filter((p: any) => p.is_active).map((p: any) => (
                      <div key={p.id} className="bg-secondary border border-border rounded-xl p-3 flex items-center justify-between">
                        <div>
                          <p className="font-body text-[12px] text-foreground font-medium font-mono">{p.pack_code}</p>
                          <p className="font-body text-[10px] text-muted-foreground">{p.credits_total - p.credits_used} crédits restants</p>
                        </div>
                        <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-1 rounded-full ${p.payment_status === "paid" ? "bg-[#4E9E7A]/15 text-[#4E9E7A]" : "bg-terra/10 text-terra"}`} style={{ fontWeight: 600 }}>
                          {p.payment_status === "paid" ? "Payé" : "En attente"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Retention indicator */}
              <div className={`p-4 rounded-xl border ${daysSinceLastVisit > 30 ? "border-destructive/30 bg-destructive/5" : "border-border bg-secondary"}`}>
                <div className="flex items-center gap-2 mb-1">
                  <Clock size={12} className={daysSinceLastVisit > 30 ? "text-destructive" : "text-muted-foreground"} />
                  <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground" style={{ fontWeight: 400 }}>Rétention</p>
                </div>
                <p className={`font-display text-xl ${daysSinceLastVisit > 30 ? "text-destructive" : "text-foreground"}`} style={{ fontWeight: 300 }}>
                  {daysSinceLastVisit} jours
                </p>
                <p className="font-body text-[10px] text-muted-foreground">depuis la dernière activité</p>
                {daysSinceLastVisit > 30 && profile.phone && (
                  <a href={`${WA_BASE}${fmt(profile.phone)}?text=${encodeURIComponent(`Bonjour ${profile.name.split(" ")[0]} 👋\nVous nous manquez au Circle Studio ! On vous a réservé une offre spéciale ✨`)}`}
                    target="_blank" rel="noopener noreferrer"
                    className="mt-2 inline-flex items-center gap-1.5 font-body text-[10px] text-[#25D366] bg-[#25D366]/10 px-3 py-1.5 rounded-full hover:bg-[#25D366]/20 transition-colors" style={{ fontWeight: 500 }}>
                    <MessageCircle size={11} /> Envoyer message de rétention
                  </a>
                )}
              </div>
            </>
          )}

          {/* ── BOOKINGS ── */}
          {tab === "bookings" && (
            <div className="space-y-2">
              <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-3" style={{ fontWeight: 500 }}>
                Historique ({profile.bookings.length} réservations)
              </p>
              {profile.bookings.length === 0 && (
                <p className="text-center font-body text-muted-foreground text-[13px] py-8">Aucune réservation</p>
              )}
              {profile.bookings.map((b: any) => (
                <div key={b.id} className="bg-secondary border border-border rounded-xl px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="font-body text-[13px] text-foreground font-medium">{b.class_name}</p>
                    <p className="font-body text-[10px] text-muted-foreground">{b.class_day} · {b.class_time} · {b.coach}</p>
                    <p className="font-body text-[9px] text-muted-foreground/60">{new Date(b.created_at).toLocaleDateString("fr-FR")}</p>
                  </div>
                  <div className="text-right">
                    <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-1 rounded-full ${b.payment_status === "paid" || b.payment_status === "pack" ? "bg-[#4E9E7A]/15 text-[#4E9E7A]" : "bg-terra/10 text-terra"}`} style={{ fontWeight: 600 }}>
                      {b.payment_status === "paid" ? "Payé" : b.payment_status === "pack" ? "Pack" : b.payment_status === "pay_on_site" ? "Sur place" : "En attente"}
                    </span>
                    {b.status === "cancelled" && (
                      <span className="block font-body text-[9px] text-destructive mt-1">Annulée</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* ── PACKS ── */}
          {tab === "packs" && (
            <div className="space-y-4">
              {loadingActivity ? (
                <div className="flex justify-center py-8"><RefreshCw size={16} className="animate-spin text-muted-foreground" /></div>
              ) : (
                <>
                  <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 500 }}>
                    Packs ({packs.length})
                  </p>
                  {packs.length === 0 && <p className="text-center font-body text-muted-foreground text-[13px] py-8">Aucun pack</p>}
                  {packs.map((p: any) => (
                    <div key={p.id} className={`border rounded-xl p-4 ${p.is_active ? "border-terra/30 bg-terra/5" : "border-border bg-secondary"}`}>
                      <div className="flex items-center justify-between mb-2">
                        <p className="font-mono font-body text-[13px] text-foreground font-medium">{p.pack_code}</p>
                        <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full ${p.is_active ? "bg-[#4E9E7A]/15 text-[#4E9E7A]" : "bg-muted text-muted-foreground"}`} style={{ fontWeight: 600 }}>
                          {p.is_active ? "Actif" : "Expiré"}
                        </span>
                      </div>
                      <div className="grid grid-cols-3 gap-2 text-center">
                        <div>
                          <p className="font-display text-lg text-foreground" style={{ fontWeight: 300 }}>{p.credits_total}</p>
                          <p className="font-body text-[8px] text-muted-foreground uppercase">total</p>
                        </div>
                        <div>
                          <p className="font-display text-lg text-terra" style={{ fontWeight: 300 }}>{p.credits_used}</p>
                          <p className="font-body text-[8px] text-muted-foreground uppercase">utilisés</p>
                        </div>
                        <div>
                          <p className="font-display text-lg text-foreground" style={{ fontWeight: 300 }}>{p.credits_total - p.credits_used}</p>
                          <p className="font-body text-[8px] text-muted-foreground uppercase">restants</p>
                        </div>
                      </div>
                      {p.expires_at && (
                        <p className="font-body text-[10px] text-muted-foreground mt-2">
                          Expire le {new Date(p.expires_at).toLocaleDateString("fr-FR")}
                        </p>
                      )}
                    </div>
                  ))}

                  {/* Pack usage log */}
                  {packUsage.length > 0 && (
                    <div>
                      <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 500 }}>Historique d'utilisation</p>
                      <div className="space-y-1.5">
                        {packUsage.slice(0, 15).map((u: any) => (
                          <div key={u.id} className="bg-secondary rounded-lg px-3 py-2 flex items-center justify-between">
                            <div>
                              <p className="font-body text-[11px] text-foreground">{u.session_title || "—"}</p>
                              <p className="font-body text-[9px] text-muted-foreground">{u.session_date} {u.session_time}</p>
                            </div>
                            <span className={`font-body text-[9px] ${u.cancelled_at ? "text-destructive" : "text-muted-foreground"}`}>
                              {u.cancelled_at ? "Annulé" : new Date(u.used_at).toLocaleDateString("fr-FR")}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* ── TIMELINE ── */}
          {tab === "timeline" && (
            <div className="space-y-1">
              {loadingActivity ? (
                <div className="flex justify-center py-8"><RefreshCw size={16} className="animate-spin text-muted-foreground" /></div>
              ) : timeline.length === 0 ? (
                <p className="text-center font-body text-muted-foreground text-[13px] py-8">Aucune activité</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-[15px] top-0 bottom-0 w-px bg-border" />
                  {timeline.slice(0, 30).map((item, i) => (
                    <div key={i} className="flex gap-3 relative pl-9 py-2.5">
                      <div className={`absolute left-[11px] top-3.5 w-2 h-2 rounded-full border-2 border-card ${
                        item.type === "booking" ? "bg-terra" :
                        item.type === "session" ? "bg-[#4E9E7A]" :
                        item.type === "pack" ? "bg-[#D4A853]" :
                        item.type === "cancel" ? "bg-destructive" :
                        item.type === "note" ? "bg-[#6B8F9E]" :
                        "bg-muted-foreground"
                      }`} />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className={`font-body text-[10px] tracking-widest uppercase ${item.color}`} style={{ fontWeight: 600 }}>{item.label}</span>
                          <span className="font-body text-[9px] text-muted-foreground/60">
                            {new Date(item.date).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit" })}
                          </span>
                        </div>
                        <p className="font-body text-[12px] text-foreground/80 mt-0.5" style={{ fontWeight: 300 }}>{item.detail}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── NOTES ── */}
          {tab === "notes" && (
            <div className="space-y-4">
              {/* Add note */}
              <div className="flex gap-2">
                <textarea
                  value={newNote}
                  onChange={e => setNewNote(e.target.value)}
                  className={iCls + " resize-none h-20"}
                  placeholder="Ajouter une note..."
                  maxLength={500}
                />
              </div>
              <button
                onClick={addNote}
                disabled={!newNote.trim() || savingNote}
                className="bg-terra text-warm-white px-4 py-2 font-body text-[11px] tracking-[0.2em] uppercase rounded-lg hover:bg-terra-dark transition-colors disabled:opacity-40 flex items-center gap-2"
              >
                <Send size={12} /> {savingNote ? "Enregistrement..." : "Ajouter la note"}
              </button>

              {/* Notes list */}
              <div className="space-y-2">
                {loadingActivity ? (
                  <div className="flex justify-center py-8"><RefreshCw size={16} className="animate-spin text-muted-foreground" /></div>
                ) : notes.length === 0 ? (
                  <p className="text-center font-body text-muted-foreground text-[13px] py-8">Aucune note</p>
                ) : (
                  notes.map((n: any) => (
                    <div key={n.id} className="bg-secondary border border-border rounded-xl p-4 group">
                      <div className="flex items-start justify-between gap-2">
                        <p className="font-body text-[13px] text-foreground flex-1" style={{ fontWeight: 300 }}>{n.note}</p>
                        <button onClick={() => deleteNote(n.id)} className="text-muted-foreground hover:text-destructive opacity-0 group-hover:opacity-100 transition-all shrink-0">
                          <Trash2 size={12} />
                        </button>
                      </div>
                      <p className="font-body text-[9px] text-muted-foreground mt-2">
                        {n.created_by} · {new Date(n.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short", year: "2-digit", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────
// Main AdminContacts
// ─────────────────────────────────────────────────────────────────

export function AdminContacts() {
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"lastSeen" | "sessions" | "spend" | "name">("lastSeen");
  const [statusF, setStatusF] = useState<string>("all");
  const [segmentF, setSegmentF] = useState<string>("all");
  const [profile, setProfile] = useState<Contact | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [bookings, participants, packs, orders] = await Promise.all([
        api.admin.contacts.list().catch(() => [] as any[]),
        api.admin.planning.list().catch(() => [] as any[]),
        api.admin.packs.list().catch(() => [] as any[]),
        Promise.resolve([] as any[]),
      ]);

      const map = new Map<string, Contact>();
      const upsert = (email: string, name: string, phone: string | null, source: string) => {
        if (!email) return;
        const key = email.toLowerCase().trim();
        if (!map.has(key)) {
          map.set(key, {
            email: key, name, phone,
            totalSessions: 0, totalSpend: 0,
            firstSeen: new Date().toISOString(), lastSeen: "2000-01-01",
            paymentMethods: [], classes: [],
            status: "new", retentionStatus: "new", daysSinceLastVisit: 0,
            noShowCount: 0, cancellationCount: 0, activePackCount: 0, remainingCredits: 0, totalOrders: 0, hasActivePack: false, highValue: false,
            sources: [], bookings: [],
          });
        }
        const c = map.get(key)!;
        if (name && !c.name) c.name = name;
        if (phone && !c.phone) c.phone = phone;
        if (!c.sources.includes(source)) c.sources.push(source);
        return c;
      };

      for (const b of bookings || []) {
        const c = upsert(b.client_email, b.client_name, b.client_phone, "booking");
        if (!c) continue;
        c.totalSessions++;
        c.totalSpend += 350;
        if (b.created_at < c.firstSeen) c.firstSeen = b.created_at;
        if (b.created_at > c.lastSeen) c.lastSeen = b.created_at;
        if (b.payment_status && !c.paymentMethods.includes(b.payment_status)) c.paymentMethods.push(b.payment_status);
        if (b.class_name && !c.classes.includes(b.class_name)) c.classes.push(b.class_name);
        if ((b.status || "").toLowerCase().includes("cancel")) c.cancellationCount++;
        c.bookings.push(b);
      }

      for (const p of participants || []) {
        const session = (p as any).sessions;
        const c = upsert(p.email, `${p.first_name} ${p.last_name}`.trim(), p.phone, "session_participant");
        if (!c) continue;
        const alreadyCounted = (bookings || []).some(b => b.client_email?.toLowerCase() === p.email?.toLowerCase());
        if (!alreadyCounted) {
          c.totalSessions++;
          c.totalSpend += session?.price ?? 350;
        }
        const date = p.registered_at || new Date().toISOString();
        if (date < c.firstSeen) c.firstSeen = date;
        if (date > c.lastSeen) c.lastSeen = date;
        if (session?.title && !c.classes.includes(session.title)) c.classes.push(session.title);
        if (p.payment_status && !c.paymentMethods.includes(p.payment_status)) c.paymentMethods.push(p.payment_status);
        if (["absent", "no-show"].includes((p.payment_status || "").toLowerCase())) c.noShowCount++;
      }

      for (const p of packs || []) {
        const c = upsert(p.client_email, p.client_name, p.client_phone, "pack");
        if (!c) continue;
        const remaining = Math.max(0, (p.credits_total || 0) - (p.credits_used || 0));
        const active = !!p.is_active && remaining > 0 && (!p.expires_at || new Date(p.expires_at) > new Date());
        if (active) {
          c.activePackCount++;
          c.remainingCredits += remaining;
        }
      }

      for (const o of orders || []) {
        const c = upsert(o.client_email, o.client_name, o.client_phone, "shop_order");
        if (!c) continue;
        c.totalOrders++;
        c.totalSpend += (o.total_amount || 0) / 100;
      }

      setContacts([...map.values()].map(c => {
        const daysSinceLastVisit = Math.max(0, Math.round((Date.now() - new Date(c.lastSeen).getTime()) / 86400000));
        return {
          ...c,
          status: getStatus(c),
          daysSinceLastVisit,
          retentionStatus: getRetentionStatus(c.firstSeen, daysSinceLastVisit),
          hasActivePack: c.activePackCount > 0,
          highValue: c.totalSpend >= 3000,
        };
      }));
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const filtered = contacts
    .filter(c => {
      const q = search.toLowerCase();
      const m = !q || c.name.toLowerCase().includes(q) || c.email.includes(q);
      const s = statusF === "all" || c.status === statusF;
      const seg =
        segmentF === "all" ||
        (segmentF === "inactive_7" && c.daysSinceLastVisit >= 7) ||
        (segmentF === "inactive_14" && c.daysSinceLastVisit >= 14) ||
        (segmentF === "inactive_30" && c.daysSinceLastVisit >= 30) ||
        (segmentF === "one_credit" && c.remainingCredits === 1) ||
        (segmentF === "no_pack" && !c.hasActivePack) ||
        (segmentF === "high_value" && c.highValue) ||
        (segmentF === "no_show" && c.noShowCount > 0) ||
        (segmentF === "new_clients" && c.retentionStatus === "new") ||
        (segmentF === "never_came_back" && c.totalSessions <= 1 && c.daysSinceLastVisit >= 7);
      return m && s && seg;
    })
    .sort((a, b) => {
      if (sortBy === "sessions") return b.totalSessions - a.totalSessions;
      if (sortBy === "spend") return b.totalSpend - a.totalSpend;
      if (sortBy === "name") return a.name.localeCompare(b.name);
      return new Date(b.lastSeen).getTime() - new Date(a.lastSeen).getTime();
    });

  const exportCSV = () => {
    const rows = [
      ["Nom", "Email", "Téléphone", "Sessions", "Dépense (DH)", "Dernière activité", "Statut"],
      ...filtered.map(c => [c.name, c.email, c.phone || "", c.totalSessions, c.totalSpend,
        new Date(c.lastSeen).toLocaleDateString("fr-FR"), c.status]),
    ];
    const csv = rows.map(r => r.join(";")).join("\n");
    const a = document.createElement("a");
    a.href = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    a.download = `the-circle-contacts-${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
  };

  const stats = {
    total: contacts.length,
    active: contacts.filter(c => c.status === "active").length,
    new7d: contacts.filter(c => (Date.now() - new Date(c.firstSeen).getTime()) < 7 * 86400000).length,
    churnRisk: contacts.filter(c => c.retentionStatus === "churn_risk" || c.retentionStatus === "lost").length,
    oneCredit: contacts.filter(c => c.remainingCredits === 1).length,
    noPack: contacts.filter(c => !c.hasActivePack).length,
    avgSessions: contacts.length ? Math.round(contacts.reduce((s, c) => s + c.totalSessions, 0) / contacts.length * 10) / 10 : 0,
  };

  if (loading) return (
    <div className="flex items-center justify-center py-20">
      <RefreshCw size={20} className="animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* KPI strip */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Contacts total", value: stats.total, icon: Users, accent: false },
          { label: "Clients actifs", value: stats.active, icon: TrendingUp, accent: true },
          { label: "Nouveaux (7j)", value: stats.new7d, icon: Star, accent: false },
          { label: "Sessions / client", value: stats.avgSessions, icon: Calendar, accent: false },
        ].map(({ label, value, icon: Icon, accent }) => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${accent ? "bg-terra/10" : "bg-secondary"}`}>
              <Icon size={14} className={accent ? "text-terra" : "text-muted-foreground"} />
            </div>
            <p className={`font-display text-2xl ${accent ? "text-terra" : "text-foreground"}`} style={{ fontWeight: 300 }}>{value}</p>
            <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground" style={{ fontWeight: 400 }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {[
          { label: "Churn risk", value: stats.churnRisk, seg: "inactive_30" },
          { label: "1 crédit restant", value: stats.oneCredit, seg: "one_credit" },
          { label: "Sans pack actif", value: stats.noPack, seg: "no_pack" },
          { label: "Nouveaux clients", value: stats.new7d, seg: "new_clients" },
        ].map((b) => (
          <button key={b.label} onClick={() => setSegmentF(b.seg)} className="bg-card border border-border rounded-xl p-3 text-left hover:border-terra/40 transition-all">
            <p className="font-display text-xl text-foreground" style={{ fontWeight: 300 }}>{b.value}</p>
            <p className="font-body text-[10px] text-muted-foreground uppercase tracking-widest">{b.label}</p>
          </button>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} className={iCls + " pl-9"} placeholder="Nom, email..." />
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          {["all", "active", "returning", "new", "churned"].map(s => {
            const sl = s === "all" ? null : statusLabel(s as Contact["status"]);
            return (
              <button key={s} onClick={() => setStatusF(s)}
                className={`px-3 py-2 rounded-full font-body text-[10px] tracking-widest uppercase transition-all border ${statusF === s ? "bg-terra text-warm-white border-terra" : "border-border text-muted-foreground hover:border-terra/30"}`}
                style={{ fontWeight: 500 }}>
                {s === "all" ? "Tous" : sl?.label}
              </button>
            );
          })}
          <select value={sortBy} onChange={e => setSortBy(e.target.value as any)}
            className="bg-card border border-border px-3 py-2 rounded-full font-body text-[10px] tracking-widest uppercase text-muted-foreground outline-none cursor-pointer" style={{ fontWeight: 500 }}>
            <option value="lastSeen">Récent</option>
            <option value="sessions">Sessions</option>
            <option value="spend">Dépense</option>
            <option value="name">Nom A→Z</option>
          </select>
          <select value={segmentF} onChange={e => setSegmentF(e.target.value)}
            className="bg-card border border-border px-3 py-2 rounded-full font-body text-[10px] tracking-widest uppercase text-muted-foreground outline-none cursor-pointer" style={{ fontWeight: 500 }}>
            <option value="all">Segments: tous</option>
            <option value="inactive_7">Inactifs 7j+</option>
            <option value="inactive_14">Inactifs 14j+</option>
            <option value="inactive_30">Inactifs 30j+</option>
            <option value="one_credit">1 crédit restant</option>
            <option value="no_pack">Sans pack actif</option>
            <option value="high_value">High value</option>
            <option value="no_show">No-show</option>
            <option value="new_clients">Nouveaux</option>
            <option value="never_came_back">Pas revenus</option>
          </select>
          <button onClick={exportCSV} className="flex items-center gap-1.5 border border-border text-muted-foreground px-3 py-2 rounded-full font-body text-[10px] tracking-widest uppercase hover:border-terra hover:text-terra transition-all" style={{ fontWeight: 500 }}>
            <Download size={11} /> Export CSV
          </button>
        </div>
      </div>

      {/* Contact list */}
      <div className="space-y-2">
        {filtered.length === 0 && (
          <div className="bg-card border border-border rounded-2xl p-12 text-center">
            <Users size={28} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-body text-muted-foreground">Aucun contact trouvé</p>
          </div>
        )}
        {filtered.map(c => {
          const sl = statusLabel(c.status);
          return (
            <div key={c.email}
              className="bg-card border border-border rounded-2xl px-5 py-4 flex items-center gap-4 hover:border-terra/30 transition-all cursor-pointer"
              onClick={() => setProfile(c)}>
              <div className="w-11 h-11 rounded-full bg-terra/10 flex items-center justify-center shrink-0">
                <span className="font-display text-terra text-base" style={{ fontWeight: 400 }}>{c.name[0]?.toUpperCase() || "?"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-body text-[14px] text-foreground font-medium">{c.name || "—"}</p>
                  <span className={`font-body text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full ${sl.bg} ${sl.color}`} style={{ fontWeight: 600 }}>{sl.label}</span>
                  <span className="font-body text-[8px] tracking-widest uppercase px-2 py-0.5 rounded-full bg-secondary text-muted-foreground" style={{ fontWeight: 600 }}>
                    {c.retentionStatus}
                  </span>
                </div>
                <div className="flex items-center gap-3 flex-wrap mt-0.5">
                  <span className="font-body text-[11px] text-muted-foreground flex items-center gap-1"><Mail size={9} />{c.email}</span>
                  {c.phone && <span className="font-body text-[11px] text-muted-foreground flex items-center gap-1"><Phone size={9} />{c.phone}</span>}
                  <span className="font-body text-[11px] text-muted-foreground flex items-center gap-1"><Clock size={9} />{c.daysSinceLastVisit}j</span>
                </div>
              </div>
              <div className="hidden sm:flex items-center gap-6 shrink-0">
                <div className="text-center">
                  <p className="font-display text-xl text-foreground" style={{ fontWeight: 300 }}>{c.totalSessions}</p>
                  <p className="font-body text-[9px] tracking-widest uppercase text-muted-foreground" style={{ fontWeight: 400 }}>sessions</p>
                </div>
                <div className="text-center">
                  <p className="font-display text-xl text-terra" style={{ fontWeight: 300 }}>{c.totalSpend.toLocaleString("fr-FR")}</p>
                  <p className="font-body text-[9px] tracking-widest uppercase text-muted-foreground" style={{ fontWeight: 400 }}>DH</p>
                </div>
                <div className="text-center">
                  <p className="font-body text-[11px] text-muted-foreground">{new Date(c.lastSeen).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}</p>
                  <p className="font-body text-[9px] tracking-widest uppercase text-muted-foreground" style={{ fontWeight: 400 }}>dernière</p>
                </div>
              </div>
              <ExternalLink size={14} className="text-muted-foreground shrink-0" />
            </div>
          );
        })}
      </div>

      {/* Profile drawer */}
      <AnimatePresence>
        {profile && <ProfileDrawer profile={profile} onClose={() => setProfile(null)} />}
      </AnimatePresence>
    </div>
  );
}
