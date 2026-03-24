// Séparateur de section avec logo animé

import MeridianLogo from "./MeridianLogo";
import { motion } from "framer-motion";

interface LogoDividerProps {
  variant?: "dark" | "sand";
  label?: string;
  size?: number;
}

const LogoDivider = ({ variant = "sand", label, size = 32 }: LogoDividerProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.85 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center gap-3 my-2"
  >
    <div className="flex items-center gap-6 w-full max-w-xs">
      <div className="flex-1 h-px bg-terra/15" />
      <MeridianLogo size={size} variant={variant} animate floatAnimation spinDuration={12} />
      <div className="flex-1 h-px bg-terra/15" />
    </div>
    {label && (
      <p className="font-body text-[9px] tracking-[0.4em] uppercase text-terra/60" style={{ fontWeight: 300 }}>
        {label}
      </p>
    )}
  </motion.div>
);

export default LogoDivider;
