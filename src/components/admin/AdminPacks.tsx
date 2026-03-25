import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, Check, CheckCircle, ChevronDown, ChevronUp,
  Copy, Minus, Plus, RefreshCw, Search, Ticket, Trash2, X, Zap,
} from "lucide-react";
import { toast } from "sonner";
import { api } from "@/lib/api";
import { Progress } from "@/components/ui/progress";
import { adminCall } from "./AdminLayout";
import { useClientProfile } from "./ClientProfileModal";

// ─── Types ────────────────────────────────────────────────────────────────────
interface Pack {
  id: string; pack_code: string; pack_type: string | null;
  client_name: string; client_email: string; client_phone: string | null;
  credits_total: number; credits_used: number;
  payment_status: string | null; payment_method?: string | null; paid_at?: string | null;
  expires_at: string | null; created_at: string; is_active: boolean | null; notes: string | null;
}

interface Request {
  id: string; client_name: string | null; client_email: string | null;
  client_phone: string | null; offer_name: string | null;
  credits_total: number; payment_method: string; request_status: string;
  created_at: string; metadata?: any;
}

interface PricingPlan {
  id: string; name: string; price: number;
  sessions_included: number | null; validity_days: number | null;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────
const iCls = "w-full bg-secondary border border-border px-3 py-2.5 font-body text-[13px] text-foreground focus:border-terra outline-none rounded-xl";
const now = () => new Date();
const fmtDate = (s: string) => new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
const fmtTime = (s: string) => new Date(s).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

function packStatus(p: Pack) {
  if (!p.is_active) return { label: "Désactivé", cls: "bg-muted text-muted-foreground" };
  if (p.expires_at && new Date(p.expires_at) < now()) return { label: "Expiré", cls: "bg-destructive/10 text-destructive" };
  if (p.credits_used >= p.credits_total) return { label: "Épuisé", cls: "bg-amber-500/10 text-amber-600" };
  return { label: "Actif", cls: "bg-emerald-500/10 text-emerald-600" };
}

function copy(text: string, label = "Copié !") {
  navigator.clipboard.writeText(text);
  toast.success(label);
}

function fmtPaymentStatus(status: string | null) {
  const map: Record<string, { label: string; cls: string }> = {
    paid: { label: "Payé", cls: "text-emerald-600" },
    pending: { label: "En attente", cls: "text-amber-600" },
    failed: { label: "Échoué", cls: "text-destructive" },
    refunded: { label: "Remboursé", cls: "text-muted-foreground" },
    cash_on_site: { label: "Sur place", cls: "text-blue-500" },
  };
  return map[status || ""] || { label: status || "—", cls: "text-muted-foreground" };
}

function fmtPaymentMethod(method: string | null) {
  const map: Record<string, string> = {
    online: "En ligne (Payzone)",
    cash_on_site: "Sur place (espèces)",
    card: "Carte bancaire",
  };
  return map[method || ""] || method || "—";
}

// ─── Main component ───────────────────────────────────────────────────────────
export function AdminPacks() {
  const { openProfile } = useClientProfile();
  const [requests, setRequests] = useState<Request[]>([]);
  const [packs, setPacks] = useState<Pack[]>([]);
  const [pricing, setPricing] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [reqLoading, setReqLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "depleted" | "expired" | "unpaid">("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const realtimeRef = useRef(false);

  // ── Fetchers ────────────────────────────────────────────────────────────────
  const fetchRequests = async () => {
    setReqLoading(true);
    try {
      const data = await api.admin.packs.list();
      setRequests(data || []);
    } catch {
      setRequests([]);
    }
    setReqLoading(false);
  };

  const fetchPacks = async () => {
    setLoading(true);
    try {
      const data = await api.admin.packs.list();
      setPacks((data || []) as Pack[]);
    } catch {
      setPacks([]);
    }
    setLoading(false);
  };

  const fetchPricing = async () => {
    try {
      const data = await api.admin.pricing.list();
      setPricing(((data || []) as PricingPlan[]).filter(p => (p.sessions_included || 0) > 0));
    } catch {
      setPricing([]);
    }
  };

  useEffect(() => {
    fetchRequests();
    fetchPacks();
    fetchPricing();
  }, []);

  // Realtime subscriptions removed — use manual refresh instead
  useEffect(() => { realtimeRef.current = false; }, []);

  // ── Pending requests ─────────────────────────────────────────────────────────
  const pending = useMemo(() => requests.filter(r => r.request_status === "pending"), [requests]);

  // ── Filtered packs ───────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    let list = [...packs];
    if (filter === "active") list = list.filter(p => p.is_active && p.credits_used < p.credits_total && (!p.expires_at || new Date(p.expires_at) > now()));
    if (filter === "depleted") list = list.filter(p => p.credits_used >= p.credits_total);
    if (filter === "expired") list = list.filter(p => !!p.expires_at && new Date(p.expires_at) < now());
    if (filter === "unpaid") list = list.filter(p => p.payment_status !== "paid" && p.payment_status !== "free");
    if (search) {
      const s = search.toLowerCase();
      list = list.filter(p =>
        p.pack_code.toLowerCase().includes(s) ||
        p.client_name.toLowerCase().includes(s) ||
        p.client_email.toLowerCase().includes(s) ||
        (p.client_phone || "").includes(s)
      );
    }
    return list.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
  }, [packs, filter, search]);

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="space-y-8">

      {/* ══ 1. PENDING REQUESTS ═══════════════════════════════════════════════ */}
      <PendingSection
        pending={pending}
        loading={reqLoading}
        onRefresh={fetchRequests}
        onApprove={async (id) => {
          try {
            const res = await adminCall({ action: "approve_blackcard_request", request_id: id, payment_source: "paid_on_site" });
            const code = res?.pack?.pack_code || res?.pack_code || null;
            if (code) {
              toast.success(`✅ Code généré : ${code}`, {
                description: "Communiquez ce code au client · /mon-pack pour le suivi",
                duration: 30000,
                action: { label: "📋 Copier", onClick: () => copy(code) },
              });
            } else {
              toast.success("Demande approuvée — code visible dans la liste");
            }
            fetchRequests(); fetchPacks();
          } catch (e: any) { toast.error(e.message || "Erreur approbation"); }
        }}
        onReject={async (id) => {
          try {
            await adminCall({ action: "reject_blackcard_request", request_id: id });
            toast.info("Demande refusée");
            fetchRequests();
          } catch (e: any) { toast.error(e.message || "Erreur refus"); }
        }}
      />

      {/* ══ 2. GENERATE CODE + USE CREDIT ════════════════════════════════════ */}
      <div className="grid gap-5 lg:grid-cols-2">
        <GenerateSection pricing={pricing} onGenerated={() => { fetchPacks(); fetchRequests(); }} />
        <UseCreditSection packs={packs} onUsed={fetchPacks} />
      </div>

      {/* ══ 3. ALL CODES ═════════════════════════════════════════════════════ */}
      <PacksListSection
        packs={filtered}
        loading={loading}
        search={search}
        filter={filter}
        expandedId={expandedId}
        onSearch={setSearch}
        onFilter={setFilter}
        onExpand={setExpandedId}
        onRefresh={fetchPacks}
        onAdjust={async (pack, delta) => {
          const newUsed = Math.max(0, Math.min(pack.credits_total, pack.credits_used + delta));
          try {
            await adminCall({ action: "adjust_pack_credits", pack_id: pack.id, new_credits_used: newUsed, reason: "Ajustement manuel" });
            setPacks(prev => prev.map(p => p.id === pack.id ? { ...p, credits_used: newUsed } : p));
          } catch (e: any) { toast.error(e.message || "Erreur"); }
        }}
        onDeactivate={async (pack) => {
          if (!confirm("Désactiver ce pack ?")) return;
          try {
            await adminCall({ action: "deactivate_pack", pack_id: pack.id, reason: "Désactivé admin" });
            toast.success("Pack désactivé");
            fetchPacks();
          } catch (e: any) { toast.error(e.message || "Erreur"); }
        }}
        onDelete={async (pack) => {
          const reason = prompt(`Raison de suppression pour ${pack.pack_code} ?`) ?? "";
          if (reason === null) return;
          try {
            await adminCall({ action: "delete_pack", pack_id: pack.id, deleted_by: "admin", reason: reason || "Suppression manuelle" });
            toast.success("Pack supprimé");
            fetchPacks();
          } catch (e: any) { toast.error(e.message || "Erreur"); }
        }}
      />
    </div>
  );
}

