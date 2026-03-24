import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

const CookieBanner = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setVisible(true), 1500);
      return () => clearTimeout(timer);
    }
  }, []);

  const accept = (level: string) => {
    localStorage.setItem("cookie-consent", level);
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[999] w-[calc(100vw-48px)] max-w-[560px]"
        >
          <div
            className="bg-dark text-warm-white border border-terra/25 p-5 flex flex-col sm:flex-row items-start sm:items-center gap-4 backdrop-blur-xl"
            style={{ borderRadius: "4px" }}
          >
            <p className="font-body text-[12px] leading-relaxed flex-1" style={{ fontWeight: 200, letterSpacing: "0.05em" }}>
              Nous utilisons des cookies pour améliorer votre expérience.
            </p>
            <div className="flex gap-2 shrink-0">
              <button
                onClick={() => accept("all")}
                className="bg-terra text-warm-white border-none px-4 py-2 font-body text-[10px] tracking-[0.3em] uppercase cursor-pointer transition-colors hover:bg-foreground/80 whitespace-nowrap"
                style={{ fontWeight: 200, borderRadius: "2px" }}
              >
                Tout accepter
              </button>
              <button
                onClick={() => accept("essential")}
                className="bg-transparent border border-white/20 text-white/60 px-4 py-2 font-body text-[10px] tracking-[0.3em] uppercase cursor-pointer transition-colors hover:border-white/40 hover:text-white/80 whitespace-nowrap"
                style={{ fontWeight: 200, borderRadius: "2px" }}
              >
                Essentiels
              </button>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CookieBanner;
