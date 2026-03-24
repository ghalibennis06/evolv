import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useSpring } from "framer-motion";
import { Link } from "react-router-dom";
import MeridianLogo from "./brand/MeridianLogo";
import ParticleCanvas from "./brand/ParticleCanvas";
import { useSiteContent } from "@/hooks/useSiteContent";
import { ChevronDown } from "lucide-react";

interface HeroSectionProps {
  onBookClick: () => void;
  burgundyBackground?: boolean;
}

const WORDMARK = "THE CIRCLE".split("");

const HeroSection = ({ onBookClick, burgundyBackground = false }: HeroSectionProps) => {
  const content = useSiteContent("hero", {
    tagline: "Reformer Pilates",
    location: "El Menzeh · Rabat",
  });

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  // Meridian: counter-parallax — reste en arrière quand on défile, effet de "survol"
  const logoYRaw = useTransform(scrollYProgress, [0, 1], [0, 260]);
  const logoY = useSpring(logoYRaw, { stiffness: 50, damping: 20, mass: 2 });
  const logoScale = useTransform(scrollYProgress, [0, 0.4, 1], [1, 1.08, 0.92]);
  const logoOp = useTransform(scrollYProgress, [0, 0.75, 1], [1, 0.6, 0]);

  // Texte : parallax normal, légèrement plus rapide
  const textY = useTransform(scrollYProgress, [0, 1], [0, -60]);

  const [logoSize, setLogoSize] = useState(380);
  useEffect(() => {
    const update = () => setLogoSize(Math.min(380, window.innerWidth * 0.65));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <section
      ref={ref}
      className={`relative min-h-screen flex flex-col items-center overflow-hidden ${burgundyBackground ? "" : "bg-background"}`}
      style={burgundyBackground ? { background: "linear-gradient(135deg, hsl(var(--burgundy)) 0%, #1a0a10 40%, #2D0F1A 100%)" } : undefined}
    >
      <ParticleCanvas />

      {/* ── Subtle background rings ── */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[340, 520, 700].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full border border-terra/5"
            style={{
              width: r,
              height: r,
              animation: `divider-spin ${40 + i * 12}s linear infinite ${i % 2 ? "reverse" : ""}`,
            }}
          />
        ))}
      </div>

      {/* ── Meridian : higher up, scroll-reactive + souris interactive ── */}
      <motion.div
        className="absolute inset-0 flex justify-center pointer-events-none"
        style={{ y: logoY, scale: logoScale, opacity: logoOp, paddingTop: "12vh" }}
      >
        {/* pointer-events-auto sur le logo → contrôle souris fonctionnel */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1.6, ease: [0.4, 0, 0.2, 1] }}
          className="animate-scale-breathe pointer-events-auto"
        >
          <MeridianLogo
            size={logoSize}
            variant="dark"
            animate
            floatAnimation={false}
            glowAnimation
            spinDuration={9}
          />
        </motion.div>
      </motion.div>

      {/* ── Content : text + CTAs, below the logo ── */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 mt-auto pt-[58vh]">
        {/* THE CIRCLE — lettre par lettre, bigger */}
        <motion.div style={{ y: textY }} className="flex overflow-hidden">
          {WORDMARK.map((char, i) => (
            <motion.span
              key={i}
              initial={{ y: "120%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.6 + i * 0.055, duration: 0.65, ease: [0.16, 1, 0.3, 1] }}
              className="text-warm-white uppercase inline-block"
              style={{
                fontSize: "clamp(28px, 5.5vw, 64px)",
                fontWeight: 300,
                letterSpacing: "0.45em",
                fontFamily: "Montserrat, sans-serif",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.div>

        {/* STUDIO */}
        <motion.p
          initial={{ opacity: 0, letterSpacing: "0.15em", y: 10 }}
          animate={{ opacity: 1, letterSpacing: "0.55em", y: 0 }}
          transition={{ delay: 2.3, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="text-terra/80 uppercase mt-2"
          style={{ fontSize: "clamp(10px, 1.6vw, 15px)", fontWeight: 300, fontFamily: "Montserrat, sans-serif" }}
        >
          Studio
        </motion.p>

        {/* Tagline */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.8, duration: 0.8 }}
          className="text-[12px] tracking-[0.3em] uppercase text-warm-white/65 mt-6"
          style={{ fontWeight: 300, fontFamily: "Montserrat, sans-serif" }}
        >
          {content.tagline as string} · {content.location as string}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col sm:flex-row gap-3"
        >
          {/* Primary CTA — solid fill, high contrast */}
          <Link
            to="/planning"
            className="relative overflow-hidden bg-terra text-warm-white px-10 py-4 rounded-full text-[11px] tracking-[0.3em] uppercase hover:bg-terra-dark transition-all btn-shimmer shadow-[0_8px_32px_rgba(184,99,74,0.35)] hover:shadow-[0_12px_40px_rgba(184,99,74,0.5)]"
            style={{ fontWeight: 500, fontFamily: "Montserrat, sans-serif" }}
          >
            <span className="relative z-10">Réserver une séance</span>
          </Link>
          {/* Secondary CTA — outline, clearly readable */}
          <Link
            to="/mon-pack"
            className="border border-warm-white/30 text-warm-white/80 px-10 py-4 rounded-full text-[11px] tracking-[0.3em] uppercase hover:border-terra hover:text-terra transition-all"
            style={{ fontWeight: 400, fontFamily: "Montserrat, sans-serif" }}
          >
            Ma Carte
          </Link>
          {/* Tertiary — ghost */}
          <Link
            to="/studio"
            className="border border-warm-white/15 text-warm-white/55 px-10 py-4 rounded-full text-[11px] tracking-[0.3em] uppercase hover:border-warm-white/35 hover:text-warm-white/75 transition-all"
            style={{ fontWeight: 300, fontFamily: "Montserrat, sans-serif" }}
          >
            Le Studio
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 4, duration: 1 }}
          className="mt-10 mb-10 flex flex-col items-center gap-2"
        >
          <div className="w-px h-16 overflow-hidden">
            <div
              className="w-full h-full scroll-line origin-top"
              style={{ background: "linear-gradient(to bottom, hsl(13 42% 50%), transparent)" }}
            />
          </div>
          <motion.div animate={{ y: [0, 5, 0] }} transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={14} className="text-terra/50" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
