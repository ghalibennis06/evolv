/**
 * ClientProfileModal — profil client accessible depuis n'importe quelle page admin
 * Usage: const { openProfile } = useClientProfile();
 *        openProfile("marie@example.com"); — ou openProfile(null, "Marie Dupont", "0600000000")
 */
import { useState, useEffect, useCallback, useContext, createContext, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X, Mail, Phone, Calendar, CreditCard, Star, Clock, Send,
  MessageCircle, Trash2, Activity, Ticket, RefreshCw, User,
  TrendingUp, Check, FileText,
} from "lucide-react";
import { adminCall } from "./AdminLayout";
import { toast } from "sonner";

// ── Context ────────────────────────────────────────────────────────────────────
interface ClientProfileCtx {
  openProfile: (email: string, name?: string, phone?: string) => void;
}

const ClientProfileContext = createContext<ClientProfileCtx>({
  openProfile: () => {},
});

export const useClientProfile = () => useContext(ClientProfileContext);

// ── Modal ──────────────────────────────────────────────────────────────────────
type ProfileTab = "overview" | "bookings" | "packs" | "timeline" | "notes";

const iCls =
  "w-full bg-secondary border border-border px-3 py-2.5 rounded-xl font-body text-[13px] text-foreground focus:border-terra outline-none";

