import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronDown, Sparkles, Ticket, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import VertebraLogo from "@/components/brand/VertebraLogo";
import { api } from "@/lib/api";
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

function buildPackRequestEmail(name: string, packName: string, credits: number): string {
  return `<div style="font-family:Montserrat,sans-serif;max-width:520px;margin:0 auto;background:#FBF7F2;padding:0"><div style="background:#B8634A;padding:32px 32px 28px"><p style="color:rgba(251,247,242,0.7);font-size:10px;letter-spacing:0.4em;text-transform:uppercase;margin:0 0 8px">EVØLV Studio</p><h1 style="color:#FBF7F2;font-size:28px;font-weight:200;letter-spacing:0.06em;margin:0;font-family:Georgia,serif">Demande reçue</h1></div><div style="padding:32px"><p style="color:#3D2318;font-size:15px;line-height:1.9;margin:0 0 20px">Bonjour <strong>${name}</strong>,</p><p style="color:#5A4538;font-size:14px;line-height:1.9;margin:0 0 24px">Votre demande pour <strong>${packName}</strong> (${credits} crédit${credits > 1 ? "s" : ""}) a bien été reçue.</p></div></div>`;
}

function buildAdminPackEmail(name: string, email: string, phone: string, packName: string, credits: number): string {
  return `<div style="font-family:Montserrat,sans-serif;max-width:520px;margin:0 auto"><div style="background:#7A3040;padding:28px 32px"><h1 style="color:#FBF7F2;font-size:24px;font-weight:200;margin:0;font-family:Georgia,serif">Nouvelle demande pack</h1></div><div style="padding:28px 32px"><p>${name} — ${email} — ${packName} (${credits} crédits)</p></div></div>`;
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
    cta_link: "/carte-signature",
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
    cta_link: "/carte-signature",
    description: "Idéal pour commencer en douceur",
  },
  {
    id: "3",
    name: "Carte Signature × 10",
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
    cta_text: "Créer ma Carte Signature",
    cta_link: "/carte-signature",
    description: "La formule la plus avantageuse",
  },
];

