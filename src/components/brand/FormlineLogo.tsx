import { useEffect, useState } from "react";

interface FormlineLogoProps {
  size?: number;
  variant?: "fog" | "ink" | "bone" | "moss" | "theme";
  animate?: boolean;
  showWordmark?: boolean;
  className?: string;
}

// Outer near-circle perimeter ≈ 138 (gap ≈ 1.5)
// Inner near-circle perimeter ≈ 81 (gap ≈ 1.5)
const OUTER_LEN = 137;
const INNER_LEN = 80;

const VARIANTS = {
  fog:   { outer: "#3D4A3E", inner: "#6B7A5C",               dot: "#6B7A5C",  text: "#1C1C1A" },
  ink:   { outer: "#8A9A78", inner: "rgba(138,154,120,0.45)",dot: "#8A9A78",  text: "#F0EDE8" },
  bone:  { outer: "#3D4A3E", inner: "rgba(61,74,62,0.4)",    dot: "#6B7A5C",  text: "#1C1C1A" },
  moss:  { outer: "#F0EDE8", inner: "rgba(240,237,232,0.4)", dot: "#F0EDE8",  text: "#F0EDE8" },
  theme: { outer: "hsl(var(--foreground))", inner: "hsl(var(--muted-foreground))", dot: "hsl(var(--foreground))", text: "hsl(var(--foreground))" },
};

const FormlineLogo = ({
  size = 48,
  variant = "fog",
  animate = true,
  showWordmark = true,
  className = "",
}: FormlineLogoProps) => {
  const v = VARIANTS[variant];

  const [outerDrawn, setOuterDrawn] = useState(!animate);
  const [innerDrawn, setInnerDrawn] = useState(!animate);
  const [dotVisible, setDotVisible] = useState(!animate);
  const [wmVisible,  setWmVisible]  = useState(!animate);

  // Idle breathe: inner opacity pulses
  const [breatheDown, setBreatheDown] = useState(false);

  useEffect(() => {
    if (!animate) return;
    const ts = [
      setTimeout(() => setOuterDrawn(true), 100),
      setTimeout(() => setInnerDrawn(true), 550),
      setTimeout(() => setDotVisible(true), 1100),
      setTimeout(() => setWmVisible(true),  1600),
    ];
    return () => ts.forEach(clearTimeout);
  }, [animate]);

  // After intro, inner echo breathes
  useEffect(() => {
    if (!animate) return;
    let id: ReturnType<typeof setInterval>;
    const t = setTimeout(() => {
      id = setInterval(() => setBreatheDown(d => !d), 3000);
    }, 2500);
    return () => { clearTimeout(t); clearInterval(id); };
  }, [animate]);

  const innerOp = innerDrawn ? (breatheDown ? 0.15 : 0.45) : 0;

  const W = showWordmark ? 130 : 52;
  const H = 52;

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
      {/* ── Icon — centered at (26, 26) ── */}
      <g transform="translate(26, 26) rotate(-90)">
        {/* Outer open loop — gap at 12 o'clock (top) via rotate(-90) */}
        <path
          d="M 0,-22 C 12,-22 22,-12 22,0 C 22,12 12,22 0,22 C -12,22 -22,12 -22,0 C -22,-12 -12,-22 0,-22"
          stroke={v.outer}
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeDasharray={`${OUTER_LEN} 1.5`}
          strokeDashoffset={outerDrawn ? 0 : OUTER_LEN}
          style={{ transition: outerDrawn ? "stroke-dashoffset 1.0s cubic-bezier(0.4,0,0.2,1)" : "none" }}
        />
        {/* Inner echo */}
        <path
          d="M 0,-13 C 7,-13 13,-7 13,0 C 13,7 7,13 0,13 C -7,13 -13,7 -13,0 C -13,-7 -7,-13 0,-13"
          stroke={v.inner}
          strokeWidth="0.8"
          strokeLinecap="round"
          strokeDasharray={`${INNER_LEN} 1.5`}
          strokeDashoffset={innerDrawn ? 0 : INNER_LEN}
          style={{
            opacity: innerOp,
            transition: innerDrawn
              ? "stroke-dashoffset 0.7s cubic-bezier(0.25,0.1,0.25,1), opacity 2.8s ease-in-out"
              : "none",
          }}
        />
        {/* Accent dot at break point (12 o'clock = top, which is x=0,y=-22 before rotate) */}
        {/* After rotate(-90), 12 o'clock is at x=-22,y=0 → dot at x=0,y=-22 in pre-rotate coords = x=-22,y=0 after */}
        {/* So in rotated space: the gap is at the "left" of the unrotated SVG = top of rendered icon */}
        <circle
          cx="0" cy="-22" r="2.8"
          fill={v.dot}
          style={{
            opacity: dotVisible ? 1 : 0,
            transform: dotVisible ? "scale(1)" : "scale(0.5)",
            transformOrigin: "0px -22px",
            transition: dotVisible
              ? "opacity 0.35s cubic-bezier(0.34,1.56,0.64,1), transform 0.35s cubic-bezier(0.34,1.56,0.64,1)"
              : "none",
          }}
        />
      </g>

      {/* ── Wordmark ── */}
      {showWordmark && (
        <g
          style={{
            opacity: wmVisible ? 1 : 0,
            transform: wmVisible ? "translateY(0)" : "translateY(5px)",
            transition: wmVisible ? "opacity 0.55s ease-out, transform 0.55s ease-out" : "none",
          }}
        >
          <text
            x="58" y="30"
            fontFamily="'Playfair Display', Georgia, serif"
            fontSize="13"
            fontWeight="400"
            fontStyle="italic"
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

export default FormlineLogo;
