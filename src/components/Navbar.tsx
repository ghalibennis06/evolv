import { useState, useEffect, useRef } from "react";
import { Menu, X, Ticket, Sun, Moon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import MeridianLogo from "./brand/MeridianLogo";

interface NavbarProps {
  onBookClick: () => void;
}

const links = [
  { label: "Planning", href: "/planning" },
  { label: "Coachs", href: "/coachs" },
  { label: "Boutique", href: "/boutique" },
  { label: "Disciplines", href: "/studio" },
];

const scrollTop = () => window.scrollTo({ top: 0, behavior: "smooth" });

const Navbar = ({ onBookClick }: NavbarProps) => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [hovered, setHovered] = useState<string | null>(null);
  const location = useLocation();
  const isHome = location.pathname === "/";
  const logoRef = useRef<HTMLDivElement>(null);
  const { theme, setTheme } = useTheme();

  // ── Scroll to top on every route change ───────────────────────────────────
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // ── Magnetic logo ──────────────────────────────────────────────────────────
  const onLogoMove = (e: React.MouseEvent) => {
    if (!logoRef.current) return;
    const rect = logoRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.12;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.12;
    logoRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(1.06)`;
  };
  const onLogoLeave = () => {
    if (logoRef.current) logoRef.current.style.transform = "translate(0,0) scale(1)";
  };

  const isDarkBg = isHome || scrolled;
  const textColor = isDarkBg ? "text-warm-white/70" : "text-foreground/70";
  const brandTxt = isDarkBg ? "text-warm-white" : "text-foreground";
  const logoVar = isDarkBg ? "dark" : "sand";
  const navBg = scrolled
    ? "bg-dark/95 backdrop-blur-md border-b border-warm-white/5"
    : isHome
      ? "bg-transparent"
      : "bg-background/90 backdrop-blur-sm border-b border-border/50";

  return (
    <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${navBg}`}>
      <div className="container mx-auto px-6 py-3 flex items-center justify-between max-w-[1400px]">
        {/* Brand */}
        <Link
          to="/"
          onClick={scrollTop}
          className="flex items-center gap-3 group"
          onMouseMove={onLogoMove}
          onMouseLeave={onLogoLeave}
        >
          <div ref={logoRef} className="transition-transform duration-300 ease-out">
            {/* Logo bigger: 44 → 52 on hover */}
            <MeridianLogo size={44} variant={logoVar} animate spinDuration={9} glowAnimation />
          </div>
          <div className="flex flex-col leading-none">
            <span
              className={`font-display text-lg tracking-[0.42em] uppercase ${brandTxt} transition-colors`}
              style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 300 }}
            >
              The Circle
            </span>
            <span
              className="font-body text-[8px] tracking-[0.4em] uppercase text-terra transition-colors"
              style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400, marginTop: "2px" }}
            >
              Studio
            </span>
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-8">
          {links.map((link) => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={scrollTop}
                onMouseEnter={() => setHovered(link.href)}
                onMouseLeave={() => setHovered(null)}
                className={`relative font-body text-[11px] tracking-[0.22em] uppercase transition-colors
                  ${active ? "text-terra" : textColor}
                  hover:text-terra`}
                style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400 }}
              >
                {link.label}
                {/* Underline */}
                <span
                  className="absolute -bottom-1 left-0 h-px bg-terra transition-all duration-300"
                  style={{ width: active || hovered === link.href ? "100%" : "0%" }}
                />
              </Link>
            );
          })}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <button
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title={theme === "dark" ? "Mode Sand" : "Mode Nuit"}
            className={`w-9 h-9 flex items-center justify-center rounded-full border border-terra/30 hover:border-terra hover:bg-terra/10 transition-all duration-300 ${isDarkBg ? "text-warm-white/60 hover:text-terra" : "text-foreground/50 hover:text-terra"}`}
          >
            {theme === "dark" ? <Sun size={14} /> : <Moon size={14} />}
          </button>
          <Link
            to="/carte-black"
            onClick={scrollTop}
            className="font-body text-[10px] tracking-[0.25em] uppercase text-warm-white/80 border border-warm-white/20 px-5 py-2.5 rounded-full hover:border-warm-white/50 hover:text-warm-white transition-all duration-300"
            style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400, background: "linear-gradient(135deg, #1a1a1a 0%, #2d1f2a 100%)" }}
          >
            Carte Black
          </Link>
          <Link
            to="/mon-pack"
            onClick={scrollTop}
            className="font-body text-[10px] tracking-[0.25em] uppercase text-terra border border-terra/40 px-5 py-2.5 rounded-full hover:bg-terra hover:text-warm-white transition-all duration-300"
            style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400 }}
          >
            Ma Carte
          </Link>
          <Link
            to="/planning"
            onClick={scrollTop}
            className="font-body text-[10px] tracking-[0.25em] uppercase text-warm-white bg-terra px-5 py-2.5 rounded-full hover:bg-terra-dark hover:shadow-lg hover:shadow-terra/20 transition-all duration-300"
            style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500 }}
          >
            Réserver
          </Link>
        </div>

        {/* Burger */}
        <button className={`md:hidden ${brandTxt} transition-colors`} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={22} /> : <Menu size={22} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-dark border-t border-warm-white/5 overflow-hidden"
          >
            <div className="px-6 py-6 space-y-1">
              <div className="flex justify-center mb-6">
                <MeridianLogo size={48} variant="dark" animate floatAnimation spinDuration={12} />
              </div>
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={link.href}
                    onClick={() => {
                      setIsOpen(false);
                      scrollTop();
                    }}
                    className={`block font-body text-[12px] tracking-[0.25em] uppercase py-3 border-b border-warm-white/5 transition-colors
                      ${location.pathname === link.href ? "text-terra" : "text-warm-white/70 hover:text-terra"}`}
                    style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400 }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="flex gap-3 pt-4">
                <Link
                  to="/planning"
                  onClick={() => { setIsOpen(false); scrollTop(); }}
                  className="flex-1 text-center bg-terra text-warm-white py-3 rounded-full font-body text-[11px] tracking-[0.25em] uppercase"
                  style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 500 }}
                >
                  Réserver
                </Link>
                <Link
                  to="/mon-pack"
                  onClick={() => { setIsOpen(false); scrollTop(); }}
                  className="flex-1 text-center border border-terra text-terra py-3 rounded-full font-body text-[11px] tracking-[0.25em] uppercase"
                  style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400 }}
                >
                  Ma Carte
                </Link>
              </div>
              <Link
                to="/carte-black"
                onClick={() => { setIsOpen(false); scrollTop(); }}
                className="flex items-center justify-center mt-2 py-3 rounded-full font-body text-[11px] tracking-[0.25em] uppercase text-warm-white/80 border border-warm-white/15 hover:border-warm-white/30 transition-colors"
                style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400, background: "linear-gradient(135deg, #1a1a1a 0%, #2d1f2a 100%)" }}
              >
                Carte Black
              </Link>
              <Link
                to="/mon-pack"
                onClick={() => { setIsOpen(false); scrollTop(); }}
                className="flex items-center justify-center gap-2 pt-3 font-body text-[10px] tracking-[0.2em] uppercase text-warm-white/70 hover:text-terra transition-colors"
                style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400 }}
              >
                <Ticket size={12} /> Ma Carte
              </Link>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-center gap-2 pt-2 pb-1 font-body text-[10px] tracking-[0.2em] uppercase text-warm-white/70 hover:text-terra transition-colors w-full"
                style={{ fontFamily: "Montserrat, sans-serif", fontWeight: 400 }}
              >
                {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
                {theme === "dark" ? "Mode Sand" : "Mode Nuit"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