function ProfileContent({
  email,
  initName,
  initPhone,
  onClose,
}: {
  email: string;
  initName?: string;
  initPhone?: string;
  onClose: () => void;
}) {
  const [tab, setTab] = useState<ProfileTab>("overview");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [notes, setNotes] = useState<any[]>([]);
  const [newNote, setNewNote] = useState("");
  const [savingNote, setSavingNote] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminCall({ action: "get_client_activity", client_email: email });
      setData(res);
      setNotes(res.notes || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, [email]);

  useEffect(() => { load(); }, [load]);

  const addNote = async () => {
    if (!newNote.trim()) return;
    setSavingNote(true);
    try {
      await adminCall({ action: "add_client_note", client_email: email, note: newNote.trim() });
      setNotes((n) => [{ id: Date.now(), content: newNote.trim(), created_at: new Date().toISOString() }, ...n]);
      setNewNote("");
      toast.success("Note ajoutée");
    } catch (e: any) { toast.error(e.message); }
    finally { setSavingNote(false); }
  };

  const deleteNote = async (noteId: string) => {
    try {
      await adminCall({ action: "delete_client_note", note_id: noteId });
      setNotes((n) => n.filter((x) => x.id !== noteId));
    } catch (e: any) { toast.error(e.message); }
  };

  const displayName = data?.name || initName || email.split("@")[0];
  const phone = data?.phone || initPhone;
  const fmt = (p: string) => p.replace(/\D/g, "").replace(/^0/, "212");

  const tabs: { key: ProfileTab; label: string }[] = [
    { key: "overview", label: "Vue d'ensemble" },
    { key: "bookings", label: "Réservations" },
    { key: "packs", label: "Packs" },
    { key: "timeline", label: "Activité" },
    { key: "notes", label: "Notes" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div
        className="px-6 pt-6 pb-5 border-b border-border"
        style={{ background: "linear-gradient(135deg, rgba(184,99,74,0.06) 0%, transparent 60%)" }}
      >
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div
              className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-display shrink-0"
              style={{ background: "rgba(184,99,74,0.15)", color: "#B8634A", fontWeight: 200 }}
            >
              {displayName[0]?.toUpperCase()}
            </div>
            <div>
              <h2 className="font-display text-xl text-foreground" style={{ fontWeight: 300, letterSpacing: "0.06em" }}>
                {displayName}
              </h2>
              <p className="font-body text-[12px] text-muted-foreground mt-0.5">{email}</p>
              {phone && (
                <div className="flex items-center gap-3 mt-1.5">
                  <a href={`tel:${phone}`} className="font-body text-[11px] text-muted-foreground hover:text-terra flex items-center gap-1 transition-colors">
                    <Phone size={10} /> {phone}
                  </a>
                  <a href={`https://wa.me/${fmt(phone)}`} target="_blank" rel="noopener noreferrer"
                    className="font-body text-[11px] text-[#25D366] hover:text-[#128C7E] flex items-center gap-1 transition-colors">
                    <Send size={10} /> WhatsApp
                  </a>
                </div>
              )}
            </div>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors mt-1">
            <X size={20} />
          </button>
        </div>

        {/* KPI quick strip */}
        {data && (
          <div className="grid grid-cols-3 gap-3 mt-5">
            {[
              { label: "Séances", value: data.totalSessions || 0, icon: Calendar, color: "text-terra" },
              { label: "Dépensé", value: `${(data.totalSpend || 0).toLocaleString("fr-FR")} DH`, icon: CreditCard, color: "text-gold" },
              { label: "Crédits restants", value: data.remainingCredits || 0, icon: Ticket, color: "text-[#4E9E7A]" },
            ].map((k) => (
              <div key={k.label} className="bg-secondary/60 rounded-xl p-3 text-center">
                <k.icon size={13} className={`${k.color} mx-auto mb-1`} />
                <p className="font-display text-lg text-foreground" style={{ fontWeight: 200 }}>{k.value}</p>
                <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground">{k.label}</p>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-border px-4 no-scrollbar shrink-0">
        {tabs.map(({ key, label }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`font-body text-[11px] tracking-widest uppercase px-4 py-3.5 whitespace-nowrap border-b-2 transition-all ${tab === key ? "border-terra text-terra" : "border-transparent text-muted-foreground hover:text-foreground"}`}
            style={{ fontWeight: 500 }}>
            {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-5">
        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : !data ? (
          <div className="py-16 text-center">
            <User size={32} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-body text-[13px] text-muted-foreground">Aucune donnée trouvée</p>
          </div>
        ) : (
          <>
            {/* OVERVIEW */}
            {tab === "overview" && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "1ère visite", value: data.firstSeen ? new Date(data.firstSeen).toLocaleDateString("fr-FR") : "—" },
                    { label: "Dernière visite", value: data.lastSeen ? new Date(data.lastSeen).toLocaleDateString("fr-FR") : "—" },
                    { label: "No-shows", value: data.noShowCount || 0 },
                    { label: "Annulations", value: data.cancellationCount || 0 },
                  ].map((item) => (
                    <div key={item.label} className="bg-card border border-border rounded-xl p-4">
                      <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-1">{item.label}</p>
                      <p className="font-display text-xl text-foreground" style={{ fontWeight: 200 }}>{item.value}</p>
                    </div>
                  ))}
                </div>
                {data.classes?.length > 0 && (
                  <div className="bg-card border border-border rounded-xl p-4">
                    <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-3">Cours pratiqués</p>
                    <div className="flex flex-wrap gap-2">
                      {data.classes.map((c: string) => (
                        <span key={c} className="bg-terra/10 text-terra font-body text-[10px] tracking-[0.1em] px-2.5 py-1 rounded-full border border-terra/20">
                          {c}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* BOOKINGS */}
            {tab === "bookings" && (
              <div className="space-y-2">
                {(data.bookings || []).length === 0 ? (
                  <p className="text-center text-muted-foreground font-body text-[13px] py-10">Aucune réservation</p>
                ) : (data.bookings || []).slice(0, 30).map((b: any) => (
                  <div key={b.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full shrink-0 ${b.attended ? "bg-[#4E9E7A]" : b.no_show ? "bg-destructive" : "bg-muted"}`} />
                    <div className="flex-1">
                      <p className="font-body text-[13px] text-foreground">{b.session_title || "Séance"}</p>
                      <p className="font-body text-[11px] text-muted-foreground">{b.date} · {b.time}</p>
                    </div>
                    <span className={`font-body text-[9px] tracking-widest uppercase px-2 py-0.5 rounded-full ${b.attended ? "bg-[#4E9E7A]/10 text-[#4E9E7A]" : b.no_show ? "bg-destructive/10 text-destructive" : "bg-secondary text-muted-foreground"}`}>
                      {b.attended ? "Présent" : b.no_show ? "No-show" : "Inscrit"}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* PACKS */}
            {tab === "packs" && (
              <div className="space-y-3">
                {(data.packs || []).length === 0 ? (
                  <p className="text-center text-muted-foreground font-body text-[13px] py-10">Aucun pack</p>
                ) : (data.packs || []).map((p: any) => (
                  <div key={p.id} className="bg-card border border-border rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-body text-[12px] text-terra tracking-widest uppercase mb-1">{p.pack_code}</p>
                        <p className="font-display text-base text-foreground" style={{ fontWeight: 300 }}>{p.offer_name || "Pack"}</p>
                        <p className="font-body text-[11px] text-muted-foreground mt-1">
                          {p.credits_used || 0}/{p.credits_total} crédits utilisés
                        </p>
                      </div>
                      <span className={`font-body text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full ${p.status === "active" ? "bg-[#4E9E7A]/10 text-[#4E9E7A]" : "bg-secondary text-muted-foreground"}`}>
                        {p.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* TIMELINE */}
            {tab === "timeline" && (
              <div className="space-y-2">
                {(data.timeline || []).length === 0 ? (
                  <p className="text-center text-muted-foreground font-body text-[13px] py-10">Aucune activité</p>
                ) : (data.timeline || []).slice(0, 40).map((t: any, i: number) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-terra/10 flex items-center justify-center shrink-0 mt-0.5">
                      <Activity size={11} className="text-terra" />
                    </div>
                    <div className="flex-1 bg-card border border-border rounded-xl px-3 py-2.5">
                      <p className="font-body text-[12px] text-foreground">{t.label || t.action_type}</p>
                      <p className="font-body text-[10px] text-muted-foreground mt-0.5">
                        {t.created_at ? new Date(t.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : ""}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* NOTES */}
            {tab === "notes" && (
              <div className="space-y-4">
                <div className="flex gap-2">
                  <input
                    value={newNote}
                    onChange={(e) => setNewNote(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && addNote()}
                    className={iCls + " flex-1"}
                    placeholder="Ajouter une note..."
                  />
                  <button onClick={addNote} disabled={savingNote || !newNote.trim()}
                    className="bg-terra text-warm-white px-4 py-2.5 rounded-xl font-body text-[11px] hover:bg-terra-dark disabled:opacity-40 transition-colors flex items-center gap-1.5">
                    {savingNote ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                  </button>
                </div>
                {notes.length === 0 ? (
                  <p className="text-center text-muted-foreground font-body text-[13px] py-10">Aucune note</p>
                ) : notes.map((n: any) => (
                  <div key={n.id} className="bg-card border border-border rounded-xl px-4 py-3 flex items-start gap-3">
                    <FileText size={13} className="text-terra shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="font-body text-[13px] text-foreground">{n.content}</p>
                      <p className="font-body text-[10px] text-muted-foreground mt-1">
                        {new Date(n.created_at).toLocaleString("fr-FR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                    <button onClick={() => deleteNote(n.id)} className="text-muted-foreground hover:text-destructive transition-colors shrink-0">
                      <Trash2 size={13} />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

// ── Provider ───────────────────────────────────────────────────────────────────
export function ClientProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<{ email: string; name?: string; phone?: string } | null>(null);

  const openProfile = useCallback((email: string, name?: string, phone?: string) => {
    setProfile({ email, name, phone });
  }, []);

  return (
    <ClientProfileContext.Provider value={{ openProfile }}>
      {children}
      <AnimatePresence>
        {profile && (
          <motion.div
            key="client-profile-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/60 backdrop-blur-sm flex items-center justify-end"
            onClick={() => setProfile(null)}
          >
            <motion.div
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", stiffness: 280, damping: 32 }}
              className="h-full w-full max-w-md bg-card border-l border-border shadow-2xl flex flex-col overflow-hidden"
              onClick={(e) => e.stopPropagation()}
            >
              <ProfileContent
                email={profile.email}
                initName={profile.name}
                initPhone={profile.phone}
                onClose={() => setProfile(null)}
              />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </ClientProfileContext.Provider>
  );
}
