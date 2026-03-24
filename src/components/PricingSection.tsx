import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Check, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

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
    name: "Carte Black x10",
    price: 2800,
    original_price: 3500,
    sessions_included: 10,
    features: ["Accès à tous les cours", "Boisson offerte à chaque séance", "Réservation prioritaire", "Validité 3 mois", "Économisez 700 DH"],
    is_popular: true,
    cta_text: "J'en profite !",
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
    cta_text: "Réserver",
    cta_link: "/carte-black",
  },
];

const PricingSection = ({ onBookClick }: PricingSectionProps) => {
  const [plans, setPlans] = useState<PricingPlan[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from("pricing").select("*").eq("is_active", true).order("sort_order", { ascending: true });
      setPlans(data && data.length > 0 ? (data as PricingPlan[]) : fallbackPricing);
      setLoading(false);
    };
    load();
  }, []);

  if (loading) return null;

  return (
    <section id="tarifs" className="py-24 px-6 bg-background relative overflow-hidden">
      <div className="container mx-auto max-w-6xl relative z-10">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="text-center mb-14">
          <p className="font-body text-[11px] tracking-[0.35em] uppercase text-terra mb-4" style={{ fontWeight: 500 }}>
            Tarifs & Codes
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground" style={{ fontWeight: 400, letterSpacing: "0.08em" }}>
            Des offres <em className="italic text-terra">claires</em>, des codes générés automatiquement
          </h2>
          <p className="font-body text-foreground/70 mt-4 max-w-2xl mx-auto" style={{ fontWeight: 400, fontSize: "14px" }}>
            Chaque formule avec crédits crée un code unique associé à votre compte. Pas de confusion: vous achetez, le code est généré, les crédits sont appliqués.
          </p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-5 items-stretch max-w-3xl mx-auto">
          {plans.filter(p => (p.sessions_included ?? 0) > 1).map((plan, idx) => {
            const codeOffer = isCodeGeneratingOffer(plan);
            const savings = plan.original_price ? plan.original_price - plan.price : 0;

            return (
              <motion.div
                key={plan.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: idx * 0.08 }}
                className={`rounded-3xl p-7 border flex flex-col ${plan.is_popular ? "bg-gradient-to-b from-terra/12 to-card border-terra/30 shadow-lg shadow-terra/10" : "bg-card border-border"}`}
              >
                <div className="flex items-center justify-between gap-2 mb-3">
                  <h3 className="font-display text-2xl text-foreground" style={{ fontWeight: 400 }}>{plan.name}</h3>
                  {plan.is_popular && (
                    <span className="inline-flex items-center gap-1 rounded-full bg-terra text-white px-3 py-1 text-[10px] tracking-widest uppercase">
                      <Sparkles size={10} /> Top
                    </span>
                  )}
                </div>

                <div className="mb-4">
                  {codeOffer ? (
                    <>
                      <div className="mb-1">
                        <span className="font-display text-terra" style={{ fontSize: "clamp(40px, 6vw, 56px)", fontWeight: 200, letterSpacing: "-0.02em", lineHeight: 1 }}>
                          {plan.sessions_included}
                        </span>
                        <span className="font-body text-terra/70 text-[11px] tracking-[0.25em] uppercase ml-2" style={{ fontWeight: 400 }}>
                          crédit{(plan.sessions_included ?? 1) > 1 ? "s" : ""}
                        </span>
                      </div>
                      <p className="font-body text-sm text-foreground/60">
                        {plan.price.toLocaleString("fr-FR")} DH
                        {plan.original_price && <span className="ml-2 line-through text-foreground/30">{plan.original_price.toLocaleString("fr-FR")}</span>}
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-display text-3xl text-foreground" style={{ fontWeight: 400 }}>{plan.price.toLocaleString("fr-FR")} DH</p>
                      {plan.original_price && (
                        <p className="font-body text-sm text-muted-foreground line-through">{plan.original_price.toLocaleString("fr-FR")} DH</p>
                      )}
                    </>
                  )}
                  {!!savings && <p className="font-body text-xs text-[#4E9E7A] mt-1">Vous économisez {savings.toLocaleString("fr-FR")} DH</p>}
                </div>

                <ul className="space-y-2.5 mb-7 flex-1">
                  {(plan.features || []).map((f) => (
                    <li key={f} className="font-body text-sm text-foreground/70 flex items-start gap-2">
                      <Check size={14} className="shrink-0 mt-0.5 text-terra" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                <Link
                  to={codeOffer ? `/carte-black?plan=${encodeURIComponent(plan.name)}` : plan.cta_link}
                  className={`w-full py-3.5 rounded-full font-body text-[11px] tracking-[0.26em] uppercase text-center block transition-all ${plan.is_popular ? "bg-terra text-warm-white hover:bg-terra-dark" : "border border-terra text-foreground hover:bg-terra hover:text-warm-white"}`}
                  style={{ fontWeight: 600 }}
                >
                  {codeOffer ? `Acheter ${plan.sessions_included} crédit${(plan.sessions_included ?? 1) > 1 ? "s" : ""}` : plan.cta_text}
                </Link>
              </motion.div>
            );
          })}
        </div>

        {/* Credits CTA */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.25 }}
          className="mt-10 text-center"
        >
          <p className="font-body text-foreground/60 text-[13px] mb-3" style={{ fontWeight: 400 }}>
            Vous avez déjà un crédit ?
          </p>
          <Link
            to="/planning"
            className="inline-flex items-center gap-2 font-body text-[11px] tracking-[0.25em] uppercase text-terra hover:text-terra-dark transition-colors border-b border-terra/40 hover:border-terra pb-0.5"
            style={{ fontWeight: 500 }}
          >
            Réservez votre séance →
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default PricingSection;
