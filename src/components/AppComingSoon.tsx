import { motion } from "framer-motion";
import { Smartphone } from "lucide-react";

const AppComingSoon = () => {
  return (
    <section className="py-28 px-6 bg-secondary">
      <div className="container mx-auto max-w-3xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.2 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className="border border-border p-10 md:p-14 text-center bg-card"
          style={{ borderRadius: "2px" }}
        >
          <div className="w-14 h-14 border border-terra/30 flex items-center justify-center mx-auto mb-6" style={{ borderRadius: "2px" }}>
            <Smartphone size={24} className="text-terra" />
          </div>
          <p className="font-body text-[11px] tracking-[0.35em] uppercase text-terra mb-4" style={{ fontWeight: 200 }}>
            Bientôt disponible
          </p>
          <h2 className="font-display text-3xl md:text-4xl text-foreground mb-4" style={{ fontWeight: 200, letterSpacing: "0.1em" }}>
            Application Mobile
          </h2>
          <p className="font-body text-base text-muted-foreground max-w-lg mx-auto mb-2 leading-[1.9]" style={{ fontWeight: 300 }}>
            Réservez vos séances, gérez vos crédits et accédez à votre planning directement depuis votre smartphone.
          </p>
          <p className="font-body text-[11px] text-muted-foreground/50 tracking-[0.2em] uppercase" style={{ fontWeight: 200 }}>
            Restez connectés pour le lancement
          </p>
        </motion.div>
      </div>
    </section>
  );
};

export default AppComingSoon;
