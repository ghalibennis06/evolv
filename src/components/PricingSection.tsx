import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { Link } from "react-router-dom";
import { api } from "@/lib/api";

interface PricingSectionProps {
  onBookClick: () => void;
}

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
}

const isCodeGeneratingOffer = (plan: PricingPlan) => (plan.sessions_included || 0) > 0;

const fallbackPricing: PricingPlan[] = [
  {
    id: "1",
    name: "Séance unique",
    price: 350,
    original_price: null,
    sessions_included: 1,
    features: ["Accès à tous les cours", "Boisson offerte", "Réservation de tapis"],
    is_popular: false,
    cta_text: "Réserver",
    cta_link: "/planning",
  },
  {
    id: "2",
    name: "Carte Signature x10",
    price: 2800,
    original_price: 3500,
    sessions_included: 10,
    features: ["Accès à tous les cours", "Boisson offerte à chaque séance", "Réservation prioritaire", "Validité 3 mois", "Économisez 700 DH"],
    is_popular: true,
    cta_text: "Acquérir",
    cta_link: "/carte-black",
  },
  {
    id: "3",
    name: "Pack 5 séances",
    price: 1600,
    original_price: 1750,
    sessions_included: 5,
    features: ["Accès à tous les cours", "Boisson offerte", "Validité 2 mois"],
    is_popular: false,
    cta_text: "Choisir",
    cta_link: "/carte-black",
  },
];

const PricingSection = ({ onBookClick }: PricingSectionProps) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.pricing.list().then((data) => {
      setPlans(data && data.length > 0 ? (data as PricingPlan[]) : fallbackPricing);
      setLoading(false);
    }).catch(() => { setPlans(fallbackPricing); setLoading(false); });
  }, []);

  if (loading) return null;

  return (
    <section id="tarifs" className="py-28 px-6 bg-secondary/20 relative overflow-hidden">
      <div className="container mx-auto max-w-5xl relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16"
        >
          <p className="brand-label justify-center mb-5">
            Formules & Abonnements
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground" style={{ fontWeight: 400, letterSpacing: "0.02em", lineHeight: 1.15 }}>
            Des formules conçues pour<br />
            <em className="italic" style={{ fontStyle: "italic", fontWeight: 300 }}>votre pratique</em>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-px bg-border max-w-3xl mx-auto">
          {plans.filter(p => (p.sessions_included ?? 0) > 1).map((plan, idx) => {
            const codeOffer = isCodeGeneratingOffer(plan);
            const savings = plan.original_price ? plan.original_price - plan.price : 0;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 28 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className={`p-8 flex flex-col relative ${plan.is_popular ? "bg-foreground text-background" : "bg-background"}`}
              >
                {plan.is_popular && (
                  <div className="absolute top-8 right-8">
                    <span className="font-body text-[9px] tracking-[0.2em] uppercase text-background/40 border border-background/20 px-2.5 py-1" style={{ fontWeight: 400 }}>
                      Recommandé
                    </span>
                  </div>
                )}

                <div className="mb-6">
                  <h3
                    className={`font-display text-2xl mb-1 ${plan.is_popular ? "text-background" : "text-foreground"}`}
                    style={{ fontWeight: 400 }}
                  >
                    {plan.name}
                  </h3>
                </div>

                <div className="mb-8">
                  {codeOffer ? (
                    <>
                      <div className="mb-1 flex items-baseline gap-2">
                        <span
                          className={`font-display ${plan.is_popular ? "text-background" : "text-foreground"}`}
                          style={{ fontSize: "clamp(42px, 6vw, 54px)", fontWeight: 300, letterSpacing: "-0.02em", lineHeight: 1 }}
                        >
                          {plan.sessions_included}
                        </span>
                        <span
                          className={`font-body text-[10px] tracking-[0.2em] uppercase ${plan.is_popular ? "text-background/50" : "text-muted-foreground"}`}
                          style={{ fontWeight: 400 }}
                        >
                          crédit{(plan.sessions_included ?? 1) > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className={`font-body text-sm mt-1 ${plan.is_popular ? "text-background/60" : "text-muted-foreground"}`}>
                        {plan.price.toLocaleString("fr-FR")} DH
                        {plan.original_price && (
                          <span className={`ml-2 line-through ${plan.is_popular ? "text-background/30" : "text-foreground/25"}`}>
                            {plan.original_price.toLocaleString("fr-FR")}
                          </span>
                        )}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className={`font-display text-3xl ${plan.is_popular ? "text-background" : "text-foreground"}`} style={{ fontWeight: 400 }}>
                        {plan.price.toLocaleString("fr-FR")} DH
                      </p>
                      {plan.original_price && (
                        <p className={`font-body text-sm mt-1 line-through ${plan.is_popular ? "text-background/40" : "text-muted-foreground"}`}>
                          {plan.original_price.toLocaleString("fr-FR")} DH
                        </p>
                      )}
                    </>
                  )}
                  {!!savings && (
                    <p className={`font-body text-xs mt-2 ${plan.is_popular ? "text-background/50" : "text-muted-foreground"}`}>
                      Économisez {savings.toLocaleString("fr-FR")} DH
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8 flex-1">
                  {(plan.features || []).map((f) => (
                    <li key={f} className={`font-body text-sm flex items-start gap-2.5 ${plan.is_popular ? "text-background/70" : "text-foreground/60"}`}>
                      <Check size={13} className={`shrink-0 mt-0.5 ${plan.is_popular ? "text-background/50" : "text-foreground/40"}`} />
                      <span style={{ fontWeight: 300 }}>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={codeOffer ? `/carte-black?plan=${encodeURIComponent(plan.name)}` : plan.cta_link}
                  className={`w-full py-4 font-body text-[10px] tracking-[0.26em] uppercase text-center block transition-all ${
                    plan.is_popular
                      ? "bg-background text-foreground hover:bg-background/90"
                      : "border border-foreground/30 text-foreground hover:bg-foreground hover:text-background"
                  }`}
                  style={{ fontWeight: 500 }}
                >
                  {codeOffer ? `Acquérir ${plan.sessions_included} crédit${(plan.sessions_included ?? 1) > 1 ? "s" : ""}` : plan.cta_text}
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2 }}
          className="mt-12 text-center"
        >
          <p className="font-body text-foreground/40 text-[13px] mb-3" style={{ fontWeight: 300 }}>
            Vous avez déjà un crédit ?
          </p>
          <Link
            to="/planning"
            className="inline-flex items-center gap-2 font-body text-[10px] tracking-[0.25em] uppercase text-foreground/50 hover:text-foreground transition-colors border-b border-foreground/20 hover:border-foreground pb-0.5"
            style={{ fontWeight: 400 }}
          >
            Réservez votre séance →
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