// ─── Section 1: Pending requests ──────────────────────────────────────────────
function PendingSection({ pending, loading, onRefresh, onApprove, onReject }: {
  pending: Request[]; loading: boolean;
  onRefresh: () => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
}) {
  const [processing, setProcessing] = useState<string | null>(null);

  return (
    <section className="rounded-3xl border-2 border-red-600/60 bg-red-600/[0.08] overflow-hidden">
      <div className="flex items-center justify-between px-6 py-4 border-b border-red-600/20 bg-red-600/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-red-600/20 flex items-center justify-center">
            <AlertTriangle size={15} className="text-red-500" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <p className="font-body text-[11px] uppercase tracking-[0.3em] text-red-500 font-bold">
                ⚠ DEMANDES À TRAITER
              </p>
              {pending.length > 0 && (
                <span className="relative flex h-2.5 w-2.5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-500 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-600"></span>
                </span>
              )}
            </div>
            <p className="font-body text-[12px] text-muted-foreground" style={{ fontWeight: 300 }}>
              {loading ? "…" : pending.length === 0 ? "Aucune demande" : `${pending.length} demande${pending.length > 1 ? "s" : ""} à valider`}
            </p>
          </div>
        </div>
        <button onClick={onRefresh} className="flex items-center gap-1.5 font-body text-[10px] uppercase tracking-widest text-muted-foreground hover:text-terra transition-colors">
          <RefreshCw size={12} /> Actualiser
        </button>
      </div>

      {loading ? (
        <div className="px-6 py-8 text-center">
          <p className="font-body text-[12px] text-muted-foreground">Chargement…</p>
        </div>
      ) : pending.length === 0 ? (
        <div className="px-6 py-8 text-center flex flex-col items-center gap-2">
          <CheckCircle size={28} className="text-emerald-500/40" />
          <p className="font-body text-[12px] text-muted-foreground">Tout est traité — aucune demande en attente.</p>
        </div>
      ) : (
        <div className="divide-y divide-red-600/10">
          {pending.map(r => (
            <div key={r.id} className="px-6 py-4 flex flex-col sm:flex-row sm:items-center gap-4 border-l-4 border-l-red-500">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <button
                    onClick={() => r.client_email && openProfile(r.client_email, r.client_name, r.client_phone || undefined)}
                    className="font-body text-[14px] text-foreground font-semibold hover:text-terra transition-colors text-left"
                  >{r.client_name || "Client inconnu"}</button>
                  <span className={`font-body text-[9px] uppercase tracking-widest px-2 py-0.5 rounded-full ${r.payment_method === "cash_on_site" ? "bg-orange-500/15 text-orange-500" : "bg-sky-500/15 text-sky-500"}`}>
                    {r.payment_method === "cash_on_site" ? "Sur place" : "En ligne"}
                  </span>
                </div>
                <p className="font-body text-[12px] text-terra font-medium">{r.offer_name || "Pack"} · {r.credits_total} crédit{r.credits_total > 1 ? "s" : ""}</p>
                <p className="font-body text-[11px] text-muted-foreground mt-0.5">
                  {r.client_email || "—"}{r.client_phone ? ` · ${r.client_phone}` : ""}
                </p>
                <p className="font-body text-[10px] text-muted-foreground/60 mt-1">
                  {fmtDate(r.created_at)} à {fmtTime(r.created_at)}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                <button
                  disabled={processing === r.id}
                  onClick={async () => { setProcessing(r.id); await onApprove(r.id); setProcessing(null); }}
                  className="flex items-center gap-1.5 bg-terra text-white px-4 py-2 rounded-xl font-body text-[11px] uppercase tracking-[0.2em] hover:bg-terra-dark transition-all disabled:opacity-50"
                >
                  <Check size={13} /> {processing === r.id ? "…" : "Valider"}
                </button>
                <button
                  disabled={processing === r.id}
                  onClick={async () => { setProcessing(r.id); await onReject(r.id); setProcessing(null); }}
                  className="flex items-center gap-1.5 border border-destructive/40 text-destructive px-4 py-2 rounded-xl font-body text-[11px] uppercase tracking-[0.2em] hover:bg-destructive hover:text-white transition-all disabled:opacity-50"
                >
                  <X size={13} /> Refuser
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

// ─── Section 2a: Generate code ────────────────────────────────────────────────
function GenerateSection({ pricing, onGenerated }: { pricing: PricingPlan[]; onGenerated: () => void }) {
  const [selectedPlanId, setSelectedPlanId] = useState("none");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payment, setPayment] = useState("paid");
  const [notes, setNotes] = useState("");
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ code: string; credits: number; client: string } | null>(null);

  const plan = pricing.find(p => p.id === selectedPlanId) || null;

  const generate = async () => {
    if (!name) return toast.error("Nom client requis");
    setGenerating(true);
    setResult(null);
    try {
      const credits = plan?.sessions_included || 1;
      const res = await adminCall({
        action: "generate_pack",
        pack_type: "carte_black",
        client_name: name,
        client_email: email || "",
        client_phone: phone || null,
        offer_id: plan?.id || null,
        offer_name: plan?.name || null,
        payment_status: payment,
        notes: notes || null,
        custom_credits: credits,
        validity_days: plan?.validity_days || 90,
        created_by: "admin",
      });
      const code = res?.code || res?.data?.pack_code;
      if (!code) throw new Error("Code non retourné");
      setResult({ code, credits, client: name });
      toast.success(`Code ${code} généré !`);
      setName(""); setEmail(""); setPhone(""); setNotes(""); setSelectedPlanId("none");
      onGenerated();
    } catch (e: any) { toast.error(e.message || "Erreur génération"); }
    setGenerating(false);
  };

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-7 h-7 rounded-full bg-terra/10 flex items-center justify-center">
          <Ticket size={13} className="text-terra" />
        </div>
        <p className="font-body text-[11px] uppercase tracking-[0.3em] text-terra" style={{ fontWeight: 400 }}>Générer un code</p>
      </div>

      <div className="space-y-3">
        <select value={selectedPlanId} onChange={e => setSelectedPlanId(e.target.value)} className={iCls}>
          <option value="none">— Formule libre —</option>
          {pricing.map(p => (
            <option key={p.id} value={p.id}>{p.name} · {p.sessions_included} crédits · {p.price} DH</option>
          ))}
        </select>
        <input value={name} onChange={e => setName(e.target.value)} className={iCls} placeholder="Nom client *" />
        <div className="grid grid-cols-2 gap-2">
          <input value={email} onChange={e => setEmail(e.target.value)} className={iCls} placeholder="Email" type="email" />
          <input value={phone} onChange={e => setPhone(e.target.value)} className={iCls} placeholder="Téléphone" type="tel" />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <select value={payment} onChange={e => setPayment(e.target.value)} className={iCls}>
            <option value="paid">Payé</option>
            <option value="pending">En attente</option>
          </select>
          <input value={notes} onChange={e => setNotes(e.target.value)} className={iCls} placeholder="Notes (opt.)" />
        </div>
        <button
          onClick={generate}
          disabled={generating || !name}
          className="w-full bg-terra text-white py-3 rounded-xl font-body text-[11px] uppercase tracking-[0.25em] hover:bg-terra-dark transition-all disabled:opacity-40 flex items-center justify-center gap-2"
        >
          <Zap size={13} /> {generating ? "Génération…" : "Générer le code"}
        </button>
      </div>

      {result && (
        <div className="mt-4 rounded-2xl bg-terra/8 border border-terra/20 p-4">
          <p className="font-body text-[10px] uppercase tracking-widest text-terra mb-2">Code généré</p>
          <div className="flex items-center justify-between gap-3">
            <p className="font-display text-2xl text-foreground" style={{ fontWeight: 300 }}>{result.code}</p>
            <div className="flex gap-2">
              <button onClick={() => copy(result.code)} className="rounded-lg border border-border px-2.5 py-1.5 hover:border-terra hover:text-terra"><Copy size={12} /></button>
            </div>
          </div>
          <p className="font-body text-[11px] text-muted-foreground mt-1">{result.client} · {result.credits} crédit{result.credits > 1 ? "s" : ""}</p>
        </div>
      )}
    </section>
  );
}

// ─── Section 2b: Use a credit ─────────────────────────────────────────────────
interface SessionSlot { id: string; title: string; date: string; time: string; instructor: string; capacity?: number; enrolled?: number; }

function UseCreditSection({ packs, onUsed }: { packs: Pack[]; onUsed: () => void }) {
  const [search, setSearch] = useState("");
  const [selectedPack, setSelectedPack] = useState<Pack | null>(null);
  const [selectedSession, setSelectedSession] = useState<SessionSlot | null>(null);
  const [sessions, setSessions] = useState<SessionSlot[]>([]);
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [confirmed, setConfirmed] = useState(false);

  useEffect(() => {
    const todayStr = new Date().toISOString().split("T")[0];
    api.sessions.list({ activeOnly: true }).then((data) => {
      setSessions(((data || []).filter((s: any) => s.date >= todayStr).slice(0, 40)) as SessionSlot[]);
    }).catch(() => {});
  }, []);

  const activePacks = useMemo(() =>
    packs.filter(p => p.is_active && p.credits_used < p.credits_total && (!p.expires_at || new Date(p.expires_at) > new Date())),
    [packs]
  );

  const results = useMemo(() => {
    if (!search) return [];
    const s = search.toLowerCase();
    return activePacks.filter(p =>
      p.pack_code.toLowerCase().includes(s) ||
      p.client_name.toLowerCase().includes(s) ||
      p.client_email.toLowerCase().includes(s)
    ).slice(0, 5);
  }, [search, activePacks]);

  // Group sessions by date
  const sessionsByDate = useMemo(() => {
    const map: Record<string, SessionSlot[]> = {};
    for (const s of sessions) {
      if (!map[s.date]) map[s.date] = [];
      map[s.date].push(s);
    }
    return map;
  }, [sessions]);

  const useCredit = async () => {
    if (!selectedPack || !selectedSession) return;
    setLoading(true);
    try {
      const newUsed = selectedPack.credits_used + 1;

      // 1. Adjust pack credits via admin function
      await adminCall({
        action: "adjust_pack_credits",
        pack_id: selectedPack.id,
        new_credits_used: newUsed,
        reason: `Séance : ${selectedSession.title} — ${selectedSession.date} ${selectedSession.time.slice(0,5)}`,
        session_id: selectedSession.id,
        session_title: selectedSession.title,
        session_date: selectedSession.date,
        session_time: selectedSession.time,
      });

      // 2. Register participant for this session
      await api.sessions.registerParticipant(selectedSession.id, {
        client_name: selectedPack.client_name,
        client_email: selectedPack.client_email || "",
        client_phone: selectedPack.client_phone || null,
        pack_code: selectedPack.pack_code,
        payment_method: "pack",
        payment_status: "Payé",
        notes: `Crédit consommé via admin · Pack ${selectedPack.pack_code}`,
      });

      toast.success(`✅ Crédit déduit & inscription créée`, {
        description: `${selectedPack.pack_code} · ${selectedSession.title} · ${selectedPack.credits_total - newUsed} crédit(s) restant(s)`,
      });
      setSelectedPack(null); setSearch(""); setSelectedSession(null); setStep(1); setConfirmed(false);
      onUsed();
    } catch (e: any) { toast.error(e.message || "Erreur lors de la déduction"); }
    setLoading(false);
  };

  const StepIndicator = ({ current }: { current: 1 | 2 | 3 }) => (
    <div className="flex items-center gap-2 mb-4">
      {[1, 2, 3].map(s => (
        <div key={s} className="flex items-center gap-2">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-body text-[10px] font-bold transition-colors ${current >= s ? "bg-terra text-white" : "bg-secondary text-muted-foreground"}`}>{s}</div>
          {s < 3 && <div className={`h-px w-6 ${current > s ? "bg-terra" : "bg-border"}`} />}
        </div>
      ))}
      <span className="font-body text-[10px] text-muted-foreground ml-1 uppercase tracking-widest">
        {current === 1 ? "Trouver le pack" : current === 2 ? "Choisir la séance" : "Confirmer"}
      </span>
    </div>
  );

  return (
    <section className="rounded-3xl border border-border bg-card p-6">
      <div className="flex items-center gap-2.5 mb-1">
        <div className="w-7 h-7 rounded-full bg-terra/10 flex items-center justify-center">
          <Minus size={13} className="text-terra" />
        </div>
        <p className="font-body text-[11px] uppercase tracking-[0.3em] text-terra" style={{ fontWeight: 400 }}>Utiliser un crédit — Inscrire à une séance</p>
      </div>
      <p className="font-body text-[11px] text-muted-foreground mb-4" style={{ fontWeight: 300 }}>
        Sélectionnez un pack actif, choisissez la séance, confirmez l'inscription.
      </p>

      <StepIndicator current={step} />

      {/* Step 1: Find pack */}
      {step === 1 && (
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className={iCls + " pl-9"}
            placeholder="Code, nom ou email du client…"
          />
          {results.length > 0 && (
            <div className="mt-1 rounded-2xl border border-border bg-card shadow-xl z-10 overflow-hidden">
              {results.map(p => (
                <button
                  key={p.id}
                  onClick={() => { setSelectedPack(p); setSearch(""); setStep(2); }}
                  className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors border-b border-border last:border-0"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-body text-[13px] text-foreground font-bold tracking-wider">{p.pack_code}</p>
                      <p className="font-body text-[12px] text-foreground">{p.client_name}</p>
                      <p className="font-body text-[10px] text-muted-foreground">{p.client_email}{p.client_phone ? ` · ${p.client_phone}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-display text-2xl text-terra" style={{ fontWeight: 300 }}>{p.credits_total - p.credits_used}</p>
                      <p className="font-body text-[9px] text-muted-foreground">crédits restants</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
          {search && results.length === 0 && (
            <p className="mt-2 font-body text-[12px] text-muted-foreground text-center">Aucun pack actif trouvé</p>
          )}
          {!search && (
            <p className="mt-3 font-body text-[11px] text-muted-foreground" style={{ fontWeight: 300 }}>
              {activePacks.length} pack{activePacks.length > 1 ? "s" : ""} actif{activePacks.length > 1 ? "s" : ""} · Tapez le code ou le nom du client
            </p>
          )}
        </div>
      )}

      {/* Step 2: Select session */}
      {step === 2 && selectedPack && (
        <div className="space-y-3">
          {/* Pack info card */}
          <div className="rounded-2xl bg-terra/8 border border-terra/20 p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[10px] uppercase tracking-widest text-terra mb-1">Pack sélectionné</p>
                <p className="font-body text-[15px] text-foreground font-bold">{selectedPack.pack_code}</p>
                <p className="font-body text-[13px] text-foreground">{selectedPack.client_name}</p>
                <p className="font-body text-[11px] text-muted-foreground">{selectedPack.client_email}{selectedPack.client_phone ? ` · ${selectedPack.client_phone}` : ""}</p>
              </div>
              <div className="text-right">
                <p className="font-display text-3xl text-terra" style={{ fontWeight: 300 }}>{selectedPack.credits_total - selectedPack.credits_used}</p>
                <p className="font-body text-[10px] text-muted-foreground">/ {selectedPack.credits_total} crédits</p>
                {selectedPack.expires_at && (
                  <p className="font-body text-[9px] text-muted-foreground mt-1">Exp. {fmtDate(selectedPack.expires_at)}</p>
                )}
              </div>
            </div>
          </div>

          {/* Session list */}
          <div>
            <p className="font-body text-[9px] tracking-[0.25em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 500 }}>
              Choisir la séance
            </p>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {Object.entries(sessionsByDate).slice(0, 10).map(([date, daySessions]) => (
                <div key={date}>
                  <p className="font-body text-[9px] uppercase tracking-widest text-muted-foreground mb-1">
                    {new Date(date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "long", day: "2-digit", month: "short" })}
                  </p>
                  {daySessions.map(s => {
                    const spots = (s.capacity || 0) - (s.enrolled || 0);
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setSelectedSession(s); setStep(3); }}
                        className="w-full text-left rounded-xl border border-border bg-secondary hover:border-terra/40 hover:bg-terra/5 transition-colors p-3 mb-1"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-body text-[12px] font-bold text-terra">{s.time.slice(0,5)}</span>
                              <span className="font-body text-[13px] text-foreground font-medium">{s.title}</span>
                            </div>
                            <p className="font-body text-[10px] text-muted-foreground">{s.instructor}</p>
                          </div>
                          {s.capacity && (
                            <span className={`font-body text-[10px] font-semibold px-2 py-0.5 rounded-full ${spots <= 0 ? "bg-destructive/10 text-destructive" : spots <= 2 ? "bg-amber-500/10 text-amber-600" : "bg-emerald-500/10 text-emerald-600"}`}>
                              {spots <= 0 ? "Complet" : `${spots} pl.`}
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => { setSelectedPack(null); setStep(1); }} className="font-body text-[10px] text-muted-foreground hover:text-foreground transition-colors">← Changer de pack</button>
        </div>
      )}

      {/* Step 3: Confirm */}
      {step === 3 && selectedPack && selectedSession && (
        <div className="space-y-4">
          <div className="rounded-2xl bg-secondary border border-border p-4 space-y-3">
            <p className="font-body text-[10px] uppercase tracking-widest text-muted-foreground">Récapitulatif</p>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-terra/10 flex items-center justify-center shrink-0">
                <span className="font-display text-sm text-terra" style={{ fontWeight: 400 }}>{selectedPack.client_name[0]?.toUpperCase()}</span>
              </div>
              <div className="flex-1">
                <p className="font-body text-[14px] text-foreground font-semibold">{selectedPack.client_name}</p>
                <p className="font-body text-[11px] text-muted-foreground">{selectedPack.pack_code}</p>
              </div>
            </div>
            <div className="h-px bg-border" />
            <div className="flex items-center justify-between">
              <div>
                <p className="font-body text-[13px] text-foreground font-medium">{selectedSession.title}</p>
                <p className="font-body text-[11px] text-muted-foreground">
                  {new Date(selectedSession.date + "T12:00:00").toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" })} · {selectedSession.time.slice(0,5)} · {selectedSession.instructor}
                </p>
              </div>
              <div className="text-right">
                <p className="font-body text-[11px] text-destructive">−1 crédit</p>
                <p className="font-body text-[10px] text-muted-foreground">{selectedPack.credits_total - selectedPack.credits_used - 1} restants</p>
              </div>
            </div>
          </div>

          <button
            onClick={useCredit}
            disabled={loading}
            className="w-full bg-terra text-white py-3 rounded-xl font-body text-[11px] uppercase tracking-[0.25em] hover:bg-terra-dark transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            <Check size={13} /> {loading ? "Traitement…" : "Confirmer l'inscription"}
          </button>
          <button onClick={() => { setSelectedSession(null); setStep(2); }} className="w-full font-body text-[10px] text-muted-foreground hover:text-foreground transition-colors text-center">← Changer de séance</button>
        </div>
      )}
    </section>
  );
}

// ─── Section 3: Full pack list ────────────────────────────────────────────────
function PacksListSection({ packs, loading, search, filter, expandedId, onSearch, onFilter, onExpand, onRefresh, onAdjust, onDeactivate, onDelete }: {
  packs: Pack[]; loading: boolean; search: string;
  filter: "all" | "active" | "depleted" | "expired" | "unpaid"; expandedId: string | null;
  onSearch: (s: string) => void; onFilter: (f: "all" | "active" | "depleted" | "expired" | "unpaid") => void;
  onExpand: (id: string | null) => void; onRefresh: () => void;
  onAdjust: (p: Pack, delta: number) => void;
  onDeactivate: (p: Pack) => void;
  onDelete: (p: Pack) => void;
}) {
  const FILTERS: { key: "all" | "active" | "depleted" | "expired" | "unpaid"; label: string }[] = [
    { key: "all", label: "Tous" },
    { key: "active", label: "Actifs" },
    { key: "depleted", label: "Épuisés" },
    { key: "expired", label: "Expirés" },
    { key: "unpaid", label: "Non payés" },
  ];

  return (
    <section className="rounded-3xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="px-6 py-4 border-b border-border flex flex-col sm:flex-row gap-3 items-start sm:items-center justify-between">
        <div className="flex items-center gap-2">
          <p className="font-body text-[11px] uppercase tracking-[0.3em] text-muted-foreground" style={{ fontWeight: 400 }}>
            Tous les codes
          </p>
          <span className="font-body text-[10px] bg-secondary text-muted-foreground px-2 py-0.5 rounded-full">{packs.length}</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {FILTERS.map(f => (
            <button key={f.key} onClick={() => onFilter(f.key)}
              className={`px-3 py-1.5 rounded-full font-body text-[10px] uppercase tracking-widest border transition-all ${
                filter === f.key
                  ? (f.key === "unpaid" ? "bg-destructive text-white border-destructive" : "bg-terra text-white border-terra")
                  : (f.key === "unpaid" ? "border-destructive/30 text-destructive hover:border-destructive/60" : "border-border text-muted-foreground hover:border-terra/40")
              }`}>
              {f.label}
            </button>
          ))}
          <button onClick={onRefresh} className="px-3 py-1.5 rounded-full border border-border text-muted-foreground hover:border-terra/40 transition-all">
            <RefreshCw size={11} />
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="px-6 py-3 border-b border-border">
        <div className="relative">
          <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => onSearch(e.target.value)} className={iCls + " pl-9"} placeholder="Code, nom, email, téléphone…" />
        </div>
      </div>

      {/* Table header */}
      <div className="hidden md:grid grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-2.5 bg-secondary/40 border-b border-border font-body text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
        <span>Client & code</span>
        <span>Crédits</span>
        <span>Statut</span>
        <span>Expire</span>
        <span>Actions</span>
      </div>

      {/* Rows */}
      <div className="divide-y divide-border">
        {loading ? (
          <p className="py-12 text-center font-body text-[13px] text-muted-foreground">Chargement…</p>
        ) : packs.length === 0 ? (
          <p className="py-12 text-center font-body text-[13px] text-muted-foreground">Aucun pack trouvé</p>
        ) : (
          packs.map(p => {
            const st = packStatus(p);
            const remaining = p.credits_total - p.credits_used;
            const pct = p.credits_total > 0 ? Math.round((remaining / p.credits_total) * 100) : 0;
            const isExpanded = expandedId === p.id;

            return (
              <div key={p.id}>
                <div className="grid md:grid-cols-[2fr_1fr_1fr_1fr_auto] gap-4 px-6 py-4 items-center hover:bg-secondary/20 transition-colors">
                  {/* Client */}
                  <div>
                    <div className="flex items-center gap-2 flex-wrap mb-0.5">
                      <button
                        onClick={() => copy(p.pack_code)}
                        className="font-body text-[13px] text-foreground font-bold tracking-wider hover:text-terra transition-colors"
                      >
                        {p.pack_code}
                      </button>
                    </div>
                    <button
                      onClick={() => p.client_email && openProfile(p.client_email, p.client_name, p.client_phone || undefined)}
                      className="font-body text-[12px] text-foreground hover:text-terra transition-colors text-left"
                    >{p.client_name}</button>
                    <p className="font-body text-[10px] text-muted-foreground">{p.client_email}{p.client_phone ? ` · ${p.client_phone}` : ""}</p>
                  </div>

                  {/* Credits */}
                  <div>
                    <p className="font-display text-xl text-foreground mb-1" style={{ fontWeight: 300 }}>
                      {remaining}<span className="font-body text-[12px] text-muted-foreground">/{p.credits_total}</span>
                    </p>
                    <Progress value={pct} className="h-1.5 w-20" />
                  </div>

                  {/* Status */}
                  <div>
                    <span className={`font-body text-[9px] uppercase tracking-widest px-2.5 py-1 rounded-full ${st.cls}`}>{st.label}</span>
                  </div>

                  {/* Expiry */}
                  <div className="font-body text-[11px] text-muted-foreground">
                    {p.expires_at ? fmtDate(p.expires_at) : "—"}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <button onClick={() => onExpand(isExpanded ? null : p.id)} className="p-1.5 rounded-lg border border-border hover:border-terra text-muted-foreground hover:text-terra transition-all">
                      {isExpanded ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                    </button>
                    <button onClick={() => copy(p.pack_code, `${p.pack_code} copié`)} className="p-1.5 rounded-lg border border-border hover:border-terra text-muted-foreground hover:text-terra transition-all">
                      <Copy size={12} />
                    </button>
                    {p.is_active && (
                      <button onClick={() => onDeactivate(p)} className="p-1.5 rounded-lg border border-border hover:border-amber-500 text-muted-foreground hover:text-amber-500 transition-all"><X size={12} /></button>
                    )}
                    <button onClick={() => onDelete(p)} className="p-1.5 rounded-lg border border-destructive/30 text-destructive/50 hover:bg-destructive hover:text-white transition-all"><Trash2 size={12} /></button>
                  </div>
                </div>

                {isExpanded && (
                  <div className="px-6 pb-4 bg-secondary/10 border-t border-border">
                    <PackDetails pack={p} />
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

// ─── Pack detail (inline expand) ──────────────────────────────────────────────
function PackDetails({ pack }: { pack: Pack }) {
  const [history, setHistory] = useState<any[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    adminCall({ action: "get_pack_history", pack_code: pack.pack_code })
      .then(res => { setHistory(res?.usageLog || []); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, [pack.pack_code]);

  const remaining = pack.credits_total - pack.credits_used;
  const pct = pack.credits_total > 0 ? Math.round((remaining / pack.credits_total) * 100) : 0;
  const ps = fmtPaymentStatus(pack.payment_status);

  return (
    <div className="pt-5 grid md:grid-cols-2 gap-6">
      {/* Left: Info */}
      <div>
        <p className="font-body text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3" style={{ fontWeight: 500 }}>Détails du pack</p>

        {/* Credits visual */}
        <div className="rounded-2xl bg-secondary border border-border p-4 mb-4">
          <div className="flex items-end gap-2 mb-2">
            <p className="font-display text-4xl text-foreground" style={{ fontWeight: 300 }}>{remaining}</p>
            <p className="font-body text-[13px] text-muted-foreground mb-1">/ {pack.credits_total} crédits</p>
          </div>
          <div className="h-2 bg-border rounded-full overflow-hidden">
            <div className="h-full rounded-full transition-all" style={{ width: `${pct}%`, background: pct > 50 ? "hsl(var(--terra))" : pct > 20 ? "#D4A853" : "#B8634A" }} />
          </div>
          <p className="font-body text-[10px] text-muted-foreground mt-1">{pack.credits_used} utilisé{pack.credits_used > 1 ? "s" : ""} · {pct}% restant</p>
        </div>

        <div className="space-y-2 font-body text-[13px]">
          <div className="flex justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground">Type de pack</span>
            <span className="text-foreground font-medium">{pack.pack_type || "Carte Black"}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground">Créé le</span>
            <span className="text-foreground">{fmtDate(pack.created_at)}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground">Expire le</span>
            <span className={`font-medium ${pack.expires_at && new Date(pack.expires_at) < new Date() ? "text-destructive" : "text-foreground"}`}>
              {pack.expires_at ? fmtDate(pack.expires_at) : "Pas d'expiration"}
            </span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground">Statut paiement</span>
            <span className={`font-medium ${ps.cls}`}>{ps.label}</span>
          </div>
          <div className="flex justify-between py-1.5 border-b border-border/50">
            <span className="text-muted-foreground">Moyen de paiement</span>
            <span className="text-foreground">{fmtPaymentMethod(pack.payment_method)}</span>
          </div>
          {(pack.paid_at || pack.payment_status === "paid") && (
            <div className="flex justify-between py-1.5 border-b border-border/50">
              <span className="text-muted-foreground">Payé le</span>
              <span className="text-foreground">{pack.paid_at ? fmtDate(pack.paid_at) : fmtDate(pack.created_at)}</span>
            </div>
          )}
          {pack.notes && (
            <div className="py-1.5">
              <span className="text-muted-foreground block mb-1">Notes</span>
              <p className="text-foreground bg-secondary rounded-xl px-3 py-2 text-[12px]">{pack.notes}</p>
            </div>
          )}
        </div>

        <div className="mt-3">
          <button onClick={() => copy(pack.pack_code)} className="rounded-xl border border-border px-3 py-1.5 font-body text-[10px] uppercase tracking-widest hover:border-terra hover:text-terra transition-all flex items-center gap-1.5">
            <Copy size={10} /> Copier le code
          </button>
        </div>
      </div>

      {/* Right: Usage history */}
      <div>
        <p className="font-body text-[10px] uppercase tracking-[0.3em] text-muted-foreground mb-3" style={{ fontWeight: 500 }}>Historique d'utilisation</p>
        {!loaded ? (
          <p className="font-body text-[12px] text-muted-foreground">Chargement…</p>
        ) : history.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border p-6 text-center">
            <p className="font-body text-[12px] text-muted-foreground">Aucune séance enregistrée pour ce pack.</p>
          </div>
        ) : (
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {history.map((u: any, i: number) => (
              <div key={u.id} className="flex items-start gap-3 rounded-xl bg-background border border-border px-4 py-3">
                <div className="w-6 h-6 rounded-full bg-terra/10 flex items-center justify-center shrink-0 mt-0.5">
                  <span className="font-body text-[9px] text-terra font-bold">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-body text-[13px] text-foreground font-medium truncate">{u.session_title || "Séance"}</p>
                  <p className="font-body text-[10px] text-muted-foreground">{u.session_date ? new Date(u.session_date).toLocaleDateString("fr-FR", { weekday: "short", day: "2-digit", month: "short" }) : fmtDate(u.used_at)}{u.session_time ? ` · ${u.session_time.slice(0,5)}` : ""}</p>
                </div>
                {u.cancelled_at && <span className="font-body text-[9px] uppercase text-destructive bg-destructive/10 px-2 py-0.5 rounded-full shrink-0">Annulé</span>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
