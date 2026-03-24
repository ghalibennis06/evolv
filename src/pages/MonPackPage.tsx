import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Ticket, Clock, CheckCircle, XCircle, AlertCircle,
  Calendar, Copy, MessageSquare, ArrowRight, MapPin, Phone,
  Mail, X, Zap, RefreshCw, CreditCard, ChevronRight, Info,
} from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MeridianLogo from "@/components/brand/MeridianLogo";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Pack {
  id: string;
  pack_code: string;
  pack_type: string;
  client_name: string;
  client_email: string;
  credits_total: number;
  credits_used: number;
  payment_status: string;
  is_active: boolean;
  expires_at: string | null;
  created_at: string;
  status?: string;
  offer_id?: string | null;
}

interface UsageEntry {
  id: string;
  session_title: string | null;
  session_date: string | null;
  session_time: string | null;
  used_at: string;
  cancelled_at: string | null;
  credit_refunded: boolean;
}

interface PendingRequest {
  id: string;
  client_name: string;
  client_email: string;
  offer_name: string;
  credits_total: number;
  payment_method: string;
  request_status: string;
  payment_status: string;
  created_at: string;
}

interface PricingOption {
  id: string;
  name: string;
  sessions: number;
  price: number;
  validity_days: number | null;
  description: string | null;
  is_active: boolean;
}

const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("fr-FR", { day: "2-digit", month: "long", year: "numeric" });

const formatCode = (raw: string) => {
  const clean = raw.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (clean.length <= 2) return clean;
  if (clean.length <= 6) return `TC-${clean.slice(2)}`;
  return `TC-${clean.slice(2, 6)}-${clean.slice(6, 10)}`;
};

const maskEmail = (email: string) => {
  const [local, domain] = email.split("@");
  if (!domain) return email;
  return local.slice(0, 2) + "••••@" + domain;
};

const getStatusConfig = (pack: Pack) => {
  const creditsLeft = pack.credits_total - pack.credits_used;
  const expired = pack.expires_at && new Date(pack.expires_at) < new Date();
  if (!pack.is_active || pack.status === "cancelled")
    return { label: "Annulé", color: "text-destructive", bg: "bg-destructive/10 border-destructive/20", icon: XCircle };
  if (expired)
    return { label: "Expiré", color: "text-muted-foreground", bg: "bg-muted border-border", icon: AlertCircle };
  if (creditsLeft <= 0)
    return { label: "Épuisé", color: "text-muted-foreground", bg: "bg-muted border-border", icon: CheckCircle };
  return { label: "Actif", color: "text-terra", bg: "bg-secondary/40 border-foreground/15", icon: CheckCircle };
};

// Step enum
type Step = "pre-search" | "verify-email" | "result";

