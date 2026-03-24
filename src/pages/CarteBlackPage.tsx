import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Sparkles, Ticket } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { SplineScene } from "@/components/SplineScene";
import { CardSpotlight } from "@/components/ui/card-spotlight";
import MeridianLogo from "@/components/brand/MeridianLogo";
import PageBackgroundMeridian from "@/components/brand/PageBackgroundMeridian";
import { supabase } from "@/integrations/supabase/client";
import { createPayzoneSession } from "@/lib/payzone";

interface PricingPlan {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  sessions_included: number | null;
  features: string[];
  is_popular: boolean;
  cta_text: string;
  cta_link: string;
  description: string;
}

// Black card visual component
function BlackCard({ plan, onClick }: { plan: PricingPlan; onClick: () => void }) {
  return (
    <motion.button
      onClick={onClick}
      whileHover={{ y: -8, rotateY: 4 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", stiffness: 220, damping: 20 }}
      className="w-full text-left"
      style={{ perspective: "800px" }}
    >
      <CardSpotlight
        radius={320}
        color="#1a0810"
        className="w-full rounded-2xl overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #1A1410 0%, #0D0B09 40%, #1C1208 70%, #120E08 100%)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.55), 0 4px 20px rgba(196,130,60,0.12), inset 0 1px 0 rgba(255,255,255,0.05)",
          minHeight: "220px",
        }}
      >
        {/* Gold shimmer */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "linear-gradient(120deg, transparent 30%, rgba(196,130,60,0.06) 50%, transparent 70%)" }}
        />
        {/* Meridian watermark */}
        <div className="absolute -bottom-8 -right-8 opacity-[0.07]">
          <MeridianLogo size={160} variant="sand" />
        </div>
        {/* Popular badge */}
        {plan.is_popular && (
          <div className="absolute top-4 right-4 z-10">
            <span className="font-body text-[8px] tracking-[0.25em] uppercase text-[#C4862A] bg-[#C4862A]/10 border border-[#C4862A]/30 px-2 py-0.5 rounded-full">
              Best seller
            </span>
          </div>
        )}
        {/* Card content */}
        <div className="relative z-10 p-6 flex flex-col justify-between" style={{ minHeight: "220px" }}>
          <div>
            <p className="font-body text-[9px] tracking-[0.4em] uppercase text-white/30 mb-1">The Circle Studio</p>
            <p className="font-display text-white/90 text-xl leading-tight" style={{ fontWeight: 200, letterSpacing: "0.06em" }}>
              {plan.name}
            </p>
          </div>
          <div className="flex items-end justify-between mt-6">
            <div>
              <p className="font-display text-4xl text-white" style={{ fontWeight: 300 }}>
                {plan.price.toLocaleString("fr-FR")}
                <span className="font-body text-base text-white/40 ml-1">DH</span>
              </p>
              {plan.original_price && (
                <p className="font-body text-[11px] text-white/30 line-through">{plan.original_price.toLocaleString("fr-FR")} DH</p>
              )}
              <p className="font-body text-[10px] text-[#C4862A] tracking-widest mt-1">
                {plan.sessions_included || 1} crédit{(plan.sessions_included || 1) > 1 ? "s" : ""}
              </p>
            </div>
            {/* Chip */}
            <div
              className="w-10 h-8 rounded mb-1"
              style={{ background: "linear-gradient(135deg, #C4A24A 0%, #8A6C2A 100%)", boxShadow: "0 2px 6px rgba(0,0,0,0.4)" }}
            />
          </div>
        </div>
      </CardSpotlight>
      {/* CTA below card */}
      <div className="mt-3 flex items-center justify-center gap-1.5 font-body text-[11px] tracking-[0.25em] uppercase text-terra">
        <Sparkles size={11} /> Générer mon code
      </div>
    </motion.button>
  );
}

