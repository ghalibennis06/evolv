import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import MeridianLogo from "@/components/brand/MeridianLogo";

interface ClassesSectionProps {
  onBookClick: () => void;
  context?: "index" | "studio";
}

const tabs = [
  { id: "reformer", label: "Reformer Pilates" },
  { id: "springwall", label: "Reformer + Springwall" },
  { id: "yoga", label: "Yoga" },
  { id: "fitness", label: "Mat & Fitness" },
  { id: "maternite", label: "Maternité & Post-natal" },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface Course {
  name: string;
  tag: string | null;
  detail: string;
}

const disciplineData: Record<TabId, Course[]> = {
  reformer: [
    {
      name: "Reformer Signature",
      tag: "Signature",
      detail:
        "Votre corps entier en 55 min. Renforcement profond, posture corrigée, silhouette redessinée — guidé par votre coach, en groupe intimiste.",
    },
    {
      name: "Reformer Jumpboard",
      tag: "Cardio",
      detail:
        "Cardio qui préserve vos genoux. Intensité, endurance, brûlure — sur une machine qui absorbe l'impact à votre place.",
    },
  ],
  springwall: [
    {
      name: "Reformer + Springwall Combo",
      tag: "Complet",
      detail:
        "Bas du corps au Reformer, haut du corps au Springwall. La séance la plus complète du studio.",
    },
  ],
  yoga: [
    {
      name: "Vinyasa Yoga",
      tag: "Flow",
      detail:
        "Fluidité et force. Chaque mouvement suit votre souffle — un yoga qui renforce autant qu'il libère.",
    },
    {
      name: "Hatha Yoga",
      tag: "Équilibre",
      detail:
        "Postures tenues, respiration consciente. Le yoga dans son essence — pour ancrer, assouplir, recentrer.",
    },
    {
      name: "Power Yoga",
      tag: "Intensif",
      detail:
        "Yoga athlétique. Séquences intenses pour bâtir de la force, de l'endurance et une concentration d'acier.",
    },
  ],
  fitness: [
    {
      name: "Mat Pilates",
      tag: null,
      detail:
        "La puissance au sol. Développez votre centre de force sans matériel — contrôle, respiration, muscles profonds.",
    },
    {
      name: "Barre Fit",
      tag: null,
      detail:
        "Inspiré du ballet, sans en être un danseur. Micro-mouvements précis qui sculptent et tonifient avec grâce.",
    },
    {
      name: "Cardio Zumba",
      tag: "Fun",
      detail:
        "Se défouler, vraiment. Cardio déguisé en fête — rythmes, chaleur, sourires. Aucun prérequis.",
    },
  ],
  maternite: [
    {
      name: "Post-natal",
      tag: "Maman",
      detail:
        "Retrouvez votre corps à votre rythme. Périnée, abdominaux profonds, bien-être global — accompagnée avec expertise.",
    },
    {
      name: "Maman & Bébé",
      tag: "Duo",
      detail:
        "Une heure pour vous deux. Votre bébé participe, vous vous reconnectez à votre corps.",
    },
  ],
};

const ClassesSection = ({ onBookClick, context = "index" }: ClassesSectionProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("reformer");
  const [visibleTabs, setVisibleTabs] = useState<string[]>(tabs.map((t) => t.id));

  useEffect(() => {
    import("@/integrations/supabase/client").then(({ supabase }) => {
      supabase
        .from("site_content")
        .select("content")
        .eq("section", "disciplines_visibility")
        .single()
        .then(({ data }) => {
          if (data?.content) {
            const vis = data.content as any;
            const list = vis[context];
            if (Array.isArray(list) && list.length > 0) setVisibleTabs(list);
          }
        });
    });
  }, [context]);

  useEffect(() => {
    if (!visibleTabs.includes(activeTab)) {
      const firstVisible = tabs.find((t) => visibleTabs.includes(t.id));
      if (firstVisible) setActiveTab(firstVisible.id);
    }
  }, [visibleTabs, activeTab]);

  const filteredTabs = tabs.filter((t) => visibleTabs.includes(t.id));

  const courses = disciplineData[activeTab];

  return (
    <section
      id="cours"
      className="min-h-screen overflow-hidden bg-background flex flex-col"
    >
      {/* Header */}
      <div className="relative py-16 px-6 text-center overflow-hidden flex-shrink-0">
        {/* Subtle terra radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(184,99,74,0.08) 0%, transparent 65%)",
          }}
        />
        {/* Meridian — bottom-right corner, never overlaps centered heading text */}
        <div
          className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/3 pointer-events-none"
          style={{ opacity: 0.28 }}
        >
          <MeridianLogo size={420} variant="theme" animate spinDuration={120} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <p
            className="font-body text-[11px] tracking-[0.45em] uppercase text-terra mb-5"
            style={{ fontWeight: 500 }}
          >
            Nos disciplines
          </p>
          <h2
            className="font-display text-foreground"
            style={{
              fontSize: "clamp(36px, 6vw, 80px)",
              fontWeight: 200,
              letterSpacing: "0.08em",
              lineHeight: 0.95,
            }}
          >
            Les{" "}
            <em className="italic text-terra">Cours</em>
          </h2>
          <p
            className="font-body text-foreground/80 mt-5 max-w-sm mx-auto leading-[1.9]"
            style={{ fontWeight: 400, fontSize: "14px" }}
          >
            Une pratique pour chaque corps, chaque intention — choisissez
            ce qui vous correspond.
          </p>
        </motion.div>
      </div>

      {/* Tab navigation */}
      <div className="relative flex-shrink-0 px-4">
        {/* Thin top rule */}
        <div
          className="absolute top-0 left-0 right-0"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(184,99,74,0.22), transparent)",
          }}
        />
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex gap-0 min-w-max mx-auto justify-center">
            {filteredTabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative px-5 py-4 font-body text-[11px] tracking-[0.22em] uppercase transition-colors whitespace-nowrap flex-shrink-0"
                  style={{
                    fontWeight: isActive ? 600 : 400,
                    color: isActive
                      ? "hsl(var(--terra))"
                      : "hsl(var(--foreground))",
                  }}
                >
                  {tab.label}
                  {/* Active underline */}
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-5 right-5 h-px bg-terra"
                      transition={{ type: "spring", stiffness: 380, damping: 36 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        {/* Thin bottom rule */}
        <div
          className="absolute bottom-0 left-0 right-0"
          style={{
            height: "1px",
            background:
              "linear-gradient(90deg, transparent, rgba(184,99,74,0.22), transparent)",
          }}
        />
      </div>

      {/* Course cards — grows to fill remaining space */}
      <div className="flex-1 flex flex-col justify-center px-6 py-10 md:py-14">
        <div className="container mx-auto max-w-5xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4"
            >
              {courses.map((course, cIdx) => (
                <motion.div
                  key={course.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    delay: cIdx * 0.07,
                    duration: 0.6,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  className="group relative p-6 bg-card border border-border rounded-sm cursor-default transition-all hover:border-terra/50 hover:bg-terra/5"
                >
                  {/* Tag */}
                  {course.tag && (
                    <span
                      className="inline-block font-body text-[10px] tracking-[0.2em] uppercase text-terra border border-terra/50 px-2.5 py-1 mb-4"
                      style={{ fontWeight: 600, borderRadius: "2px" }}
                    >
                      {course.tag}
                    </span>
                  )}
                  {!course.tag && <div className="mb-4 h-[26px]" />}

                  {/* Course name */}
                  <h4
                    className="font-display text-foreground mb-3 group-hover:text-terra transition-colors"
                    style={{
                      fontSize: "clamp(18px, 2.2vw, 26px)",
                      fontWeight: 400,
                      letterSpacing: "0.04em",
                      lineHeight: 1.15,
                    }}
                  >
                    {course.name}
                  </h4>

                  {/* Description */}
                  <p
                    className="font-body text-foreground/70 leading-[1.9]"
                    style={{ fontWeight: 400, fontSize: "13px" }}
                  >
                    {course.detail}
                  </p>

                  {/* Hover accent line */}
                  <div
                    className="absolute bottom-0 left-0 h-px w-0 bg-terra group-hover:w-full transition-all duration-500"
                    style={{ borderRadius: "0 0 2px 2px" }}
                  />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* CTA */}
      <div className="relative py-10 text-center flex-shrink-0">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 100%, rgba(184,99,74,0.06) 0%, transparent 55%)",
          }}
        />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center gap-4"
        >
          <p
            className="font-body text-foreground text-[11px] tracking-[0.3em] uppercase"
            style={{ fontWeight: 500 }}
          >
            Prêt·e à commencer ?
          </p>
          <button
            onClick={onBookClick}
            className="inline-flex items-center gap-3 bg-terra hover:bg-terra-dark text-white px-10 py-4 font-body text-[11px] tracking-[0.3em] uppercase transition-all"
            style={{ fontWeight: 500, borderRadius: "40px" }}
          >
            Réserver une séance →
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default ClassesSection;
