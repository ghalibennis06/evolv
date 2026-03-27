import { Link, useLocation } from "react-router-dom";
import VertebraLogo from "./brand/VertebraLogo";
import { motion } from "framer-motion";
import { Instagram, MapPin, Phone } from "lucide-react";

const Footer = () => {
  const location = useLocation();
  const isContactPage = location.pathname === "/contact";
  return (
    <footer className="pt-24 pb-10 px-6 bg-foreground relative overflow-hidden">
      <div className="container mx-auto max-w-[1200px] relative z-10">
        <div className="grid md:grid-cols-3 gap-12 mb-16">
          {/* Brand column */}
          <div className="flex flex-col items-start md:items-center gap-5">
            <motion.div whileHover={{ scale: 1.04 }} transition={{ type: "spring", stiffness: 300 }}>
              <VertebraLogo size={56} variant="ink" animate showWordmark />
            </motion.div>
          </div>

          {/* Links */}
          <div className="flex flex-col gap-3">
            <p className="font-body text-[9px] tracking-[0.35em] uppercase text-white/55 mb-3" style={{ fontWeight: 400 }}>
              Navigation
            </p>
            {[
              { label: "Planning", href: "/planning" },
              { label: "Réserver", href: "/reserver" },
              { label: "Carte Signature", href: "/carte-black" },
              { label: "Boutique", href: "/boutique" },
              { label: "Boissons", href: "/boissons" },
              { label: "Nos Coachs", href: "/coachs" },
            ].map((link) => (
              <Link
                key={link.href}
                to={link.href}
                className="font-body text-[12px] tracking-[0.1em] text-white/50 hover:text-white transition-colors"
                style={{ fontWeight: 300 }}
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Contact */}
          <div className="flex flex-col gap-4">
            <p className="font-body text-[9px] tracking-[0.35em] uppercase text-white/55 mb-3" style={{ fontWeight: 400 }}>
              Contact
            </p>
            <div className="flex items-start gap-3 text-white/50">
              <MapPin size={13} className="shrink-0 text-white/55 mt-0.5" />
              <p className="font-body text-[12px] leading-relaxed" style={{ fontWeight: 300 }}>
                Casablanca, Maroc
              </p>
            </div>
            <a
              href="https://wa.me/212600000000"
              className="flex items-center gap-3 text-white/50 hover:text-white transition-colors group"
            >
              <Phone size={13} className="shrink-0 text-white/55" />
              <p className="font-body text-[12px]" style={{ fontWeight: 300 }}>
                WhatsApp Studio
              </p>
            </a>
            <a
              href="https://instagram.com"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 text-white/50 hover:text-white transition-colors"
            >
              <Instagram size={13} className="shrink-0 text-white/55" />
              <p className="font-body text-[12px]" style={{ fontWeight: 300 }}>
                @evolv.studio
              </p>
            </a>
          </div>
        </div>

        {/* Contact CTA */}
        <div className="mb-12 flex flex-col sm:flex-row items-center justify-between gap-6 py-8 px-8 border border-white/10">
          <div>
            <p className="font-body text-[9px] tracking-[0.35em] uppercase text-white/55 mb-1" style={{ fontWeight: 400 }}>Venez nous découvrir</p>
            <p className="font-display text-white text-xl" style={{ fontWeight: 400, letterSpacing: "0.02em" }}>Casablanca · Maroc</p>
          </div>
          {isContactPage ? (
            <button
              onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
              className="font-body text-[10px] tracking-[0.2em] uppercase border border-white/20 text-white/60 px-7 py-3 hover:border-white/50 hover:text-white transition-all"
              style={{ fontWeight: 400 }}
            >
              Haut de page ↑
            </button>
          ) : (
            <Link
              to="/contact"
              className="font-body text-[10px] tracking-[0.2em] uppercase border border-white/20 text-white/60 px-7 py-3 hover:border-white/50 hover:text-white transition-all"
              style={{ fontWeight: 400 }}
            >
              Nous contacter →
            </Link>
          )}
        </div>

        <div className="w-full h-px bg-white/12 mb-8" />

        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="font-body text-[10px] tracking-[0.2em] uppercase text-white/45 text-center" style={{ fontWeight: 300 }}>
            © 2026 EVØLV Studio · Tous droits réservés
          </p>
          <div className="flex gap-6">
            <Link to="/contact" className="font-body text-[10px] tracking-[0.15em] uppercase text-white/45 hover:text-white/50 transition-colors" style={{ fontWeight: 300 }}>
              Contact
            </Link>
            <Link to="/studio" className="font-body text-[10px] tracking-[0.15em] uppercase text-white/45 hover:text-white/50 transition-colors" style={{ fontWeight: 300 }}>
              À propos
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
