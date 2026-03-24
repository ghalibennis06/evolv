import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, CalendarCheck } from "lucide-react";
import { Link } from "react-router-dom";

const BookingPopup = () => {
  const [show, setShow] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (dismissed) return;
    const timer = setTimeout(() => setShow(true), 10000);
    const handleScroll = () => {
      const scrollPercent = window.scrollY / (document.documentElement.scrollHeight - window.innerHeight);
      if (scrollPercent > 0.5) setShow(true);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => { clearTimeout(timer); window.removeEventListener("scroll", handleScroll); };
  }, [dismissed]);

  const handleDismiss = () => { setShow(false); setDismissed(true); };

  return (
    <AnimatePresence>
      {show && !dismissed && (
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 40 }}
          transition={{ duration: 0.4 }}
          className="fixed bottom-24 left-6 right-6 md:left-auto md:right-8 md:max-w-sm z-50"
        >
          <div className="bg-card border border-border p-6 shadow-2xl relative" style={{ borderRadius: "2px" }}>
            <button onClick={handleDismiss} className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors">
              <X size={18} />
            </button>
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 border border-foreground/20 flex items-center justify-center shrink-0" style={{ borderRadius: "2px" }}>
                <CalendarCheck size={20} className="text-terra" />
              </div>
              <div>
                <h4 className="font-display text-lg text-foreground mb-1" style={{ fontWeight: 300 }}>
                  Réservez votre séance
                </h4>
                <p className="font-body text-sm text-muted-foreground mb-4" style={{ fontWeight: 300 }}>
                  Places limitées — réservez dès maintenant.
                </p>
                <Link to="/planning"
                  className="inline-block bg-terra text-warm-white px-5 py-2 font-body text-[10px] tracking-[0.3em] uppercase hover:bg-foreground/80 transition-colors"
                  style={{ fontWeight: 200, borderRadius: "2px" }}>
                  Voir le planning →
                </Link>
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BookingPopup;
