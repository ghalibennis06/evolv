import { useEffect, useState } from "react";

interface AscentLogoProps {
  size?: number;
  variant?: "fog" | "ink" | "moss" | "clay" | "theme";
  animate?: boolean;
  showWordmark?: boolean;
  className?: string;
}

const LINE_LEN = 100; // dasharray for each line

const VARIANTS = {
  fog:   { center: "#3D4A3E", flank: "#6B7A5C", dot: "#6B7A5C",  text: "#1C1C1A" },
  ink:   { center: "#8A9A78", flank: "rgba(138,154,120,0.7)",     dot: "#8A9A78",  text: "#F0EDE8" },
  moss:  { center: "#F0EDE8", flank: "rgba(240,237,232,0.65)",    dot: "#F0EDE8",  text: "#F0EDE8" },
  clay:  { center: "#F0EDE8", flank: "rgba(240,237,232,0.65)",    dot: "#F0EDE8",  text: "#F0EDE8" },
  theme: { center: "hsl(var(--foreground))", flank: "hsl(var(--muted-foreground))", dot: "hsl(var(--foreground))", text: "hsl(var(--foreground))" },
};

const AscentLogo = ({
  size = 48,
  variant = "fog",
  animate = true,
  showWordmark = true,
  className = "",
}: AscentLogoProps) => {
  const v = VARIANTS[variant];

  const [line1, setLine1] = useState(!animate);
  const [line2, setLine2] = useState(!animate);
  const [line3, setLine3] = useState(!animate);
  const [dot,   setDot]   = useState(!animate);
  const [wm,    setWm]    = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    const ts = [
      setTimeout(() => setLine1(true), 80),
      setTimeout(() => setLine2(true), 150),
      setTimeout(() => setLine3(true), 400),
      setTimeout(() => setDot(true),   800),
      setTimeout(() => setWm(true),    1000),
    ];
    return () => ts.forEach(clearTimeout);
  }, [animate]);

  const W = showWordmark ? 120 : 28;
  const H = 56;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size * (W / H)}
      height={size}
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* ── Icon ── */}
      <g transform="translate(14, 46)">
        {/* Left flank */}
        <line
          x1="-9" y1="0" x2="-9" y2="-22"
          stroke={v.flank}
          strokeWidth="1.2"
          strokeLinecap="square"
          strokeDasharray={LINE_LEN}
          strokeDashoffset={line1 ? 0 : LINE_LEN}
          style={{ transition: line1 ? "stroke-dashoffset 0.5s ease-out" : "none" }}
        />
        {/* Center (tallest) */}
        <line
          x1="0" y1="0" x2="0" y2="-30"
          stroke={v.center}
          strokeWidth="1.6"
          strokeLinecap="square"
          strokeDasharray={LINE_LEN}
          strokeDashoffset={line2 ? 0 : LINE_LEN}
          style={{ transition: line2 ? "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" : "none" }}
        />
        {/* Right flank */}
        <line
          x1="9" y1="0" x2="9" y2="-22"
          stroke={v.flank}
          strokeWidth="1.2"
          strokeLinecap="square"
          strokeDasharray={LINE_LEN}
          strokeDashoffset={line3 ? 0 : LINE_LEN}
          style={{ transition: line3 ? "stroke-dashoffset 0.5s ease-out" : "none" }}
        />
        {/* Apex dot */}
        <circle
          cx="0" cy="-33" r="2.5"
          fill={v.dot}
          style={{
            opacity: dot ? 1 : 0,
            transform: dot ? "scale(1)" : "scale(0.5)",
            transformOrigin: "0px -33px",
            transition: dot ? "opacity 0.4s cubic-bezier(0.34,1.56,0.64,1), transform 0.4s cubic-bezier(0.34,1.56,0.64,1)" : "none",
          }}
        />
      </g>

      {/* ── Wordmark ── */}
      {showWordmark && (
        <g
          style={{
            opacity: wm ? 1 : 0,
            transform: wm ? "translateY(0)" : "translateY(5px)",
            transition: wm ? "opacity 0.5s ease-out, transform 0.5s ease-out" : "none",
          }}
        >
          <text
            x="30" y="33"
            fontFamily="'Playfair Display', Georgia, serif"
            fontSize="14"
            fontWeight="400"
            fill={v.text}
            letterSpacing="4"
            style={{ userSelect: "none" }}
          >
            EVOLV
          </text>
        </g>
      )}
    </svg>
  );
};

export default AscentLogo;
