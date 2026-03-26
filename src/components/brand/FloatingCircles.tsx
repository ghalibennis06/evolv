import { motion } from "framer-motion";

const lines = [
  { height: 90,  top: "8%",  left: "6%",   duration: 14, delay: 0,   opacity: 0.18 },
  { height: 120, top: "45%", right: "4%",  duration: 18, delay: 2.5, opacity: 0.14 },
  { height: 70,  bottom: "12%", left: "14%", duration: 12, delay: 1, opacity: 0.16 },
  { height: 100, top: "22%", right: "11%", duration: 16, delay: 4,   opacity: 0.12 },
  { height: 80,  bottom: "20%", right: "18%", duration: 20, delay: 1.5, opacity: 0.13 },
];

const FloatingCircles = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
    {lines.map((l, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          width: 1,
          height: l.height,
          top: (l as any).top,
          left: (l as any).left,
          right: (l as any).right,
          bottom: (l as any).bottom,
          opacity: l.opacity,
          background: "linear-gradient(to bottom, transparent, hsl(var(--foreground)/0.4), transparent)",
        }}
        animate={{ y: [0, -18, 0] }}
        transition={{ duration: l.duration, repeat: Infinity, ease: "easeInOut", delay: l.delay }}
      />
    ))}
  </div>
);

export default FloatingCircles;
