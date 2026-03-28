import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import VertebraLogo from "@/components/brand/VertebraLogo";
import { ArrowRight } from "lucide-react";
import coachAndy from "@/assets/coach-andy.jpg";
import coachMayssae from "@/assets/coach-mayssae.jpg";

interface Coach {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string | null;
  specialties: string[];
  instagram: string | null;
  is_featured?: boolean;
}

const fallbackCoaches: Coach[] = [
  {
    id: "1",
    name: "Andy",
    role: "Reformer · Pilates Matwork & Reformer",
    bio: "Enseignant le Pilates depuis 2018, Andy est certifié en Pilates Matwork et Reformer. Il propose des séances structurées, adaptées à tous les niveaux, visant à renforcer le corps en profondeur, améliorer la posture et développer une meilleure conscience corporelle.",
    photo: coachAndy,
    specialties: ["Reformer", "Jumpboard", "Pilates Matwork"],
    instagram: null,
    is_featured: true,
  },
  {
    id: "2",
    name: "Mayssae",
    role: "Mat Pilates · Post-natal · Maman & Bébé · Danse & Zumba",
    bio: "Professionnelle polyvalente, Mayssae est une fusion entre l'art de la danse classique (diplômée, 15 ans de pratique) et la science du conditionnement physique. Forte de 12 années d'expérience en bien-être et fitness, certifiée en Pilates, Personal Training, Fitness et Zumba.",
    photo: coachMayssae,
    specialties: ["Mat Pilates", "Post-natal", "Maman & Bébé", "Barre Fit", "Zumba"],
    instagram: null,
  },
  {
    id: "3",
    name: "Yasmine",
    role: "Reformer Pilates",
    bio: "Animée par le bien-être, Yasmine a découvert le Pilates en 2020 à Londres. Formée 5 ans plus tard, elle enseigne avec douceur et pédagogie sur reformer. Installée à Rabat depuis 1 an, elle accompagne ses élèves avec passion.",
    photo: null,
    specialties: ["Reformer", "Pilates Reformer"],
    instagram: null,
  },
  {
    id: "4",
    name: "Narjiss",
    role: "Yoga · Vinyasa · Hatha · Power Yoga",
    bio: "Professeure de yoga certifiée 200h, formée à Bali, Narjiss propose une approche dynamique qui combine mouvement, respiration et mobilité. Ses cours sont adaptés à tous les niveaux.",
    photo: null,
    specialties: ["Vinyasa", "Hatha", "Power Yoga", "Yoga Slow Flow"],
    instagram: null,
  },
];

const CoachCard = ({ coach, onClick, isActive }: { coach: Coach; onClick: () => void; isActive: boolean }) => (
  <motion.button
    onClick={onClick}
    whileHover={{ y: -2 }}
    transition={{ duration: 0.25 }}
    className={`text-left border transition-all duration-200 group ${isActive ? "border-foreground bg-card" : "border-border bg-background hover:border-foreground/40 hover:bg-card"}`}
  >
    {/* Photo */}
    <div className="aspect-[3/4] overflow-hidden bg-secondary relative">
      {coach.photo ? (
        <img src={coach.photo} alt={`Coach ${coach.name}`} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" loading="lazy" />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-card">
          <span className="font-display text-foreground/20 select-none" style={{ fontSize: "clamp(60px, 8vw, 100px)", fontWeight: 400 }}>
            {coach.name[0]}
          </span>
        </div>
      )}
      {coach.is_featured && (
        <div className="absolute top-3 left-3">
          <span className="font-body text-[8px] tracking-[0.2em] uppercase bg-terra text-white px-2 py-1" style={{ fontWeight: 500 }}>
            Vedette
          </span>
        </div>
      )}
    </div>
    {/* Info */}
    <div className="p-5">
      <h3 className="font-display text-foreground mb-1" style={{ fontSize: "clamp(20px, 2.5vw, 26px)", fontWeight: 400, letterSpacing: "0.02em" }}>
        {coach.name}
      </h3>
      <p className="font-body text-muted-foreground text-[10px] tracking-[0.2em] uppercase" style={{ fontWeight: 400 }}>
        {coach.role.split(" · ")[0]}
      </p>
    </div>
  </motion.button>
);