function buildPackRequestEmail(name: string, packName: string, credits: number): string {
  return `<div style="font-family:Montserrat,sans-serif;max-width:520px;margin:0 auto;background:#FBF7F2;padding:0"><div style="background:#B8634A;padding:32px 32px 28px"><p style="color:rgba(251,247,242,0.7);font-size:10px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 8px">The Circle Studio</p><h1 style="color:#FBF7F2;font-size:28px;font-weight:200;letter-spacing:0.06em;margin:0;font-family:Georgia,serif">Demande reçue</h1></div><div style="padding:32px"><p style="color:#3D2318;font-size:15px;line-height:1.9;margin:0 0 20px">Bonjour <strong>${name}</strong>,</p><p style="color:#5A4538;font-size:14px;line-height:1.9;margin:0 0 24px">Votre demande pour <strong>${packName}</strong> (${credits} crédit${credits > 1 ? "s" : ""}) a bien été reçue. Notre équipe l'activera après confirmation du paiement.</p><div style="background:#FFF8F5;border:1px solid rgba(184,99,74,0.2);border-radius:12px;padding:20px;margin:0 0 24px"><p style="color:#B8634A;font-size:10px;letter-spacing:0.35em;text-transform:uppercase;margin:0 0 8px">Votre pack</p><p style="color:#3D2318;font-size:18px;font-weight:300;margin:0;font-family:Georgia,serif">${packName}</p><p style="color:#7A3040;font-size:13px;margin:4px 0 0">${credits} crédit${credits > 1 ? "s" : ""}</p></div><p style="color:#5A4538;font-size:14px;line-height:1.9;margin:0 0 8px">Vous recevrez votre code d'accès dès validation.</p><p style="color:#5A4538;font-size:14px;margin:0 0 32px">Suivez votre carte : <a href="https://thecirclestudio.vercel.app/mon-pack" style="color:#B8634A">thecircle.ma/mon-pack</a></p><div style="border-top:1px solid rgba(184,99,74,0.15);padding-top:20px"><p style="color:#9D8070;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;margin:0">The Circle Studio · El Menzeh, Rabat</p></div></div></div>`;
}

function buildAdminPackEmail(name: string, email: string, phone: string, packName: string, credits: number): string {
  return `<div style="font-family:Montserrat,sans-serif;max-width:520px;margin:0 auto;background:#FBF7F2;padding:0"><div style="background:#7A3040;padding:28px 32px"><p style="color:rgba(251,247,242,0.6);font-size:10px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 6px">Admin · The Circle</p><h1 style="color:#FBF7F2;font-size:24px;font-weight:200;letter-spacing:0.06em;margin:0;font-family:Georgia,serif">Nouvelle demande pack</h1></div><div style="padding:28px 32px"><table style="width:100%;border-collapse:collapse"><tr><td style="padding:10px 0;border-bottom:1px solid rgba(184,99,74,0.12);color:#9D8070;font-size:11px;letter-spacing:0.2em;text-transform:uppercase;width:35%">Client</td><td style="padding:10px 0;border-bottom:1px solid rgba(184,99,74,0.12);color:#3D2318;font-size:14px">${name}</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid rgba(184,99,74,0.12);color:#9D8070;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">Email</td><td style="padding:10px 0;border-bottom:1px solid rgba(184,99,74,0.12);color:#3D2318;font-size:14px">${email}</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid rgba(184,99,74,0.12);color:#9D8070;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">Tél</td><td style="padding:10px 0;border-bottom:1px solid rgba(184,99,74,0.12);color:#3D2318;font-size:14px">${phone || "—"}</td></tr><tr><td style="padding:10px 0;border-bottom:1px solid rgba(184,99,74,0.12);color:#9D8070;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">Pack</td><td style="padding:10px 0;border-bottom:1px solid rgba(184,99,74,0.12);color:#3D2318;font-size:14px">${packName}</td></tr><tr><td style="padding:10px 0;color:#9D8070;font-size:11px;letter-spacing:0.2em;text-transform:uppercase">Crédits</td><td style="padding:10px 0;color:#3D2318;font-size:14px">${credits}</td></tr></table><div style="margin-top:24px"><a href="https://thecirclestudio.vercel.app/admin" style="display:inline-block;background:#B8634A;color:#FBF7F2;padding:12px 24px;border-radius:24px;font-size:11px;letter-spacing:0.25em;text-transform:uppercase;text-decoration:none">Voir dans l'admin →</a></div></div></div>`;
}

const isCodeGeneratingOffer = (plan: PricingPlan) => (plan.sessions_included || 0) > 0;
const isUuid = (value?: string | null) =>
  !!value && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);

