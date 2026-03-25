import { useEffect, useRef, useState } from "react";
import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import StudioSection from "@/components/StudioSection";
import ClassesSection from "@/components/ClassesSection";
import CoachesSection from "@/components/CoachesSection";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import UpcomingSessions from "@/components/UpcomingSessions";
import FloatingCircles from "@/components/brand/FloatingCircles";
import LogoDivider from "@/components/brand/LogoDivider";
import MeridianLogo from "@/components/brand/MeridianLogo";
import StarfieldCanvas from "@/components/brand/StarfieldCanvas";
import { useNavigate, Link } from "react-router-dom";
import { useSessions } from "@/hooks/useSessions";
import { getTypeColor } from "@/lib/schedule";
import { api } from "@/lib/api";
import {
  motion,
  useScroll,
  useTransform,
  useVelocity,
  useSpring,
  AnimatePresence,
  useInView,
} from "framer-motion";
import { Calendar, Star, Clock, Users, ChevronRight, ChevronUp, ChevronDown, ArrowRight, Check, X, Sparkles, Ticket } from "lucide-react";
import { createPayzoneSession } from "@/lib/payzone";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  sessions_included: number | null;
  features: string[];
  is_popular: boolean;
}

const stats = [
  { value: 8, label: "disciplines au programme", icon: Sparkles, suffix: "" },
  { value: 3, label: "coachs certifiés", icon: Star, suffix: "" },
  { value: 55, label: "min de pur travail", icon: Clock, suffix: "" },
  { value: 24, label: "séances / semaine", icon: Calendar, suffix: "" },
];

const fallbackBlack: PricingPlan = {
  id: "black-fallback",
  name: "Carte Signature x10",
  price: 2800,
  original_price: 3500,
  sessions_included: 10,
  features: ["Code instantané", "Validité 90 jours", "Réservation prioritaire"],
  is_popular: true,
};

// ── Scroll progress bar ───────────────────────────────────────────────────────
const ScrollProgressBar = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, { stiffness: 200, damping: 40 });
  return (
    <motion.div
      style={{ scaleX, transformOrigin: "left" }}
      className="fixed top-0 left-0 right-0 h-[2px] bg-foreground z-[200] pointer-events-none"
    />
  );
};

// ── Giant Meridian scroll anchor ──────────────────────────────────────────────
const MeridianScrollAnchor = () => {
  const { scrollYProgress } = useScroll();
  const scrollVelocity = useVelocity(scrollYProgress);
  const velocityY = useTransform(scrollVelocity, [-0.05, 0, 0.05], [60, 0, -60]);
  const smoothVelocityY = useSpring(velocityY, { stiffness: 50, damping: 32, mass: 3.5 });
  const scale = useTransform(
    scrollYProgress,
    [0, 0.08, 0.25, 0.55, 0.85, 1],
    [0.52, 0.70, 1.45, 1.28, 0.82, 0.55]
  );
  const opacity = useTransform(
    scrollYProgress,
    [0, 0.06, 0.18, 0.5, 0.82, 0.96, 1],
    [0, 0, 0.13, 0.20, 0.13, 0.05, 0]
  );
  const rotate = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const yBase = useTransform(scrollYProgress, [0, 1], [0, -380]);
  const ySpring = useSpring(yBase, { stiffness: 28, damping: 26, mass: 4 });

  return (
    <div
      className="fixed inset-0 flex items-center justify-center pointer-events-none overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden
    >
      {/* Terra radial glow behind meridian */}
      <motion.div
        className="absolute rounded-full"
        style={{
          width: 900,
          height: 900,
          background: "radial-gradient(ellipse at center, rgba(184,99,74,0.07) 0%, transparent 65%)",
          opacity,
          scale,
        }}
      />
      <motion.div style={{ rotate, opacity, scale, y: ySpring }}>
        <motion.div style={{ y: smoothVelocityY }}>
          <MeridianLogo size={1500} variant="theme" animate spinDuration={200} />
        </motion.div>
      </motion.div>
    </div>
  );
};

// ── Animated counter ──────────────────────────────────────────────────────────
const AnimatedCounter = ({ target, suffix = "" }: { target: number; suffix?: string }) => {
  const [count, setCount] = useState(0);
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20%" });

  useEffect(() => {
    if (!inView) return;
    let start = 0;
    const duration = 1400;
    const startTime = performance.now();
    const tick = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setCount(Math.round(start + (target - start) * eased));
      if (progress < 1) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  }, [inView, target]);

  return <span ref={ref}>{count}{suffix}</span>;
};

