import { motion } from "framer-motion";

const reveal = {
  hidden: { opacity: 0, y: 28 },
  visible: { opacity: 1, y: 0 },
};

const StudioSection = () => {
  return (
    <section id="studio" className="py-32 px-6 bg-background relative overflow-hidden">
      {/* Decorative vertical line */}
      <div className="absolute left-1/2 top-0 bottom-0 w-px bg-foreground/4 pointer-events-none" />

      <div className="container mx-auto max-w-2xl text-center relative z-10">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={reveal}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <p className="font-body text-[10px] tracking-[0.4em] uppercase text-muted-foreground mb-8" style={{ fontWeight: 400 }}>
            Notre philosophie
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-10 leading-[1.15]" style={{ fontWeight: 400 }}>
            L'excellence du mouvement,<br />
            <em className="italic" style={{ fontStyle: "italic", fontWeight: 300 }}>réinventée</em>
          </h2>
          <div className="flex items-center justify-center gap-4 mb-12">
            <div className="w-10 h-px bg-foreground/20" />
            <div className="w-1.5 h-1.5 rounded-full bg-foreground/20" />
            <div className="w-10 h-px bg-foreground/20" />
          </div>
          <p className="font-body text-[15px] text-foreground/65 leading-[1.95] mb-6" style={{ fontWeight: 300 }}>
            EVØLV est né d'une conviction profonde : que le mouvement, pratiqué avec précision et intention, est la forme la plus pure de transformation. Un studio boutique dédié à l'excellence du Pilates.
          </p>
          <p className="font-body text-[15px] text-foreground/65 leading-[1.95] mb-6" style={{ fontWeight: 300 }}>
            Nos séances en <strong className="text-foreground font-medium">petits groupes de 6 personnes maximum</strong> garantissent un encadrement d'exception — précis, attentif, individualisé.
          </p>
          <p className="font-body text-[15px] text-foreground/65 leading-[1.95]" style={{ fontWeight: 300 }}>
            Des cours <strong className="text-foreground font-medium">post-natal et Maman & Bébé</strong> accompagnent les jeunes mamans dans une reprise douce, bienveillante et respectueuse du corps.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default StudioSection;