const fallbackPlans: PricingPlan[] = [
  {
    id: "1",
    name: "Séance à l'unité",
    price: 350,
    original_price: null,
    sessions_included: 1,
    features: ["Accès à tous les cours", "Tapis inclus", "Réservation en ligne"],
    is_popular: false,
    cta_text: "Créer mon code",
    cta_link: "/carte-black",
    description: "Pour découvrir ou pour les occasionnels",
  },
  {
    id: "2",
    name: "Pack 5 séances",
    price: 1600,
    original_price: 1750,
    sessions_included: 5,
    features: ["Accès à tous les cours", "Boisson offerte", "Validité 2 mois", "Économisez 150 DH"],
    is_popular: false,
    cta_text: "Créer mon code",
    cta_link: "/carte-black",
    description: "Idéal pour commencer en douceur",
  },
  {
    id: "3",
    name: "Carte Black × 10",
    price: 2800,
    original_price: 3500,
    sessions_included: 10,
    features: [
      "Accès premium à tous les cours",
      "Boisson offerte à chaque séance",
      "Réservation prioritaire",
      "Validité 3 mois",
      "Économisez 700 DH",
    ],
    is_popular: true,
    cta_text: "Créer ma Carte Black",
    cta_link: "/carte-black",
    description: "La formule la plus avantageuse",
  },
];

const inputCls =
  "w-full rounded-2xl border border-border bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-2 focus:ring-terra/40 focus:border-terra";

