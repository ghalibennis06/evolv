import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarCheck } from "lucide-react";

const FloatingBookButton = () => (
  <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 3.5 }}>
    <Link
      to="/planning"
      className="fixed bottom-6 right-6 z-40 bg-terra text-warm-white px-6 py-4 rounded-full font-body text-[11px] tracking-[0.3em] uppercase shadow-lg hover:shadow-xl hover:bg-terra-dark transition-all flex items-center gap-2 animate-pulse-soft"
      style={{ fontWeight: 500 }}
    >
      <CalendarCheck size={16} />
      Réserver
    </Link>
  </motion.div>
);

export default FloatingBookButton;
