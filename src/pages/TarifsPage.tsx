import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import SpineWatermark from "@/components/brand/SpineWatermark";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

interface PricingPlan {
  id: string;
  name: string;
  description: string;
  price: number;
  original_price: number | null;
  sessions_included: number | null;
  validity_days: number | null;
  is_popular: boolean;
  features: string[];
  cta_text: string;
  cta_link: string;
}


const isCodeGeneratingOffer = (plan: PricingPlan) => (plan.sessions_included || 0) > 0;

const fallbackPricing: PricingPlan[] = [
  { id: "1", name: "Séance unique", description: "", price: 350, original_price: null, sessions_included: 1, validity_days: null, is_popular: false, features: ["Accès à tous les cours du planning", "Réservation en ligne", "Choix boisson & tapis"], cta_text: "Réserver", cta_link: "/reserver" },
  { id: "2", name: "Carte Signature x10", description: "", price: 2800, original_price: 3500, sessions_included: 10, validity_days: 90, is_popular: true, features: ["10 séances — tous les cours", "Boisson offerte à chaque séance", "Réservation prioritaire", "Flexibilité totale sur le planning", "Économisez 700 DH", "Validité 3 mois"], cta_text: "Acheter la Carte Signature", cta_link: "/carte-black" },
  { id: "3", name: "Pack 5 séances", description: "", price: 1600, original_price: 1750, sessions_included: 5, validity_days: 60, is_popular: false, features: ["5 séances — tous les cours", "Boisson offerte", "Économisez 150 DH", "Validité 2 mois"], cta_text: "Acheter le Pack 5", cta_link: "/carte-black" },
];

