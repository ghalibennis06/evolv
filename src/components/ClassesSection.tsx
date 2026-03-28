import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import SpineWatermark from "@/components/brand/SpineWatermark";

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
        "Corps entier en 55 minutes. Renforcement profond, posture corrigée, silhouette redessinée — guidé par votre coach, en groupe intimiste de 6.",
    },
    {
      name: "Reformer Jumpboard",
      tag: "Cardio",
      detail:
        "Intensité cardio sans impact articulaire. Endurance, force, brûlure — sur une machine qui absorbe l'impact à votre place.",
    },
  ],
  springwall: [
    {
      name: "Reformer + Springwall Combo",
      tag: "Complet",
      detail:
        "Bas du corps au Reformer, haut du corps au Springwall. La séance la plus complète du studio EVØLV.",
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
        "Yoga athlétique. Séquences intenses pour bâtir force, endurance et concentration.",
    },
  ],
  fitness: [
    {
      name: "Mat Pilates",
      tag: null,
      detail:
        "La puissance au sol. Développez votre centre de force — contrôle, respiration, muscles profonds.",
    },
    {
      name: "Barre Fit",
      tag: null,
      detail:
        "Inspiré du ballet. Micro-mouvements précis qui sculptent et tonifient avec grâce.",
    },
    {
      name: "Cardio Zumba",
      tag: "Fun",
      detail:
        "Se défouler, vraiment. Cardio déguisé en célébration — rythmes, chaleur, énergie.",
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
    fetch("/api/site-content?section=disciplines_visibility")
      .then(r => r.json())
      .then(data => {
        if (data?.content) {
          const vis = data.content as any;
          const list = vis[context];
          if (Array.isArray(list) && list.length > 0) setVisibleTabs(list);
        }
      })
      .catch(() => {});
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
    <section id="cours" className="min-h-screen overflow-hidden bg-background flex flex-col">
      {/* Header */}
      <div className="relative py-20 px-6 text-center overflow-hidden flex-shrink-0">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, hsl(var(--stone)/0.06) 0%, transparent 65%)" }}
        />
        <div className="absolute bottom-0 right-0 translate-x-1/4 translate-y-1/3 pointer-events-none" style={{ opacity: 0.12 }}>
          <SpineWatermark size={380} opacity={0.06} />
        </div>

        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <p className="brand-label justify-center mb-6">
            Nos disciplines
          </p>
          <h2
            className="font-display text-foreground"
            style={{ fontSize: "clamp(36px, 6vw, 76px)", fontWeight: 400, letterSpacing: "0.02em", lineHeight: 1.1 }}
          >
            Les{" "}
            <em className="italic" style={{ fontStyle: "italic", fontWeight: 300 }}>Cours</em>
          </h2>
          <p className="font-body text-foreground/50 mt-6 max-w-sm mx-auto leading-[1.95]" style={{ fontWeight: 300, fontSize: "14px" }}>
            Une pratique pour chaque corps, chaque intention — choisissez ce qui vous correspond.
          </p>
        </motion.div>
      </div>

      {/* Tab navigation */}
      <div className="relative flex-shrink-0 px-4">
        <div className="absolute top-0 left-0 right-0 h-px bg-border" />
        <div className="overflow-x-auto scrollbar-none">
          <div className="flex gap-0 min-w-max mx-auto justify-center">
            {filteredTabs.map((tab) => {
              const isActive = tab.id === activeTab;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className="relative px-6 py-4 font-body text-[10px] tracking-[0.22em] uppercase transition-colors whitespace-nowrap flex-shrink-0"
                  style={{
                    fontWeight: isActive ? 500 : 400,
                    color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))",
                  }}
                >
                  {tab.label}
                  {isActive && (
                    <motion.div
                      layoutId="tab-underline"
                      className="absolute bottom-0 left-6 right-6 h-px bg-foreground"
                      transition={{ type: "spring", stiffness: 380, damping: 36 }}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-px bg-border" />
      </div>

      {/* Course cards */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 md:py-16">
        <div className="container mx-auto max-w-5xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-px bg-border"
            >
              {courses.map((course, cIdx) => (
                <motion.div
                  key={course.name}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: cIdx * 0.06, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="group relative p-8 bg-background cursor-default transition-all hover:bg-secondary/30"
                >
                  {course.tag && (
                    <span
                      className="inline-block font-body text-[9px] tracking-[0.25em] uppercase text-foreground/40 border border-foreground/15 px-2.5 py-1 mb-5"
                      style={{ fontWeight: 500 }}
                    >
                      {course.tag}
                    </span>
                  )}
                  {!course.tag && <div className="mb-5 h-[26px]" />}

                  <h4
                    className="font-display text-foreground mb-4 group-hover:opacity-70 transition-opacity"
                    style={{ fontSize: "clamp(18px, 2.2vw, 24px)", fontWeight: 400, letterSpacing: "0.02em", lineHeight: 1.2 }}
                  >
                    {course.name}
                  </h4>

                  <p className="font-body text-foreground/50 leading-[1.9]" style={{ fontWeight: 300, fontSize: "13px" }}>
                    {course.detail}
                  </p>

                  <div className="absolute bottom-0 left-0 h-px w-0 bg-foreground group-hover:w-full transition-all duration-500" />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* CTA */}
      <div className="relative py-12 text-center flex-shrink-0">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 100%, hsl(var(--secondary)) 0%, transparent 60%)" }} />
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 flex flex-col items-center gap-5"
        >
          <p className="font-body text-foreground/40 text-[10px] tracking-[0.3em] uppercase" style={{ fontWeight: 400 }}>
            Prêt·e à commencer ?
          </p>
          <button
            onClick={onBookClick}
            className="inline-flex items-center gap-3 bg-foreground hover:bg-foreground/80 text-background px-10 py-4 font-body text-[10px] tracking-[0.3em] uppercase transition-all"
            style={{ fontWeight: 500 }}
          >
            Réserver une séance →
          </button>
        </motion.div>
      </div>
    </section>
  );
};

export default ClassesSection;
