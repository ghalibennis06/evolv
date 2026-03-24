/**
 * FloatingCircles — background ambient animation.
 * Uses MeridianLogo so every floating circle has the orbiting dot.
 */
import { motion } from "framer-motion";
import MeridianLogo from "@/components/brand/MeridianLogo";

const circles = [
  { size: 340, top: "6%", left: "-14%", duration: 48, delay: 0, opacity: 0.07 },
  { size: 240, top: "55%", right: "-8%", duration: 36, delay: 2, opacity: 0.08 },
  { size: 180, bottom: "10%", left: "5%", duration: 52, delay: 5, opacity: 0.06 },
  { size: 120, top: "30%", right: "5%", duration: 32, delay: 1, opacity: 0.09 },
  { size: 290, bottom: "5%", right: "8%", duration: 58, delay: 3, opacity: 0.06 },
];

const FloatingCircles = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden" style={{ zIndex: -1 }}>
    {circles.map((c, i) => (
      <motion.div
        key={i}
        className="absolute"
        style={{
          width: c.size,
          height: c.size,
          top: (c as any).top,
          left: (c as any).left,
          right: (c as any).right,
          bottom: (c as any).bottom,
          opacity: c.opacity,
        }}
        animate={{ rotate: 360 }}
        transition={{ duration: c.duration, repeat: Infinity, ease: "linear", delay: c.delay }}
      >
        {/* Use the iconic logo so every circle has the orbiting dot */}
        <MeridianLogo size={c.size} variant="theme" animate spinDuration={c.duration * 0.7} />
      </motion.div>
    ))}
  </div>
);

export default FloatingCircles;
