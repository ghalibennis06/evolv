import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import VertebraLogo from "@/components/brand/VertebraLogo";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404:", location.pathname);
  }, [location.pathname]);

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center relative overflow-hidden"
      style={{ background: "#1C1C1A" }}
    >
      {/* Diagonal spine line — brand decoration */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 1,
          height: "140%",
          background: "linear-gradient(to bottom, transparent 0%, rgba(107,122,92,0.15) 40%, rgba(107,122,92,0.15) 60%, transparent 100%)",
          transform: "rotate(-12deg)",
          left: "50%",
          top: "-20%",
        }}
      />
      <div
        className="absolute pointer-events-none"
        style={{
          width: 1,
          height: "60%",
          background: "linear-gradient(to bottom, transparent, rgba(107,122,92,0.08), transparent)",
          left: "20%",
          top: "20%",
        }}
      />

      <div className="relative z-10 flex flex-col items-center text-center px-8">
        {/* Logo */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          className="mb-16"
        >
          <VertebraLogo size={52} variant="ink" animate showWordmark />
        </motion.div>

        {/* 404 number */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 0.8 }}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 100,
            fontSize: "clamp(100px, 20vw, 180px)",
            lineHeight: 1,
            color: "rgba(107,122,92,0.12)",
            letterSpacing: "-0.02em",
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            zIndex: 0,
            userSelect: "none",
          }}
        >
          404
        </motion.p>

        {/* Eyebrow */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 0.8 }}
          className="brand-label mb-6"
          style={{ color: "#6B7A5C" }}
        >
          Page introuvable
        </motion.div>

        {/* Headline */}
        <motion.h1
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.9, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{
            fontFamily: "'Playfair Display', Georgia, serif",
            fontWeight: 400,
            fontSize: "clamp(28px, 5vw, 48px)",
            color: "#F0EDE8",
            letterSpacing: "0.04em",
            lineHeight: 1.2,
            marginBottom: "16px",
          }}
        >
          Cette page <em style={{ color: "#8A9A78", fontStyle: "italic" }}>n'existe pas.</em>
        </motion.h1>

        {/* Body */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.2, duration: 0.8 }}
          style={{
            fontFamily: "'Outfit', sans-serif",
            fontWeight: 300,
            fontSize: 14,
            color: "#A8A49E",
            letterSpacing: "0.01em",
            lineHeight: 1.9,
            maxWidth: 400,
            marginBottom: 48,
          }}
        >
          Le chemin que vous cherchez a peut-être évolué. Revenez à l'accueil et reprenez depuis le début.
        </motion.p>

        {/* Divider line */}
        <motion.div
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ delay: 2.5, duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
          style={{
            width: 60,
            height: 1,
            background: "linear-gradient(to right, transparent, rgba(107,122,92,0.5), transparent)",
            marginBottom: 40,
          }}
        />

        {/* CTA */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 2.7, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
        >
          <Link
            to="/"
            style={{
              fontFamily: "'Outfit', sans-serif",
              fontWeight: 300,
              fontSize: 10,
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "#F0EDE8",
              border: "1px solid rgba(240,237,232,0.2)",
              padding: "14px 32px",
              display: "inline-block",
              transition: "border-color 0.3s, color 0.3s",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(107,122,92,0.7)";
              (e.currentTarget as HTMLElement).style.color = "#8A9A78";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLElement).style.borderColor = "rgba(240,237,232,0.2)";
              (e.currentTarget as HTMLElement).style.color = "#F0EDE8";
            }}
          >
            Retour à l'accueil
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default NotFound;
