/**
 * AdminWhatsApp — Onglet WhatsApp unifié
 * Tabs: Configuration · Rappels (24h / 2h) · Push personnalisé
 */
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  MessageSquare, Clock, RefreshCw, Settings2, Send, Phone, User,
  Calendar, Check, X, Bell, AlertCircle, Save, Smartphone,
  AlignLeft, AlignRight, Users, ChevronDown, Eye, Zap,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

// ── Types ──────────────────────────────────────────────────────────────────────
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

interface UniqueClient {
  key: string; // phone or email as dedup key
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string;
}

interface WhatsAppConfig {
  whatsapp: string;
  button_side: "left" | "right";
  button_edge: number;
  button_top: number;
}

// ── Defaults ───────────────────────────────────────────────────────────────────
const DEFAULT_CFG: WhatsAppConfig = {
  whatsapp: "33668710966",
  button_side: "left",
  button_edge: 24,
  button_top: 32,
};

const DEFAULT_TEMPLATE_24H =
  "Bonjour {prénom} 👋\n\nRappel : votre cours *{cours}* avec {coach} est *demain {date} à {heure}*.\n\nÀ bientôt au studio ! 🧘\n— The Circle";

const DEFAULT_TEMPLATE_2H =
  "Bonjour {prénom} 👋\n\nVotre cours *{cours}* avec {coach} commence dans 2h à *{heure}*.\n\nOn vous attend ! 🏋️\n— The Circle";

const DEFAULT_PUSH_TEMPLATE =
  "Bonjour {prénom} 👋\n\n[Votre message ici]\n\n— EVØLV Studio";

// ── Helpers ────────────────────────────────────────────────────────────────────
function applyTemplate(template: string, p: UpcomingParticipant): string {
  const dateLabel = new Date(p.session_date + "T12:00:00").toLocaleDateString("fr-FR", {
    weekday: "long", day: "numeric", month: "long",
  });
  return template
    .replace(/{prénom}/g, p.first_name)
    .replace(/{cours}/g, p.session_title)
    .replace(/{heure}/g, p.session_time.slice(0, 5))
    .replace(/{coach}/g, p.session_instructor)
    .replace(/{date}/g, dateLabel)
    .replace(/{nom}/g, `${p.first_name} ${p.last_name}`.trim());
}

function applyPushTemplate(template: string, client: UniqueClient): string {
  return template
    .replace(/{prénom}/g, client.first_name)
    .replace(/{nom}/g, `${client.first_name} ${client.last_name}`.trim())
    .replace(/{studio}/g, "EVØLV Studio")
    .replace(/{lien_pack}/g, `${window.location.origin}/mon-pack`);
}

function buildWaLink(phone: string, message: string): string {
  const clean = phone.replace(/\D/g, "");
  const intl = clean.startsWith("0") ? "212" + clean.slice(1) : clean;
  return `https://wa.me/${intl}?text=${encodeURIComponent(message)}`;
}

// ── Styles ─────────────────────────────────────────────────────────────────────
const iCls =
  "w-full bg-secondary border border-border px-3 py-2.5 rounded-xl font-body text-[13px] text-foreground focus:border-terra outline-none";
const btnPrimary =
  "bg-terra text-warm-white px-4 py-2.5 rounded-full font-body text-[11px] tracking-[0.2em] uppercase hover:bg-terra-dark transition-colors flex items-center gap-2 disabled:opacity-50";

// ── Tab selector ───────────────────────────────────────────────────────────────
type WaTab = "config" | "rappels" | "push";

