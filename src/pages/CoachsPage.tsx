import { useState, useEffect, useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import MeridianLogo from "@/components/brand/MeridianLogo";
import PageBackgroundMeridian from "@/components/brand/PageBackgroundMeridian";
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
    bio: "Enseignant le Pilates depuis 2018, Andy est certifié en Pilates Matwork et Reformer. Il propose des séances structurées, adaptées à tous les niveaux, visant à renforcer le corps en profondeur, améliorer la posture et développer une meilleure conscience corporelle. Passionné par le mouvement et le bien-être, il accompagne chaque élève avec exigence, bienveillance et professionnalisme.",
    photo: coachAndy,
    specialties: ["Reformer", "Jumpboard", "Pilates Matwork"],
    instagram: null,
    is_featured: true,
  },
  {
    id: "2",
    name: "Mayssae",
    role: "Mat Pilates · Post-natal · Maman & Bébé · Danse & Zumba",
    bio: "Professionnelle polyvalente, Mayssae est une fusion entre l'art de la danse classique (diplômée, 15 ans de pratique) et la science du conditionnement physique. Forte de 12 années d'expérience en bien-être et fitness, certifiée en Pilates, Personal Training, Fitness et Zumba, elle accompagne les femmes avec élégance et bienveillance — flexible, précise et adaptée à chaque âge et chaque niveau.",
    photo: coachMayssae,
    specialties: ["Mat Pilates", "Post-natal", "Maman & Bébé", "Barre Fit", "Zumba"],
    instagram: null,
  },
  {
    id: "3",
    name: "Yasmine",
    role: "Reformer Pilates",
    bio: "Animée par le bien-être, Yasmine a découvert le Pilates en 2020 à Londres et ne s'en est plus séparée. Formée à Londres 5 ans plus tard, elle enseigne avec douceur et pédagogie. Installée à Rabat depuis 1 an, elle accompagne ses élèves avec passion sur reformer.",
    photo: null,
    specialties: ["Reformer", "Pilates Reformer"],
    instagram: null,
  },
  {
    id: "4",
    name: "Narjiss",
    role: "Yoga · Vinyasa · Hatha · Power Yoga",
    bio: "Professeure de yoga certifiée 200h, formée à Bali, Narjiss propose une approche dynamique et accessible qui combine mouvement, respiration et mobilité. Ses cours — vinyasa, hatha, power yoga, ainsi que des pratiques axées sur la flexibilité et le renforcement — sont adaptés à tous les niveaux.",
    photo: null,
    specialties: ["Vinyasa", "Hatha", "Power Yoga", "Yoga Slow Flow"],
    instagram: null,
  },
];

// Parallax photo wrapper
const ParallaxPhoto = ({ src, name, idx }: { src: string | null; name: string; idx: number }) => {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
  const y = useTransform(scrollYProgress, [0, 1], ["-8%", "8%"]);

  return (
    <div ref={ref} className="relative overflow-hidden" style={{ borderRadius: "1px", aspectRatio: "3/4" }}>
      {src ? (
        <motion.div className="absolute inset-0 scale-110" style={{ y }}>
          <img src={src} alt={`Coach ${name}`} className="w-full h-full object-cover" loading="lazy" />
        </motion.div>
      ) : (
        // Atmospheric placeholder for coaches without photo
        <div
          className="w-full h-full flex flex-col items-center justify-center relative"
          style={{
            background: idx % 2 === 0
              ? "linear-gradient(145deg, hsl(var(--muted)) 0%, hsl(var(--card)) 50%, hsl(var(--secondary)) 100%)"
              : "linear-gradient(145deg, hsl(var(--secondary)) 0%, hsl(var(--card)) 50%, hsl(var(--muted)) 100%)",
          }}
        >
          <div style={{ opacity: 0.32 }}>
            <MeridianLogo size={260} variant="theme" animate spinDuration={60} />
          </div>
          <span
            className="absolute font-display text-terra/15 select-none"
            style={{ fontWeight: 200, fontSize: "clamp(80px, 14vw, 140px)", top: "50%", left: "50%", transform: "translate(-50%, -50%)", lineHeight: 1 }}
          >
            {name[0]}
          </span>
        </div>
      )}
    </div>
  );
};

