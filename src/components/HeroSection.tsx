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

const WORDMARK = "EVØLV".split("");

const HeroSection = ({ onBookClick, burgundyBackground = false }: HeroSectionProps) => {
  const content = useSiteContent("hero", {
    tagline: "Reformer Pilates",
    location: "Casablanca",
  });

  const ref = useRef<HTMLElement>(null);
  const { scrollYProgress } = useScroll({ target: ref, offset: ["start start", "end start"] });

  const logoYRaw = useTransform(scrollYProgress, [0, 1], [0, 220]);
  const logoY = useSpring(logoYRaw, { stiffness: 45, damping: 22, mass: 2 });
  const logoScale = useTransform(scrollYProgress, [0, 0.4, 1], [1, 1.06, 0.94]);
  const logoOp = useTransform(scrollYProgress, [0, 0.75, 1], [1, 0.5, 0]);

  const textY = useTransform(scrollYProgress, [0, 1], [0, -50]);

  const [logoSize, setLogoSize] = useState(340);
  useEffect(() => {
    const update = () => setLogoSize(Math.min(340, window.innerWidth * 0.6));
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, []);

  return (
    <section
      ref={ref}
      className="relative min-h-screen flex flex-col items-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #0f0f0f 0%, #1a1a1a 50%, #111111 100%)" }}
    >
      <ParticleCanvas />

      {/* Subtle background rings */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {[320, 500, 680].map((r, i) => (
          <div
            key={i}
            className="absolute rounded-full"
            style={{
              width: r,
              height: r,
              border: "1px solid rgba(249,246,241,0.04)",
              animation: `divider-spin ${45 + i * 14}s linear infinite ${i % 2 ? "reverse" : ""}`,
            }}
          />
        ))}
      </div>

      {/* EVØLV logo mark — large, scroll-reactive */}
      <motion.div
        className="absolute inset-0 flex justify-center pointer-events-none"
        style={{ y: logoY, scale: logoScale, opacity: logoOp, paddingTop: "10vh" }}
      >
        <motion.div
          initial={{ scale: 0.85, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 2, ease: [0.4, 0, 0.2, 1] }}
          className="animate-scale-breathe pointer-events-auto"
        >
          <MeridianLogo
            size={logoSize}
            variant="terra"
            animate
            floatAnimation={false}
            glowAnimation
            spinDuration={14}
          />
        </motion.div>
      </motion.div>

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center text-center px-6 mt-auto pt-[56vh]">

        {/* EVØLV — letter by letter with editorial reveal */}
        <motion.div style={{ y: textY }} className="flex overflow-hidden">
          {WORDMARK.map((char, i) => (
            <motion.span
              key={i}
              initial={{ y: "110%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.4 + i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
              className="inline-block text-white"
              style={{
                fontSize: "clamp(32px, 6vw, 72px)",
                fontFamily: "'Playfair Display', Georgia, serif",
                fontWeight: 400,
                letterSpacing: "0.38em",
              }}
            >
              {char === " " ? "\u00A0" : char}
            </motion.span>
          ))}
        </motion.div>

        {/* Pilates Studio */}
        <motion.div
          initial={{ opacity: 0, scaleX: 0.4 }}
          animate={{ opacity: 1, scaleX: 1 }}
          transition={{ delay: 2.2, duration: 1, ease: [0.16, 1, 0.3, 1] }}
          className="flex items-center gap-4 mt-3"
        >
          <div className="w-8 h-px bg-white/20" />
          <p
            className="text-white/45 uppercase"
            style={{
              fontSize: "clamp(8px, 1.2vw, 11px)",
              fontWeight: 400,
              letterSpacing: "0.4em",
              fontFamily: "'DM Sans', Inter, sans-serif",
            }}
          >
            Pilates Studio
          </p>
          <div className="w-8 h-px bg-white/20" />
        </motion.div>

        {/* Location */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.7, duration: 0.8 }}
          className="text-white/30 uppercase mt-4"
          style={{
            fontSize: "clamp(8px, 1vw, 10px)",
            fontWeight: 400,
            letterSpacing: "0.3em",
            fontFamily: "'DM Sans', Inter, sans-serif",
          }}
        >
          {content.location as string}
        </motion.p>

        {/* CTAs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col sm:flex-row gap-3"
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
            className="border border-white/20 text-white/70 px-10 py-4 text-[10px] tracking-[0.3em] uppercase hover:border-white/50 hover:text-white transition-all"
            style={{ fontWeight: 400, fontFamily: "'DM Sans', Inter, sans-serif" }}
          >
            Mon Abonnement
          </Link>
          <Link
            to="/studio"
            className="border border-white/10 text-white/40 px-10 py-4 text-[10px] tracking-[0.3em] uppercase hover:border-white/25 hover:text-white/60 transition-all"
            style={{ fontWeight: 400, fontFamily: "'DM Sans', Inter, sans-serif" }}
          >
            Le Studio
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 3.8, duration: 1 }}
          className="mt-10 mb-10 flex flex-col items-center gap-2"
        >
          <div className="w-px h-14 overflow-hidden">
            <div
              className="w-full h-full scroll-line origin-top"
              style={{ background: "linear-gradient(to bottom, rgba(249,246,241,0.4), transparent)" }}
            />
          </div>
          <motion.div animate={{ y: [0, 4, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}>
            <ChevronDown size={13} className="text-white/25" />
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default HeroSection;