const CoachsPage = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    api.coaches.list().then((data) => {
      const list = data && data.length > 0 ? (data as Coach[]) : fallbackCoaches;
      setCoaches(list);
      setActive(list[0]?.id || null);
      setLoading(false);
    }).catch(() => {
      setCoaches(fallbackCoaches);
      setActive(fallbackCoaches[0]?.id || null);
      setLoading(false);
    });
  }, []);

  const activeCoach = coaches.find((c) => c.id === active) || null;

  return (
    <main className="bg-background min-h-screen overflow-x-hidden">
      <Navbar onBookClick={() => {}} />

      {/* ═══ HERO ══════════════════════════════════════════════════════════ */}
      <section className="pt-28 pb-16 px-6 border-b border-border">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <p className="brand-label mb-6">L'équipe</p>
            <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4">
              <h1 className="font-display text-foreground" style={{ fontSize: "clamp(42px, 8vw, 96px)", fontWeight: 400, letterSpacing: "0.02em", lineHeight: 0.95 }}>
                Vos{" "}
                <em className="italic" style={{ fontWeight: 300 }}>Coachs</em>
              </h1>
              <p className="font-body text-muted-foreground max-w-xs leading-[1.8] pb-1" style={{ fontWeight: 300, fontSize: "13px" }}>
                Des professionnels certifiés, passionnés par le mouvement et dévoués à votre progression.
              </p>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ═══ ROSTER GRID + DETAIL ══════════════════════════════════════════ */}
      {loading ? (
        <div className="py-32 flex justify-center">
          <motion.div animate={{ rotate: 360 }} transition={{ duration: 3, repeat: Infinity, ease: "linear" }}>
            <VertebraLogo size={36} variant="theme" animate showWordmark={false} />
          </motion.div>
        </div>
      ) : (
        <section className="px-6 py-12">
          <div className="container mx-auto max-w-5xl">
            <div className="grid md:grid-cols-[1fr_1px_1.8fr] gap-0">
              {/* Coach card grid */}
              <div className="grid grid-cols-2 gap-0 border border-border content-start">
                {coaches.map((coach, i) => (
                  <motion.div
                    key={coach.id}
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: i * 0.08, duration: 0.6 }}
                    className="border-r border-b border-border last-row:border-b-0 odd:border-r"
                  >
                    <CoachCard coach={coach} onClick={() => setActive(coach.id)} isActive={active === coach.id} />
                  </motion.div>
                ))}
              </div>

              {/* Vertical divider */}
              <div className="hidden md:block bg-border" />

              {/* Detail panel */}
              <div className="hidden md:flex flex-col border border-border border-l-0">
                <AnimatePresence mode="wait">
                  {activeCoach && (
                    <motion.div
                      key={activeCoach.id}
                      initial={{ opacity: 0, x: 16 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.35 }}
                      className="flex flex-col h-full"
                    >
                      {/* Photo banner */}
                      {activeCoach.photo && (
                        <div className="h-64 overflow-hidden">
                          <img src={activeCoach.photo} alt={activeCoach.name} className="w-full h-full object-cover object-top" />
                        </div>
                      )}
                      <div className="flex-1 p-10">
                        {/* Role */}
                        <p className="font-body text-[10px] tracking-[0.35em] uppercase text-terra mb-4" style={{ fontWeight: 500 }}>
                          {activeCoach.role}
                        </p>
                        {/* Name */}
                        <h2 className="font-display text-foreground mb-6" style={{ fontSize: "clamp(32px, 4vw, 52px)", fontWeight: 400, letterSpacing: "0.02em", lineHeight: 1 }}>
                          {activeCoach.name}
                        </h2>
                        <div className="w-8 h-px bg-terra mb-7" />
                        {/* Bio */}
                        <p className="font-body text-foreground/75 leading-[1.9] mb-8" style={{ fontWeight: 300, fontSize: "14px", maxWidth: "440px" }}>
                          {activeCoach.bio}
                        </p>
                        {/* Specialties */}
                        {activeCoach.specialties.length > 0 && (
                          <div className="flex flex-wrap gap-2 mb-6">
                            {activeCoach.specialties.map((s) => (
                              <span key={s} className="font-body text-[9px] tracking-[0.2em] uppercase border border-terra/40 text-terra px-3 py-1.5" style={{ fontWeight: 500 }}>
                                {s}
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Instagram */}
                        {activeCoach.instagram && (
                          <a href={`https://instagram.com/${activeCoach.instagram}`} target="_blank" rel="noopener noreferrer" className="font-body text-[11px] tracking-[0.2em] uppercase text-terra hover:text-foreground transition-colors" style={{ fontWeight: 500 }}>
                            ↗ @{activeCoach.instagram}
                          </a>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Mobile: full bio below grid */}
            <AnimatePresence mode="wait">
              {activeCoach && (
                <motion.div
                  key={`mobile-${activeCoach.id}`}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                  className="md:hidden mt-0 border border-border border-t-0 p-8"
                >
                  <p className="font-body text-[10px] tracking-[0.35em] uppercase text-terra mb-3" style={{ fontWeight: 500 }}>
                    {activeCoach.role}
                  </p>
                  <h2 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(28px, 6vw, 44px)", fontWeight: 400 }}>
                    {activeCoach.name}
                  </h2>
                  <div className="w-8 h-px bg-terra mb-6" />
                  <p className="font-body text-foreground/75 leading-[1.9] mb-6" style={{ fontWeight: 300, fontSize: "14px" }}>
                    {activeCoach.bio}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {activeCoach.specialties.map((s) => (
                      <span key={s} className="font-body text-[9px] tracking-[0.2em] uppercase border border-terra/40 text-terra px-3 py-1.5" style={{ fontWeight: 500 }}>
                        {s}
                      </span>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      )}

      {/* ═══ CTA ═══════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 border-t border-border bg-card">
        <div className="container mx-auto max-w-5xl flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div>
            <p className="brand-label mb-4">Prêt·e à commencer ?</p>
            <h2 className="font-display text-foreground" style={{ fontSize: "clamp(26px, 4vw, 48px)", fontWeight: 400, letterSpacing: "0.02em" }}>
              Réservez votre{" "}
              <em className="italic" style={{ fontWeight: 300 }}>première séance</em>
            </h2>
          </div>
          <a
            href="/planning"
            className="inline-flex items-center gap-3 bg-terra text-white font-body text-[11px] tracking-[0.28em] uppercase px-8 py-4 transition-all hover:bg-foreground shrink-0 group"
            style={{ fontWeight: 500 }}
          >
            Voir le planning
            <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
          </a>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
};

export default CoachsPage;
