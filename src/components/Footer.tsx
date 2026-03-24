import { Link, useLocation } from "react-router-dom";
import MeridianLogo from "./brand/MeridianLogo";
import { motion } from "framer-motion";
import { Instagram, MapPin, Phone } from "lucide-react";

const Footer = () => {
  const location = useLocation();
  const isContactPage = location.pathname === "/contact";
  return (
  <footer className="pt-24 pb-10 px-6 bg-secondary relative overflow-hidden">
    <div className="container mx-auto max-w-[1200px] relative z-10">
      <div className="grid md:grid-cols-3 gap-12 mb-16">
        {/* Brand column */}
        <div className="flex flex-col items-start md:items-center gap-4">
          <motion.div whileHover={{ scale: 1.05 }} transition={{ type: "spring", stiffness: 300 }}>
            <MeridianLogo size={56} variant="theme" animate floatAnimation glowAnimation spinDuration={11} />
          </motion.div>
          <div className="text-center md:text-left">
            <p className="font-display text-xl tracking-[0.42em] uppercase text-foreground" style={{ fontWeight: 300 }}>
              The Circle
            </p>
            <p className="font-body text-[9px] tracking-[0.4em] uppercase text-primary mt-1" style={{ fontWeight: 300 }}>
              Studio · El Menzeh · Rabat
            </p>
          </div>
        </div>

        {/* Links */}
        <div className="flex flex-col gap-3">
          <p className="font-body text-[9px] tracking-[0.35em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 300 }}>
            Navigation
          </p>
          {[
            { label: "Planning", href: "/planning" },
            { label: "Réserver", href: "/reserver" },
            { label: "Carte Black", href: "/carte-black" },
            { label: "Boutique", href: "/boutique" },
            { label: "Boissons", href: "/boissons" },
            { label: "Nos Coachs", href: "/coachs" },
          ].map((link) => (
            <Link
              key={link.href}
              to={link.href}
              className="font-body text-[12px] tracking-[0.15em] text-foreground hover:text-primary transition-colors"
              style={{ fontWeight: 300 }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Contact */}
        <div className="flex flex-col gap-4">
          <p className="font-body text-[9px] tracking-[0.35em] uppercase text-muted-foreground mb-2" style={{ fontWeight: 300 }}>
            Contact
          </p>
          <div className="flex items-start gap-3 text-foreground">
            <MapPin size={14} className="shrink-0 text-primary mt-0.5" />
            <p className="font-body text-[12px] leading-relaxed" style={{ fontWeight: 300 }}>
              El Menzeh, Rabat
              <br />
              Maroc
            </p>
          </div>
          <a
            href="https://wa.me/212600000000"
            className="flex items-center gap-3 text-foreground hover:text-primary transition-colors group"
          >
            <Phone size={14} className="shrink-0 text-primary" />
            <p className="font-body text-[12px]" style={{ fontWeight: 300 }}>
              WhatsApp Studio
            </p>
          </a>
          <a
            href="https://instagram.com"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-3 text-foreground hover:text-primary transition-colors"
          >
            <Instagram size={14} className="shrink-0 text-primary" />
            <p className="font-body text-[12px]" style={{ fontWeight: 300 }}>
              @thecircle.studio
            </p>
          </a>
        </div>
      </div>

      {/* Contact CTA */}
      <div className="mb-12 flex flex-col sm:flex-row items-center justify-center gap-4 py-8 rounded-2xl border border-terra/20 bg-terra/5">
        <div className="text-center sm:text-left">
          <p className="font-body text-[10px] tracking-[0.35em] uppercase text-terra mb-1" style={{ fontWeight: 500 }}>Venez nous voir</p>
          <p className="font-display text-foreground text-xl" style={{ fontWeight: 200, letterSpacing: "0.04em" }}>El Menzeh, Rabat · Maroc</p>
        </div>
        {isContactPage ? (
          <button
            onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
            className="font-body text-[11px] tracking-[0.25em] uppercase bg-terra text-warm-white px-7 py-3 rounded-full hover:bg-terra/90 transition-all"
            style={{ fontWeight: 500 }}
          >
            Haut de page ↑
          </button>
        ) : (
          <Link
            to="/contact"
            className="font-body text-[11px] tracking-[0.25em] uppercase bg-terra text-warm-white px-7 py-3 rounded-full hover:bg-terra/90 transition-all"
            style={{ fontWeight: 500 }}
          >
            Nous contacter →
          </Link>
        )}
      </div>

      <div className="w-full h-px bg-border mb-8" />

      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        <p
          className="font-body text-[10px] tracking-[0.2em] uppercase text-muted-foreground text-center"
          style={{ fontWeight: 200 }}
        >
          © 2026 The Circle Studio · Tous droits réservés
        </p>
        <div className="flex gap-6">
          <Link
            to="/contact"
            className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors"
            style={{ fontWeight: 200 }}
          >
            Contact
          </Link>
          <Link
            to="/studio"
            className="font-body text-[10px] tracking-[0.15em] uppercase text-muted-foreground hover:text-primary transition-colors"
            style={{ fontWeight: 200 }}
          >
            À propos
          </Link>
        </div>
      </div>
    </div>
  </footer>
  );
};

export default Footer;
