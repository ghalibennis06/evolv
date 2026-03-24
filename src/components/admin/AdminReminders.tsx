/**
 * AdminReminders — Rappels WhatsApp
 * Affiche les participants avec des sessions dans les prochaines 24h / 2h
 * et permet d'envoyer des rappels via WhatsApp en un clic.
 * Les templates de messages sont configurables et sauvegardés dans site_content.
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare,
  Clock,
  RefreshCw,
  Settings2,
  Send,
  Phone,
  User,
  Calendar,
  ChevronDown,
  Check,
  X,
  Bell,
  AlertCircle,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface UpcomingParticipant {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone: string | null;
  session_id: string;
  session_title: string;
  session_date: string;
  session_time: string;
  session_instructor: string;
  minutesUntil: number;
}

const DEFAULT_TEMPLATE_24H =
  "Bonjour {prénom} 👋\n\nRappel : votre cours *{cours}* avec {coach} est *demain {date} à {heure}*.\n\nÀ bientôt au studio ! 🧘\n— The Circle";

const DEFAULT_TEMPLATE_2H =
  "Bonjour {prénom} 👋\n\nVotre cours *{cours}* avec {coach} commence dans 2h à *{heure}*.\n\nOn vous attend ! 🏋️\n— The Circle";

function applyTemplate(template: string, p: UpcomingParticipant): string {
  const dateLabel = new Date(p.session_date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
  return template
    .replace(/{prénom}/g, p.first_name)
    .replace(/{cours}/g, p.session_title)
    .replace(/{heure}/g, p.session_time.slice(0, 5))
    .replace(/{coach}/g, p.session_instructor)
    .replace(/{date}/g, dateLabel)
    .replace(/{nom}/g, `${p.first_name} ${p.last_name}`.trim());
}

function buildWaLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, "");
  const intl = clean.startsWith("0") ? "33" + clean.slice(1) : clean;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

const iCls =
  "w-full bg-secondary border border-border px-3 py-2.5 rounded-xl font-body text-[13px] text-foreground focus:border-terra outline-none";
const btn =
  "bg-terra text-warm-white px-4 py-2.5 rounded-full font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra-dark transition-colors flex items-center gap-2 disabled:opacity-50";

export function AdminReminders() {
  const [tab, setTab] = useState<"24h" | "2h">("24h");
  const [participants24h, setParticipants24h] = useState<UpcomingParticipant[]>([]);
  const [participants2h, setParticipants2h] = useState<UpcomingParticipant[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [template24h, setTemplate24h] = useState(DEFAULT_TEMPLATE_24H);
  const [template2h, setTemplate2h] = useState(DEFAULT_TEMPLATE_2H);
  const [editTemplate24h, setEditTemplate24h] = useState(DEFAULT_TEMPLATE_24H);
  const [editTemplate2h, setEditTemplate2h] = useState(DEFAULT_TEMPLATE_2H);
  const [savingTemplates, setSavingTemplates] = useState(false);
  const [sentIds, setSentIds] = useState<Set<string>>(new Set());

  const loadTemplates = useCallback(async () => {
    const { data } = await supabase
      .from("site_content")
      .select("content")
      .eq("section", "whatsapp_reminders")
      .maybeSingle();
    if (data?.content) {
      const c = data.content as any;
      if (c.template24h) {
        setTemplate24h(c.template24h);
        setEditTemplate24h(c.template24h);
      }
      if (c.template2h) {
        setTemplate2h(c.template2h);
        setEditTemplate2h(c.template2h);
      }
    }
  }, []);

  const loadParticipants = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const in24h = new Date(now.getTime() + 24 * 60 * 60 * 1000);
      const in2h = new Date(now.getTime() + 2 * 60 * 60 * 1000);

      const today = now.toISOString().slice(0, 10);
      const tomorrow = in24h.toISOString().slice(0, 10);

      // Fetch sessions for today and tomorrow
      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, date, time, title, instructor")
        .in("date", [...new Set([today, tomorrow])])
        .eq("is_active", true);

      if (!sessions || sessions.length === 0) {
        setParticipants24h([]);
        setParticipants2h([]);
        return;
      }

      // Filter to sessions within 24h
      const sessions24h = sessions.filter((s: any) => {
        const dt = new Date(`${s.date}T${s.time}`);
        return dt > now && dt <= in24h;
      });
      const sessions2h = sessions.filter((s: any) => {
        const dt = new Date(`${s.date}T${s.time}`);
        return dt > now && dt <= in2h;
      });

      const fetchParticipantsFor = async (
        filteredSessions: typeof sessions,
      ): Promise<UpcomingParticipant[]> => {
        if (filteredSessions.length === 0) return [];
        const ids = filteredSessions.map((s: any) => s.id);
        const { data: parts } = await supabase
          .from("session_participants")
          .select("id, first_name, last_name, email, phone, session_id")
          .in("session_id", ids);

        return (parts || []).map((p: any) => {
          const s = filteredSessions.find((ss: any) => ss.id === p.session_id)!;
          const dt = new Date(`${s.date}T${s.time}`);
          const minutesUntil = Math.round((dt.getTime() - now.getTime()) / 60000);
          return {
            id: p.id,
            first_name: p.first_name || "",
            last_name: p.last_name || "",
            email: p.email || "",
            phone: p.phone || null,
            session_id: p.session_id,
            session_title: s.title,
            session_date: s.date,
            session_time: s.time,
            session_instructor: s.instructor || "",
            minutesUntil,
          };
        });
      };

      const [p24, p2] = await Promise.all([
        fetchParticipantsFor(sessions24h),
        fetchParticipantsFor(sessions2h),
      ]);

      setParticipants24h(p24.sort((a, b) => a.minutesUntil - b.minutesUntil));
      setParticipants2h(p2.sort((a, b) => a.minutesUntil - b.minutesUntil));
    } catch (err) {
      console.error(err);
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
    loadParticipants();
  }, [loadTemplates, loadParticipants]);

  const saveTemplates = async () => {
    setSavingTemplates(true);
    try {
      const { data: existing } = await supabase
        .from("site_content")
        .select("id")
        .eq("section", "whatsapp_reminders")
        .maybeSingle();

      const payload = { template24h: editTemplate24h, template2h: editTemplate2h };

      if (existing?.id) {
        await supabase.from("site_content").update({ content: payload }).eq("id", existing.id);
      } else {
        await supabase.from("site_content").insert({ section: "whatsapp_reminders", content: payload });
      }

      setTemplate24h(editTemplate24h);
      setTemplate2h(editTemplate2h);
      setShowTemplateEditor(false);
      toast.success("Templates sauvegardés");
    } catch (err: any) {
      toast.error(err.message || "Erreur de sauvegarde");
    } finally {
      setSavingTemplates(false);
    }
  };

  const sendReminder = (p: UpcomingParticipant, type: "24h" | "2h") => {
    if (!p.phone) {
      toast.error(`${p.first_name} n'a pas de numéro de téléphone`);
      return;
    }
    const template = type === "24h" ? template24h : template2h;
    const message = applyTemplate(template, p);
    const url = buildWaLink(p.phone, message);
    window.open(url, "_blank");
    setSentIds((prev) => new Set(prev).add(p.id));
    toast.success(`WhatsApp ouvert pour ${p.first_name}`);
  };

  const sendAllReminders = (list: UpcomingParticipant[], type: "24h" | "2h") => {
    const withPhone = list.filter((p) => p.phone);
    if (withPhone.length === 0) {
      toast.error("Aucun participant avec un numéro de téléphone");
      return;
    }
    withPhone.forEach((p, i) => {
      setTimeout(() => sendReminder(p, type), i * 800);
    });
  };

  const participants = tab === "24h" ? participants24h : participants2h;
  const currentTemplate = tab === "24h" ? template24h : template2h;

  const formatTimeUntil = (mins: number) => {
    if (mins < 60) return `dans ${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `dans ${h}h${m > 0 ? m + "m" : ""}`;
  };

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(["24h", "2h"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`font-body text-[11px] tracking-widest uppercase px-5 py-2.5 rounded-full transition-all border ${tab === t ? "bg-terra text-warm-white border-terra" : "border-border text-muted-foreground hover:border-terra/30"}`}
              style={{ fontWeight: 500 }}
            >
              Rappels {t}
              {t === "24h" && participants24h.length > 0 && (
                <span className="ml-2 bg-terra/20 text-terra text-[9px] px-1.5 py-0.5 rounded-full">
                  {participants24h.length}
                </span>
              )}
              {t === "2h" && participants2h.length > 0 && (
                <span className="ml-2 bg-destructive/20 text-destructive text-[9px] px-1.5 py-0.5 rounded-full">
                  {participants2h.length}
                </span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button
            onClick={loadParticipants}
            className="text-muted-foreground hover:text-terra transition-colors p-2.5"
          >
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => {
              setShowTemplateEditor(!showTemplateEditor);
              setEditTemplate24h(template24h);
              setEditTemplate2h(template2h);
            }}
            className={`font-body text-[11px] tracking-widest uppercase px-4 py-2.5 rounded-full transition-all border flex items-center gap-2 ${showTemplateEditor ? "bg-terra/10 border-terra/30 text-terra" : "border-border text-muted-foreground hover:border-terra/30"}`}
            style={{ fontWeight: 500 }}
          >
            <Settings2 size={13} /> Templates
          </button>
        </div>
      </div>

      {/* Template editor */}
      <AnimatePresence>
        {showTemplateEditor && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-terra/20 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base text-foreground" style={{ fontWeight: 300 }}>
                Personnaliser les messages
              </h3>
              <button onClick={() => setShowTemplateEditor(false)} className="text-muted-foreground hover:text-foreground">
                <X size={16} />
              </button>
            </div>
            <p className="font-body text-[11px] text-muted-foreground">
              Variables disponibles :{" "}
              {["{prénom}", "{cours}", "{heure}", "{date}", "{coach}", "{nom}"].map((v) => (
                <code
                  key={v}
                  className="bg-secondary px-1.5 py-0.5 rounded text-terra font-mono text-[10px] mr-1"
                >
                  {v}
                </code>
              ))}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-[11px] tracking-widest uppercase text-muted-foreground block mb-2">
                  Message rappel 24h
                </label>
                <textarea
                  value={editTemplate24h}
                  onChange={(e) => setEditTemplate24h(e.target.value)}
                  className={iCls + " min-h-[140px] resize-none"}
                  placeholder="Message envoyé 24h avant le cours..."
                />
              </div>
              <div>
                <label className="font-body text-[11px] tracking-widest uppercase text-muted-foreground block mb-2">
                  Message rappel 2h
                </label>
                <textarea
                  value={editTemplate2h}
                  onChange={(e) => setEditTemplate2h(e.target.value)}
                  className={iCls + " min-h-[140px] resize-none"}
                  placeholder="Message envoyé 2h avant le cours..."
                />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => {
                  setEditTemplate24h(DEFAULT_TEMPLATE_24H);
                  setEditTemplate2h(DEFAULT_TEMPLATE_2H);
                }}
                className="font-body text-[11px] text-muted-foreground hover:text-foreground underline"
              >
                Remettre par défaut
              </button>
              <button onClick={saveTemplates} disabled={savingTemplates} className={btn}>
                {savingTemplates ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                Sauvegarder
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Participants list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-terra" />
            <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 400 }}>
              {tab === "24h" ? "Sessions dans les prochaines 24h" : "Sessions dans les 2 prochaines heures"}
              {" "}({participants.length} participant{participants.length > 1 ? "s" : ""})
            </p>
          </div>
          {participants.filter((p) => p.phone).length > 0 && (
            <button
              onClick={() => sendAllReminders(participants, tab)}
              className={btn + " text-[10px]"}
            >
              <Send size={12} /> Envoyer à tous ({participants.filter((p) => p.phone).length})
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <RefreshCw size={18} className="animate-spin text-muted-foreground" />
          </div>
        ) : participants.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell size={32} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-body text-[13px] text-muted-foreground">
              Aucune session prévue dans les {tab === "24h" ? "24 prochaines heures" : "2 prochaines heures"}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {participants.map((p) => (
              <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                {/* Avatar */}
                <div className="w-9 h-9 rounded-full bg-terra/10 flex items-center justify-center shrink-0">
                  <User size={15} className="text-terra" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-body text-[13px] text-foreground font-medium">
                      {p.first_name} {p.last_name}
                    </p>
                    {sentIds.has(p.id) && (
                      <span className="bg-green-500/15 text-green-600 font-body text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={9} /> Envoyé
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="font-body text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar size={10} />
                      {p.session_title} · {p.session_time.slice(0, 5)}
                    </span>
                    <span className="font-body text-[10px] text-terra bg-terra/8 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
                      {formatTimeUntil(p.minutesUntil)}
                    </span>
                  </div>
                  {p.phone && (
                    <p className="font-body text-[11px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> {p.phone}
                    </p>
                  )}
                </div>

                {/* Action */}
                {p.phone ? (
                  <button
                    onClick={() => sendReminder(p, tab)}
                    className={`shrink-0 ${sentIds.has(p.id) ? "bg-green-500/15 text-green-600 border border-green-500/20" : "bg-[#25D366]/15 text-[#128C7E] border border-[#25D366]/20 hover:bg-[#25D366]/25"} px-3 py-2 rounded-xl font-body text-[11px] flex items-center gap-1.5 transition-colors`}
                    style={{ fontWeight: 500 }}
                  >
                    <MessageSquare size={13} />
                    {sentIds.has(p.id) ? "Renvoyé" : "Envoyer"}
                  </button>
                ) : (
                  <div className="shrink-0 flex items-center gap-1.5 text-muted-foreground/50 font-body text-[11px]">
                    <AlertCircle size={13} />
                    Pas de tel.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Preview */}
      <div className="bg-secondary/50 border border-border rounded-2xl p-5">
        <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-3" style={{ fontWeight: 400 }}>
          Aperçu du message ({tab})
        </p>
        <pre className="font-body text-[12px] text-foreground whitespace-pre-wrap leading-relaxed">
          {participants.length > 0
            ? applyTemplate(currentTemplate, participants[0])
            : currentTemplate
                .replace(/{prénom}/g, "Marie")
                .replace(/{cours}/g, "Reformer Pilates")
                .replace(/{heure}/g, "10:00")
                .replace(/{coach}/g, "Sofia")
                .replace(/{date}/g, "demain lundi 16 mars")
                .replace(/{nom}/g, "Marie Dupont")}
        </pre>
      </div>
    </div>
  );
}
