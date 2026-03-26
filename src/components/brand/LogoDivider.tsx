import VertebraLogo from "./VertebraLogo";
import { motion } from "framer-motion";

interface LogoDividerProps {
  variant?: "dark" | "sand";
  label?: string;
  size?: number;
}

const LogoDivider = ({ variant = "sand", label, size = 32 }: LogoDividerProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    whileInView={{ opacity: 1, scale: 1 }}
    viewport={{ once: true, amount: 0.5 }}
    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
    className="flex flex-col items-center gap-3 my-2"
  >
    <div className="flex items-center gap-8 w-full max-w-sm">
      <div className="flex-1 h-px bg-foreground/10" />
      <VertebraLogo size={size} variant="fog" animate showWordmark={false} />
      <div className="flex-1 h-px bg-foreground/10" />
    </div>
    {label && (
      <p className="font-body text-[9px] tracking-[0.4em] uppercase text-muted-foreground/60" style={{ fontWeight: 400 }}>
        {label}
      </p>
    )}
  </motion.div>
);

export default LogoDivider;
