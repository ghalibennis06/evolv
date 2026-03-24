import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import MeridianLogo from "@/components/brand/MeridianLogo";
import { Link } from "react-router-dom";
import coachAndy from "@/assets/coach-andy.jpg";
import coachMayssae from "@/assets/coach-mayssae.jpg";

interface Coach {
  id: string;
  name: string;
  role: string;
  bio: string;
  photo: string | null;
  specialties: string[];
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
    is_featured: true,
  },
  {
    id: "2",
    name: "Mayssae",
    role: "Mat Pilates · Post-natal · Maman & Bébé · Zumba",
    bio: "Fusion entre l'art de la danse classique (15 ans de pratique) et la science du conditionnement physique. 12 ans d'expérience en bien-être et fitness, certifiée Pilates, Personal Training et Zumba — elle accompagne les femmes avec élégance et bienveillance.",
    photo: coachMayssae,
    specialties: ["Mat Pilates", "Post-natal", "Maman & Bébé", "Barre Fit", "Zumba"],
  },
  {
    id: "3",
    name: "Yasmine",
    role: "Reformer Pilates",
    bio: "Animée par le bien-être, Yasmine a découvert le Pilates en 2020 à Londres. Formée à Londres 5 ans plus tard, elle enseigne avec douceur et pédagogie sur reformer.",
    photo: null,
    specialties: ["Reformer", "Pilates Reformer"],
  },
  {
    id: "4",
    name: "Narjiss",
    role: "Yoga · Vinyasa · Hatha · Power Yoga",
    bio: "Professeure de yoga certifiée 200h, formée à Bali. Propose une approche dynamique combinant mouvement, respiration et mobilité — vinyasa, hatha, power yoga, adaptés à tous les niveaux.",
    photo: null,
    specialties: ["Vinyasa", "Hatha", "Power Yoga", "Yoga Slow Flow"],
  },
];

// ─── Coach row ────────────────────────────────────────────────────────────────

interface CoachRowProps {
  coach: Coach;
  idx: number;
  isActive: boolean;
  onHover: () => void;
}

const CoachRow = ({ coach, isActive, onHover }: CoachRowProps) => (
  <motion.div
    onMouseEnter={onHover}
    animate={{ opacity: isActive ? 1 : 0.45, x: isActive ? 8 : 0 }}
    transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    className="py-5 border-b border-border cursor-pointer"
  >
    <h3
      className="font-display text-3xl md:text-4xl text-foreground"
      style={{ fontWeight: 300, letterSpacing: "0.05em" }}
    >
      {coach.name}
    </h3>
    <p
      className="font-body text-[11px] tracking-[0.28em] uppercase text-terra mt-1.5"
      style={{ fontWeight: 500 }}
    >
      {coach.role}
    </p>
  </motion.div>
);

// ─── Photo panel ──────────────────────────────────────────────────────────────

interface PhotoPanelProps {
  coach: Coach;
  idx: number;
}

const PhotoPanel = ({ coach }: PhotoPanelProps) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={coach.id}
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -16 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 rounded-2xl overflow-hidden"
    >
      {coach.photo ? (
        <img
          src={coach.photo}
          alt={coach.name}
          className="w-full h-full object-cover"
        />
      ) : (
        <div className="w-full h-full bg-card flex items-center justify-center relative overflow-hidden">
          {/* Meridian — using built-in animate so the orbiting dot is alive */}
          <div style={{ opacity: 0.18, position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <MeridianLogo size={260} variant="theme" animate spinDuration={80} />
          </div>
          <span
            className="font-display text-foreground/20 select-none relative z-10"
            style={{
              fontSize: "clamp(80px, 14vw, 140px)",
              fontWeight: 200,
            }}
          >
            {coach.name[0]}
          </span>
        </div>
      )}

      {/* Bottom gradient overlay with specialty tags */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-background/80 to-transparent">
        <div className="flex flex-wrap gap-1.5">
          {(coach.specialties || []).slice(0, 3).map((s) => (
            <span
              key={s}
              className="font-body text-[9px] tracking-[0.18em] uppercase text-warm-white/70 border border-warm-white/20 px-2.5 py-1 rounded-sm"
              style={{ fontWeight: 300 }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  </AnimatePresence>
);

// ─── Main section ─────────────────────────────────────────────────────────────

const CoachesSection = () => {
  const [coaches, setCoaches] = useState<Coach[]>(fallbackCoaches);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState(0);

  useEffect(() => {
    supabase
      .from("coaches")
      .select("*")
      .eq("is_active", true)
      .order("sort_order", { ascending: true })
      .then(({ data }) => {
        setCoaches(data && data.length > 0 ? (data as Coach[]) : fallbackCoaches);
        setLoading(false);
      });
  }, []);

  const displayCoaches = coaches.slice(0, 4);

  if (loading) {
    return (
      <section
        id="coachs"
        className="min-h-screen bg-background flex items-center justify-center"
      >
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
        >
          <MeridianLogo size={48} variant="theme" />
        </motion.div>
      </section>
    );
  }

  return (
    <section
      id="coachs"
      className="min-h-screen bg-background flex items-center overflow-hidden"
    >
      <div className="container mx-auto max-w-6xl px-6 py-16 w-full">
        <div className="flex flex-col md:flex-row gap-8 md:gap-16 items-start md:items-center">

          {/* Left: coach list */}
          <div className="flex-1">
            <p
              className="font-body text-[11px] tracking-[0.45em] uppercase text-terra mb-3"
              style={{ fontWeight: 500 }}
            >
              L'Équipe
            </p>
            <h2
              className="font-display text-foreground mb-8"
              style={{
                fontSize: "clamp(40px, 6vw, 80px)",
                fontWeight: 200,
                letterSpacing: "0.06em",
              }}
            >
              Vos <em className="italic text-terra">Coachs</em>
            </h2>
            <div className="w-10 h-px bg-terra mb-8" />

            <div>
              {displayCoaches.map((coach, i) => (
                <CoachRow
                  key={coach.id}
                  coach={coach}
                  idx={i}
                  isActive={hoveredIdx === i}
                  onHover={() => setHoveredIdx(i)}
                />
              ))}
            </div>

            <Link
              to="/coachs"
              className="inline-flex items-center gap-2 mt-8 font-body text-[11px] tracking-[0.25em] uppercase text-terra hover:text-terra-dark transition-colors"
              style={{ fontWeight: 500 }}
            >
              Rencontrer l'équipe complète →
            </Link>
          </div>

          {/* Right: photo panel — hidden on mobile */}
          <div className="hidden md:block w-[380px] h-[520px] relative flex-shrink-0">
            {/* Subtle terra glow behind photo */}
            <div
              className="absolute -inset-8 rounded-full pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse, rgba(184,99,74,0.1) 0%, transparent 70%)",
              }}
            />
            <PhotoPanel coach={displayCoaches[hoveredIdx]} idx={hoveredIdx} />
          </div>

        </div>
      </div>
    </section>
  );
};

export default CoachesSection;
