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
          <p className="brand-label justify-center mb-8">
            Notre philosophie
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-10 leading-[1.15]" style={{ fontWeight: 400 }}>
            Pas l'arrivée —<br />
            <em className="italic" style={{ fontStyle: "italic", fontWeight: 300 }}>le mouvement perpétuel</em>
          </h2>
          <div className="brand-divider mb-12" />
          <p className="font-body text-[15px] text-foreground/65 leading-[1.95] mb-6" style={{ fontWeight: 300 }}>
            EVØLV n'est pas un luxe pour le luxe. Ce n'est pas non plus de la performance clinique. C'est le point de rencontre précis — là où la rigueur est douce, et la beauté se mérite.
          </p>
          <p className="font-body text-[15px] text-foreground/65 leading-[1.95] mb-6" style={{ fontWeight: 300 }}>
            Nos séances en <strong className="text-foreground/90" style={{ fontWeight: 400 }}>petits groupes de 6 personnes maximum</strong> garantissent un encadrement d'exception — précis, attentif, individualisé.
          </p>
          <p className="font-body text-[15px] text-foreground/65 leading-[1.95]" style={{ fontWeight: 300 }}>
            Des cours <strong className="text-foreground/90" style={{ fontWeight: 400 }}>post-natal et Maman & Bébé</strong> accompagnent les jeunes mamans dans une reprise douce, bienveillante et respectueuse du corps.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default StudioSection;