const CarteBlackPage = () => {
  const [searchParams] = useSearchParams();
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [selected, setSelected] = useState<PricingPlan | null>(null);
  const [step, setStep] = useState<"plans" | "form" | "loading" | "confirmed">("plans");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [paymentMethod, setPaymentMethod] = useState<"online" | "cash_on_site">("online");
  const [loadingPlans, setLoadingPlans] = useState(true);

  useEffect(() => {
    supabase
      .from("pricing")
      .select("*")
      .eq("is_active", true)
      .order("sort_order")
      .then(({ data }) => {
        const available = (data && data.length > 0 ? data : fallbackPlans) as PricingPlan[];
        const onlyCodePlans = available.filter(isCodeGeneratingOffer);
        const source = onlyCodePlans.length ? onlyCodePlans : available;
        setPlans(source);
        const wanted = (searchParams.get("plan") || "").toLowerCase();
        const byQuery = wanted ? source.find((x) => x.name.toLowerCase() === wanted) : null;
        setSelected(byQuery || source.find((x) => x.is_popular) || source[0] || null);
        setLoadingPlans(false);
      });
  }, [searchParams]);

  const selectedCredits = useMemo(() => selected?.sessions_included || 1, [selected]);

  const handleBuy = async () => {
    if (!selected || !name) return;
    if (paymentMethod === "online" && !email) {
      alert("Email requis pour le paiement en ligne.");
      return;
    }
    if (paymentMethod === "cash_on_site" && !email && !phone) {
      alert("Merci d'ajouter au moins un email ou un téléphone pour créer la demande.");
      return;
    }
    setStep("loading");

    try {
      if (paymentMethod === "cash_on_site") {
        const safeOfferId = isUuid(selected.id) ? selected.id : null;

        let requestId: string | undefined;

        // 1. Try edge function
        try {
          const { data: efData, error: efErr } = await supabase.functions.invoke("create-blackcard-request", {
            body: {
              client_name: name,
              client_email: email,
              client_phone: phone,
              offer_id: safeOfferId,
              offer_name: selected.name,
              credits_total: selectedCredits,
              payment_method: "cash_on_site",
            },
          });
          if (!efErr && efData?.request_id) requestId = efData.request_id;
        } catch (_) { /* fallthrough to direct insert */ }

        // 2. Fallback: direct insert into code_creation_requests (anon, no service key needed)
        if (!requestId) {
          const { data: directData } = await supabase
            .from("code_creation_requests")
            .insert({
              client_name: name,
              client_email: email || null,
              client_phone: phone || null,
              offer_id: safeOfferId,
              offer_name: selected.name,
              credits_total: selectedCredits,
              payment_method: "cash_on_site",
              payment_status: "pending",
              request_source: "frontend",
              request_status: "pending",
              metadata: { created_from: "carte-black-page" },
            })
            .select("id")
            .single();
          if (directData?.id) requestId = directData.id;
        }

        // Auto-send emails (non-blocking)
        supabase.functions.invoke("send-email", {
          body: { to: email, subject: `Demande reçue — ${selected.name} · The Circle Studio`, html: buildPackRequestEmail(name, selected.name, selectedCredits) },
        }).catch(() => {});
        supabase.functions.invoke("send-email", {
          body: { to: "ghali.bennis06@gmail.com", subject: `[Admin] Nouvelle demande pack — ${name}`, html: buildAdminPackEmail(name, email, phone, selected.name, selectedCredits) },
        }).catch(() => {});

        setStep("confirmed");
        return;
      }

      const safeOfferId = isUuid(selected.id) ? selected.id : undefined;
      const session = await createPayzoneSession({
        amount: selected.price,
        description: `${selected.name} — The Circle Studio`,
        customerName: name,
        customerEmail: email,
        customerPhone: phone,
        offerId: safeOfferId,
        offerName: selected.name,
        packType: selected.name,
        packCredits: selectedCredits,
        returnPath: "/payment-success",
      });

      window.location.href = session.paymentUrl;
    } catch (err: any) {
      alert(err?.message || "Une erreur est survenue. Merci de réessayer.");
      setStep("form");
    }
  };

  return (
    <main className="bg-background min-h-screen relative overflow-x-hidden">
      {/* Warm burgundy/terra ambient */}
      <div className="fixed inset-0 pointer-events-none" style={{ zIndex: -1, background: "radial-gradient(ellipse at 30% 20%, rgba(122,48,64,0.12) 0%, transparent 55%), radial-gradient(ellipse at 75% 75%, rgba(184,99,74,0.09) 0%, transparent 50%)" }} />
      <PageBackgroundMeridian />
      <Navbar onBookClick={() => {}} />

      <section className="pt-28 pb-16 px-6">
        <div className="container mx-auto max-w-5xl">
          <div className="relative mb-14">
            {/* Spline 3D — droite, desktop uniquement, pointer-events-none */}
            <div className="hidden md:block absolute top-1/2 right-0 -translate-y-1/2 pointer-events-none" style={{ width: "46%", height: 260 }}>
              <SplineScene scene="YOUR_SCENE_URL" className="w-full h-full" />
              <div className="absolute inset-0" style={{ background: "linear-gradient(to right, var(--background) 0%, transparent 35%)" }} />
            </div>

            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative z-10 text-center md:text-left md:max-w-[54%]">
              <p className="font-body text-[10px] tracking-[0.4em] uppercase text-terra/80 mb-4">Code instantané</p>
              <h1 className="font-display text-4xl md:text-6xl text-foreground mb-4" style={{ fontWeight: 200, letterSpacing: "0.1em" }}>
                Votre <em className="italic text-terra">Carte</em>
              </h1>
              <p className="font-body text-muted-foreground max-w-lg mx-auto md:mx-0 text-sm" style={{ fontWeight: 300 }}>
                Choisissez une formule — un code unique à crédits est généré immédiatement.
              </p>
            </motion.div>
          </div>

          {loadingPlans ? (
            <div className="flex justify-center py-20">
              <MeridianLogo size={48} variant="sand" animate spinDuration={6} />
            </div>
          ) : (
            <div className={`grid gap-6 ${plans.length === 4 ? "md:grid-cols-2 lg:grid-cols-4" : "md:grid-cols-3"}`}>
              {plans.map((plan, i) => (
                <motion.div
                  key={plan.id}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.1, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                >
                  <BlackCard
                    plan={plan}
                    onClick={() => { setSelected(plan); setStep("form"); }}
                  />
                  {/* Features list below each card */}
                  <ul className="mt-4 space-y-1.5 px-1">
                    {plan.features.slice(0, 3).map((f) => (
                      <li key={f} className="flex items-start gap-2 font-body text-[11px] text-muted-foreground" style={{ fontWeight: 300 }}>
                        <Check size={11} className="mt-0.5 text-terra/60 shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                </motion.div>
              ))}
            </div>
          )}

          {/* Bottom info strip */}
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
            className="mt-14 flex flex-col sm:flex-row items-center justify-center gap-8 border-t border-border pt-10"
          >
            {[
              { label: "Code TC-XXXX-XXXX généré", sub: "après validation ou paiement" },
              { label: "Crédits automatiques", sub: "selon la formule choisie" },
              { label: "Suivi sur /mon-pack", sub: "historique et solde en temps réel" },
            ].map((item) => (
              <div key={item.label} className="text-center">
                <p className="font-body text-[12px] text-foreground/70" style={{ fontWeight: 300 }}>{item.label}</p>
                <p className="font-body text-[10px] text-muted-foreground/50 tracking-widest uppercase mt-0.5">{item.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      <AnimatePresence>
        {(step === "form" || step === "loading" || step === "confirmed") && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/35 backdrop-blur-sm p-4"
            onClick={() => step === "form" && setStep("plans")}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-card border border-border w-full max-w-md rounded-3xl overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {step === "confirmed" ? (
                <div className="p-10 text-center">
                  <div className="w-16 h-16 rounded-full bg-terra/15 border border-terra/30 flex items-center justify-center mx-auto mb-5">
                    <Check size={28} className="text-terra" />
                  </div>
                  <h3 className="font-display text-2xl text-foreground mb-2" style={{ fontWeight: 200 }}>Demande envoyée</h3>
                  <p className="font-body text-sm text-muted-foreground mb-1">
                    <span className="text-foreground/80">{selected.name}</span> — {selectedCredits} crédit{selectedCredits > 1 ? "s" : ""}
                  </p>
                  <p className="font-body text-sm text-muted-foreground/60 mb-8">
                    Votre code sera activé après paiement sur place.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a
                      href="/mon-pack"
                      className="w-full rounded-full bg-terra py-3 text-white text-xs tracking-[0.28em] uppercase flex items-center justify-center gap-2 hover:bg-terra-dark transition-all"
                    >
                      <Ticket size={13} /> Suivre ma carte
                    </a>
                    <button
                      onClick={() => setStep("plans")}
                      className="w-full rounded-full border border-border py-3 text-muted-foreground text-xs tracking-[0.28em] uppercase hover:border-terra/30 transition-all"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : step === "loading" ? (
                <div className="p-10 text-center">
                  <MeridianLogo size={64} variant="theme" animate floatAnimation spinDuration={5} className="mx-auto mb-5" />
                  <p className="text-lg text-muted-foreground">Initialisation du paiement…</p>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-xl text-foreground" style={{ fontWeight: 200 }}>{selected.name}</p>
                      <button onClick={() => setStep("plans")} className="text-muted-foreground hover:text-foreground"><ChevronDown size={18} /></button>
                    </div>
                    <p className="font-display text-3xl text-terra mt-2">{selected.price.toLocaleString("fr-FR")} DH</p>
                    <p className="text-xs text-muted-foreground/60 mt-1">{selectedCredits} crédit{selectedCredits > 1 ? "s" : ""} générés automatiquement.</p>
                  </div>
                  <div className="p-6 space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Nom complet *" />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="Email *" type="email" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="Téléphone" type="tel" />

                    <div className="grid grid-cols-2 gap-2">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("online")}
                        className={`rounded-full py-2.5 text-xs border transition-all ${paymentMethod === "online" ? "bg-terra text-white border-terra" : "border-border text-muted-foreground hover:border-terra/40"}`}
                      >
                        En ligne
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cash_on_site")}
                        className={`rounded-full py-2.5 text-xs border transition-all ${paymentMethod === "cash_on_site" ? "bg-terra text-white border-terra" : "border-border text-muted-foreground hover:border-terra/40"}`}
                      >
                        Sur place
                      </button>
                    </div>

                    <button
                      onClick={handleBuy}
                      disabled={!name || !email}
                      className="w-full rounded-full bg-terra py-4 text-white text-xs tracking-[0.28em] uppercase flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-terra-dark transition-all"
                    >
                      <Sparkles size={14} /> {paymentMethod === "online" ? "Payer & générer" : "Créer une demande"}
                    </button>
                    <p className="text-[10px] text-center text-muted-foreground/50">
                      {paymentMethod === "online"
                        ? "Paiement sécurisé — code généré instantanément."
                        : "Demande envoyée en admin — code activé après paiement sur place."}
                    </p>
                  </div>
                </>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <Footer />
      <WhatsAppButton />
    </main>
  );
};

export default CarteBlackPage;