const MonPackPage = () => {
  // Form state
  const [codeInput, setCodeInput] = useState("");
  const [emailInput, setEmailInput] = useState("");

  // Search flow
  const [step, setStep] = useState<Step>("pre-search");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Results
  const [pack, setPack] = useState<Pack | null>(null);
  const [usage, setUsage] = useState<UsageEntry[]>([]);
  const [pendingRequest, setPendingRequest] = useState<PendingRequest | null>(null);
  const [notFound, setNotFound] = useState(false);

  // Misc
  const [copied, setCopied] = useState(false);
  const [showRecharger, setShowRecharger] = useState(false);
  const [pricing, setPricing] = useState<PricingOption[]>([]);
  const [pricingLoading, setPricingLoading] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState<PricingOption | null>(null);
  const [rechargeLoading, setRechargeLoading] = useState(false);

  // Step 1: lookup code
  const handleCodeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const code = codeInput.trim().toUpperCase();
    if (!code) return;
    setLoading(true);
    setError("");
    setPack(null);
    setUsage([]);
    setPendingRequest(null);
    setNotFound(false);

    const { data: packData } = await supabase
      .from("packs")
      .select("*")
      .eq("pack_code", code)
      .maybeSingle();

    setLoading(false);

    if (!packData) {
      // Move to email step anyway to check pending requests
      setStep("verify-email");
      return;
    }

    // Code found — ask for email verification
    setPack(packData as Pack);
    setStep("verify-email");
  };

  // Step 2: verify email
  const handleEmailSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const email = emailInput.trim().toLowerCase();
    if (!email) return;
    setLoading(true);
    setError("");

    if (pack) {
      // Check email matches
      if (pack.client_email.toLowerCase() !== email) {
        setLoading(false);
        setError("L'adresse email ne correspond pas à ce code. Vérifiez votre email de confirmation.");
        return;
      }
      // Email matches — load usage
      const { data: usageData } = await supabase
        .from("pack_usage_log")
        .select("id, session_title, session_date, session_time, used_at, cancelled_at, credit_refunded")
        .eq("pack_id", pack.id)
        .order("used_at", { ascending: false });
      setUsage((usageData || []) as UsageEntry[]);
      setLoading(false);
      setStep("result");
    } else {
      // No pack found — check pending requests by email
      const { data: reqData } = await supabase
        .from("pack_purchase_requests")
        .select("*")
        .eq("client_email", email)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();

      if (reqData) {
        setPendingRequest(reqData as PendingRequest);
      } else {
        setNotFound(true);
      }
      setLoading(false);
      setStep("result");
    }
  };

  const resetSearch = () => {
    setStep("pre-search");
    setCodeInput("");
    setEmailInput("");
    setError("");
    setPack(null);
    setUsage([]);
    setPendingRequest(null);
    setNotFound(false);
  };

  const copyCode = () => {
    if (!pack) return;
    navigator.clipboard.writeText(pack.pack_code);
    setCopied(true);
    toast.success("Code copié !");
    setTimeout(() => setCopied(false), 2000);
  };

  const openRecharger = async () => {
    setShowRecharger(true);
    setSelectedOffer(null);
    if (pricing.length > 0) return;
    setPricingLoading(true);
    const { data } = await supabase
      .from("pricing")
      .select("*")
      .eq("is_active", true)
      .order("price", { ascending: true });
    setPricing((data as PricingOption[]) || []);
    setPricingLoading(false);
  };

  const handleRecharge = async () => {
    if (!selectedOffer || !pack) return;
    setRechargeLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-payzone-session", {
        body: {
          amount: selectedOffer.price,
          pack_type: selectedOffer.name,
          client_name: pack.client_name,
          client_email: pack.client_email,
          existing_pack_code: pack.pack_code,
          sessions: selectedOffer.sessions,
        },
      });
      if (error || !data?.payment_url) throw new Error(error?.message || "Erreur Payzone");
      window.location.href = data.payment_url;
    } catch {
      const msg = encodeURIComponent(
        `Bonjour 👋 Je souhaite recharger ma carte ${pack.pack_code} (${pack.client_name}) avec l'offre "${selectedOffer.name}" (${selectedOffer.sessions} séances — ${selectedOffer.price} MAD).`
      );
      window.open(`https://wa.me/33668710966?text=${msg}`, "_blank");
    } finally {
      setRechargeLoading(false);
      setShowRecharger(false);
    }
  };

  const creditsLeft = pack ? pack.credits_total - pack.credits_used : 0;
  const progressPct = pack ? Math.max(0, (creditsLeft / pack.credits_total) * 100) : 0;
  const statusCfg = pack ? getStatusConfig(pack) : null;
  const StatusIcon = statusCfg?.icon ?? CheckCircle;

  const daysUntilExpiry = pack?.expires_at
    ? Math.ceil((new Date(pack.expires_at).getTime() - Date.now()) / 86400000)
    : null;

  return (
    <main className="bg-sand min-h-screen">
      <Navbar onBookClick={() => {}} />

      <section className="pt-28 pb-20 px-6">
        <div className="container mx-auto max-w-2xl">

          {/* ── Header ── */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="text-center mb-10"
          >
            <div className="flex justify-center mb-6">
              <MeridianLogo size={72} variant="sand" animate spinDuration={12} glowAnimation />
            </div>
            <p className="font-body text-[11px] tracking-[0.35em] uppercase text-terra mb-3" style={{ fontWeight: 200 }}>
              Mon espace
            </p>
            <h1 className="font-display text-4xl md:text-5xl text-foreground mb-3" style={{ fontWeight: 200, letterSpacing: "0.1em" }}>
              <em className="italic text-terra">Consultez votre carte</em>{" "}
              <span style={{ fontWeight: 200 }}>Circler</span>
            </h1>
            <p className="font-body text-muted-foreground max-w-md mx-auto" style={{ fontWeight: 300 }}>
              Entrez votre code unique pour accéder à votre tableau de bord — crédits, historique de séances et rechargement en ligne.
            </p>
          </motion.div>

          {/* ── PRE-SEARCH STATE ── */}
          <AnimatePresence mode="wait">
            {step === "pre-search" && (
              <motion.div
                key="pre-search"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                {/* Info cards */}
                <div className="grid sm:grid-cols-3 gap-3 mb-8">
                  {[
                    {
                      icon: Ticket,
                      title: "Votre code Circler",
                      desc: "Chaque carte a un code unique au format TC-XXXX-XXXX, reçu par email après achat.",
                    },
                    {
                      icon: CreditCard,
                      title: "Vos crédits",
                      desc: "Consultez vos séances restantes, votre historique et votre date d'expiration.",
                    },
                    {
                      icon: Zap,
                      title: "Recharger",
                      desc: "Rechargez votre carte directement en ligne ou via WhatsApp en quelques clics.",
                    },
                  ].map(({ icon: Icon, title, desc }, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, y: 12 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 + i * 0.07 }}
                      className="bg-card border border-border rounded-2xl p-4"
                    >
                      <div className="w-8 h-8 rounded-xl bg-secondary/40 flex items-center justify-center mb-3">
                        <Icon size={15} className="text-terra" />
                      </div>
                      <p className="font-body text-[12px] text-foreground mb-1" style={{ fontWeight: 500 }}>{title}</p>
                      <p className="font-body text-[11px] text-muted-foreground leading-relaxed" style={{ fontWeight: 300 }}>{desc}</p>
                    </motion.div>
                  ))}
                </div>

                {/* Code input */}
                <form onSubmit={handleCodeSubmit} className="flex gap-3 mb-6">
                  <div className="relative flex-1">
                    <Ticket size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <input
                      value={codeInput}
                      onChange={(e) => setCodeInput(formatCode(e.target.value))}
                      placeholder="TC-XXXX-XXXX"
                      maxLength={14}
                      className="w-full pl-10 pr-4 py-3.5 bg-card border border-border rounded-2xl font-body text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra tracking-[0.1em] uppercase"
                      style={{ fontWeight: 400 }}
                    />
                  </div>
                  <motion.button
                    type="submit"
                    disabled={loading || codeInput.length < 3}
                    whileTap={{ scale: 0.96 }}
                    className="px-6 py-3.5 bg-terra text-white rounded-2xl font-body text-[11px] tracking-[0.25em] uppercase hover:bg-foreground/85 transition-colors disabled:opacity-50 flex items-center gap-2"
                    style={{ fontWeight: 500 }}
                  >
                    {loading ? (
                      <motion.span animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: "linear" }}>
                        <RefreshCw size={14} />
                      </motion.span>
                    ) : (
                      <Search size={15} />
                    )}
                    {loading ? "" : "Suivant"}
                  </motion.button>
                </form>

                {/* Helper links */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.4 }}
                  className="bg-card border border-border rounded-2xl p-5"
                >
                  <div className="flex items-start gap-3 mb-4">
                    <Info size={15} className="text-terra shrink-0 mt-0.5" />
                    <div>
                      <p className="font-body text-[12px] text-foreground mb-1" style={{ fontWeight: 500 }}>
                        Où trouver mon code ?
                      </p>
                      <p className="font-body text-[11px] text-muted-foreground leading-relaxed" style={{ fontWeight: 300 }}>
                        Votre code au format <span className="font-mono text-terra">TC-XXXX-XXXX</span> figure dans votre email de confirmation d'achat ou dans votre conversation WhatsApp avec le studio.
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <Link
                      to="/planning"
                      className="flex items-center justify-center gap-2 bg-terra/8 text-terra border border-foreground/15 px-4 py-2.5 rounded-xl font-body text-[11px] tracking-[0.15em] uppercase hover:bg-foreground/15 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      Voir le planning <ChevronRight size={13} />
                    </Link>
                    <Link
                      to="/carte-black"
                      className="flex items-center justify-center gap-2 bg-secondary border border-border px-4 py-2.5 rounded-xl font-body text-[11px] tracking-[0.15em] uppercase hover:bg-border transition-colors text-foreground"
                      style={{ fontWeight: 400 }}
                    >
                      Découvrir la Carte Signature <ChevronRight size={13} />
                    </Link>
                    <a
                      href="https://wa.me/33668710966?text=Bonjour%2C%20je%20voudrais%20retrouver%20mon%20code%20carte%20Circler."
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2 bg-[#25D366]/8 text-[#128C7E] border border-[#25D366]/20 px-4 py-2.5 rounded-xl font-body text-[11px] tracking-[0.15em] uppercase hover:bg-[#25D366]/15 transition-colors"
                      style={{ fontWeight: 500 }}
                    >
                      <MessageSquare size={13} /> WhatsApp
                    </a>
                  </div>
                </motion.div>
              </motion.div>
            )}

            {/* ── STEP 2: EMAIL VERIFICATION ── */}
            {step === "verify-email" && (
              <motion.div
                key="verify-email"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -12 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="bg-card border border-border rounded-3xl overflow-hidden mb-6">
                  <div className="px-6 py-5 border-b border-border flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-secondary/40 flex items-center justify-center">
                      <Mail size={14} className="text-terra" />
                    </div>
                    <div>
                      <p className="font-body text-[10px] tracking-[0.3em] uppercase text-terra" style={{ fontWeight: 400 }}>
                        Vérification
                      </p>
                      <p className="font-display text-base text-foreground" style={{ fontWeight: 300, letterSpacing: "0.06em" }}>
                        Confirmez votre adresse email
                      </p>
                    </div>
                  </div>

                  <div className="p-6">
                    <div className="flex items-center gap-2 bg-secondary rounded-xl px-4 py-2.5 mb-5">
                      <Ticket size={13} className="text-terra shrink-0" />
                      <span className="font-mono text-[13px] text-foreground tracking-[0.12em]">{codeInput}</span>
                      <button
                        onClick={resetSearch}
                        className="ml-auto text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Modifier le code"
                      >
                        <X size={13} />
                      </button>
                    </div>

                    <p className="font-body text-[12px] text-muted-foreground mb-4" style={{ fontWeight: 300 }}>
                      Pour protéger vos données, entrez l'adresse email associée à votre carte Circler.
                    </p>

                    <form onSubmit={handleEmailSubmit} className="space-y-3">
                      <div className="relative">
                        <Mail size={15} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                        <input
                          type="email"
                          value={emailInput}
                          onChange={(e) => { setEmailInput(e.target.value); setError(""); }}
                          placeholder="votre@email.com"
                          required
                          className="w-full pl-10 pr-4 py-3.5 bg-background border border-border rounded-2xl font-body text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-terra/30 focus:border-terra"
                          style={{ fontWeight: 300 }}
                        />
                      </div>

                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="bg-destructive/8 border border-destructive/20 rounded-xl px-4 py-3"
                        >
                          <p className="font-body text-[12px] text-destructive" style={{ fontWeight: 300 }}>{error}</p>
                        </motion.div>
                      )}

                      <motion.button
                        type="submit"
                        disabled={loading || !emailInput}
                        whileTap={{ scale: 0.97 }}
                        className="w-full py-3.5 bg-terra text-white rounded-2xl font-body text-[11px] tracking-[0.25em] uppercase hover:bg-foreground/85 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                        style={{ fontWeight: 500 }}
                      >
                        {loading ? (
                          <RefreshCw size={14} className="animate-spin" />
                        ) : (
                          <>Accéder à ma carte <ArrowRight size={14} /></>
                        )}
                      </motion.button>
                    </form>
                  </div>
                </div>

                <button
                  onClick={resetSearch}
                  className="w-full text-center font-body text-[11px] text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center justify-center gap-1.5"
                >
                  ← Corriger mon code
                </button>
              </motion.div>
            )}

            {/* ── RESULT STATE ── */}
            {step === "result" && (
              <motion.div
                key="result"
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-4"
              >
                {/* Not found */}
                {notFound && (
                  <div className="bg-destructive/8 border border-destructive/20 rounded-2xl px-6 py-6 text-center">
                    <XCircle size={28} className="text-destructive mx-auto mb-3 opacity-60" />
                    <p className="font-display text-lg text-foreground mb-2" style={{ fontWeight: 300 }}>
                      Aucune carte trouvée
                    </p>
                    <p className="font-body text-[12px] text-muted-foreground mb-4" style={{ fontWeight: 300 }}>
                      Vérifiez le format de votre code (TC-XXXX-XXXX) et votre adresse email. Votre code figure sur l'email de confirmation ou dans votre conversation WhatsApp.
                    </p>
                    <div className="flex flex-col sm:flex-row gap-2 justify-center">
                      <button
                        onClick={resetSearch}
                        className="flex items-center justify-center gap-2 bg-secondary border border-border px-5 py-2.5 rounded-xl font-body text-[11px] tracking-[0.15em] uppercase hover:bg-border transition-colors"
                        style={{ fontWeight: 400 }}
                      >
                        Réessayer
                      </button>
                      <a
                        href="https://wa.me/33668710966?text=Bonjour%2C%20je%20ne%20trouve%20pas%20ma%20carte%20Circler."
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2 bg-[#25D366]/10 text-[#128C7E] border border-[#25D366]/20 px-5 py-2.5 rounded-xl font-body text-[11px] tracking-[0.15em] uppercase hover:bg-[#25D366]/20 transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        <MessageSquare size={13} /> Contacter le studio
                      </a>
                    </div>
                  </div>
                )}

                {/* Pending request */}
                {pendingRequest && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="rounded-2xl border border-[#D4A853]/30 bg-[#D4A853]/5 px-5 py-5"
                  >
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-[#D4A853]/15 flex items-center justify-center shrink-0 mt-0.5">
                        <Clock size={14} className="text-[#D4A853]" />
                      </div>
                      <div className="flex-1">
                        <p className="font-body text-[11px] tracking-[0.2em] uppercase text-[#D4A853] mb-1" style={{ fontWeight: 600 }}>
                          Votre demande est en cours de traitement
                        </p>
                        <p className="font-body text-sm text-foreground mb-0.5" style={{ fontWeight: 400 }}>
                          {pendingRequest.client_name} — {pendingRequest.offer_name}
                        </p>
                        <p className="font-body text-[11px] text-muted-foreground mb-3">
                          {pendingRequest.credits_total} crédit(s) · {pendingRequest.payment_method === "cash_on_site" ? "Paiement sur place" : "Paiement en ligne"} · soumis le {new Date(pendingRequest.created_at).toLocaleDateString("fr-FR")}
                        </p>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className={`font-body text-[10px] tracking-[0.15em] uppercase px-3 py-1.5 rounded-full border ${
                            pendingRequest.request_status === "completed" ? "bg-[#4E9E7A]/10 text-[#4E9E7A] border-[#4E9E7A]/20" :
                            pendingRequest.request_status === "cancelled" ? "bg-destructive/10 text-destructive border-destructive/20" :
                            "bg-[#D4A853]/10 text-[#D4A853] border-[#D4A853]/20"
                          }`} style={{ fontWeight: 600 }}>
                            {pendingRequest.request_status === "completed" ? "✓ Activé" :
                             pendingRequest.request_status === "cancelled" ? "Annulé" :
                             "⏳ En cours de traitement"}
                          </span>
                          <p className="font-body text-[10px] text-muted-foreground">
                            {pendingRequest.request_status === "pending"
                              ? "Votre carte sera activée sous 24h. Vous recevrez votre code par email."
                              : pendingRequest.request_status === "completed"
                              ? "Votre carte a été activée. Cherchez votre code TC-XXXX-XXXX dans votre email."
                              : "Contactez-nous via WhatsApp si besoin."}
                          </p>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* Full pack dashboard */}
                {pack && statusCfg && (
                  <>
                    {/* ── Premium Dark Card ── */}
                    <div
                      className="relative rounded-3xl overflow-hidden shadow-2xl"
                      style={{ background: "linear-gradient(135deg, #1A1714 0%, #2D2420 55%, #1A1714 100%)" }}
                    >
                      <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full border border-terra/8 pointer-events-none" />
                      <div className="absolute -bottom-16 -left-16 w-56 h-56 rounded-full border border-terra/6 pointer-events-none" />
                      <div className="absolute bottom-0 right-0 pointer-events-none">
                        <MeridianLogo size={180} variant="dark" animate={false} className="opacity-[0.04]" spinDuration={999} />
                      </div>

                      <div className="relative z-10 p-7 md:p-8">
                        {/* Top row */}
                        <div className="flex items-start justify-between mb-6">
                          <div>
                            <p className="font-body text-[9px] tracking-[0.5em] uppercase text-terra/70 mb-0.5" style={{ fontWeight: 300 }}>
                              EVØLV
                            </p>
                            <p className="font-display text-white/90 text-lg" style={{ fontWeight: 200, letterSpacing: "0.12em" }}>
                              {pack.pack_type?.replace(/_/g, " ") || "Carte Séances"}
                            </p>
                          </div>
                          <span className={`inline-flex items-center gap-1.5 text-[10px] tracking-[0.2em] uppercase font-body px-3 py-1.5 rounded-full border ${statusCfg.bg} ${statusCfg.color}`} style={{ fontWeight: 500 }}>
                            <StatusIcon size={10} /> {statusCfg.label}
                          </span>
                        </div>

                        {/* Credits counter */}
                        <div className="mb-5">
                          <div className="flex items-baseline gap-2 mb-2">
                            <span className="font-display text-5xl md:text-6xl text-warm-white" style={{ fontWeight: 200 }}>
                              {creditsLeft}
                            </span>
                            <span className="font-body text-white/40 text-base" style={{ fontWeight: 200 }}>
                              / {pack.credits_total} séances
                            </span>
                          </div>
                          <div className="h-1 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              initial={{ width: 0 }}
                              animate={{ width: `${progressPct}%` }}
                              transition={{ duration: 1.2, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
                              className="h-full rounded-full"
                              style={{ background: "linear-gradient(90deg, #B8634A, #E8834A)" }}
                            />
                          </div>
                          {creditsLeft > 0 && creditsLeft <= 2 && (
                            <p className="font-body text-[11px] text-amber-400 mt-2">
                              ⚠️ Plus que {creditsLeft} crédit{creditsLeft > 1 ? "s" : ""} — pensez à recharger !
                            </p>
                          )}
                        </div>

                        {/* Client & code */}
                        <div className="border-t border-white/8 pt-4 flex items-end justify-between gap-4">
                          <div>
                            <p className="font-body text-[10px] tracking-[0.2em] uppercase text-white/30 mb-0.5" style={{ fontWeight: 300 }}>
                              Titulaire
                            </p>
                            <p className="font-body text-white/80 text-sm" style={{ fontWeight: 300 }}>
                              {pack.client_name}
                            </p>
                            <p className="font-body text-white/30 text-[11px] mt-0.5">
                              {maskEmail(pack.client_email)}
                            </p>
                          </div>
                          <button
                            onClick={copyCode}
                            className="flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-2 rounded-xl transition-colors group"
                          >
                            <span className="font-body text-white/70 text-[12px] tracking-[0.15em] font-mono group-hover:text-warm-white transition-colors">
                              {pack.pack_code}
                            </span>
                            {copied ? (
                              <CheckCircle size={13} className="text-terra shrink-0" />
                            ) : (
                              <Copy size={13} className="text-white/30 group-hover:text-white/60 shrink-0 transition-colors" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* ── Quick stats row ── */}
                    <div className="grid grid-cols-3 gap-3">
                      <div className="bg-card border border-border rounded-2xl p-4 text-center">
                        <p className="font-display text-2xl text-foreground mb-0.5" style={{ fontWeight: 300 }}>
                          {pack.credits_used}
                        </p>
                        <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground" style={{ fontWeight: 300 }}>
                          Utilisés
                        </p>
                      </div>
                      <div className="bg-card border border-border rounded-2xl p-4 text-center">
                        <p className="font-display text-2xl text-foreground mb-0.5" style={{ fontWeight: 300 }}>
                          {usage.filter((u) => !u.cancelled_at).length}
                        </p>
                        <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground" style={{ fontWeight: 300 }}>
                          Séances
                        </p>
                      </div>
                      <div className={`rounded-2xl p-4 text-center border ${daysUntilExpiry !== null && daysUntilExpiry <= 14 && daysUntilExpiry > 0 ? "bg-amber-50 border-amber-200" : "bg-card border-border"}`}>
                        <p className={`font-display text-2xl mb-0.5 ${daysUntilExpiry !== null && daysUntilExpiry <= 14 && daysUntilExpiry > 0 ? "text-amber-600" : "text-foreground"}`} style={{ fontWeight: 300 }}>
                          {daysUntilExpiry !== null && daysUntilExpiry > 0 ? daysUntilExpiry : daysUntilExpiry !== null && daysUntilExpiry <= 0 ? "—" : "∞"}
                        </p>
                        <p className="font-body text-[9px] tracking-[0.2em] uppercase text-muted-foreground" style={{ fontWeight: 300 }}>
                          Jours restants
                        </p>
                      </div>
                    </div>

                    {/* ── Dates ── */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="bg-card border border-border rounded-2xl p-4">
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Calendar size={12} className="text-terra" />
                          <span className="font-body text-[9px] tracking-[0.25em] uppercase text-muted-foreground" style={{ fontWeight: 300 }}>Créé le</span>
                        </div>
                        <p className="font-body text-[13px] text-foreground" style={{ fontWeight: 300 }}>{formatDate(pack.created_at)}</p>
                      </div>
                      <div className={`rounded-2xl p-4 border ${daysUntilExpiry !== null && daysUntilExpiry <= 14 && daysUntilExpiry > 0 ? "bg-amber-50 border-amber-200" : "bg-card border-border"}`}>
                        <div className="flex items-center gap-1.5 mb-1.5">
                          <Clock size={12} className={daysUntilExpiry !== null && daysUntilExpiry <= 14 && daysUntilExpiry > 0 ? "text-amber-600" : "text-terra"} />
                          <span className="font-body text-[9px] tracking-[0.25em] uppercase text-muted-foreground" style={{ fontWeight: 300 }}>Expire le</span>
                        </div>
                        <p className="font-body text-[13px] text-foreground" style={{ fontWeight: 300 }}>
                          {pack.expires_at ? formatDate(pack.expires_at) : "—"}
                        </p>
                        {daysUntilExpiry !== null && daysUntilExpiry > 0 && daysUntilExpiry <= 14 && (
                          <p className="font-body text-[10px] text-amber-600 mt-0.5">Dans {daysUntilExpiry} jours</p>
                        )}
                      </div>
                    </div>

                    {/* ── CTAs ── */}
                    <div className="grid grid-cols-2 gap-3">
                      <Link
                        to="/planning"
                        className="flex items-center justify-center gap-2 bg-terra text-white py-3.5 rounded-2xl font-body text-[11px] tracking-[0.2em] uppercase hover:bg-foreground/85 transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        Réserver une séance <ArrowRight size={14} />
                      </Link>
                      <button
                        onClick={openRecharger}
                        className="flex items-center justify-center gap-2 bg-secondary/40 text-terra border border-foreground/15 py-3.5 rounded-2xl font-body text-[11px] tracking-[0.2em] uppercase hover:bg-foreground/20 transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        <Zap size={14} /> Recharger
                      </button>
                    </div>

                    {/* ── Usage history ── */}
                    <div className="bg-card border border-border rounded-3xl overflow-hidden">
                      <div className="px-6 py-4 border-b border-border flex items-center justify-between">
                        <h3 className="font-display text-base text-foreground" style={{ fontWeight: 300, letterSpacing: "0.06em" }}>
                          Historique des séances
                        </h3>
                        <span className="font-body text-[10px] text-muted-foreground">
                          {usage.filter((u) => !u.cancelled_at).length} séance{usage.filter((u) => !u.cancelled_at).length !== 1 ? "s" : ""}
                        </span>
                      </div>
                      {usage.length === 0 ? (
                        <div className="px-6 py-10 text-center">
                          <p className="font-body text-sm text-muted-foreground" style={{ fontWeight: 300 }}>
                            Aucune séance enregistrée pour cette carte.
                          </p>
                        </div>
                      ) : (
                        <div className="divide-y divide-border">
                          {usage.map((u, i) => (
                            <motion.div
                              key={u.id}
                              initial={{ opacity: 0, x: -12 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: i * 0.04 }}
                              className={`px-6 py-4 flex items-center justify-between ${u.cancelled_at ? "opacity-50" : ""}`}
                            >
                              <div>
                                <p className="font-body text-[13px] text-foreground" style={{ fontWeight: 400 }}>
                                  {u.session_title || "Séance"}
                                </p>
                                <p className="font-body text-[11px] text-muted-foreground mt-0.5" style={{ fontWeight: 300 }}>
                                  {u.session_date ? formatDate(u.session_date) : formatDate(u.used_at)}
                                  {u.session_time ? ` · ${u.session_time.slice(0, 5)}` : ""}
                                </p>
                              </div>
                              <div className="text-right">
                                {u.cancelled_at ? (
                                  <span className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground">
                                    {u.credit_refunded ? "Annulé ✓" : "Annulé"}
                                  </span>
                                ) : (
                                  <span className="font-body text-[11px] text-terra" style={{ fontWeight: 400 }}>−1 crédit</span>
                                )}
                              </div>
                            </motion.div>
                          ))}
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Reset button */}
                <button
                  onClick={resetSearch}
                  className="w-full text-center font-body text-[11px] text-muted-foreground hover:text-foreground transition-colors py-2 flex items-center justify-center gap-1.5"
                >
                  ← Chercher une autre carte
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* ── Studio info (always visible) ── */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="mt-12 bg-card border border-border rounded-3xl overflow-hidden"
          >
            <div className="px-6 py-5 border-b border-border flex items-center gap-3">
              <MeridianLogo size={28} variant="sand" animate spinDuration={16} />
              <div>
                <p className="font-display text-base text-foreground" style={{ fontWeight: 300, letterSpacing: "0.08em" }}>EVØLV</p>
                <p className="font-body text-[10px] tracking-[0.25em] uppercase text-terra" style={{ fontWeight: 300 }}>Studio · Rabat</p>
              </div>
            </div>
            <div className="p-6 grid sm:grid-cols-2 gap-4">
              <a
                href="https://maps.google.com/?q=El+Menzeh+Rabat+Maroc"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors group"
              >
                <MapPin size={15} className="text-terra mt-0.5 shrink-0" />
                <div>
                  <p className="font-body text-[12px] text-foreground" style={{ fontWeight: 400 }}>El Menzeh · Rabat</p>
                  <p className="font-body text-[11px] text-muted-foreground group-hover:text-foreground transition-colors">Voir sur la carte →</p>
                </div>
              </a>
              <a
                href="https://wa.me/33668710966?text=Bonjour%20je%20viens%20du%20site%20The%20Circle"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 p-4 rounded-2xl bg-[#25D366]/8 hover:bg-[#25D366]/15 border border-[#25D366]/15 transition-colors group"
              >
                <MessageSquare size={15} className="text-[#128C7E] mt-0.5 shrink-0" />
                <div>
                  <p className="font-body text-[12px] text-foreground" style={{ fontWeight: 400 }}>WhatsApp</p>
                  <p className="font-body text-[11px] text-[#128C7E]">+33 6 68 71 09 66</p>
                </div>
              </a>
              <a
                href="tel:+33668710966"
                className="flex items-start gap-3 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Phone size={15} className="text-terra mt-0.5 shrink-0" />
                <div>
                  <p className="font-body text-[12px] text-foreground" style={{ fontWeight: 400 }}>Téléphone</p>
                  <p className="font-body text-[11px] text-muted-foreground">+33 6 68 71 09 66</p>
                </div>
              </a>
              <a
                href="mailto:contact@evolv.ma"
                className="flex items-start gap-3 p-4 rounded-2xl bg-secondary hover:bg-secondary/80 transition-colors"
              >
                <Mail size={15} className="text-terra mt-0.5 shrink-0" />
                <div>
                  <p className="font-body text-[12px] text-foreground" style={{ fontWeight: 400 }}>Email</p>
                  <p className="font-body text-[11px] text-muted-foreground">contact@evolv.ma</p>
                </div>
              </a>
            </div>
            <div className="px-6 pb-6">
              <Link
                to="/planning"
                className="w-full flex items-center justify-center gap-2 bg-terra text-white py-3.5 rounded-2xl font-body text-[11px] tracking-[0.25em] uppercase hover:bg-foreground/85 transition-colors"
                style={{ fontWeight: 500 }}
              >
                Voir le planning & réserver <ArrowRight size={14} />
              </Link>
            </div>
          </motion.div>

        </div>
      </section>

      <Footer />
      <WhatsAppButton />

      {/* ── Recharger Modal ── */}
      <AnimatePresence>
        {showRecharger && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-dark/70 backdrop-blur-sm z-50"
              onClick={() => setShowRecharger(false)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
              className="fixed inset-x-4 bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:w-full md:max-w-lg z-50 bg-card border border-border rounded-3xl shadow-2xl overflow-hidden"
            >
              <div className="flex items-center justify-between px-6 py-5 border-b border-border">
                <div>
                  <p className="font-body text-[10px] tracking-[0.3em] uppercase text-terra mb-0.5" style={{ fontWeight: 300 }}>
                    Recharger
                  </p>
                  <h2 className="font-display text-xl text-foreground" style={{ fontWeight: 300, letterSpacing: "0.06em" }}>
                    Choisissez votre offre
                  </h2>
                </div>
                <button
                  onClick={() => setShowRecharger(false)}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-secondary hover:bg-border transition-colors text-muted-foreground"
                >
                  <X size={15} />
                </button>
              </div>

              <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
                {pricingLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw size={20} className="animate-spin text-muted-foreground" />
                  </div>
                ) : pricing.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="font-body text-sm text-muted-foreground mb-4">
                      Contactez-nous pour recharger votre carte.
                    </p>
                    <a
                      href={`https://wa.me/33668710966?text=${encodeURIComponent(`Bonjour 👋 Je souhaite recharger ma carte${pack ? ` ${pack.pack_code}` : ""}. Quelles sont les offres disponibles ?`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 bg-[#25D366] text-white px-6 py-3 rounded-full font-body text-[11px] tracking-[0.2em] uppercase"
                      style={{ fontWeight: 500 }}
                    >
                      <MessageSquare size={14} /> WhatsApp
                    </a>
                  </div>
                ) : (
                  pricing.map((offer) => (
                    <button
                      key={offer.id}
                      onClick={() => setSelectedOffer(offer.id === selectedOffer?.id ? null : offer)}
                      className={`w-full text-left p-4 rounded-2xl border transition-all ${
                        selectedOffer?.id === offer.id
                          ? "border-terra bg-terra/8 ring-1 ring-terra/30"
                          : "border-border hover:border-foreground/20 bg-secondary/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-body text-[13px] text-foreground" style={{ fontWeight: 500 }}>
                            {offer.name}
                          </p>
                          <p className="font-body text-[11px] text-muted-foreground mt-0.5">
                            {offer.sessions} séance{offer.sessions > 1 ? "s" : ""}
                            {offer.validity_days ? ` · valable ${offer.validity_days} jours` : ""}
                          </p>
                          {offer.description && (
                            <p className="font-body text-[11px] text-terra mt-0.5">{offer.description}</p>
                          )}
                        </div>
                        <div className="text-right shrink-0 ml-4">
                          <p className="font-display text-xl text-terra" style={{ fontWeight: 300 }}>
                            {offer.price} <span className="text-[13px]">MAD</span>
                          </p>
                          {offer.sessions > 1 && (
                            <p className="font-body text-[10px] text-muted-foreground">
                              {Math.round(offer.price / offer.sessions)} MAD/séance
                            </p>
                          )}
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>

              {pricing.length > 0 && (
                <div className="px-5 pb-5 pt-2 border-t border-border space-y-2">
                  <button
                    onClick={handleRecharge}
                    disabled={!selectedOffer || rechargeLoading}
                    className="w-full bg-terra text-white py-3.5 rounded-2xl font-body text-[11px] tracking-[0.25em] uppercase hover:bg-foreground/85 transition-colors disabled:opacity-40 flex items-center justify-center gap-2"
                    style={{ fontWeight: 500 }}
                  >
                    {rechargeLoading ? (
                      <RefreshCw size={14} className="animate-spin" />
                    ) : (
                      <>
                        <Zap size={14} />
                        {selectedOffer ? `Payer ${selectedOffer.price} MAD` : "Sélectionnez une offre"}
                      </>
                    )}
                  </button>
                  <a
                    href={`https://wa.me/33668710966?text=${encodeURIComponent(`Bonjour 👋 Je souhaite recharger ma carte${pack ? ` ${pack.pack_code}` : ""}${selectedOffer ? ` avec l'offre "${selectedOffer.name}" (${selectedOffer.price} MAD)` : ""}. Pouvez-vous m'aider ?`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center justify-center gap-2 border border-[#25D366]/30 text-[#128C7E] py-3 rounded-2xl font-body text-[11px] tracking-[0.2em] uppercase hover:bg-[#25D366]/10 transition-colors"
                    style={{ fontWeight: 400 }}
                  >
                    <MessageSquare size={13} /> Recharger via WhatsApp
                  </a>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </main>
  );
};

export default MonPackPage;
