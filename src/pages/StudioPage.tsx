import { useRef, useEffect, useState } from "react";
import {
  motion,
  useScroll,
  useTransform,
} from "framer-motion";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import PageBackgroundMeridian from "@/components/brand/PageBackgroundMeridian";
import heroImage from "@/assets/hero-studio.jpg";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";


// ── Section label ─────────────────────────────────────────────────────────────
const SectionLabel = ({ children }: { children: string }) => (
  <p
    className="font-body text-[11px] tracking-[0.5em] uppercase text-terra mb-6"
    style={{ fontWeight: 500 }}
  >
    {children}
  </p>
);

// ── Char reveal ───────────────────────────────────────────────────────────────
const WordReveal = ({ text, delay = 0 }: { text: string; delay?: number }) => {
  const words = text.split(" ");
  return (
    <>
      {words.map((word, i) => (
        <span key={i} className="inline-block overflow-hidden mr-[0.22em]">
          <motion.span
            className="inline-block"
            initial={{ y: "110%", opacity: 0 }}
            whileInView={{ y: 0, opacity: 1 }}
            viewport={{ once: true }}
            transition={{
              duration: 1,
              delay: delay + i * 0.08,
              ease: [0.16, 1, 0.3, 1],
            }}
          >
            {word}
          </motion.span>
        </span>
      ))}
    </>
  );
};

const ALL_DISCIPLINES = [
  { id: "reformer", label: "Reformer Pilates", courses: ["Reformer Signature", "Reformer Jumpboard"] },
  { id: "springwall", label: "Reformer + Springwall", courses: ["Reformer + Springwall Combo"] },
  { id: "yoga", label: "Yoga", courses: ["Vinyasa Yoga", "Hatha Yoga", "Power Yoga"] },
  { id: "fitness", label: "Mat & Fitness", courses: ["Mat Pilates", "Barre Fit", "Cardio Zumba"] },
  { id: "maternite", label: "Maternité & Post-natal", courses: ["Post-natal", "Maman & Bébé"] },
];