const inputCls =
  "w-full border border-border bg-background px-4 py-3 text-sm text-foreground font-body placeholder:text-muted-foreground focus:outline-none focus:border-terra transition-colors";

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
    api.pricing.list().then((data) => {
      const available = (data && data.length > 0 ? data : fallbackPlans) as PricingPlan[];
      const onlyCodePlans = available.filter(isCodeGeneratingOffer);
      const source = onlyCodePlans.length ? onlyCodePlans : available;
      setPlans(source);
      const wanted = (searchParams.get("plan") || "").toLowerCase();
      const byQuery = wanted ? source.find((x) => x.name.toLowerCase() === wanted) : null;
      setSelected(byQuery || source.find((x) => x.is_popular) || source[0] || null);
      setLoadingPlans(false);
    }).catch(() => {
      const source = fallbackPlans.filter(isCodeGeneratingOffer).length ? fallbackPlans.filter(isCodeGeneratingOffer) : fallbackPlans;
      setPlans(source);
      setSelected(source.find((x) => x.is_popular) || source[0] || null);
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

        try {
          const efData = await api.admin.packs.create({
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
            metadata: { created_from: "carte-signature-page" },
          });
          if (efData?.request_id) requestId = efData.request_id;
          if (efData?.id) requestId = efData.id;
        } catch (_) { /* non-blocking */ }

        console.log("Pack request created for:", name, selected.name);
        setStep("confirmed");
        return;
      }

      const safeOfferId = isUuid(selected.id) ? selected.id : undefined;
      const session = await createPayzoneSession({
        amount: selected.price,
        description: `${selected.name} — EVØLV Studio`,
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
      <Navbar onBookClick={() => {}} />

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="pt-28 pb-0 px-6 border-b border-border">
        <div className="container mx-auto max-w-5xl pb-16">
          <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7 }}>
            <p className="brand-label mb-6">Code instantané</p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-6">
              <h1 className="font-display text-foreground" style={{ fontSize: "clamp(40px, 7vw, 80px)", fontWeight: 400, letterSpacing: "0.02em", lineHeight: 0.95 }}>
                Votre{" "}
                <em className="italic" style={{ fontWeight: 300 }}>Carte Signature</em>
              </h1>
              <p className="font-body text-muted-foreground max-w-sm pb-1 leading-[1.8]" style={{ fontWeight: 300, fontSize: "13px" }}>
                Choisissez une formule — un code unique à crédits est généré immédiatement après confirmation.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ PLANS GRID ════════════════════════════════════════════════════ */}
      <section className="px-6 py-16">
        <div className="container mx-auto max-w-5xl">
          {loadingPlans ? (
            <div className="flex justify-center py-20">
              <VertebraLogo size={40} variant="theme" animate showWordmark={false} />
            </div>
          ) : (
            <div className={`grid gap-0 border border-border ${plans.length === 4 ? "md:grid-cols-4" : "md:grid-cols-3"}`}>
              {plans.map((plan, i) => {
                const savings = plan.original_price ? plan.original_price - plan.price : 0;
                const isSelected = selected?.id === plan.id;
                return (
                  <motion.button
                    key={plan.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.6 }}
                    onClick={() => { setSelected(plan); setStep("form"); }}
                    className={`relative text-left p-7 border-r border-border last:border-r-0 group transition-all ${
                      isSelected ? "bg-foreground" : "bg-background hover:bg-card"
                    }`}
                  >
                    {/* Popular badge */}
                    {plan.is_popular && (
                      <div className="absolute top-4 right-4">
                        <span className={`font-body text-[8px] tracking-[0.22em] uppercase px-2.5 py-1 border ${isSelected ? "border-background/30 text-background/60" : "border-terra/40 text-terra"}`} style={{ fontWeight: 500 }}>
                          Best seller
                        </span>
                      </div>
                    )}
                    {/* Discount */}
                    {savings > 0 && (
                      <div className="mb-4">
                        <span className={`font-body text-[9px] tracking-[0.2em] uppercase px-2 py-0.5 ${isSelected ? "bg-background/15 text-background/70" : "bg-terra/10 text-terra"}`} style={{ fontWeight: 500 }}>
                          −{savings.toLocaleString("fr-FR")} DH
                        </span>
                      </div>
                    )}
                    {!savings && <div className="mb-4 h-[20px]" />}

                    <p className={`font-body text-[9px] tracking-[0.35em] uppercase mb-3 ${isSelected ? "text-background/50" : "text-muted-foreground"}`} style={{ fontWeight: 400 }}>
                      {plan.description}
                    </p>
                    <h3 className={`font-display mb-4 leading-[1.05] ${isSelected ? "text-background" : "text-foreground"}`} style={{ fontSize: "clamp(16px, 2vw, 20px)", fontWeight: 400, letterSpacing: "0.01em" }}>
                      {plan.name}
                    </h3>
                    <div className="flex items-baseline gap-1.5 mb-5">
                      <span className={`font-display ${isSelected ? "text-background" : "text-foreground"}`} style={{ fontSize: "clamp(28px, 4vw, 40px)", fontWeight: 400 }}>
                        {plan.price.toLocaleString("fr-FR")}
                      </span>
                      <span className={`font-body text-[12px] ${isSelected ? "text-background/60" : "text-muted-foreground"}`} style={{ fontWeight: 300 }}>DH</span>
                      {plan.original_price && (
                        <span className={`font-body text-[11px] line-through ml-1 ${isSelected ? "text-background/40" : "text-muted-foreground/60"}`}>
                          {plan.original_price.toLocaleString("fr-FR")}
                        </span>
                      )}
                    </div>
                    <p className={`font-body text-[10px] tracking-[0.2em] uppercase mb-6 ${isSelected ? "text-background/60" : "text-terra"}`} style={{ fontWeight: 500 }}>
                      {plan.sessions_included || 1} crédit{(plan.sessions_included || 1) > 1 ? "s" : ""}
                    </p>

                    <ul className="space-y-2 mb-6">
                      {plan.features.slice(0, 4).map((f) => (
                        <li key={f} className={`flex items-start gap-2 font-body text-[11px] leading-snug ${isSelected ? "text-background/70" : "text-muted-foreground"}`} style={{ fontWeight: 300 }}>
                          <Check size={10} className={`shrink-0 mt-0.5 ${isSelected ? "text-background/60" : "text-terra"}`} />
                          {f}
                        </li>
                      ))}
                    </ul>

                    <div className={`font-body text-[10px] tracking-[0.25em] uppercase flex items-center gap-1.5 ${isSelected ? "text-background/70" : "text-terra"}`} style={{ fontWeight: 500 }}>
                      <Sparkles size={10} />
                      {isSelected ? "Sélectionné" : "Générer mon code"}
                    </div>
                  </motion.button>
                );
              })}
            </div>
          )}

          {/* How it works strip */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
            className="mt-0 grid grid-cols-1 md:grid-cols-3 gap-0 border border-border border-t-0"
          >
            {[
              { label: "Code TC-XXXX-XXXX généré", sub: "après validation ou paiement" },
              { label: "Crédits automatiques", sub: "selon la formule choisie" },
              { label: "Suivi sur /mon-pack", sub: "historique et solde en temps réel" },
            ].map((item, i) => (
              <div key={item.label} className="px-6 py-5 border-r border-border last:border-r-0">
                <p className="font-body text-[12px] text-foreground/75 mb-0.5" style={{ fontWeight: 400 }}>{item.label}</p>
                <p className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground">{item.sub}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* ═══ FORM MODAL ════════════════════════════════════════════════════ */}
      <AnimatePresence>
        {(step === "form" || step === "loading" || step === "confirmed") && selected && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            onClick={() => step === "form" && setStep("plans")}
          >
            <motion.div
              initial={{ y: 40, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 40, opacity: 0 }}
              className="bg-card border border-border w-full max-w-md overflow-hidden shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {step === "confirmed" ? (
                <div className="p-10 text-center">
                  <div className="w-14 h-14 border border-foreground/15 bg-terra/10 flex items-center justify-center mx-auto mb-5">
                    <Check size={26} className="text-terra" />
                  </div>
                  <h3 className="font-display text-2xl text-foreground mb-2" style={{ fontWeight: 400 }}>Demande envoyée</h3>
                  <p className="font-body text-sm text-muted-foreground mb-1">
                    <span className="text-foreground/80">{selected.name}</span> — {selectedCredits} crédit{selectedCredits > 1 ? "s" : ""}
                  </p>
                  <p className="font-body text-sm text-muted-foreground/60 mb-8">
                    Votre code sera activé après paiement sur place.
                  </p>
                  <div className="flex flex-col gap-3">
                    <a
                      href="/mon-pack"
                      className="w-full bg-terra py-3.5 text-white text-xs tracking-[0.28em] uppercase flex items-center justify-center gap-2 hover:bg-foreground/80 transition-all"
                    >
                      <Ticket size={12} /> Suivre ma carte
                    </a>
                    <button
                      onClick={() => setStep("plans")}
                      className="w-full border border-border py-3.5 text-muted-foreground text-xs tracking-[0.28em] uppercase hover:border-foreground/30 transition-all"
                    >
                      Fermer
                    </button>
                  </div>
                </div>
              ) : step === "loading" ? (
                <div className="p-10 text-center">
                  <VertebraLogo size={48} variant="theme" animate showWordmark={false} className="mx-auto mb-5" />
                  <p className="text-lg text-muted-foreground" style={{ fontWeight: 300 }}>Initialisation du paiement…</p>
                </div>
              ) : (
                <>
                  <div className="p-6 border-b border-border">
                    <div className="flex items-center justify-between">
                      <p className="font-display text-xl text-foreground" style={{ fontWeight: 400 }}>{selected.name}</p>
                      <button onClick={() => setStep("plans")} className="text-muted-foreground hover:text-foreground p-1 border border-border">
                        <ChevronDown size={16} />
                      </button>
                    </div>
                    <p className="font-display text-3xl text-foreground mt-2" style={{ fontWeight: 400 }}>
                      {selected.price.toLocaleString("fr-FR")} <span className="text-base text-muted-foreground" style={{ fontWeight: 300 }}>DH</span>
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">{selectedCredits} crédit{selectedCredits > 1 ? "s" : ""} générés automatiquement.</p>
                  </div>
                  <div className="p-6 space-y-3">
                    <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Nom complet *" />
                    <input value={email} onChange={(e) => setEmail(e.target.value)} className={inputCls} placeholder="Email *" type="email" />
                    <input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="Téléphone" type="tel" />

                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("online")}
                        className={`py-3 text-xs border transition-all font-body tracking-[0.15em] uppercase ${paymentMethod === "online" ? "bg-terra text-white border-terra" : "border-border text-muted-foreground hover:border-terra/40"}`}
                        style={{ fontWeight: 500 }}
                      >
                        En ligne
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cash_on_site")}
                        className={`py-3 text-xs border transition-all font-body tracking-[0.15em] uppercase ${paymentMethod === "cash_on_site" ? "bg-terra text-white border-terra" : "border-border text-muted-foreground hover:border-terra/40"}`}
                        style={{ fontWeight: 500 }}
                      >
                        Sur place
                      </button>
                    </div>

                    <button
                      onClick={handleBuy}
                      disabled={!name || !email}
                      className="w-full bg-terra py-4 text-white text-xs tracking-[0.28em] uppercase flex items-center justify-center gap-2 disabled:opacity-40 hover:bg-foreground/80 transition-all font-body"
                      style={{ fontWeight: 500 }}
                    >
                      <Sparkles size={13} /> {paymentMethod === "online" ? "Payer & générer" : "Créer une demande"}
                    </button>
                    <p className="text-[10px] text-center text-muted-foreground/55 font-body">
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
