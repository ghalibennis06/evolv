import { useState, useEffect, useRef } from "react";
import { Menu, X, Ticket, Sun, Moon } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import { useTheme } from "next-themes";
import VertebraLogo from "./brand/VertebraLogo";

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

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const onLogoMove = (e: React.MouseEvent) => {
    if (!logoRef.current) return;
    const rect = logoRef.current.getBoundingClientRect();
    const dx = (e.clientX - (rect.left + rect.width / 2)) * 0.1;
    const dy = (e.clientY - (rect.top + rect.height / 2)) * 0.1;
    logoRef.current.style.transform = `translate(${dx}px, ${dy}px) scale(1.05)`;
  };
  const onLogoLeave = () => {
    if (logoRef.current) logoRef.current.style.transform = "translate(0,0) scale(1)";
  };

  const isDarkBg = isHome && !scrolled;
  const textColor = isDarkBg ? "text-white/60" : "text-foreground/55";
  const brandTxt = isDarkBg ? "text-white" : "text-foreground";

  const navBg = scrolled
    ? "bg-background/95 backdrop-blur-md border-b border-border/60 shadow-sm"
    : isHome
      ? "bg-transparent"
      : "bg-background/90 backdrop-blur-sm border-b border-border/40";

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
            <VertebraLogo
              size={42}
              variant={isDarkBg ? "ink" : "fog"}
              animate
              showWordmark
            />
          </div>
        </Link>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-10">
          {links.map((link) => {
            const active = location.pathname === link.href;
            return (
              <Link
                key={link.href}
                to={link.href}
                onClick={scrollTop}
                onMouseEnter={() => setHovered(link.href)}
                onMouseLeave={() => setHovered(null)}
                className={`relative font-body text-[10px] tracking-[0.22em] uppercase transition-colors
                  ${active ? (isDarkBg ? "text-white" : "text-foreground") : textColor}
                  hover:text-foreground`}
                style={{ fontWeight: 400 }}
              >
                {link.label}
                <span
                  className="absolute -bottom-1 left-0 h-px bg-foreground transition-all duration-300"
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
            title={theme === "dark" ? "Mode Clair" : "Mode Sombre"}
            className={`w-9 h-9 flex items-center justify-center rounded-full border border-foreground/15 hover:border-foreground/40 transition-all duration-300 ${isDarkBg ? "text-white/50 hover:text-white border-white/20 hover:border-white/50" : "text-foreground/40 hover:text-foreground"}`}
          >
            {theme === "dark" ? <Sun size={13} /> : <Moon size={13} />}
          </button>
          <Link
            to="/carte-black"
            onClick={scrollTop}
            className={`font-body text-[10px] tracking-[0.2em] uppercase px-5 py-2.5 border transition-all duration-300
              ${isDarkBg
                ? "text-white/80 border-white/20 hover:border-white/50 hover:text-white"
                : "text-foreground border-foreground/20 hover:border-foreground hover:bg-foreground hover:text-background"
              }`}
            style={{ fontWeight: 400 }}
          >
            Carte Signature
          </Link>
          <Link
            to="/planning"
            onClick={scrollTop}
            className={`font-body text-[10px] tracking-[0.2em] uppercase px-6 py-2.5 transition-all duration-300
              ${isDarkBg
                ? "bg-white text-foreground hover:bg-white/90"
                : "bg-foreground text-background hover:bg-foreground/80"
              }`}
            style={{ fontWeight: 500 }}
          >
            Réserver
          </Link>
        </div>

        {/* Burger */}
        <button className={`md:hidden ${brandTxt} transition-colors`} onClick={() => setIsOpen(!isOpen)}>
          {isOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      {/* Mobile menu */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-background border-t border-border overflow-hidden"
          >
            <div className="px-6 py-8 space-y-1">
              <div className="flex justify-center mb-8">
                <VertebraLogo size={56} variant="fog" animate showWordmark />
              </div>
              {links.map((link, i) => (
                <motion.div
                  key={link.href}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.05 }}
                >
                  <Link
                    to={link.href}
                    onClick={() => { setIsOpen(false); scrollTop(); }}
                    className={`block font-body text-[11px] tracking-[0.25em] uppercase py-4 border-b border-border/50 transition-colors
                      ${location.pathname === link.href ? "text-foreground" : "text-muted-foreground hover:text-foreground"}`}
                    style={{ fontWeight: 400 }}
                  >
                    {link.label}
                  </Link>
                </motion.div>
              ))}
              <div className="flex gap-3 pt-6">
                <Link
                  to="/planning"
                  onClick={() => { setIsOpen(false); scrollTop(); }}
                  className="flex-1 text-center bg-foreground text-background py-3.5 font-body text-[10px] tracking-[0.25em] uppercase"
                  style={{ fontWeight: 500 }}
                >
                  Réserver
                </Link>
                <Link
                  to="/carte-black"
                  onClick={() => { setIsOpen(false); scrollTop(); }}
                  className="flex-1 text-center border border-foreground/30 text-foreground py-3.5 font-body text-[10px] tracking-[0.25em] uppercase hover:border-foreground transition-colors"
                  style={{ fontWeight: 400 }}
                >
                  Carte Signature
                </Link>
              </div>
              <Link
                to="/mon-pack"
                onClick={() => { setIsOpen(false); scrollTop(); }}
                className="flex items-center justify-center gap-2 pt-4 font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors"
                style={{ fontWeight: 400 }}
              >
                <Ticket size={12} /> Mon Abonnement
              </Link>
              <button
                onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
                className="flex items-center justify-center gap-2 pt-2 pb-1 font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground hover:text-foreground transition-colors w-full"
                style={{ fontWeight: 400 }}
              >
                {theme === "dark" ? <Sun size={12} /> : <Moon size={12} />}
                {theme === "dark" ? "Mode Clair" : "Mode Sombre"}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </nav>
  );
};

export default Navbar;