const TarifsPage = () => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.pricing.list().then((data) => {
      setPlans(data && data.length > 0 ? data as PricingPlan[] : fallbackPricing);
      setLoading(false);
    }).catch(() => { setPlans(fallbackPricing); setLoading(false); });
  }, []);

  const formatPrice = (p: number) => {
    if (p >= 1000) return `${Math.floor(p / 1000)} ${String(p % 1000).padStart(3, "0").replace(/^0+/, "")}`.replace(/ $/, "").replace(/ 0*$/, " 000").trim();
    return String(p);
  };

  return (
    <main className="bg-background min-h-screen">
      <Navbar onBookClick={() => {}} />
      <section className="pt-28 pb-24 px-6 relative overflow-hidden">
        {/* Hero meridian — decorative, behind title */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ zIndex: 0 }}>
          <SpineWatermark size={500} opacity={0.05} />
        </div>
        <div className="container mx-auto max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }} className="text-center mb-16">
            <p className="font-body text-[11px] tracking-[0.35em] uppercase text-terra mb-4" style={{ fontWeight: 200 }}>Nos offres</p>
            <h1 className="font-display text-4xl md:text-6xl text-foreground mb-4" style={{ fontWeight: 200, letterSpacing: "0.12em" }}>
              <em className="italic text-terra">Tarifs</em>
            </h1>
            <p className="font-body text-muted-foreground max-w-lg mx-auto" style={{ fontWeight: 300 }}>
              Des formules simples et transparentes pour s'adapter à votre rythme.
            </p>
          </motion.div>

          {loading ? (
            <p className="text-center font-body text-muted-foreground py-20" style={{ fontWeight: 200 }}>Chargement...</p>
          ) : (
            <div className="grid md:grid-cols-3 gap-[2px] items-stretch mb-16">
              {plans.map((plan, idx) => (
                <motion.div key={plan.id}
                  initial={{ opacity: 0, y: 24 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className={`p-8 flex flex-col relative ${
                    plan.is_popular ? "bg-secondary/40 border border-foreground/20" : "bg-card border border-border"
                  }`}
                  style={{ borderRadius: "2px" }}>
                  {plan.is_popular && (
                    <p className="font-body text-[10px] tracking-[0.3em] uppercase text-gold mb-4" style={{ fontWeight: 200 }}>Le + populaire</p>
                  )}
                  <h3 className="font-display text-xl text-foreground mb-2" style={{ fontWeight: 200, letterSpacing: "0.08em" }}>{plan.name}</h3>
                  <div className="mb-1 flex items-baseline gap-2">
                    <span className="font-display text-4xl text-foreground" style={{ fontWeight: 300 }}>{plan.price.toLocaleString("fr-FR")}</span>
                    <span className="font-body text-lg text-muted-foreground" style={{ fontWeight: 200 }}>DH</span>
                    {plan.original_price && (
                      <span className="font-body text-sm text-muted-foreground line-through" style={{ fontWeight: 200 }}>{plan.original_price.toLocaleString("fr-FR")} DH</span>
                    )}
                  </div>
                  {plan.sessions_included && plan.sessions_included > 1 && (
                    <p className="font-body text-sm text-muted-foreground mb-6" style={{ fontWeight: 200 }}>
                      soit {Math.round(plan.price / plan.sessions_included)} DH / séance
                    </p>
                  )}
                  {plan.sessions_included === 1 && (
                    <p className="font-body text-sm text-muted-foreground mb-6" style={{ fontWeight: 200 }}>/ séance</p>
                  )}
                  <ul className="space-y-3 mb-8 flex-1">
                    {plan.features.map(f => (
                      <li key={f} className="font-body text-sm text-muted-foreground flex items-start gap-2" style={{ fontWeight: 300 }}>
                        <Check size={14} className="shrink-0 mt-0.5 text-terra" />
                        <span>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <Link
                    to={isCodeGeneratingOffer(plan) ? `/carte-black?plan=${encodeURIComponent(plan.name)}` : plan.cta_link}
                    className={`w-full py-3 font-body text-[11px] tracking-[0.3em] uppercase text-center block transition-all ${
                      plan.is_popular
                        ? "bg-terra text-warm-white hover:bg-foreground/80"
                        : "border border-terra text-foreground hover:bg-foreground hover:text-warm-white"
                    }`}
                    style={{ fontWeight: 200, borderRadius: "2px" }}>
                    {isCodeGeneratingOffer(plan) ? "Générer mon code" : plan.cta_text}
                  </Link>
                </motion.div>
              ))}
            </div>
          )}

          {/* How packs work */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className="bg-burgundy/10 border border-burgundy/20 p-8 md:p-10 relative overflow-hidden" style={{ borderRadius: "2px" }}>
            {/* Meridian in dark section */}
            <div className="absolute inset-0 flex items-center justify-end pointer-events-none overflow-hidden">
              <SpineWatermark size={380} opacity={0.06} />
            </div>
            <h3 className="font-display text-2xl text-warm-white mb-8 relative z-10" style={{ fontWeight: 200, letterSpacing: "0.08em" }}>Comment ça marche ?</h3>
            <div className="grid md:grid-cols-4 gap-6 relative z-10">
              {[
                { step: "1", text: "Choisissez votre formule et cliquez sur « Générer mon code »." },
                { step: "2", text: "Payez en ligne ou demandez à régler sur place — un code TC-XXXX-XXXX est créé." },
                { step: "3", text: "Réservez vos séances sur /planning et présentez votre code." },
                { step: "4", text: "Suivez vos crédits et votre historique sur /mon-pack." },
              ].map(item => (
                <div key={item.step} className="text-center">
                  <div className="w-10 h-10 border border-foreground/20 text-terra flex items-center justify-center font-body text-sm mx-auto mb-3" style={{ fontWeight: 200, borderRadius: "2px" }}>
                    {item.step}
                  </div>
                  <p className="font-body text-sm text-white/60" style={{ fontWeight: 300 }}>{item.text}</p>
                </div>
              ))}
            </div>
            <div className="mt-8 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-3 relative z-10">
              <Link
                to="/carte-black"
                className="inline-flex items-center justify-center gap-2 bg-terra text-warm-white px-6 py-3 font-body text-[11px] tracking-[0.28em] uppercase hover:bg-foreground/80 transition-all"
                style={{ borderRadius: "2px", fontWeight: 400 }}
              >
                Générer ma carte →
              </Link>
              <Link
                to="/mon-pack"
                className="inline-flex items-center justify-center gap-2 border border-white/20 text-white/60 px-6 py-3 font-body text-[11px] tracking-[0.28em] uppercase hover:border-terra hover:text-foreground transition-all"
                style={{ borderRadius: "2px", fontWeight: 300 }}
              >
                Consulter ma carte
              </Link>
            </div>
          </motion.div>
        </div>
      </section>
      <Footer />
      <WhatsAppButton />
    </main>
  );
};

export default TarifsPage;