// Individual coach section
const CoachBlock = ({ coach, idx }: { coach: Coach; idx: number }) => {
  const isEven = idx % 2 === 0;
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start 0.85", "start 0.2"] });
  const opacity = useTransform(scrollYProgress, [0, 1], [0, 1]);
  const x = useTransform(scrollYProgress, [0, 1], [isEven ? -32 : 32, 0]);

  return (
    <motion.div
      ref={ref}
      style={{ opacity, x }}
      className={`grid md:grid-cols-2 gap-0 min-h-[70vh]`}
    >
      {/* Photo — left on even, right on odd */}
      <div className={`${isEven ? "md:order-1" : "md:order-2"} relative`}>
        <ParallaxPhoto src={coach.photo} name={coach.name} idx={idx} />
        {/* Index number — overlapping corner */}
        <div className={`absolute top-6 ${isEven ? "right-6" : "left-6"} z-10`}>
          <span
            className="font-display text-foreground/[0.08] select-none"
            style={{ fontSize: "clamp(60px, 10vw, 120px)", fontWeight: 200, lineHeight: 1 }}
          >
            0{idx + 1}
          </span>
        </div>
      </div>

      {/* Content */}
      <div
        className={`${isEven ? "md:order-2" : "md:order-1"} flex flex-col justify-center px-10 md:px-16 py-16 relative overflow-hidden`}
        style={{ background: isEven ? "hsl(var(--card))" : "hsl(var(--secondary))" }}
      >
        {/* Role */}
        <p
          className="font-body text-[11px] tracking-[0.35em] uppercase text-terra mb-6 relative z-10"
          style={{ fontWeight: 500 }}
        >
          {coach.role}
        </p>

        {/* Name */}
        <h2
          className="font-display text-foreground mb-4 relative z-10"
          style={{
            fontSize: "clamp(42px, 7vw, 88px)",
            fontWeight: 200,
            letterSpacing: "0.06em",
            lineHeight: 0.95,
          }}
        >
          {coach.name}
          {coach.is_featured && (
            <span className="ml-4 font-body text-[10px] tracking-[0.2em] uppercase text-terra align-middle" style={{ fontSize: "11px", fontWeight: 400 }}>
              ★ Vedette
            </span>
          )}
        </h2>

        {/* Divider */}
        <motion.div
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="h-px bg-terra origin-left mb-8 relative z-10"
          style={{ width: "48px" }}
        />

        {/* Bio */}
        <p
          className="font-body text-foreground leading-[1.9] mb-8 relative z-10"
          style={{ fontWeight: 400, fontSize: "14px", maxWidth: "440px" }}
        >
          {coach.bio}
        </p>

        {/* Specialties */}
        {coach.specialties.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6 relative z-10">
            {coach.specialties.map((s) => (
              <span
                key={s}
                className="font-body text-[10px] tracking-[0.18em] uppercase text-terra border border-terra/40 px-3 py-1.5"
                style={{ fontWeight: 500, borderRadius: "2px" }}
              >
                {s}
              </span>
            ))}
          </div>
        )}

        {/* Instagram */}
        {coach.instagram && (
          <a
            href={`https://instagram.com/${coach.instagram}`}
            target="_blank"
            rel="noopener noreferrer"
            className="relative z-10 font-body text-[11px] tracking-[0.2em] uppercase text-terra hover:text-terra-dark transition-colors inline-block"
            style={{ fontWeight: 500 }}
          >
            ↗ @{coach.instagram}
          </a>
        )}
      </div>
    </motion.div>
  );
};

const CoachsPage = () => {
  const [coaches, setCoaches] = useState<Coach[]>([]);
  const [loading, setLoading] = useState(true);

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

  return (
    <main className="bg-background min-h-screen overflow-x-hidden">
      <PageBackgroundMeridian />
      <Navbar onBookClick={() => {}} />

      {/* ── Hero intro ────────────────────────────────────────────────── */}
      <section className="relative min-h-[70vh] flex flex-col items-center justify-center px-6 overflow-hidden">
        {/* Warm espresso background */}
        <div className="absolute inset-0 bg-background" />
        {/* Hero meridian — decorative, behind title */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ opacity: 0.07 }}>
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 120, repeat: Infinity, ease: "linear" }}
          >
            <MeridianLogo size={520} variant="theme" animate={false} />
          </motion.div>
        </div>
        {/* Terra radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(184,99,74,0.12) 0%, rgba(212,168,85,0.04) 35%, transparent 65%)" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 32 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 text-center"
        >
          <p
            className="font-body text-[11px] tracking-[0.45em] uppercase text-terra mb-8"
            style={{ fontWeight: 500 }}
          >
            L'équipe
          </p>
          <h1
            className="font-display text-foreground mb-8"
            style={{
              fontSize: "clamp(52px, 10vw, 120px)",
              fontWeight: 200,
              letterSpacing: "0.08em",
              lineHeight: 0.95,
            }}
          >
            Vos{" "}
            <em className="italic text-terra">Coachs</em>
          </h1>
          <p
            className="font-body text-foreground/80 max-w-md mx-auto leading-[1.9]"
            style={{ fontWeight: 400, fontSize: "15px" }}
          >
            Des professionnels certifiés, passionnés par le mouvement
            et dévoués à votre progression.
          </p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 6, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-12 bg-gradient-to-b from-terra/50 to-transparent"
          />
        </motion.div>
      </section>

      {/* ── Coach blocks ─────────────────────────────────────────────── */}
      {loading ? (
        <div className="py-32 text-center">
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            className="inline-block"
          >
            <MeridianLogo size={40} variant="theme" />
          </motion.div>
        </div>
      ) : (
        <div>
          {coaches.map((coach, idx) => (
            <CoachBlock key={coach.id} coach={coach} idx={idx} />
          ))}
        </div>
      )}

      {/* ── Bottom CTA ───────────────────────────────────────────────── */}
      <section
        className="py-32 px-6 text-center relative overflow-hidden bg-card"
      >
        {/* Terra radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(184,99,74,0.09) 0%, transparent 60%)" }}
        />
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10"
        >
          <p
            className="font-body text-[11px] tracking-[0.4em] uppercase text-terra mb-6"
            style={{ fontWeight: 500 }}
          >
            Prêt·e à commencer ?
          </p>
          <h2
            className="font-display text-foreground mb-10"
            style={{ fontSize: "clamp(32px, 5vw, 64px)", fontWeight: 200, letterSpacing: "0.1em" }}
          >
            Réservez votre <em className="italic text-terra">première séance</em>
          </h2>
          <a
            href="/planning"
            className="inline-flex items-center gap-3 bg-terra text-warm-white px-10 py-4 rounded-full font-body text-[11px] tracking-[0.3em] uppercase hover:bg-terra-dark transition-all"
            style={{ fontWeight: 500 }}
          >
            Voir le planning →
          </a>
        </motion.div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
};

export default CoachsPage;
