import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import EvolvWordmark from "./brand/EvolvWordmark";
import ParticleCanvas from "./brand/ParticleCanvas";
import { useSiteContent } from "@/hooks/useSiteContent";
import { ChevronDown } from "lucide-react";

interface HeroSectionProps {
  onBookClick: () => void;
  burgundyBackground?: boolean;
}

const HeroSection = ({ onBookClick }: HeroSectionProps) => {
  const content = useSiteContent("hero", {
    tagline: "Reformer Pilates",
    location: "Casablanca",
  });

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const markYRaw   = useTransform(scrollYProgress, [0, 1], [0, 180]);
  const markY      = useSpring(markYRaw, { stiffness: 45, damping: 22, mass: 2 });
  const markScale  = useTransform(scrollYProgress, [0, 0.4, 1], [1, 1.04, 0.92]);
  const markOp     = useTransform(scrollYProgress, [0, 0.7, 1], [1, 0.4, 0]);
  const textY      = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const [wordmarkSize, setWordmarkSize] = useState(88);
  useEffect(() => {
    const update = () => {
      const w = window.innerWidth;
      // clamp: 56px on mobile → 112px on desktop
      setWordmarkSize(Math.max(56, Math.min(112, w * 0.085)));
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0c0c0c 0%, #191919 55%, #101010 100%)" }}
    >
      <ParticleCanvas />

      {/* Ambient rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[360, 560, 760].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: r, height: r,
              border: "1px solid rgba(242,239,233,0.035)",
              animation: `divider-spin ${50 + i * 16}s linear infinite ${i % 2 ? "reverse" : ""}`,
            }}
          />
        ))}
      </div>

      {/* ── MAIN HERO MARK — EvolvWordmark centered ─────────── */}
      <motion.div
        className="absolute inset-0 flex items-center justify-center pointer-events-none"
        style={{ y: markY, scale: markScale, opacity: markOp }}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
        >
          <EvolvWordmark
            color="rgba(242,239,233,0.92)"
            subColor="rgba(242,239,233,0.38)"
            fontSize={wordmarkSize}
            animate
          />
        </motion.div>
      </motion.div>

      {/* ── BOTTOM TEXT BLOCK ────────────────────────────────── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 mt-auto pt-[68vh]">

        {/* Location pill */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.2, duration: 0.9 }}
          className="uppercase mb-8"
          style={{
            fontSize: "clamp(8px, 1vw, 10px)",
            fontWeight: 400,
            letterSpacing: "0.38em",
            color: "rgba(242,239,233,0.28)",
            fontFamily: "'DM Sans', Inter, sans-serif",
          }}
        >
          {content.location as string}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.5, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-col sm:flex-row gap-3"
          style={{ y: textY }}
        >
          <Link
            to="/planning"
            className="relative overflow-hidden bg-white text-foreground px-10 py-4 text-[10px] tracking-[0.3em] uppercase hover:bg-white/90 transition-all btn-shimmer"
            style={{ fontWeight: 500, fontFamily: "'DM Sans', Inter, sans-serif" }}
          >
            <span className="relative z-10">Réserver une séance</span>
          </Link>
          <Link
            to="/mon-pack"
            className="border border-white/20 text-white/70 px-10 py-4 text-[10px] tracking-[0.3em] uppercase hover:border-white/45 hover:text-white transition-all"
            style={{ fontWeight: 400, fontFamily: "'DM Sans', Inter, sans-serif" }}
          >
            Mon Abonnement
          </Link>
          <Link
            to="/studio"
            className="border border-white/10 text-white/35 px-10 py-4 text-[10px] tracking-[0.3em] uppercase hover:border-white/22 hover:text-white/55 transition-all"
            style={{ fontWeight: 400, fontFamily: "'DM Sans', Inter, sans-serif" }}
          >
            Le Studio
          </Link>
        </motion.div>

        {/* Scroll line */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4.2, duration: 1 }}
          className="mt-12 mb-10 flex flex-col items-center gap-2"
        >
          <div className="w-px h-14 overflow-hidden">
            <div
              className="w-full h-full scroll-line origin-top"
              style={{ background: "linear-gradient(to bottom, rgba(242,239,233,0.35), transparent)" }}
            />
          </div>
          <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={13} style={{ color: "rgba(242,239,233,0.22)" }} />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
