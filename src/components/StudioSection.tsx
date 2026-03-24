import { motion } from "framer-motion";

const reveal = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0 },
};

const StudioSection = () => {
  return (
    <section id="studio" className="py-28 px-6 bg-background relative overflow-hidden">
      <div className="container mx-auto max-w-3xl text-center">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={reveal}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] as const }}
        >
          <p className="font-body text-[11px] tracking-[0.35em] uppercase text-terra mb-6" style={{ fontWeight: 400 }}>
            Notre philosophie
          </p>
          <h2 className="font-display text-4xl md:text-5xl text-foreground mb-10 leading-tight" style={{ fontWeight: 400, letterSpacing: "0.1em" }}>
            Un espace pour se <em className="italic text-terra">reconnecter</em> à soi
          </h2>
          <div className="w-12 h-px bg-terra mx-auto mb-10" />
          <p className="font-body text-base text-foreground/80 leading-[1.9] mb-6" style={{ fontWeight: 400 }}>
            The Circle est né d'une envie simple : créer un espace où l'on vient se reconnecter à soi. Un studio boutique à Casablanca dédié au mouvement conscient, à l'équilibre et au bien-être.
          </p>
          <p className="font-body text-base text-foreground/80 leading-[1.9] mb-6" style={{ fontWeight: 400 }}>
            Nous proposons des séances en <strong className="text-foreground font-medium">petits groupes de 6 personnes maximum</strong>, afin de garantir un accompagnement attentif, précis et sécurisé.
          </p>
          <p className="font-body text-base text-foreground/80 leading-[1.9]" style={{ fontWeight: 400 }}>
            Des cours <strong className="text-foreground font-medium">post-natal et Maman & Bébé</strong> sont également proposés pour accompagner les jeunes mamans dans une reprise douce et bienveillante.
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default StudioSection;
