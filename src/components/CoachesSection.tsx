import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { api } from "@/lib/api";
import SpineWatermark from "@/components/brand/SpineWatermark";
import VertebraLogo from "@/components/brand/VertebraLogo";
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
    bio: "Animée par le bien-être, Yasmine a découvert le Pilates en 2020 à Londres. Formée 5 ans plus tard, elle enseigne avec douceur et pédagogie sur reformer.",
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

interface CoachRowProps {
  coach: Coach;
  idx: number;
  isActive: boolean;
  onHover: () => void;
}

const CoachRow = ({ coach, isActive, onHover }: CoachRowProps) => (
  <motion.div
    onMouseEnter={onHover}
    animate={{ opacity: isActive ? 1 : 0.32, x: isActive ? 6 : 0 }}
    transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
    className="py-6 border-b border-border/50 cursor-pointer"
  >
    <h3
      className="font-display text-3xl md:text-4xl text-foreground"
      style={{ fontWeight: 400, letterSpacing: "0.02em" }}
    >
      {coach.name}
    </h3>
    <p
      className="font-body text-[10px] tracking-[0.28em] uppercase text-muted-foreground mt-2"
      style={{ fontWeight: 400 }}
    >
      {coach.role}
    </p>
  </motion.div>
);

interface PhotoPanelProps {
  coach: Coach;
  idx: number;
}

const PhotoPanel = ({ coach }: PhotoPanelProps) => (
  <AnimatePresence mode="wait">
    <motion.div
      key={coach.id}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -12 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="absolute inset-0 overflow-hidden"
    >
      {coach.photo ? (
        <img src={coach.photo} alt={coach.name} className="w-full h-full object-cover" />
      ) : (
        <div className="w-full h-full bg-secondary/30 flex items-center justify-center relative overflow-hidden">
          <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%)" }}>
            <SpineWatermark size={240} opacity={0.06} />
          </div>
          <span
            className="font-display text-foreground/15 select-none relative z-10"
            style={{ fontSize: "clamp(80px, 14vw, 130px)", fontWeight: 300 }}
          >
            {coach.name[0]}
          </span>
        </div>
      )}

      {/* Bottom gradient with specialty tags */}
      <div className="absolute bottom-0 left-0 right-0 p-5 bg-gradient-to-t from-foreground/60 to-transparent">
        <div className="flex flex-wrap gap-1.5">
          {(coach.specialties || []).slice(0, 3).map((s) => (
            <span
              key={s}
              className="font-body text-[8px] tracking-[0.2em] uppercase text-white/60 border border-white/20 px-2.5 py-1"
              style={{ fontWeight: 400 }}
            >
              {s}
            </span>
          ))}
        </div>
      </div>
    </motion.div>
  </AnimatePresence>
);

const CoachesSection = () => {
  const [coaches, setCoaches] = useState<Coach[]>(fallbackCoaches);
  const [loading, setLoading] = useState(true);
  const [hoveredIdx, setHoveredIdx] = useState(0);

  useEffect(() => {
    api.coaches.list().then((data) => {
      setCoaches(data && data.length > 0 ? (data as Coach[]) : fallbackCoaches);
      setLoading(false);
    }).catch(() => { setCoaches(fallbackCoaches); setLoading(false); });
  }, []);

  const displayCoaches = coaches.slice(0, 4);

  if (loading) {
    return (
      <section id="coachs" className="min-h-screen bg-background flex items-center justify-center">
        <motion.div animate={{ rotate: 360 }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
          <VertebraLogo size={44} variant="theme" animate showWordmark={false} />
        </motion.div>
      </section>
    );
  }

  return (
    <section id="coachs" className="min-h-screen bg-background flex items-center overflow-hidden">
      <div className="container mx-auto max-w-6xl px-6 py-16 w-full">
        <div className="flex flex-col md:flex-row gap-8 md:gap-20 items-start md:items-center">

          {/* Left: coach list */}
          <div className="flex-1">
            <p className="font-body text-[10px] tracking-[0.45em] uppercase text-muted-foreground mb-3" style={{ fontWeight: 400 }}>
              L'Équipe
            </p>
            <h2
              className="font-display text-foreground mb-10"
              style={{ fontSize: "clamp(38px, 5.5vw, 72px)", fontWeight: 400, letterSpacing: "0.02em" }}
            >
              Vos <em className="italic" style={{ fontStyle: "italic", fontWeight: 300 }}>Coachs</em>
            </h2>
            <div className="w-8 h-px bg-foreground/20 mb-10" />

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
              className="inline-flex items-center gap-2 mt-8 font-body text-[10px] tracking-[0.25em] uppercase text-foreground/50 hover:text-foreground transition-colors border-b border-foreground/20 hover:border-foreground pb-0.5"
              style={{ fontWeight: 400 }}
            >
              Rencontrer l'équipe complète →
            </Link>
          </div>

          {/* Right: photo panel */}
          <div className="hidden md:block w-[360px] h-[500px] relative flex-shrink-0">
            <PhotoPanel coach={displayCoaches[hoveredIdx]} idx={hoveredIdx} />
          </div>

        </div>
      </div>
    </section>
  );
};

export default CoachesSection;
