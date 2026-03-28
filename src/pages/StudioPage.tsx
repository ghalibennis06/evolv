import { useRef, useEffect, useState } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import { api } from "@/lib/api";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import heroImage from "@/assets/hero-studio.jpg";
import { Link } from "react-router-dom";
import { ArrowRight, Check } from "lucide-react";

const ALL_DISCIPLINES = [
  { id: "reformer", label: "Reformer Pilates", courses: ["Reformer Signature", "Reformer Jumpboard"] },
  { id: "springwall", label: "Reformer + Springwall", courses: ["Reformer + Springwall Combo"] },
  { id: "yoga", label: "Yoga", courses: ["Vinyasa Yoga", "Hatha Yoga", "Power Yoga"] },
  { id: "fitness", label: "Mat & Fitness", courses: ["Mat Pilates", "Barre Fit", "Cardio Zumba"] },
  { id: "maternite", label: "Maternité & Post-natal", courses: ["Post-natal", "Maman & Bébé"] },
];

const StudioPage = () => {
  const heroRef = useRef<HTMLElement>(null);
  const { scrollYProgress: heroScroll } = useScroll({ target: heroRef, offset: ["start start", "end start"] });
  const heroImgY = useTransform(heroScroll, [0, 1], ["0%", "22%"]);
  const heroOpacity = useTransform(heroScroll, [0, 0.65], [1, 0]);

  const [visibleDisciplines, setVisibleDisciplines] = useState(ALL_DISCIPLINES);

  useEffect(() => {
    api.siteContent.get("disciplines_visibility").then((data) => {
      if (data?.content) {
        const vis = (data.content as any)?.studio;
        if (Array.isArray(vis) && vis.length > 0)
          setVisibleDisciplines(ALL_DISCIPLINES.filter((d) => vis.includes(d.id)));
      }
    }).catch(() => {});
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-background text-foreground">
      <Navbar onBookClick={() => {}} />

      {/* ═══ HERO ═══════════════════════════════════════════════════════════ */}
      <section ref={heroRef} className="relative h-screen flex flex-col items-center justify-center overflow-hidden">
        <motion.div className="absolute inset-0" style={{ y: heroImgY }}>
          <img src={heroImage} alt="EVØLV Studio" className="w-full h-full object-cover" style={{ filter: "brightness(0.38) saturate(0.7)" }} />
        </motion.div>
        <div className="absolute bottom-0 left-0 right-0 h-40 pointer-events-none" style={{ background: "linear-gradient(to top, hsl(var(--background)), transparent)" }} />

        <motion.div className="relative z-10 text-center px-6" style={{ opacity: heroOpacity }}>
          <p className="font-body text-[10px] tracking-[0.55em] uppercase text-white/50 mb-8" style={{ fontWeight: 400 }}>
            Notre Studio
          </p>
          <h1 className="font-display text-white mb-6 leading-[0.95]" style={{ fontSize: "clamp(58px, 11vw, 128px)", fontWeight: 400, letterSpacing: "0.04em" }}>
            EVØLV
          </h1>
          <p className="font-body text-white/55 tracking-[0.18em] uppercase" style={{ fontSize: "13px", fontWeight: 300 }}>
            Reformer Pilates · El Menzeh · Rabat
          </p>
        </motion.div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 1.4 }} className="absolute bottom-10 left-1/2 -translate-x-1/2">
          <motion.div animate={{ y: [0, 8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-px h-12 mx-auto" style={{ background: "linear-gradient(to bottom, rgba(255,255,255,0.3), transparent)" }} />
        </motion.div>
      </section>

      {/* ═══ STATS ══════════════════════════════════════════════════════════ */}
      <section className="border-b border-border bg-card">
        <div className="container mx-auto max-w-4xl">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-border">
            {[
              { value: "8", label: "Disciplines" },
              { value: "4", label: "Reformers Pro" },
              { value: "2", label: "Springwalls" },
              { value: "3", label: "Coachs Certifiés" },
            ].map((s, i) => (
              <motion.div
                key={s.label}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08, duration: 0.7 }}
                className="py-10 px-8 text-center"
              >
                <p className="font-display text-foreground mb-1.5" style={{ fontSize: "clamp(36px, 5vw, 52px)", fontWeight: 400, letterSpacing: "-0.01em" }}>
                  {s.value}
                </p>
                <p className="font-body text-[10px] tracking-[0.3em] uppercase text-muted-foreground" style={{ fontWeight: 400 }}>
                  {s.label}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ HISTOIRE ════════════════════════════════════════════════════════ */}
      <section className="py-0 overflow-hidden">
        <div className="grid md:grid-cols-2 min-h-[80vh]">
          {/* Image */}
          <div className="relative overflow-hidden" style={{ minHeight: "50vh" }}>
            <img src={heroImage} alt="EVØLV Studio" className="w-full h-full object-cover" style={{ filter: "brightness(0.65) saturate(0.75)" }} />
            <div className="absolute inset-0" style={{ background: "linear-gradient(to right, transparent 70%, hsl(var(--background)) 100%)" }} />
          </div>

          {/* Text */}
          <div className="flex flex-col justify-center px-10 md:px-16 py-20 bg-background border-l border-border">
            <p className="brand-label mb-8">Notre histoire</p>
            <h2 className="font-display text-foreground mb-8 leading-[1.05]" style={{ fontSize: "clamp(30px, 4.5vw, 50px)", fontWeight: 400, letterSpacing: "0.02em" }}>
              Un espace pour se{" "}
              <em className="italic" style={{ fontStyle: "italic", fontWeight: 300 }}>reconnecter à soi</em>
            </h2>
            <div className="w-10 h-px bg-terra/60 mb-10" />
            <div className="space-y-5 font-body text-foreground/70 leading-[1.9]" style={{ fontSize: "14px", fontWeight: 300 }}>
              {[
                "EVØLV est né d'une conviction profonde : le mouvement est un acte de reconnexion. Loin des salles impersonnelles, nous avons imaginé un lieu intime, chaleureux, pensé comme un cocon.",
                "Pas de cours bondés ni de coaching générique. Des séances en petits groupes, pour un accompagnement attentif, précis et sécurisé.",
                "Le Pilates est bien plus qu'un sport — c'est une philosophie du mouvement conscient, un chemin vers l'équilibre entre force et souplesse.",
              ].map((p, i) => (
                <motion.p key={i} initial={{ opacity: 0, y: 12 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.12, duration: 0.8 }}>
                  {p}
                </motion.p>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ VALEURS ════════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-card border-t border-border">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <p className="brand-label justify-center mb-6">Ce qui nous définit</p>
            <h2 className="font-display text-foreground" style={{ fontSize: "clamp(32px, 5vw, 60px)", fontWeight: 400, letterSpacing: "0.02em" }}>
              L'expérience{" "}
              <em className="italic" style={{ fontWeight: 300 }}>EVØLV</em>
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-0 border border-border">
            {[
              { num: "01", title: "Intimité", accent: "Présence totale", desc: "Un suivi attentif dans un espace conçu pour le mouvement. Chaque geste est supervisé, chaque correction personnalisée." },
              { num: "02", title: "Excellence", accent: "Précision & soin", desc: "Des coachs certifiés et passionnés qui combinent rigueur technique et bienveillance profonde." },
              { num: "03", title: "Bienveillance", accent: "Pour toutes", desc: "Un espace safe et inclusif — des cours post-natal et Maman & Bébé pour accompagner chaque étape de la vie." },
            ].map((pillar, i) => (
              <motion.div
                key={pillar.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ delay: i * 0.15, duration: 0.9 }}
                className="relative p-10 border-r border-border last:border-r-0 group hover:bg-background transition-colors duration-300"
                style={{ minHeight: 280 }}
              >
                <p className="font-body text-[10px] tracking-[0.4em] uppercase text-terra mb-5" style={{ fontWeight: 500 }}>
                  {pillar.num} · {pillar.accent}
                </p>
                <h3 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(26px, 3.5vw, 38px)", fontWeight: 400, letterSpacing: "0.02em" }}>
                  {pillar.title}
                </h3>
                <div className="w-8 h-px bg-terra/50 mb-5" />
                <p className="font-body text-foreground/70 leading-[1.85]" style={{ fontSize: "13px", fontWeight: 300 }}>
                  {pillar.desc}
                </p>
                <span className="absolute bottom-8 right-8 font-display text-foreground/[0.04] select-none pointer-events-none" style={{ fontSize: "clamp(70px, 10vw, 120px)", fontWeight: 400, lineHeight: 1 }} aria-hidden>
                  {pillar.num}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ ÉQUIPEMENT ═════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-background border-t border-border">
        <div className="container mx-auto max-w-5xl">
          <div className="grid md:grid-cols-2 gap-16 items-start">
            <div>
              <p className="brand-label mb-8">L'espace</p>
              <h2 className="font-display text-foreground mb-6 leading-[1.05]" style={{ fontSize: "clamp(28px, 4.5vw, 48px)", fontWeight: 400, letterSpacing: "0.02em" }}>
                Équipement{" "}
                <em className="italic" style={{ fontWeight: 300 }}>professionnel</em>
              </h2>
              <p className="font-body text-foreground/70 leading-[1.9] mb-10" style={{ fontSize: "14px", fontWeight: 300 }}>
                Notre studio est équipé de matériel Pilates professionnel, soigneusement sélectionné et régulièrement entretenu pour vous garantir la meilleure expérience à chaque séance.
              </p>
              <Link
                to="/planning"
                className="inline-flex items-center gap-3 bg-terra text-white font-body text-[11px] tracking-[0.28em] uppercase px-8 py-3.5 transition-all hover:bg-foreground group"
                style={{ fontWeight: 500 }}
              >
                Réserver une séance
                <ArrowRight size={13} className="group-hover:translate-x-1 transition-transform" />
              </Link>
            </div>

            <div className="space-y-0 border border-border">
              {[
                { name: "4 Reformers classiques", desc: "Matériel professionnel pour toutes les disciplines" },
                { name: "2 Springwalls", desc: "Pour des exercices variés et une expérience unique" },
                { name: "Cours maintenus dès 2 participants", desc: "Aucune séance annulée faute de monde" },
                { name: "Post-natal & Maman & Bébé", desc: "Accompagnement spécialisé pour les jeunes mamans" },
              ].map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, x: 16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08, duration: 0.7 }}
                  className="flex items-start gap-4 px-6 py-5 border-b border-border last:border-b-0 group hover:bg-card transition-colors"
                >
                  <Check size={14} className="shrink-0 mt-0.5 text-terra" />
                  <div>
                    <p className="font-body text-foreground text-[13px] mb-0.5" style={{ fontWeight: 400 }}>{item.name}</p>
                    <p className="font-body text-muted-foreground text-[12px]" style={{ fontWeight: 300 }}>{item.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ═══ DISCIPLINES ════════════════════════════════════════════════════ */}
      <section className="py-24 px-6 bg-card border-t border-border">
        <div className="container mx-auto max-w-5xl">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.8 }} className="mb-14">
            <p className="brand-label mb-6">Au programme</p>
            <h2 className="font-display text-foreground" style={{ fontSize: "clamp(32px, 5vw, 56px)", fontWeight: 400, letterSpacing: "0.02em" }}>
              Nos{" "}
              <em className="italic" style={{ fontWeight: 300 }}>Disciplines</em>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-0 border border-border">
            {visibleDisciplines.map((disc, i) => (
              <motion.div
                key={disc.id}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.07, duration: 0.7 }}
                className="p-7 border-r border-b border-border hover:bg-background transition-colors duration-300 [&:nth-child(3n)]:border-r-0 last:border-b-0"
              >
                <h3 className="font-display text-foreground mb-4" style={{ fontSize: "clamp(16px, 2vw, 20px)", fontWeight: 400, letterSpacing: "0.01em" }}>
                  {disc.label}
                </h3>
                <ul className="space-y-1.5">
                  {disc.courses.map((course) => (
                    <li key={course} className="flex items-center gap-2">
                      <span className="w-1 h-1 bg-terra flex-shrink-0" />
                      <span className="font-body text-foreground/70 text-[12px]" style={{ fontWeight: 300 }}>{course}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══ CTA ════════════════════════════════════════════════════════════ */}
      <section className="py-28 px-6 text-center bg-foreground">
        <motion.div initial={{ opacity: 0, y: 24 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ duration: 0.9 }}>
          <p className="font-body text-[10px] tracking-[0.5em] uppercase text-background/50 mb-6" style={{ fontWeight: 400 }}>Prêt·e à commencer ?</p>
          <h2 className="font-display text-background mb-10" style={{ fontSize: "clamp(32px, 5.5vw, 64px)", fontWeight: 400, letterSpacing: "0.02em" }}>
            Votre première{" "}
            <em className="italic" style={{ fontWeight: 300 }}>séance</em>
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/planning" className="inline-flex items-center gap-3 bg-background text-foreground font-body text-[11px] tracking-[0.28em] uppercase px-10 py-4 transition-all hover:bg-background/85 group" style={{ fontWeight: 500 }}>
              Voir le planning
              <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
            </Link>
            <Link to="/coachs" className="inline-flex items-center gap-3 border border-background/25 text-background/70 font-body text-[11px] tracking-[0.28em] uppercase px-10 py-4 transition-all hover:border-background/60 hover:text-background" style={{ fontWeight: 400 }}>
              Rencontrer les coachs
            </Link>
          </div>
        </motion.div>
      </section>

      <Footer />
      <WhatsAppButton />
    </main>
  );
};

export default StudioPage;