const isUuid = (v?: string | null) =>
  !!v && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(v);

const inputCls =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-terra/40 focus:border-terra";

// ── Carnets section ───────────────────────────────────────────────────────────
const CarnetsSection = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selected, setSelected] = useState<PricingPlan | null>(null);
  const [step, setStep] = useState<"form" | "loading" | "confirmed">("form");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [method, setMethod] = useState<"online" | "cash_on_site">("online");
  const sectionRef = useRef<HTMLElement>(null);

  useEffect(() => {
    api.pricing.list().then((data) => {
      const list = (data || []) as PricingPlan[];
      setPlans(list.length ? list : [fallbackBlack]);
    }).catch(() => setPlans([fallbackBlack]));
  }, []);

  const openModal = (plan: PricingPlan) => {
    setSelected(plan);
    setStep("form");
    setName(""); setEmail(""); setPhone(""); setMethod("online");
  };
  const closeModal = () => setSelected(null);

  const handleBuy = async () => {
    if (!selected || !name || !email) return;
    setStep("loading");
    const credits = selected.sessions_included || 1;
    const safeId = isUuid(selected.id) ? selected.id : undefined;
    try {
      if (method === "cash_on_site") {
        // Submit pack request via API
        try {
          await api.admin.packs.create({
            client_name: name, client_email: email, client_phone: phone || null,
            offer_id: safeId || null, offer_name: selected.name, credits_total: credits,
            payment_method: "cash_on_site", payment_status: "pending",
            request_source: "frontend", request_status: "pending",
            metadata: { created_from: "index-carnets" },
          });
        } catch (_) { /* non-blocking */ }
        // Email notifications removed — no email service yet
        console.log("Pack request created for:", name, selected.name);
        setStep("confirmed");
        return;
      }
      const session = await createPayzoneSession({
        amount: selected.price,
        description: `${selected.name} — EVØLV Studio`,
        customerName: name, customerEmail: email, customerPhone: phone,
        offerId: safeId, offerName: selected.name,
        packType: selected.name, packCredits: credits,
        returnPath: "/payment-success",
      });
      window.location.href = session.paymentUrl;
    } catch (err: any) {
      alert(err?.message || "Une erreur est survenue.");
      setStep("form");
    }
  };

  return (
    <section
      ref={sectionRef}
      className="relative py-14 px-6 overflow-hidden min-h-screen flex flex-col justify-center bg-secondary"
    >
      {/* Terra & burgundy radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse at 35% 50%, rgba(122,48,64,0.07) 0%, rgba(184,99,74,0.04) 40%, transparent 70%)" }}
      />


      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-center mb-10"
        >
          <p className="font-body text-[11px] tracking-[0.5em] uppercase text-terra mb-4" style={{ fontWeight: 500 }}>
            Nos carnets
          </p>
          <h2
            className="font-display text-foreground mb-4"
            style={{ fontSize: "clamp(28px, 4vw, 52px)", fontWeight: 200, letterSpacing: "0.08em" }}
          >
            Achetez des <em className="italic text-terra">crédits</em>, réservez librement
          </h2>
          <p className="font-body text-foreground/70 max-w-lg mx-auto leading-[1.9]" style={{ fontWeight: 400, fontSize: "14px" }}>
            Chaque crédit = 1 séance de votre choix. Achetez un pack, votre code est généré instantanément, et vous réservez quand vous voulez.
          </p>
        </motion.div>

        {/* Credit system explainer */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap justify-center gap-6 mb-10"
        >
          {[
            { step: "01", label: "Choisissez un pack", desc: "Sélectionnez le nombre de crédits qui vous convient" },
            { step: "02", label: "Code instantané", desc: "Votre code d'accès est créé automatiquement" },
            { step: "03", label: "Réservez librement", desc: "Utilisez vos crédits pour toute séance du planning" },
          ].map((item) => (
            <div key={item.step} className="flex items-start gap-3 max-w-[200px]">
              <span className="font-display text-foreground/30 text-2xl shrink-0" style={{ fontWeight: 200, lineHeight: 1 }}>{item.step}</span>
              <div>
                <p className="font-body text-foreground text-[12px] tracking-[0.15em] uppercase mb-0.5" style={{ fontWeight: 600 }}>{item.label}</p>
                <p className="font-body text-foreground/55 text-[12px] leading-[1.7]" style={{ fontWeight: 300 }}>{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Pack cards — clean vertical grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {plans.map((plan, i) => {
            const savings = plan.original_price ? plan.original_price - plan.price : 0;
            const isPopular = plan.is_popular;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className={`relative flex flex-col rounded-3xl border overflow-hidden transition-all hover:shadow-xl ${
                  isPopular
                    ? "border-terra shadow-terra/20"
                    : "border-border"
                }`}
                style={isPopular ? {
                  background: "linear-gradient(135deg, hsl(var(--burgundy)) 0%, #1a0a10 50%, #2D0F1A 100%)",
                } : {
                  background: "hsl(var(--card))",
                }}
              >
                {/* Popular badge */}
                {isPopular && (
                  <div className="absolute top-4 right-4 z-10">
                    <span className="inline-flex items-center gap-1 font-body text-[8px] tracking-[0.3em] uppercase px-2.5 py-1 rounded-full bg-white/20 text-white" style={{ fontWeight: 600 }}>
                      ★ Populaire
                    </span>
                  </div>
                )}

                <div className="p-6 flex flex-col flex-1">
                  {/* Large sessions count */}
                  <div className="mb-4">
                    <span
                      className="font-display block"
                      style={{
                        fontSize: "clamp(56px, 8vw, 80px)",
                        fontWeight: 200,
                        color: isPopular ? "#FBF7F2" : "hsl(var(--terra))",
                        lineHeight: 1,
                      }}
                    >
                      {plan.sessions_included ?? 1}
                    </span>
                    <span
                      className="font-body text-[10px] tracking-[0.35em] uppercase mt-1 block"
                      style={{ fontWeight: 500, color: isPopular ? "rgba(251,247,242,0.6)" : "hsl(var(--muted-foreground))" }}
                    >
                      crédit{(plan.sessions_included ?? 1) > 1 ? "s" : ""}
                    </span>
                  </div>

                  {/* Pack name */}
                  <p
                    className="font-body text-[13px] mb-1"
                    style={{ fontWeight: 600, color: isPopular ? "rgba(251,247,242,0.9)" : "hsl(var(--foreground))" }}
                  >
                    {plan.name}
                  </p>

                  {/* Price */}
                  <div className="flex items-baseline gap-2 mb-4">
                    <span
                      className="font-display text-2xl"
                      style={{ fontWeight: 300, color: isPopular ? "#FBF7F2" : "hsl(var(--terra))" }}
                    >
                      {plan.price.toLocaleString("fr-FR")} DH
                    </span>
                    {plan.original_price && (
                      <span className="font-body text-[12px] line-through" style={{ color: isPopular ? "rgba(251,247,242,0.4)" : "hsl(var(--muted-foreground))" }}>
                        {plan.original_price.toLocaleString("fr-FR")}
                      </span>
                    )}
                  </div>

                  {/* Savings badge */}
                  {savings > 0 && (
                    <div className="mb-3">
                      <span
                        className="font-body text-[10px] px-2.5 py-1 rounded-full"
                        style={{
                          fontWeight: 600,
                          background: isPopular ? "rgba(255,255,255,0.15)" : "rgba(184,99,74,0.12)",
                          color: isPopular ? "#FBF7F2" : "hsl(var(--terra))",
                        }}
                      >
                        Économisez {savings.toLocaleString("fr-FR")} DH
                      </span>
                    </div>
                  )}

                  {/* Features */}
                  <ul className="space-y-2 mb-6 flex-1">
                    {(plan.features || []).map((f) => (
                      <li key={f} className="flex items-start gap-2">
                        <Check size={12} className="mt-0.5 shrink-0" style={{ color: isPopular ? "#FBF7F2" : "hsl(var(--terra))" }} />
                        <span
                          className="font-body text-[12px] leading-snug"
                          style={{ fontWeight: 300, color: isPopular ? "rgba(251,247,242,0.75)" : "hsl(var(--muted-foreground))" }}
                        >
                          {f}
                        </span>
                      </li>
                    ))}
                  </ul>

                  {/* CTA */}
                  <button
                    onClick={() => openModal(plan)}
                    className="w-full py-3 rounded-full font-body text-[11px] tracking-[0.22em] uppercase transition-all flex items-center justify-center gap-2 group"
                    style={{
                      fontWeight: 600,
                      background: isPopular ? "rgba(255,255,255,0.18)" : "hsl(var(--terra))",
                      color: "#FBF7F2",
                      border: isPopular ? "1px solid rgba(255,255,255,0.25)" : "none",
                    }}
                  >
                    Acheter <ArrowRight size={12} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5 }}
          className="text-center font-body text-muted-foreground/50 text-[11px] tracking-[0.2em] mt-8"
          style={{ fontWeight: 300 }}
        >
          Code généré instantanément · Suivi sur{" "}
          <Link to="/mon-pack" className="text-muted-foreground hover:text-foreground transition-colors">/mon-pack</Link>
          {" "}· Paiement en ligne ou sur place
        </motion.p>
      </div>

      {/* Purchase modal */}
      <AnimatePresence>
        {selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/70 backdrop-blur-md p-4"
            onClick={() => step === "form" && closeModal()}
          >
            <motion.div
              initial={{ y: 48, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 48, opacity: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 28 }}
              className="w-full max-w-md rounded-3xl overflow-hidden shadow-2xl border border-border bg-card"
              onClick={(e) => e.stopPropagation()}
            >
              {step === "confirmed" ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-terra/15 flex items-center justify-center mx-auto mb-5">
                    <Check size={30} className="text-terra" />
                  </div>
                  <h3 className="font-display text-2xl text-foreground mb-2" style={{ fontWeight: 300 }}>Demande envoyée ✓</h3>
                  <p className="font-body text-sm text-muted-foreground mb-6" style={{ fontWeight: 300 }}>
                    {selected.name} — {selected.sessions_included || 1} crédit(s).<br />
                    Présentez-vous sur place pour finaliser le paiement. Votre code sera activé par l'équipe.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a href="/mon-pack" className="w-full rounded-full border border-terra text-terra py-3 text-[11px] tracking-[0.25em] uppercase flex items-center justify-center gap-2 hover:bg-foreground hover:text-white transition-all">
                      <Ticket size={13} /> Suivre ma carte
                    </a>
                    <button onClick={closeModal} className="w-full rounded-full bg-terra py-3 text-white text-[11px] tracking-[0.25em] uppercase">
                      Fermer
                    </button>
                  </div>
                </div>
              ) : step === "loading" ? (
                <div className="p-10 text-center">
                  <MeridianLogo size={56} variant="theme" animate spinDuration={4} className="mx-auto mb-5" />
                  <p className="font-body text-muted-foreground">Initialisation du paiement…</p>
                </div>
              ) : (
                <>
                  <div className="px-6 pt-6 pb-4 border-b border-white/8 flex items-start justify-between">
                    <div>
                      <p className="font-body text-[10px] tracking-[0.35em] uppercase text-terra mb-1" style={{ fontWeight: 300 }}>
                        {selected.sessions_included} séance{(selected.sessions_included || 0) > 1 ? "s" : ""}
                      </p>
                      <h3 className="font-display text-xl text-foreground" style={{ fontWeight: 300 }}>{selected.name}</h3>
                      <p className="font-display text-2xl text-terra mt-1" style={{ fontWeight: 300 }}>
                        {selected.price.toLocaleString("fr-FR")} DH
                      </p>
                    </div>
                    <button onClick={closeModal} className="text-muted-foreground/50 hover:text-foreground mt-1"><X size={18} /></button>
                  </div>
                  <div className="px-6 py-5 space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Nom complet *" />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="Email *" type="email" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="Téléphone" type="tel" />
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        onClick={() => setMethod("online")}
                        className={`rounded-full py-2.5 text-[11px] tracking-[0.15em] uppercase border transition-all ${method === "online" ? "bg-terra border-terra text-white" : "border-border text-muted-foreground hover:border-foreground/30"}`}
                      >En ligne</button>
                      <button
                        onClick={() => setMethod("cash_on_site")}
                        className={`rounded-full py-2.5 text-[11px] tracking-[0.15em] uppercase border transition-all ${method === "cash_on_site" ? "bg-terra border-terra text-white" : "border-border text-muted-foreground hover:border-foreground/30"}`}
                      >Sur place</button>
                    </div>
                    <button
                      onClick={handleBuy}
                      disabled={!name || !email}
                      className="w-full rounded-full bg-terra py-4 text-white text-[11px] tracking-[0.28em] uppercase flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-foreground/80 transition-all mt-1"
                      style={{ fontWeight: 500 }}
                    >
                      <Sparkles size={13} />
                      {method === "online" ? "Payer & générer mon code" : "Réserver sur place"}
                    </button>
                    <p className="text-center font-body text-[10px] text-muted-foreground/50 pb-1" style={{ fontWeight: 300 }}>
                      {method === "online"
                        ? "Paiement sécurisé Payzone · Code généré instantanément"
                        : "Votre demande sera validée par l'équipe sur place"}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
};

// ── Why section — horizontal pin reveal ──────────────────────────────────────
const WHY_ITEMS = [
  {
    num: "01",
    hook: "Votre corps, enfin compris.",
    subhook: "Un coach qui vous voit vraiment.",
    desc: "Pas une salle de sport anonyme. Un espace intime où chaque mouvement est adapté à votre corps — chaque séance suivie, chaque progression remarquée. Vous n'êtes pas un numéro de tapis.",
    accent: "Intimité",
    cta: "Rencontrer nos coachs",
    ctaHref: "/coachs",
  },
  {
    num: "02",
    hook: "8 disciplines. Zéro excuse.",
    subhook: "Reformer, Yoga, Barre, Post-natal et plus.",
    desc: "Matwork, Reformer, Jumpboard, Barre Fit, Vinyasa, Hatha, Post-natal, Maman & Bébé. Le programme évolue chaque semaine. Votre corps aussi.",
    accent: "Programme",
    cta: "Voir les disciplines",
    ctaHref: "/studio",
  },
  {
    num: "03",
    hook: "1 crédit = 1 séance. Rien de plus.",
    subhook: "Pas d'abonnement. Pas d'engagement.",
    desc: "Achetez un pack de crédits, recevez votre code. Réservez Reformer un lundi, Yoga un jeudi. Votre rythme, vos règles. Les crédits ne expirent pas avant 90 jours.",
    accent: "Liberté",
    cta: "Voir les tarifs",
    ctaHref: "/carte-black",
  },
  {
    num: "04",
    hook: "Votre séance aura lieu.",
    subhook: "Maintenu dès 2 participants. Garanti.",
    desc: "On s'engage sur chaque cours. Si vous êtes inscrit·e et qu'un autre participant l'est aussi — c'est parti. Pas d'annulation de dernière minute. El Menzeh, Rabat.",
    accent: "Fiabilité",
    cta: "Réserver une séance",
    ctaHref: "/planning",
  },
];

const WhySection = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start start", "end end"],
  });
  const x = useTransform(scrollYProgress, [0, 1], ["0vw", `${-(WHY_ITEMS.length - 1) * 100}vw`]);

  return (
    <div ref={containerRef} style={{ height: `${WHY_ITEMS.length * 100}vh` }} className="relative">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div style={{ x }} className="flex h-full">
          {WHY_ITEMS.map((item, i) => {
            const isEven = i % 2 === 0;
            const accentColor = isEven ? "#B8634A" : "hsl(var(--burgundy))";
            return (
              <div
                key={item.num}
                className="w-screen h-screen flex-shrink-0 flex items-center relative overflow-hidden bg-background"
              >
                {/* Warm radial glow */}
                <div className="absolute inset-0 pointer-events-none" style={{
                  background: isEven
                    ? "radial-gradient(ellipse at 15% 60%, rgba(184,99,74,0.11) 0%, transparent 55%)"
                    : "radial-gradient(ellipse at 85% 40%, rgba(122,48,64,0.13) 0%, transparent 55%)",
                }} />

                {/* Large decorative meridian — upper right corner */}
                <div className="absolute pointer-events-none" style={{ right: "-7vw", top: "-7vh", opacity: 0.09 }}>
                  <motion.div
                    animate={{ rotate: i % 2 === 0 ? 360 : -360 }}
                    transition={{ duration: 80 + i * 15, repeat: Infinity, ease: "linear" }}
                  >
                    <MeridianLogo size={500} variant="theme" animate={false} />
                  </motion.div>
                </div>

                {/* Giant ghost number — bottom-left anchor */}
                <div
                  className="absolute bottom-0 left-0 font-display select-none pointer-events-none"
                  style={{
                    fontSize: "clamp(200px, 32vw, 420px)",
                    fontWeight: 100,
                    color: isEven ? "rgba(184,99,74,0.045)" : "rgba(122,48,64,0.055)",
                    lineHeight: 0.85,
                    letterSpacing: "-0.04em",
                  }}
                  aria-hidden
                >{item.num}</div>

                {/* Content */}
                <div className="container mx-auto max-w-5xl px-8 md:px-20 relative z-10">
                  <div className="max-w-xl">
                    {/* Accent label with mini spinning meridian */}
                    <div className="flex items-center gap-3 mb-8">
                      <motion.div style={{ opacity: 0.45 }} animate={{ rotate: 360 }} transition={{ duration: 12, repeat: Infinity, ease: "linear" }}>
                        <MeridianLogo size={18} variant="theme" animate={false} />
                      </motion.div>
                      <p className="font-body text-[10px] tracking-[0.6em] uppercase" style={{ fontWeight: 500, color: accentColor }}>
                        {item.num} — {item.accent}
                      </p>
                    </div>

                    {/* Hook headline */}
                    <h3 className="font-display text-foreground mb-2" style={{
                      fontSize: "clamp(36px, 6.5vw, 82px)",
                      fontWeight: 200, letterSpacing: "0.03em", lineHeight: 1.02,
                    }}>{item.hook}</h3>

                    {/* Subhook italic */}
                    <p className="font-display mb-7" style={{
                      fontSize: "clamp(15px, 2vw, 24px)",
                      fontWeight: 300, fontStyle: "italic", color: accentColor, letterSpacing: "0.04em",
                    }}>{item.subhook}</p>

                    <div className="mb-7" style={{ width: "48px", height: "1px", background: accentColor, opacity: 0.5 }} />

                    <p className="font-body text-foreground/65 leading-[2] mb-10" style={{ fontWeight: 300, fontSize: "15px", maxWidth: "440px" }}>
                      {item.desc}
                    </p>

                    {/* CTA */}
                    <Link to={item.ctaHref} className="font-body text-[11px] tracking-[0.3em] uppercase inline-flex items-center gap-2 transition-opacity hover:opacity-70" style={{ fontWeight: 500, color: accentColor }}>
                      {item.cta} <ArrowRight size={12} />
                    </Link>

                    {/* Progress dots */}
                    <div className="flex gap-2 mt-14">
                      {WHY_ITEMS.map((_, j) => (
                        <div key={j} className="h-px transition-all duration-500" style={{
                          width: j === i ? "32px" : "16px",
                          background: j === i ? accentColor : "hsl(var(--foreground) / 0.12)",
                        }} />
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
};

// ── Today sessions strip ──────────────────────────────────────────────────────
function TodaySessionsStrip() {
  const navigate = useNavigate();
  const { sessions } = useSessions();
  const today = new Date().toISOString().slice(0, 10);
  const todaySessions = sessions.filter((s) => s.date === today && s.is_active !== false);
  if (!todaySessions.length) return null;

  return (
    <section className="py-6 px-6 bg-card border-y border-terra/10">
      <div className="container mx-auto max-w-6xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display text-xl text-foreground" style={{ fontWeight: 400 }}>
            Aujourd'hui au studio
          </h3>
          <div className="flex items-center gap-3">
            <Link
              to="/carte-black"
              className="inline-flex items-center gap-1.5 font-body text-[10px] tracking-[0.2em] uppercase bg-terra text-warm-white px-4 py-2 rounded-full hover:bg-foreground/80 transition-colors"
              style={{ fontWeight: 500 }}
            >
              <Ticket size={10} /> Acheter des crédits
            </Link>
            <Link to="/planning" className="font-body text-[10px] tracking-[0.2em] uppercase text-terra hover:underline" style={{ fontWeight: 500 }}>
              Planning complet →
            </Link>
          </div>
        </div>
        <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
          {todaySessions.map((s) => {
            const c = getTypeColor(s.type);
            const spotsLeft = Math.max(0, s.capacity - s.enrolled);
            const isFull = spotsLeft === 0;
            return (
              <motion.button
                key={s.id}
                onClick={() => navigate(`/planning?session=${s.id}`)}
                whileHover={{ scale: 1.02, y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`flex-shrink-0 bg-card border rounded-2xl p-4 text-left min-w-[170px] transition-all shadow-sm ${isFull ? "opacity-60 cursor-default border-border" : "hover:shadow-md cursor-pointer border-border hover:border-foreground/20"}`}
                disabled={isFull}
                style={{ borderTopWidth: 3, borderTopColor: c.dot }}
              >
                <p className="font-body text-base font-bold mb-1" style={{ color: c.dot }}>{s.time}</p>
                <p className="font-display text-[13px] text-foreground leading-tight mb-1" style={{ fontWeight: 400 }}>{s.title}</p>
                <p className="font-body text-[10px] text-muted-foreground mb-2">{s.instructor} · {s.duration}min</p>
                <div className="flex items-center justify-between gap-2">
                  <span className={`font-body text-[9px] tracking-widest uppercase px-2.5 py-1 rounded-full ${isFull ? "bg-destructive/10 text-destructive" : "bg-secondary/40 text-terra"}`} style={{ fontWeight: 600 }}>
                    {isFull ? "Complet" : `${spotsLeft} place${spotsLeft > 1 ? "s" : ""}`}
                  </span>
                  {!isFull && (
                    <span className="font-body text-[9px] tracking-widest uppercase text-muted-foreground" style={{ fontWeight: 400 }}>
                      1 crédit
                    </span>
                  )}
                </div>
              </motion.button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

// ── Collapsible section wrapper ────────────────────────────────────────────────
const SectionToggle = ({
  id,
  label,
  collapsed,
  onToggle,
}: {
  id: string;
  label: string;
  collapsed: boolean;
  onToggle: () => void;
}) => (
  <div className="flex items-center justify-between px-6 py-2.5 border-b border-terra/12 bg-background/80 backdrop-blur-sm z-10 relative">
    <span className="font-body text-[9px] tracking-[0.4em] uppercase text-muted-foreground/60" style={{ fontWeight: 400 }}>
      {label}
    </span>
    <button
      onClick={onToggle}
      className="flex items-center gap-1.5 font-body text-[9px] tracking-[0.25em] uppercase text-muted-foreground/60 hover:text-burgundy transition-colors"
      style={{ fontWeight: 700 }}
    >
      {collapsed ? "afficher" : "réduire"}
      {collapsed ? <ChevronDown size={11} /> : <ChevronUp size={11} />}
    </button>
  </div>
);

// ── Index ─────────────────────────────────────────────────────────────────────

const Index = () => {
  const navigate = useNavigate();
  const goToBooking = () => navigate("/planning");

  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const toggle = (id: string) => setCollapsed((c) => ({ ...c, [id]: !c[id] }));

  // Parallax refs for mid-sections
  const statsSectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress: statsScroll } = useScroll({ target: statsSectionRef, offset: ["start end", "end start"] });
  const statsY = useTransform(statsScroll, [0, 1], ["4%", "-4%"]);

  const planningSectionRef = useRef<HTMLElement>(null);
  const { scrollYProgress: planningScroll } = useScroll({ target: planningSectionRef, offset: ["start end", "end start"] });
  const planningBgY = useTransform(planningScroll, [0, 1], ["-5%", "5%"]);

  return (
    <main style={{ position: "relative" }}>
      {/* Warm burgundy/terra ambient — fixed behind all sections */}
      <div
        className="fixed inset-0 pointer-events-none"
        style={{
          zIndex: -1,
          background: "radial-gradient(ellipse at 25% 10%, rgba(122,48,64,0.22) 0%, transparent 45%), radial-gradient(ellipse at 78% 52%, rgba(184,99,74,0.18) 0%, transparent 42%), radial-gradient(ellipse at 48% 88%, rgba(122,48,64,0.14) 0%, transparent 38%)",
        }}
        aria-hidden
      />
      <ScrollProgressBar />
      <StarfieldCanvas />
      <FloatingCircles />
      <Navbar onBookClick={goToBooking} />
      <HeroSection onBookClick={goToBooking} burgundyBackground />
      <TodaySessionsStrip />

      {/* Stats strip with parallax */}
      <div ref={statsSectionRef} className="relative overflow-hidden bg-terra/12 border-y border-foreground/10 py-6 px-6">
        <motion.div style={{ y: statsY }} className="container mx-auto max-w-5xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.7 }}
                className="text-center"
              >
                <p className="font-display text-4xl text-terra" style={{ fontWeight: 200 }}>
                  <AnimatedCounter target={s.value} suffix={s.suffix} />
                </p>
                <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground mt-1.5" style={{ fontWeight: 300 }}>
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>

      <SectionToggle id="studio" label="Le Studio" collapsed={!!collapsed.studio} onToggle={() => toggle("studio")} />
      <AnimatePresence initial={false}>
        {!collapsed.studio && (
          <motion.div key="studio" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: "hidden" }}>
            <StudioSection />
          </motion.div>
        )}
      </AnimatePresence>
      <LogoDivider variant="sand" label="Planning" />

      <SectionToggle id="planning" label="Planning" collapsed={!!collapsed.planning} onToggle={() => toggle("planning")} />
      <AnimatePresence initial={false}>
        {!collapsed.planning && (
          <motion.div key="planning" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: "hidden" }}>
            <section ref={planningSectionRef} className="relative py-16 px-6 overflow-hidden bg-secondary">
              <div className="absolute inset-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(122,48,64,0.07) 0%, rgba(184,99,74,0.04) 100%)" }} />

              <div className="container mx-auto max-w-6xl relative z-10">
                <div className="grid md:grid-cols-[1fr_2fr] gap-10 lg:gap-16 items-start">

                  {/* Left: editorial heading + info + CTA */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                    className="md:sticky md:top-24 space-y-8"
                  >
                    <div>
                      <div className="flex items-center gap-3 mb-5">
                        <div style={{ opacity: 0.3 }}>
                          <MeridianLogo size={22} variant="theme" animate spinDuration={10} />
                        </div>
                        <p className="font-body text-[10px] tracking-[0.45em] uppercase text-terra" style={{ fontWeight: 500 }}>
                          Prochaines séances
                        </p>
                      </div>
                      <h2
                        className="font-display text-foreground mb-5"
                        style={{ fontSize: "clamp(36px, 5vw, 60px)", fontWeight: 200, letterSpacing: "0.06em", lineHeight: 1.0 }}
                      >
                        Le <em className="italic text-terra">Planning</em>
                      </h2>
                      <div className="w-8 h-px bg-terra mb-6" />
                    </div>

                    {/* Discipline dots */}
                    <div className="flex flex-col gap-2.5">
                      {[
                        { color: "bg-terra", label: "Reformer · Pilates" },
                        { color: "bg-burgundy", label: "Yoga · Vinyasa · Hatha" },
                        { color: "bg-terra/60", label: "Mat Pilates · Post-natal · Zumba" },
                        { color: "bg-burgundy/60", label: "Barre Fit · Maman & Bébé" },
                      ].map((d) => (
                        <div key={d.label} className="flex items-center gap-2.5">
                          <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${d.color}`} />
                          <span className="font-body text-[11px] text-muted-foreground" style={{ fontWeight: 300 }}>{d.label}</span>
                        </div>
                      ))}
                    </div>

                    {/* Manifesto line */}
                    <p className="font-display text-foreground/40 text-sm leading-[1.9]" style={{ fontWeight: 200, letterSpacing: "0.05em", fontStyle: "italic" }}>
                      "Maintenu dès 2 participants.<br />1 crédit = 1 séance."
                    </p>

                    <div className="flex flex-col gap-3">
                      <Link
                        to="/planning"
                        className="inline-flex items-center gap-3 bg-terra text-warm-white px-8 py-3.5 rounded-full font-body text-[11px] tracking-[0.3em] uppercase hover:bg-foreground/80 transition-all shadow-[0_6px_24px_rgba(184,99,74,0.28)] hover:shadow-[0_8px_32px_rgba(184,99,74,0.42)] group"
                        style={{ fontWeight: 500 }}
                      >
                        Tout le planning
                        <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
                      </Link>
                      <Link
                        to="/carte-black"
                        className="inline-flex items-center gap-2 font-body text-[11px] tracking-[0.25em] uppercase text-terra/70 hover:text-foreground transition-colors"
                        style={{ fontWeight: 500 }}
                      >
                        <Ticket size={12} /> Recharger des crédits →
                      </Link>
                    </div>
                  </motion.div>

                  {/* Right: sessions list */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.9, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
                  >
                    <UpcomingSessions limit={3} />
                  </motion.div>

                </div>
              </div>
            </section>
          </motion.div>
        )}
      </AnimatePresence>

      <LogoDivider variant="sand" label="Cours" />
      <SectionToggle id="classes" label="Nos Cours" collapsed={!!collapsed.classes} onToggle={() => toggle("classes")} />
      <AnimatePresence initial={false}>
        {!collapsed.classes && (
          <motion.div key="classes" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: "hidden" }}>
            <ClassesSection onBookClick={goToBooking} />
          </motion.div>
        )}
      </AnimatePresence>

      <SectionToggle id="why" label="Pourquoi The Circle" collapsed={!!collapsed.why} onToggle={() => toggle("why")} />
      <AnimatePresence initial={false}>
        {!collapsed.why && (
          <motion.div key="why" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: "clip" }}>
            <WhySection />
          </motion.div>
        )}
      </AnimatePresence>

      <SectionToggle id="carnets" label="Nos Carnets" collapsed={!!collapsed.carnets} onToggle={() => toggle("carnets")} />
      <AnimatePresence initial={false}>
        {!collapsed.carnets && (
          <motion.div key="carnets" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: "hidden" }}>
            <CarnetsSection />
          </motion.div>
        )}
      </AnimatePresence>

      <LogoDivider variant="sand" label="Coachs" />
      <SectionToggle id="coaches" label="L'Équipe" collapsed={!!collapsed.coaches} onToggle={() => toggle("coaches")} />
      <AnimatePresence initial={false}>
        {!collapsed.coaches && (
          <motion.div key="coaches" initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }} style={{ overflow: "hidden" }}>
            <CoachesSection />
          </motion.div>
        )}
      </AnimatePresence>
      <Footer />
      <WhatsAppButton />
    </main>
  );
};

export default Index;
