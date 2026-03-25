import { useState, useEffect } from "react";
import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useLocation } from "react-router-dom";
import { api } from "@/lib/api";

// WhatsApp SVG official icon
const WaIcon = () => (
  <svg viewBox="0 0 32 32" width="22" height="22" fill="white" aria-hidden>
    <path d="M16.002 3C9.37 3 4 8.373 4 15.002c0 2.237.615 4.33 1.687 6.119L4 29l8.063-1.663A12.93 12.93 0 0016.002 28C22.63 28 28 22.627 28 15.998 28 9.371 22.63 3 16.002 3zm6.577 18.25a3.42 3.42 0 01-2.224 1.545c-.59.121-1.361.218-3.954-.85-3.315-1.347-5.453-4.707-5.618-4.924-.159-.218-1.334-1.777-1.334-3.39 0-1.614.847-2.406 1.148-2.736.3-.33.654-.413.872-.413.218 0 .436.002.626.012.2.01.47-.076.736.563.27.652.915 2.248 1 2.418.082.17.136.369.027.589-.106.218-.16.355-.318.546-.16.19-.335.425-.479.57-.16.16-.327.334-.14.654.19.32.84 1.386 1.804 2.244 1.24 1.106 2.285 1.449 2.605 1.61.32.16.508.133.696-.08.19-.21.81-.944 1.027-1.266.217-.323.435-.269.735-.162.3.108 1.905.898 2.231 1.062.326.163.544.244.625.382.08.136.08.79-.19 1.553z" />
  </svg>
);

const WhatsAppButton = () => {
  const location = useLocation();
  const [hover, setHover] = useState(false);
  const [waNumber, setWaNumber] = useState("33668710966");
  const [side, setSide] = useState<"left" | "right">("left");
  const [edgePx, setEdgePx] = useState(24);
  const [topPx, setTopPx] = useState(32);

  useEffect(() => {
    api.siteContent.get("contact").then((data) => {
      const c = data?.content as any;
      if (!c) return;
      if (c.whatsapp) setWaNumber(String(c.whatsapp));
      if (c.button_side) setSide(c.button_side);
      if (c.button_edge !== undefined) setEdgePx(Number(c.button_edge));
      if (c.button_top !== undefined) setTopPx(Number(c.button_top));
    }).catch(() => {});
  }, []);

  // Superman spring — très haute masse, très faible raideur
  const baseY = useMotionValue(topPx);
  const smoothY = useSpring(baseY, { stiffness: 10, damping: 50, mass: 12 });

  useEffect(() => {
    const update = () => {
      const scrollable = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
      const progress = Math.min(window.scrollY / scrollable, 1);
      const travel = Math.max(0, window.innerHeight - 48 - 64);
      baseY.set(topPx + progress * travel);
    };
    window.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    update();
    return () => {
      window.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [baseY, location.pathname, topPx]);

  const posStyle: React.CSSProperties =
    side === "left"
      ? { left: edgePx }
      : { right: edgePx };

  return (
    <motion.div
      className="fixed top-0 z-40"
      style={{ ...posStyle, y: smoothY }}
    >
      <div className="relative flex items-center">
        {/* Hover label */}
        <AnimatePresence>
          {hover && (
            <motion.span
              initial={{ opacity: 0, x: side === "left" ? -10 : 10, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: side === "left" ? -8 : 8, scale: 0.97 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
              className="absolute whitespace-nowrap font-body text-[11px] tracking-[0.12em] text-white/90 bg-black/60 backdrop-blur-md px-4 py-2 rounded-full shadow-md pointer-events-none"
              style={{
                top: "50%",
                transform: "translateY(-50%)",
                ...(side === "left" ? { left: "100%", marginLeft: 12 } : { right: "100%", marginRight: 12 }),
              }}
            >
              Écrire sur WhatsApp
            </motion.span>
          )}
        </AnimatePresence>

        {/* Main floating button */}
        <motion.a
          href={`https://wa.me/${waNumber}`}
          target="_blank"
          rel="noopener noreferrer"
          aria-label="Contactez-nous sur WhatsApp"
          className="relative w-12 h-12 rounded-full flex items-center justify-center"
          style={{
            background: "linear-gradient(145deg, #2ECC71 0%, #128C7E 100%)",
            boxShadow: hover
              ? "0 10px 32px rgba(37,211,102,0.42), 0 2px 10px rgba(0,0,0,0.14)"
              : "0 4px 18px rgba(37,211,102,0.28), 0 2px 6px rgba(0,0,0,0.1)",
          }}
          animate={{
            y: [0, -6, 0],
            scale: hover ? 1.1 : 1,
          }}
          transition={{
            y: {
              duration: 4.8,
              repeat: Infinity,
              ease: "easeInOut",
            },
            scale: { type: "spring", stiffness: 280, damping: 18 },
            boxShadow: { duration: 0.4 },
          }}
          onMouseEnter={() => setHover(true)}
          onMouseLeave={() => setHover(false)}
          whileTap={{ scale: 0.9, transition: { duration: 0.12 } }}
        >
          {/* Pulse ring 1 */}
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: "1.5px solid rgba(46,204,113,0.55)" }}
            animate={{ scale: [1, 1.5, 1.5], opacity: [0.6, 0, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeOut", repeatDelay: 0.8 }}
          />
          {/* Pulse ring 2 */}
          <motion.span
            className="absolute inset-0 rounded-full"
            style={{ border: "1px solid rgba(46,204,113,0.3)" }}
            animate={{ scale: [1, 1.8, 1.8], opacity: [0.35, 0, 0] }}
            transition={{ duration: 3.8, repeat: Infinity, ease: "easeOut", delay: 1.4, repeatDelay: 0.8 }}
          />
          <WaIcon />
        </motion.a>
      </div>
    </motion.div>
  );
};

export default WhatsAppButton;
