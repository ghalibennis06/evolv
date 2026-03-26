import { useEffect, useRef, useState } from "react";

interface VertebraLogoProps {
  size?: number;
  variant?: "fog" | "ink" | "moss" | "clay" | "theme";
  animate?: boolean;
  showWordmark?: boolean;
  className?: string;
}

const SPINE_LEN   = 52;
const NOTCH_OUTER = 14;
const NOTCH_INNER = 10;

const VARIANTS = {
  fog:   { spine: "#3D4A3E", notch: "#6B7A5C",                 text: "#1C1C1A" },
  ink:   { spine: "#8A9A78", notch: "rgba(138,154,120,0.9)",   text: "#F0EDE8" },
  moss:  { spine: "#F0EDE8", notch: "rgba(240,237,232,0.85)",  text: "#F0EDE8" },
  clay:  { spine: "#F0EDE8", notch: "rgba(240,237,232,0.75)",  text: "#F0EDE8" },
  theme: { spine: "hsl(var(--foreground))", notch: "hsl(var(--muted-foreground))", text: "hsl(var(--foreground))" },
};

const VertebraLogo = ({
  size = 48,
  variant = "fog",
  animate = true,
  showWordmark = true,
  className = "",
}: VertebraLogoProps) => {
  const v = VARIANTS[variant];

  const [spineDrawn,      setSpineDrawn]      = useState(!animate);
  const [notch1,          setNotch1]          = useState(!animate);
  const [notch2,          setNotch2]          = useState(!animate);
  const [notch3,          setNotch3]          = useState(!animate);
  const [notch4,          setNotch4]          = useState(!animate);
  const [wordmarkVisible, setWordmarkVisible] = useState(!animate);
  const [breatheDown,     setBreatheDown]     = useState(false);

  // Intro sequence
  useEffect(() => {
    if (!animate) return;
    const ts = [
      setTimeout(() => setSpineDrawn(true),      100),
      setTimeout(() => setNotch1(true),           600),
      setTimeout(() => setNotch2(true),           750),
      setTimeout(() => setNotch3(true),           900),
      setTimeout(() => setNotch4(true),           1050),
      setTimeout(() => setWordmarkVisible(true),  1150),
    ];
    return () => ts.forEach(clearTimeout);
  }, [animate]);

  // Idle breathe loop — notches pulse after intro settles
  useEffect(() => {
    if (!animate) return;
    let cancelled = false;
    const start = setTimeout(() => {
      if (cancelled) return;
      const loop = setInterval(() => {
        setBreatheDown(d => !d);
      }, 2500);
      return () => clearInterval(loop);
    }, 2000);
    return () => { cancelled = true; clearTimeout(start); };
  }, [animate]);

  const notchOp = (drawn: boolean) => drawn ? (breatheDown ? 0.35 : 0.6) : 0;
  const notchTransition = (drawn: boolean) =>
    drawn
      ? "stroke-dashoffset 0.3s ease-out, opacity 2.4s ease-in-out"
      : "none";

  // SVG dimensions
  const W = showWordmark ? 120 : 20;
  const H = 58;
  const svgW = size * (W / H);
  const svgH = size;

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={svgW}
      height={svgH}
      className={className}
      style={{ display: "block", overflow: "visible" }}
    >
      {/* ── Icon ── */}
      <g transform="translate(10, 29)">
        {/* Spine */}
        <line
          x1="0" y1="-26" x2="0" y2="26"
          stroke={v.spine}
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeDasharray={SPINE_LEN}
          strokeDashoffset={spineDrawn ? 0 : SPINE_LEN}
          style={{ transition: spineDrawn ? "stroke-dashoffset 1.1s cubic-bezier(0.4,0,0.2,1)" : "none" }}
        />
        {/* Notch 1 — top outer */}
        <line
          x1="-7" y1="-16" x2="7" y2="-16"
          stroke={v.notch}
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray={NOTCH_OUTER}
          strokeDashoffset={notch1 ? 0 : NOTCH_OUTER}
          style={{ opacity: notchOp(notch1), transition: notchTransition(notch1) }}
        />
        {/* Notch 2 — inner top */}
        <line
          x1="-5" y1="-5" x2="5" y2="-5"
          stroke={v.notch}
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray={NOTCH_INNER}
          strokeDashoffset={notch2 ? 0 : NOTCH_INNER}
          style={{ opacity: notchOp(notch2), transition: notchTransition(notch2) }}
        />
        {/* Notch 3 — inner bottom */}
        <line
          x1="-5" y1="6" x2="5" y2="6"
          stroke={v.notch}
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray={NOTCH_INNER}
          strokeDashoffset={notch3 ? 0 : NOTCH_INNER}
          style={{ opacity: notchOp(notch3), transition: notchTransition(notch3) }}
        />
        {/* Notch 4 — bottom outer */}
        <line
          x1="-7" y1="17" x2="7" y2="17"
          stroke={v.notch}
          strokeWidth="1"
          strokeLinecap="round"
          strokeDasharray={NOTCH_OUTER}
          strokeDashoffset={notch4 ? 0 : NOTCH_OUTER}
          style={{ opacity: notchOp(notch4), transition: notchTransition(notch4) }}
        />
      </g>

      {/* ── Wordmark ── */}
      {showWordmark && (
        <g
          style={{
            opacity: wordmarkVisible ? 1 : 0,
            transform: wordmarkVisible ? "translateY(0)" : "translateY(5px)",
            transition: wordmarkVisible ? "opacity 0.55s ease-out 0s, transform 0.55s ease-out 0s" : "none",
          }}
        >
          <text
            x="26" y="33"
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

export default VertebraLogo;
