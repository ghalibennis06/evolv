import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface ClassesSectionProps {
  onBookClick: () => void;
  context?: "index" | "studio";
}

const tabs = [
  { id: "reformer", label: "Reformer" },
  { id: "springwall", label: "Springwall" },
  { id: "yoga", label: "Yoga" },
  { id: "fitness", label: "Mat & Fitness" },
  { id: "maternite", label: "Maternité" },
] as const;

type TabId = (typeof tabs)[number]["id"];

interface Course {
  name: string;
  tag: string | null;
  detail: string;
}

const disciplineData: Record<TabId, Course[]> = {
  reformer: [
    { name: "Reformer Signature", tag: "Signature", detail: "Corps entier en 55 minutes. Renforcement profond, posture corrigée, silhouette redessinée — guidé par votre coach, en groupe intimiste de 6." },
    { name: "Reformer Jumpboard", tag: "Cardio", detail: "Intensité cardio sans impact articulaire. Endurance, force, brûlure — sur une machine qui absorbe l'impact à votre place." },
  ],
  springwall: [
    { name: "Reformer + Springwall Combo", tag: "Complet", detail: "Bas du corps au Reformer, haut du corps au Springwall. La séance la plus complète du studio EVØLV." },
  ],
  yoga: [
    { name: "Vinyasa Yoga", tag: "Flow", detail: "Fluidité et force. Chaque mouvement suit votre souffle — un yoga qui renforce autant qu'il libère." },
    { name: "Hatha Yoga", tag: "Équilibre", detail: "Postures tenues, respiration consciente. Le yoga dans son essence — pour ancrer, assouplir, recentrer." },
    { name: "Power Yoga", tag: "Intensif", detail: "Yoga athlétique. Séquences intenses pour bâtir force, endurance et concentration." },
  ],
  fitness: [
    { name: "Mat Pilates", tag: null, detail: "La puissance au sol. Développez votre centre de force — contrôle, respiration, muscles profonds." },
    { name: "Barre Fit", tag: null, detail: "Inspiré du ballet. Micro-mouvements précis qui sculptent et tonifient avec grâce." },
    { name: "Cardio Zumba", tag: "Fun", detail: "Se défouler, vraiment. Cardio déguisé en célébration — rythmes, chaleur, énergie." },
  ],
  maternite: [
    { name: "Post-natal", tag: "Maman", detail: "Retrouvez votre corps à votre rythme. Périnée, abdominaux profonds, bien-être global — accompagnée avec expertise." },
    { name: "Maman & Bébé", tag: "Duo", detail: "Une heure pour vous deux. Votre bébé participe, vous vous reconnectez à votre corps." },
  ],
};

const ClassesSection = ({ onBookClick, context = "index" }: ClassesSectionProps) => {
  const [activeTab, setActiveTab] = useState<TabId>("reformer");
  const [visibleTabs, setVisibleTabs] = useState<string[]>(tabs.map((t) => t.id));

  useEffect(() => {
    fetch("/api/site-content?section=disciplines_visibility")
      .then((r) => r.json())
      .then((data) => {
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
    <section id="cours" className="bg-background border-t border-border">
      {/* Header */}
      <div className="py-16 px-6 border-b border-border">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 18 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }}>
            <p className="brand-label mb-5">Nos disciplines</p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <h2 className="font-display text-foreground" style={{ fontSize: "clamp(32px, 5.5vw, 64px)", fontWeight: 400, letterSpacing: "0.02em", lineHeight: 1.05 }}>
                Les{" "}
                <em className="italic" style={{ fontWeight: 300 }}>Cours</em>
              </h2>
              <p className="font-body text-muted-foreground max-w-xs leading-[1.8]" style={{ fontWeight: 300, fontSize: "13px" }}>
                Une pratique pour chaque corps — choisissez ce qui vous correspond.
              </p>
            </div>
          </motion.div>
        </div>
      </div>

      {/* Tab bar */}
      <div className="border-b border-border bg-card">
        <div className="container mx-auto max-w-5xl px-6">
          <div className="overflow-x-auto scrollbar-none">
            <div className="flex min-w-max">
              {filteredTabs.map((tab) => {
                const isActive = tab.id === activeTab;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className="relative px-6 py-4 font-body text-[10px] tracking-[0.22em] uppercase transition-colors whitespace-nowrap"
                    style={{ fontWeight: isActive ? 500 : 400, color: isActive ? "hsl(var(--foreground))" : "hsl(var(--muted-foreground))" }}
                  >
                    {tab.label}
                    {isActive && (
                      <motion.div
                        layoutId="tab-underline"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-terra"
                        transition={{ type: "spring", stiffness: 400, damping: 38 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Course cards */}
      <div className="px-6 py-12">
        <div className="container mx-auto max-w-5xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.35 }}
              className="grid sm:grid-cols-2 lg:grid-cols-3 gap-0 border border-border"
            >
              {courses.map((course, cIdx) => (
                <motion.div
                  key={course.name}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: cIdx * 0.05, duration: 0.5 }}
                  className="relative p-8 border-r border-b border-border last:border-r-0 bg-background hover:bg-card transition-colors duration-200 group"
                >
                  {course.tag ? (
                    <span className="inline-block font-body text-[9px] tracking-[0.25em] uppercase bg-terra/10 text-terra px-2.5 py-1 mb-5" style={{ fontWeight: 500 }}>
                      {course.tag}
                    </span>
                  ) : (
                    <div className="mb-5 h-[26px]" />
                  )}
                  <h4 className="font-display text-foreground mb-3" style={{ fontSize: "clamp(17px, 2vw, 22px)", fontWeight: 400, letterSpacing: "0.01em", lineHeight: 1.2 }}>
                    {course.name}
                  </h4>
                  <p className="font-body text-foreground/65 leading-[1.85]" style={{ fontWeight: 300, fontSize: "13px" }}>
                    {course.detail}
                  </p>
                  <div className="absolute bottom-0 left-0 h-px w-0 bg-terra group-hover:w-full transition-all duration-400" />
                </motion.div>
              ))}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>

      {/* CTA */}
      <div className="px-6 pb-14 pt-2 border-t border-border">
        <div className="container mx-auto max-w-5xl flex flex-col sm:flex-row items-center justify-between gap-6">
          <p className="font-body text-muted-foreground text-[11px] tracking-[0.2em] uppercase" style={{ fontWeight: 400 }}>
            Prêt·e à commencer ?
          </p>
          <button
            onClick={onBookClick}
            className="inline-flex items-center gap-3 bg-foreground hover:bg-foreground/80 text-background px-10 py-3.5 font-body text-[10px] tracking-[0.28em] uppercase transition-all"
            style={{ fontWeight: 500 }}
          >
            Réserver une séance →
          </button>
        </div>
      </div>
    </section>
  );
};

export default ClassesSection;