// ═══════════════════════════════════════════════════════════════════════════════
// CONFIG TAB
// ═══════════════════════════════════════════════════════════════════════════════
function ConfigTab() {
  const [cfg, setCfg] = useState<WhatsAppConfig>(DEFAULT_CFG);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    supabase
      .from("site_content")
      .select("content")
      .eq("section", "contact")
      .maybeSingle()
      .then(({ data }) => {
        if (data?.content) {
          const c = data.content as any;
          setCfg({
            whatsapp: c.whatsapp || DEFAULT_CFG.whatsapp,
            button_side: c.button_side || DEFAULT_CFG.button_side,
            button_edge: c.button_edge ?? DEFAULT_CFG.button_edge,
            button_top: c.button_top ?? DEFAULT_CFG.button_top,
          });
        }
        setLoaded(true);
      });
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const { data: existing } = await supabase
        .from("site_content")
        .select("id, content")
        .eq("section", "contact")
        .maybeSingle();

      const merged = { ...(existing?.content as any || {}), ...cfg };

      if (existing?.id) {
        await supabase.from("site_content").update({ content: merged }).eq("id", existing.id);
      } else {
        await supabase.from("site_content").insert({ section: "contact", content: merged });
      }
      toast.success("Configuration WhatsApp sauvegardée");
    } catch (err: any) {
      toast.error(err.message || "Erreur de sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (!loaded) return (
    <div className="flex items-center justify-center py-16">
      <RefreshCw size={18} className="animate-spin text-muted-foreground" />
    </div>
  );

  return (
    <div className="space-y-5 max-w-xl">
      {/* Numéro WhatsApp */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Smartphone size={15} className="text-terra" />
          <h3 className="font-display text-base text-foreground" style={{ fontWeight: 300 }}>
            Numéro WhatsApp du studio
          </h3>
        </div>
        <div>
          <label className="font-body text-[11px] tracking-widest uppercase text-muted-foreground block mb-1.5">
            Numéro international (sans +)
          </label>
          <input
            value={cfg.whatsapp}
            onChange={(e) => setCfg((c) => ({ ...c, whatsapp: e.target.value.replace(/\D/g, "") }))}
            className={iCls}
            placeholder="33668710966"
          />
          <p className="font-body text-[11px] text-muted-foreground/60 mt-1.5">
            Exemple : <code className="text-terra">212612345678</code> pour Maroc, <code className="text-terra">33612345678</code> pour France
          </p>
        </div>
      </div>

      {/* Position du bouton — phone mockup */}
      <div className="bg-card border border-border rounded-2xl p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Smartphone size={15} className="text-terra" />
          <h3 className="font-display text-base text-foreground" style={{ fontWeight: 300 }}>
            Position du bouton flottant
          </h3>
        </div>
        <p className="font-body text-[11px] text-muted-foreground -mt-2">
          Cliquez dans la prévisualisation pour placer le bouton, ou utilisez les sliders.
        </p>

        {/* Phone mockup — click to position */}
        <div className="flex gap-6 items-start">
          <div
            className="relative bg-secondary border-2 border-border rounded-[24px] overflow-hidden cursor-crosshair select-none shrink-0"
            style={{ width: 160, height: 290 }}
            onClick={(e) => {
              const rect = e.currentTarget.getBoundingClientRect();
              const relX = e.clientX - rect.left;
              const relY = e.clientY - rect.top;
              const isLeft = relX < rect.width / 2;
              const edgePct = isLeft ? relX / rect.width : (rect.width - relX) / rect.width;
              const edge = Math.max(12, Math.min(60, Math.round(edgePct * 60 * 2.5)));
              const top = Math.max(16, Math.min(120, Math.round((relY / rect.height) * 120)));
              setCfg(c => ({ ...c, button_side: isLeft ? "left" : "right", button_edge: edge, button_top: top }));
            }}
          >
            <div className="absolute top-2 left-1/2 -translate-x-1/2 w-8 h-1 bg-border rounded-full" />
            <div className="absolute inset-x-4 top-7 space-y-1.5 opacity-40">
              {[70, 45, 60, 35, 55, 40].map((w, i) => (
                <div key={i} className="h-1 bg-foreground rounded-full" style={{ width: `${w}%` }} />
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-3 flex justify-center">
              <div className="w-8 h-1 bg-border rounded-full" />
            </div>
            {/* Button preview */}
            <div
              className="absolute w-8 h-8 rounded-full shadow-lg flex items-center justify-center z-10 transition-all duration-150"
              style={{
                background: "linear-gradient(135deg, #2ECC71, #128C7E)",
                [cfg.button_side]: `${Math.max(4, Math.round(cfg.button_edge / 60 * 40))}px`,
                top: `${Math.round(cfg.button_top / 120 * 220) + 20}px`,
              }}
            >
              <MessageSquare size={12} className="text-white" />
            </div>
            {/* Center line guide */}
            <div className="absolute inset-y-0 left-1/2 w-px border-l border-dashed border-border/30 pointer-events-none" />
          </div>

          <div className="flex-1 space-y-4">
            <div>
              <label className="font-body text-[11px] tracking-widest uppercase text-muted-foreground block mb-2">Côté</label>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setCfg((c) => ({ ...c, button_side: "left" }))}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] font-body transition-all ${cfg.button_side === "left" ? "bg-terra/10 border-terra/40 text-terra" : "border-border text-muted-foreground"}`}>
                  <AlignLeft size={12} /> Gauche
                </button>
                <button onClick={() => setCfg((c) => ({ ...c, button_side: "right" }))}
                  className={`flex items-center justify-center gap-1.5 py-2 rounded-xl border text-[11px] font-body transition-all ${cfg.button_side === "right" ? "bg-terra/10 border-terra/40 text-terra" : "border-border text-muted-foreground"}`}>
                  <AlignRight size={12} /> Droite
                </button>
              </div>
            </div>
            <div>
              <label className="font-body text-[11px] tracking-widest uppercase text-muted-foreground block mb-1.5">
                Bord : <span className="text-terra">{cfg.button_edge}px</span>
              </label>
              <input type="range" min={12} max={60} value={cfg.button_edge}
                onChange={(e) => setCfg((c) => ({ ...c, button_edge: Number(e.target.value) }))}
                className="w-full accent-terra" />
            </div>
            <div>
              <label className="font-body text-[11px] tracking-widest uppercase text-muted-foreground block mb-1.5">
                Hauteur : <span className="text-terra">{cfg.button_top}px</span>
              </label>
              <input type="range" min={16} max={120} value={cfg.button_top}
                onChange={(e) => setCfg((c) => ({ ...c, button_top: Number(e.target.value) }))}
                className="w-full accent-terra" />
              <div className="flex justify-between font-body text-[9px] text-muted-foreground/50 mt-0.5">
                <span>Haut</span><span>Bas</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <button onClick={save} disabled={saving} className={btnPrimary + " ml-auto"}>
        {saving ? <RefreshCw size={12} className="animate-spin" /> : <Save size={12} />}
        Sauvegarder
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RAPPELS TAB
// ═══════════════════════════════════════════════════════════════════════════════
function RappelsTab() {
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
      if (c.template24h) { setTemplate24h(c.template24h); setEditTemplate24h(c.template24h); }
      if (c.template2h) { setTemplate2h(c.template2h); setEditTemplate2h(c.template2h); }
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

      const { data: sessions } = await supabase
        .from("sessions")
        .select("id, date, time, title, instructor")
        .in("date", [...new Set([today, tomorrow])])
        .eq("is_active", true);

      if (!sessions || sessions.length === 0) {
        setParticipants24h([]); setParticipants2h([]); return;
      }

      const sessions24h = sessions.filter((s: any) => {
        const dt = new Date(`${s.date}T${s.time}`);
        return dt > now && dt <= in24h;
      });
      const sessions2h = sessions.filter((s: any) => {
        const dt = new Date(`${s.date}T${s.time}`);
        return dt > now && dt <= in2h;
      });

      const fetchFor = async (list: typeof sessions): Promise<UpcomingParticipant[]> => {
        if (list.length === 0) return [];
        const ids = list.map((s: any) => s.id);
        const { data: parts } = await supabase
          .from("session_participants")
          .select("id, first_name, last_name, email, phone, session_id")
          .in("session_id", ids);
        return (parts || []).map((p: any) => {
          const s = list.find((ss: any) => ss.id === p.session_id)!;
          const dt = new Date(`${s.date}T${s.time}`);
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
            minutesUntil: Math.round((dt.getTime() - now.getTime()) / 60000),
          };
        });
      };

      const [p24, p2] = await Promise.all([fetchFor(sessions24h), fetchFor(sessions2h)]);
      setParticipants24h(p24.sort((a, b) => a.minutesUntil - b.minutesUntil));
      setParticipants2h(p2.sort((a, b) => a.minutesUntil - b.minutesUntil));
    } catch (err) {
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
        .from("site_content").select("id").eq("section", "whatsapp_reminders").maybeSingle();
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
    if (!p.phone) { toast.error(`${p.first_name} n'a pas de numéro de téléphone`); return; }
    const msg = applyTemplate(type === "24h" ? template24h : template2h, p);
    window.open(buildWaLink(p.phone, msg), "_blank");
    setSentIds((prev) => new Set(prev).add(p.id));
    toast.success(`Message personnalisé envoyé à ${p.first_name}`);
  };

  const sendAll = (list: UpcomingParticipant[], type: "24h" | "2h") => {
    const withPhone = list.filter((p) => p.phone);
    if (withPhone.length === 0) { toast.error("Aucun participant avec numéro"); return; }
    withPhone.forEach((p, i) => setTimeout(() => sendReminder(p, type), i * 900));
    toast.success(`Ouverture de ${withPhone.length} messages personnalisés…`);
  };

  const participants = tab === "24h" ? participants24h : participants2h;
  const currentTemplate = tab === "24h" ? template24h : template2h;

  const fmt = (mins: number) => {
    if (mins < 60) return `dans ${mins} min`;
    const h = Math.floor(mins / 60), m = mins % 60;
    return `dans ${h}h${m > 0 ? m + "m" : ""}`;
  };

  return (
    <div className="space-y-5 max-w-3xl">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex gap-2">
          {(["24h", "2h"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`font-body text-[11px] tracking-widest uppercase px-5 py-2.5 rounded-full transition-all border ${tab === t ? "bg-terra text-warm-white border-terra" : "border-border text-muted-foreground hover:border-terra/30"}`}
              style={{ fontWeight: 500 }}>
              Rappels {t}
              {t === "24h" && participants24h.length > 0 && (
                <span className="ml-2 bg-terra/20 text-terra text-[9px] px-1.5 py-0.5 rounded-full">{participants24h.length}</span>
              )}
              {t === "2h" && participants2h.length > 0 && (
                <span className="ml-2 bg-destructive/20 text-destructive text-[9px] px-1.5 py-0.5 rounded-full">{participants2h.length}</span>
              )}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <button onClick={loadParticipants} className="text-muted-foreground hover:text-terra transition-colors p-2.5">
            <RefreshCw size={14} className={loading ? "animate-spin" : ""} />
          </button>
          <button
            onClick={() => { setShowTemplateEditor(!showTemplateEditor); setEditTemplate24h(template24h); setEditTemplate2h(template2h); }}
            className={`font-body text-[11px] tracking-widest uppercase px-4 py-2.5 rounded-full transition-all border flex items-center gap-2 ${showTemplateEditor ? "bg-terra/10 border-terra/30 text-terra" : "border-border text-muted-foreground hover:border-terra/30"}`}
            style={{ fontWeight: 500 }}>
            <Settings2 size={13} /> Templates
          </button>
        </div>
      </div>

      <AnimatePresence>
        {showTemplateEditor && (
          <motion.div
            initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
            className="bg-card border border-terra/20 rounded-2xl p-5 space-y-4"
          >
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base text-foreground" style={{ fontWeight: 300 }}>Personnaliser les messages</h3>
              <button onClick={() => setShowTemplateEditor(false)} className="text-muted-foreground hover:text-foreground"><X size={16} /></button>
            </div>
            <p className="font-body text-[11px] text-muted-foreground">
              Variables : {["{prénom}", "{cours}", "{heure}", "{date}", "{coach}", "{nom}"].map((v) => (
                <code key={v} className="bg-secondary px-1.5 py-0.5 rounded text-terra font-mono text-[10px] mr-1">{v}</code>
              ))}
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="font-body text-[11px] tracking-widest uppercase text-muted-foreground block mb-2">Rappel 24h</label>
                <textarea value={editTemplate24h} onChange={(e) => setEditTemplate24h(e.target.value)}
                  className={iCls + " min-h-[140px] resize-none"} />
              </div>
              <div>
                <label className="font-body text-[11px] tracking-widest uppercase text-muted-foreground block mb-2">Rappel 2h</label>
                <textarea value={editTemplate2h} onChange={(e) => setEditTemplate2h(e.target.value)}
                  className={iCls + " min-h-[140px] resize-none"} />
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => { setEditTemplate24h(DEFAULT_TEMPLATE_24H); setEditTemplate2h(DEFAULT_TEMPLATE_2H); }}
                className="font-body text-[11px] text-muted-foreground hover:text-foreground underline">
                Par défaut
              </button>
              <button onClick={saveTemplates} disabled={savingTemplates} className={btnPrimary}>
                {savingTemplates ? <RefreshCw size={12} className="animate-spin" /> : <Check size={12} />}
                Sauvegarder
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Bell size={14} className="text-terra" />
            <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 400 }}>
              {tab === "24h" ? "Sessions dans 24h" : "Sessions dans 2h"} ({participants.length})
            </p>
          </div>
          {participants.filter((p) => p.phone).length > 0 && (
            <button onClick={() => sendAll(participants, tab)} className={btnPrimary + " text-[10px]"}>
              <Send size={12} /> Envoyer à tous ({participants.filter((p) => p.phone).length})
            </button>
          )}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw size={18} className="animate-spin text-muted-foreground" /></div>
        ) : participants.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Bell size={32} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-body text-[13px] text-muted-foreground">Aucune session prévue dans les {tab}</p>
          </div>
        ) : (
          <div className="divide-y divide-border">
            {participants.map((p) => (
              <div key={p.id} className="px-5 py-4 flex items-center gap-4 hover:bg-secondary/30 transition-colors">
                <div className="w-9 h-9 rounded-full bg-terra/10 flex items-center justify-center shrink-0">
                  <User size={15} className="text-terra" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-body text-[13px] text-foreground font-medium">{p.first_name} {p.last_name}</p>
                    {sentIds.has(p.id) && (
                      <span className="bg-green-500/15 text-green-600 font-body text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Check size={9} /> Envoyé
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-3 mt-0.5 flex-wrap">
                    <span className="font-body text-[11px] text-muted-foreground flex items-center gap-1">
                      <Calendar size={10} /> {p.session_title} · {p.session_time.slice(0, 5)}
                    </span>
                    <span className="font-body text-[10px] text-terra bg-terra/8 px-2 py-0.5 rounded-full" style={{ fontWeight: 500 }}>
                      {fmt(p.minutesUntil)}
                    </span>
                  </div>
                  {p.phone && (
                    <p className="font-body text-[11px] text-muted-foreground/60 flex items-center gap-1 mt-0.5">
                      <Phone size={10} /> {p.phone}
                    </p>
                  )}
                </div>
                {p.phone ? (
                  <button
                    onClick={() => sendReminder(p, tab)}
                    className={`shrink-0 ${sentIds.has(p.id) ? "bg-green-500/15 text-green-600 border border-green-500/20" : "bg-[#25D366]/15 text-[#128C7E] border border-[#25D366]/20 hover:bg-[#25D366]/25"} px-3 py-2 rounded-xl font-body text-[11px] flex items-center gap-1.5 transition-colors`}
                    style={{ fontWeight: 500 }}>
                    <MessageSquare size={13} />
                    {sentIds.has(p.id) ? "Renvoyé" : "Envoyer"}
                  </button>
                ) : (
                  <div className="shrink-0 flex items-center gap-1.5 text-muted-foreground/50 font-body text-[11px]">
                    <AlertCircle size={13} /> Pas de tel.
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Message preview */}
      <div className="bg-secondary/50 border border-border rounded-2xl p-5">
        <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-3" style={{ fontWeight: 400 }}>
          Aperçu du message personnalisé ({tab})
        </p>
        <pre className="font-body text-[12px] text-foreground whitespace-pre-wrap leading-relaxed">
          {participants.length > 0
            ? applyTemplate(currentTemplate, participants[0])
            : currentTemplate
                .replace(/{prénom}/g, "Marie").replace(/{cours}/g, "Reformer Pilates")
                .replace(/{heure}/g, "10:00").replace(/{coach}/g, "Andy")
                .replace(/{date}/g, "lundi 16 mars").replace(/{nom}/g, "Marie Dupont")}
        </pre>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUSH TAB
// ═══════════════════════════════════════════════════════════════════════════════
function PushTab() {
  const [clients, setClients] = useState<UniqueClient[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [template, setTemplate] = useState(DEFAULT_PUSH_TEMPLATE);
  const [previewClient, setPreviewClient] = useState<UniqueClient | null>(null);
  const [sentKeys, setSentKeys] = useState<Set<string>>(new Set());

  useEffect(() => {
    // Load unique clients from session_participants (grouped by phone or email)
    supabase
      .from("session_participants")
      .select("first_name, last_name, phone, email")
      .then(({ data }) => {
        const seen = new Map<string, UniqueClient>();
        (data || []).forEach((p: any) => {
          const key = p.phone ? p.phone.replace(/\D/g, "") : p.email;
          if (!key || seen.has(key)) return;
          seen.set(key, {
            key,
            first_name: p.first_name || "",
            last_name: p.last_name || "",
            phone: p.phone || null,
            email: p.email || "",
          });
        });
        const list = [...seen.values()].sort((a, b) => a.first_name.localeCompare(b.first_name));
        setClients(list);
        if (list.length > 0) setPreviewClient(list[0]);
      })
      .finally(() => setLoading(false));
  }, []);

  const toggleAll = () => {
    if (selected.size === clients.filter((c) => c.phone).length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(clients.filter((c) => c.phone).map((c) => c.key)));
    }
  };

  const toggleClient = (key: string) => {
    setSelected((prev) => {
      const n = new Set(prev);
      n.has(key) ? n.delete(key) : n.add(key);
      return n;
    });
  };

  const sendToSelected = () => {
    const targets = clients.filter((c) => c.phone && selected.has(c.key));
    if (targets.length === 0) { toast.error("Sélectionnez au moins un contact avec numéro"); return; }
    targets.forEach((c, i) => {
      setTimeout(() => {
        const msg = applyPushTemplate(template, c);
        window.open(buildWaLink(c.phone!, msg), "_blank");
        setSentKeys((prev) => new Set(prev).add(c.key));
      }, i * 900);
    });
    toast.success(`Envoi de ${targets.length} messages personnalisés…`);
  };

  const withPhone = clients.filter((c) => c.phone);

  return (
    <div className="space-y-5 max-w-3xl">
      {/* Template editor */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <div className="flex items-center gap-2">
          <Zap size={15} className="text-terra" />
          <h3 className="font-display text-base text-foreground" style={{ fontWeight: 300 }}>Message push personnalisé</h3>
        </div>
        <div className="space-y-2">
          <p className="font-body text-[11px] text-muted-foreground">
            Variables disponibles — cliquez pour insérer dans le message :
          </p>
          <div className="flex flex-wrap gap-1.5">
            {[
              { v: "{prénom}", desc: "Prénom du client" },
              { v: "{nom}", desc: "Prénom + Nom" },
              { v: "{studio}", desc: "EVØLV Studio" },
              { v: "{lien_pack}", desc: "Lien /mon-pack" },
            ].map(({ v, desc }) => (
              <button
                key={v}
                title={desc}
                onClick={() => setTemplate(t => t + v)}
                className="font-mono text-[10px] bg-secondary border border-border hover:border-terra/60 hover:text-terra text-muted-foreground px-2 py-1 rounded-lg transition-all"
              >
                {v}
              </button>
            ))}
          </div>
        </div>
        <textarea
          value={template}
          onChange={(e) => setTemplate(e.target.value)}
          className={iCls + " min-h-[140px] resize-none"}
          placeholder="Bonjour {prénom} 👋&#10;&#10;[Votre message ici]&#10;&#10;— EVØLV Studio"
        />

        {/* Preview */}
        {previewClient && (
          <div className="bg-secondary/60 rounded-xl p-4">
            <p className="font-body text-[10px] tracking-widest uppercase text-muted-foreground mb-2">
              Aperçu pour {previewClient.first_name}
            </p>
            <pre className="font-body text-[12px] text-foreground whitespace-pre-wrap leading-relaxed">
              {applyPushTemplate(template, previewClient)}
            </pre>
          </div>
        )}
      </div>

      {/* Client list */}
      <div className="bg-card border border-border rounded-2xl overflow-hidden">
        <div className="px-6 py-4 border-b border-border flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Users size={14} className="text-terra" />
            <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 400 }}>
              Contacts ({withPhone.length} avec numéro · {selected.size} sélectionnés)
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={toggleAll}
              className="font-body text-[11px] text-muted-foreground hover:text-terra transition-colors">
              {selected.size === withPhone.length ? "Tout désélectionner" : "Tout sélectionner"}
            </button>
            {selected.size > 0 && (
              <button onClick={sendToSelected} className={btnPrimary + " text-[10px]"}>
                <Send size={12} /> Envoyer ({selected.size})
              </button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16"><RefreshCw size={18} className="animate-spin text-muted-foreground" /></div>
        ) : clients.length === 0 ? (
          <div className="px-6 py-16 text-center">
            <Users size={32} className="text-muted-foreground/30 mx-auto mb-3" />
            <p className="font-body text-[13px] text-muted-foreground">Aucun contact trouvé</p>
          </div>
        ) : (
          <div className="divide-y divide-border max-h-[480px] overflow-y-auto">
            {clients.map((c) => (
              <div
                key={c.key}
                onClick={() => { if (c.phone) { toggleClient(c.key); setPreviewClient(c); } else setPreviewClient(c); }}
                className={`px-5 py-3.5 flex items-center gap-4 transition-colors cursor-pointer ${selected.has(c.key) ? "bg-terra/5" : "hover:bg-secondary/30"} ${!c.phone ? "opacity-50" : ""}`}
              >
                <div className={`w-5 h-5 rounded border flex items-center justify-center shrink-0 transition-all ${selected.has(c.key) ? "bg-terra border-terra" : "border-border"}`}>
                  {selected.has(c.key) && <Check size={11} className="text-white" />}
                </div>
                <div className="w-8 h-8 rounded-full bg-terra/10 flex items-center justify-center shrink-0">
                  <User size={13} className="text-terra" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13px] text-foreground">{c.first_name} {c.last_name}</p>
                  <p className="font-body text-[11px] text-muted-foreground flex items-center gap-1">
                    {c.phone ? <><Phone size={10} /> {c.phone}</> : <><AlertCircle size={10} /> Pas de numéro</>}
                  </p>
                </div>
                {sentKeys.has(c.key) && (
                  <span className="bg-green-500/15 text-green-600 font-body text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Check size={9} /> Envoyé
                  </span>
                )}
                {previewClient?.key === c.key && (
                  <span className="bg-terra/10 text-terra font-body text-[9px] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Eye size={9} /> Aperçu
                  </span>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════════════════════
export function AdminWhatsApp() {
  const [tab, setTab] = useState<WaTab>("config");

  const tabs: { key: WaTab; label: string; icon: any }[] = [
    { key: "config", label: "Configuration", icon: Settings2 },
    { key: "rappels", label: "Rappels", icon: Clock },
    { key: "push", label: "Push", icon: Zap },
  ];

  return (
    <div className="space-y-6">
      <div className="flex gap-2 flex-wrap">
        {tabs.map(({ key, label, icon: Icon }) => (
          <button key={key} onClick={() => setTab(key)}
            className={`flex items-center gap-2 font-body text-[11px] tracking-widest uppercase px-5 py-2.5 rounded-full transition-all border ${tab === key ? "bg-terra text-warm-white border-terra" : "border-border text-muted-foreground hover:border-terra/30"}`}
            style={{ fontWeight: 500 }}>
            <Icon size={13} /> {label}
          </button>
        ))}
      </div>

      {tab === "config" && <ConfigTab />}
      {tab === "rappels" && <RappelsTab />}
      {tab === "push" && <PushTab />}
    </div>
  );
}