// ─────────────────────────────────────────────────────────────────────────────
// MAIN PAGE
// ─────────────────────────────────────────────────────────────────────────────
const StudioPage = () => {
  // ── Hero parallax ──────────────────────────────────────────────────────────
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({
    target: heroRef,
    offset: ["start start", "end start"],
  });
  const heroImgY = useTransform(heroScroll, [0, 1], ["0%", "28%"]);
  const heroTextY = useTransform(heroScroll, [0, 1], ["0%", "55%"]);
  const heroOpacity = useTransform(heroScroll, [0, 0.7], [1, 0]);

  // ── Story parallax ─────────────────────────────────────────────────────────
  const storyRef = useRef<HTMLElement>(null);
  const { scrollYProgress: storyScroll } = useScroll({
    target: storyRef,
    offset: ["start end", "end start"],
  });
  const storyImgY = useTransform(storyScroll, [0, 1], ["-10%", "10%"]);
  const storyTextX = useTransform(storyScroll, [0, 1], ["4%", "-4%"]);

  // ── Pillars parallax ───────────────────────────────────────────────────────
  const pillarsRef = useRef<HTMLElement>(null);
  const { scrollYProgress: pillarsScroll } = useScroll({
    target: pillarsRef,
    offset: ["start end", "end start"],
  });
  const pillarsY = useTransform(pillarsScroll, [0, 1], ["-5%", "5%"]);

  // ── Disciplines visibility ──────────────────────────────────────────────────
  const [visibleDisciplines, setVisibleDisciplines] = useState(ALL_DISCIPLINES);

  useEffect(() => {
    api.siteContent.get("disciplines_visibility").then((data) => {
      if (data?.content) {
        const vis = (data.content as any)?.studio;
        if (Array.isArray(vis) && vis.length > 0) {
          setVisibleDisciplines(ALL_DISCIPLINES.filter(d => vis.includes(d.id)));
        }
      }
    }).catch(() => {});
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <PageBackgroundMeridian />
      <Navbar onBookClick={() => {}} />

      {/* ══════════════════════════════════════════════════════════════════════
          HERO — Full viewport, cinématique
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        ref={heroRef}
        className="relative h-screen flex flex-col items-center justify-center overflow-hidden"
      >
        {/* Studio photo — parallax */}
        <motion.div
          className="absolute inset-0 w-full h-full"
          style={{ y: heroImgY }}
        >
          <img
            src={heroImage}
            alt="EVØLV Studio"
            className="w-full h-full object-cover"
            style={{ filter: "brightness(0.42) saturate(0.75)" }}
          />
        </motion.div>

        {/* Terra radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 60%, rgba(184,99,74,0.18) 0%, transparent 60%)",
          }}
        />

        {/* Bottom gradient — blends to background */}
        <div
          className="absolute bottom-0 left-0 right-0 h-48 pointer-events-none"
          style={{
            background:
              "linear-gradient(to top, hsl(var(--background)) 0%, transparent 100%)",
          }}
        />

        {/* Hero text — always white since photo is darkened */}
        <motion.div
          className="relative z-10 text-center px-6 max-w-4xl"
          style={{ y: heroTextY, opacity: heroOpacity }}
        >
          <SectionLabel>Notre Studio</SectionLabel>

          <h1
            className="font-display leading-[0.92] mb-8 text-white"
            style={{
              fontSize: "clamp(56px, 11vw, 130px)",
              fontWeight: 200,
              letterSpacing: "0.06em",
            }}
          >
            <WordReveal text="The" delay={0.1} />{" "}
            <span className="text-terra">
              <WordReveal text="Circle" delay={0.2} />
            </span>
            <br />
            <span style={{ fontSize: "0.55em", letterSpacing: "0.18em", fontWeight: 200, opacity: 0.7 }}>
              <WordReveal text="Studio · Rabat" delay={0.35} />
            </span>
          </h1>

          <motion.div
            className="h-px mx-auto mb-8"
            style={{ background: "rgba(184,99,74,0.6)", width: 64 }}
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 1.2, delay: 0.8, ease: [0.16, 1, 0.3, 1] }}
          />

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.9, ease: [0.16, 1, 0.3, 1] }}
            className="font-body text-[13px] leading-[2] mx-auto max-w-sm text-white/70"
            style={{ fontWeight: 300, letterSpacing: "0.1em" }}
          >
            Reformer Pilates · El Menzeh · Rabat
          </motion.p>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6 }}
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
        >
          <motion.div
            animate={{ y: [0, 8, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
            className="w-px h-14"
            style={{ background: "linear-gradient(to bottom, rgba(184,99,74,0.6), transparent)" }}
          />
        </motion.div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          STATS STRIP
      ══════════════════════════════════════════════════════════════════════ */}
      <section
        className="relative py-16 px-6 border-y border-foreground/10"
        style={{ background: "rgba(184,99,74,0.06)" }}
      >
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: 8, label: "disciplines au programme", suffix: "" },
              { value: 4, label: "Reformers professionnels", suffix: "" },
              { value: 2, label: "Springwalls", suffix: "" },
              { value: 3, label: "coachs certifiés", suffix: "" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="text-center"
              >
                <p
                  className="font-display mb-1 text-terra"
                  style={{ fontSize: "clamp(40px, 7vw, 64px)", fontWeight: 200, letterSpacing: "-0.02em" }}
                >
                  {s.value}{s.suffix}
                </p>
                <p
                  className="font-body text-[10px] tracking-[0.25em] uppercase text-foreground/65"
                  style={{ fontWeight: 400 }}
                >
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          HISTOIRE — Split parallax (image + text)
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={storyRef} className="relative py-0 overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-screen">
          {/* Image — parallax */}
          <div className="relative overflow-hidden" style={{ minHeight: "60vh" }}>
            <motion.div
              className="absolute inset-0 scale-110"
              style={{ y: storyImgY }}
            >
              <img
                src={heroImage}
                alt="EVØLV Studio"
                className="w-full h-full object-cover"
                style={{ filter: "brightness(0.62) saturate(0.80)" }}
              />
            </motion.div>
            {/* Terra glow overlay */}
            <div
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(135deg, rgba(184,99,74,0.15) 0%, transparent 50%), linear-gradient(to right, transparent 70%, hsl(var(--background)) 100%)",
              }}
            />
          </div>

          {/* Text — parallax */}
          <motion.div
            className="flex flex-col justify-center px-10 md:px-16 py-24 relative bg-card"
            style={{ x: storyTextX }}
          >
            {/* Subtle radial glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background:
                  "radial-gradient(ellipse at 30% 50%, rgba(184,99,74,0.07) 0%, transparent 60%)",
              }}
            />

            <div className="relative z-10 max-w-lg">
              <SectionLabel>Notre histoire</SectionLabel>

              <h2
                className="font-display text-foreground mb-8 leading-[1.05]"
                style={{
                  fontSize: "clamp(32px, 5vw, 54px)",
                  fontWeight: 200,
                  letterSpacing: "0.06em",
                }}
              >
                <WordReveal text="Un espace pour se" delay={0} />
                <br />
                <em className="italic text-terra">
                  <WordReveal text="reconnecter à soi" delay={0.2} />
                </em>
              </h2>

              <motion.div
                className="h-px mb-10"
                style={{ background: "rgba(184,99,74,0.4)", width: 48 }}
                initial={{ scaleX: 0, originX: 0 }}
                whileInView={{ scaleX: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
              />

              <div
                className="space-y-5 font-body leading-[1.95] text-foreground/75"
                style={{ fontSize: "14px", fontWeight: 300 }}
              >
                {[
                  "EVØLV est né d'une conviction profonde : le mouvement est un acte de reconnexion. Loin des salles impersonnelles, nous avons imaginé un lieu intime, chaleureux, pensé comme un cocon.",
                  "Ici, pas de cours bondés ni de coaching générique. Nous proposons des séances en petits groupes, afin de garantir un accompagnement attentif, précis et sécurisé.",
                  "Nous croyons que le Pilates est bien plus qu'un sport — c'est une philosophie du mouvement conscient, un chemin vers l'équilibre entre force et souplesse, intensité et douceur.",
                ].map((p, i) => (
                  <motion.p
                    key={i}
                    initial={{ opacity: 0, y: 16 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.15, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                  >
                    {p}
                  </motion.p>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          VALEURS — Trois panels pleine largeur avec parallax
      ══════════════════════════════════════════════════════════════════════ */}
      <section ref={pillarsRef} className="relative py-32 px-6 overflow-hidden bg-secondary">
        {/* Terra radial glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(184,99,74,0.08) 0%, transparent 65%)",
          }}
        />

        <div className="container mx-auto max-w-6xl relative z-10">
          <div className="text-center mb-20">
            <SectionLabel>Ce qui nous définit</SectionLabel>
            <h2
              className="font-display text-foreground"
              style={{
                fontSize: "clamp(36px, 6vw, 72px)",
                fontWeight: 200,
                letterSpacing: "0.08em",
              }}
            >
              L'expérience{" "}
              <em className="italic text-terra">
                EVØLV
              </em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-px" style={{ background: "rgba(184,99,74,0.15)" }}>
            {[
              {
                num: "01",
                title: "Intimité",
                desc: "Un suivi attentif, dans un espace conçu pour le mouvement. Chaque mouvement est supervisé, chaque correction personnalisée.",
                accent: "Présence totale",
              },
              {
                num: "02",
                title: "Excellence",
                desc: "Des coachs certifiés et passionnés qui combinent rigueur technique et bienveillance profonde.",
                accent: "Précision & soin",
              },
              {
                num: "03",
                title: "Bienveillance",
                desc: "Un espace safe et inclusif — des cours post-natal et Maman & Bébé pour accompagner chaque étape.",
                accent: "Pour toutes",
              },
            ].map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.18, duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
                whileHover={{ y: -4, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }}
                className="relative p-10 flex flex-col group bg-card"
                style={{ minHeight: 320 }}
              >
                {/* Number watermark */}
                <span
                  className="absolute top-6 right-8 font-display select-none pointer-events-none"
                  style={{
                    fontSize: "clamp(80px, 12vw, 140px)",
                    fontWeight: 100,
                    color: "rgba(184,99,74,0.10)",
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                  }}
                  aria-hidden
                >
                  {pillar.num}
                </span>

                <p
                  className="font-body text-[10px] tracking-[0.45em] uppercase mb-5 text-terra"
                  style={{ fontWeight: 500 }}
                >
                  {pillar.num} · {pillar.accent}
                </p>

                <h3
                  className="font-display text-foreground mb-5"
                  style={{
                    fontSize: "clamp(28px, 4vw, 42px)",
                    fontWeight: 200,
                    letterSpacing: "0.06em",
                  }}
                >
                  {pillar.title}
                </h3>

                <motion.div
                  className="h-px mb-6"
                  style={{ background: "rgba(184,99,74,0.5)", width: 40 }}
                  initial={{ scaleX: 0, originX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.18 + 0.3, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                />

                <p
                  className="font-body text-[13px] leading-[2] flex-1 text-foreground/70"
                  style={{ fontWeight: 300 }}
                >
                  {pillar.desc}
                </p>

                {/* Hover glow */}
                <div
                  className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                  style={{
                    background:
                      "radial-gradient(ellipse at 30% 30%, rgba(184,99,74,0.10) 0%, transparent 70%)",
                  }}
                />
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          ÉQUIPEMENT
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-28 px-6 border-t border-terra/12 bg-background">
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 80% 50%, rgba(184,99,74,0.05) 0%, transparent 55%)",
          }}
        />

        <div className="container mx-auto max-w-5xl relative z-10">
          <div className="grid md:grid-cols-2 gap-16 items-center">
            {/* Left — text */}
            <div>
              <SectionLabel>L'espace</SectionLabel>
              <h2
                className="font-display text-foreground mb-8 leading-[1.05]"
                style={{
                  fontSize: "clamp(32px, 5vw, 52px)",
                  fontWeight: 200,
                  letterSpacing: "0.07em",
                }}
              >
                <WordReveal text="Équipement" delay={0} />
                <br />
                <em className="italic text-terra">
                  <WordReveal text="professionnel" delay={0.15} />
                </em>
              </h2>
              <motion.p
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="font-body leading-[1.95] mb-10 text-foreground/70"
                style={{ fontSize: "14px", fontWeight: 300 }}
              >
                Notre studio est équipé de matériel Pilates professionnel, soigneusement sélectionné et régulièrement entretenu pour vous garantir la meilleure expérience à chaque séance.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.9, delay: 0.3, ease: [0.16, 1, 0.3, 1] }}
              >
                <Link
                  to="/planning"
                  className="inline-flex items-center gap-3 bg-terra text-white font-body text-[11px] tracking-[0.3em] uppercase px-8 py-3.5 rounded-full transition-all group shadow-[0_4px_20px_rgba(184,99,74,0.25)] hover:bg-foreground/80 hover:shadow-[0_8px_32px_rgba(184,99,74,0.4)] hover:scale-[1.02]"
                  style={{ fontWeight: 500 }}
                >
                  Réserver une séance
                  <ArrowRight
                    size={13}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </Link>
              </motion.div>
            </div>

            {/* Right — equipment list */}
            <div className="space-y-3">
              {[
                { name: "4 Reformers classiques", desc: "Matériel professionnel Pilates pour toutes les disciplines" },
                { name: "2 Springwalls", desc: "Pour des exercices variés et une expérience unique" },
                { name: "Cours maintenu dès 2 participants", desc: "Aucune séance annulée faute de monde" },
                { name: "Cours post-natal & Maman & Bébé", desc: "Accompagnement spécialisé pour les jeunes mamans" },
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 20 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.1, duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  className="flex items-start gap-4 p-5 border border-foreground/10 bg-card"
                  style={{ borderRadius: "2px" }}
                >
                  <div className="w-1.5 h-1.5 rounded-full shrink-0 mt-2 bg-terra" />
                  <div>
                    <p
                      className="font-body text-[13px] mb-1 text-foreground"
                      style={{ fontWeight: 400 }}
                    >
                      {item.name}
                    </p>
                    <p
                      className="font-body text-[12px] text-foreground/60"
                      style={{ fontWeight: 300 }}
                    >
                      {item.desc}
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ══ DISCIPLINES SECTION ══ */}
      <section className="relative py-24 px-6 overflow-hidden bg-secondary">
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse at 50% 50%, rgba(184,99,74,0.06) 0%, transparent 65%)" }} />
        <div className="container mx-auto max-w-5xl relative z-10">
          <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }} className="text-center mb-14">
            <p className="font-body text-[11px] tracking-[0.5em] uppercase text-terra mb-4" style={{ fontWeight: 500 }}>Au programme</p>
            <h2 className="font-display text-foreground" style={{ fontSize: "clamp(36px, 5vw, 64px)", fontWeight: 200, letterSpacing: "0.08em" }}>Nos <em className="italic text-terra">Disciplines</em></h2>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {visibleDisciplines.map((disc, i) => (
              <motion.div key={disc.id} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.08, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                className="p-6 rounded-sm border border-foreground/10 hover:border-terra/40 transition-all group cursor-default bg-card"
              >
                <h3 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(18px, 2.5vw, 24px)", fontWeight: 200, letterSpacing: "0.06em" }}>{disc.label}</h3>
                <ul className="space-y-1.5">
                  {disc.courses.map(course => (
                    <li key={course} className="flex items-center gap-2">
                      <span className="w-1 h-1 rounded-full bg-terra flex-shrink-0" />
                      <span className="font-body text-foreground/70 text-[13px]" style={{ fontWeight: 300 }}>{course}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════════════════════════════
          CTA FINAL
      ══════════════════════════════════════════════════════════════════════ */}
      <section className="relative py-40 px-6 text-center overflow-hidden bg-background">
        {/* Deep glow */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background:
              "radial-gradient(ellipse at 50% 50%, rgba(184,99,74,0.12) 0%, rgba(212,168,85,0.04) 40%, transparent 70%)",
          }}
        />

        <div className="relative z-10">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 1.1, ease: [0.16, 1, 0.3, 1] }}
          >
            <SectionLabel>Prêt·e à commencer ?</SectionLabel>
            <h2
              className="font-display text-foreground mb-12"
              style={{
                fontSize: "clamp(36px, 6vw, 72px)",
                fontWeight: 200,
                letterSpacing: "0.08em",
              }}
            >
              Votre première <em className="italic text-terra">séance</em>
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {/* Primary — solid filled, high contrast */}
              <Link
                to="/planning"
                className="inline-flex items-center gap-3 bg-terra text-white font-body text-[11px] tracking-[0.3em] uppercase px-10 py-4 rounded-full transition-all group shadow-[0_8px_32px_rgba(184,99,74,0.35)] hover:bg-foreground/80 hover:shadow-[0_12px_44px_rgba(184,99,74,0.55)] hover:scale-[1.02]"
                style={{ fontWeight: 500 }}
              >
                Voir le planning
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              {/* Secondary — outlined, readable */}
              <Link
                to="/coachs"
                className="inline-flex items-center gap-3 font-body text-[11px] tracking-[0.3em] uppercase px-10 py-4 rounded-full border border-border text-foreground/70 transition-all hover:border-terra/60 hover:text-foreground"
                style={{ fontWeight: 400 }}
              >
                Rencontrer les coachs
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
};

export default StudioPage;
