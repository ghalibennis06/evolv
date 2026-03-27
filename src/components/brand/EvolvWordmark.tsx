import { useEffect, useState } from "react";

interface EvolvWordmarkProps {
  color?: string;
  subColor?: string;
  fontSize?: number;
  animate?: boolean;
  className?: string;
}

// The Ø SVG: viewBox "0 0 90 110", ellipse at (45,55) rx=31 ry=40
// Slash (22,22)→(68,88) — its midpoint is (45,55) = same as ellipse center
const ELLIPSE_LEN = 252;
const SLASH_LEN   = 82;

const EvolvWordmark = ({
  color    = "rgba(242,239,233,0.95)",
  subColor = "rgba(242,239,233,0.55)",
  fontSize = 96,
  animate  = true,
  className = "",
}: EvolvWordmarkProps) => {
  const [phase, setPhase] = useState<"idle" | "slash" | "circle" | "letters" | "subline" | "done">(
    animate ? "idle" : "done"
  );
  const [lettersVisible, setLettersVisible] = useState(!animate);
  const [sublineVisible,  setSublineVisible]  = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    let cancelled = false;
    const seq = async () => {
      await wait(350);  if (cancelled) return;
      setPhase("slash");
      await wait(750);  if (cancelled) return;
      setPhase("circle");
      await wait(950);  if (cancelled) return;
      setPhase("letters"); setLettersVisible(true);
      await wait(850);  if (cancelled) return;
      setSublineVisible(true); setPhase("subline");
      await wait(600);  if (cancelled) return;
      setPhase("done");
    };
    seq();
    return () => { cancelled = true; };
  }, [animate]);

  const slashReady  = phase !== "idle";
  const circleReady = ["circle","letters","subline","done"].includes(phase);
  const orbiting    = phase === "done"; // only after intro settles

  const gap = fontSize * 0.04;

  return (
    <div
      className={`flex flex-col items-center select-none ${className}`}
      style={{ gap: fontSize * 0.22 }}
    >
      {/* ── WORDMARK ROW ── */}
      <div style={{ display: "flex", alignItems: "center", gap, lineHeight: 1 }}>

        <Letter char="E" visible={lettersVisible} delay={80}  fontSize={fontSize} color={color} />
        <Letter char="V" visible={lettersVisible} delay={220} fontSize={fontSize} color={color} />

        {/* Ø — SVG drawn, then continuously animated */}
        <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", margin: `0 ${gap * 0.5}px` }}>
          <svg
            viewBox="0 0 90 110"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            style={{ height: fontSize, width: "auto", overflow: "visible", display: "block" }}
          >
            {/* Ellipse — draws on intro, then gently breathes */}
            <ellipse
              cx="45" cy="55" rx="31" ry="40"
              fill="none"
              stroke={color}
              strokeWidth="2"
              strokeLinecap="round"
              strokeDasharray={ELLIPSE_LEN}
              strokeDashoffset={circleReady ? 0 : ELLIPSE_LEN}
              style={{
                transition: circleReady ? "stroke-dashoffset 0.88s cubic-bezier(0.4,0,0.2,1)" : "none",
                animation: orbiting ? "ellipse-breathe 5s ease-in-out infinite 0.5s" : "none",
              }}
            />

            {/* Slash — draws on intro, then orbits continuously */}
            <g
              style={{
                transformBox: "fill-box",
                transformOrigin: "center",
                animation: orbiting ? "slash-orbit 14s linear infinite" : "none",
              }}
            >
              <line
                x1="22" y1="22" x2="68" y2="88"
                stroke={color}
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray={SLASH_LEN}
                strokeDashoffset={slashReady ? 0 : SLASH_LEN}
                style={{
                  transition: slashReady ? "stroke-dashoffset 0.65s cubic-bezier(0.4,0,0.2,1)" : "none",
                }}
              />
            </g>
          </svg>
        </span>

        <Letter char="L" visible={lettersVisible} delay={220} fontSize={fontSize} color={color} />
        <Letter char="V" visible={lettersVisible} delay={80}  fontSize={fontSize} color={color} />

      </div>

      {/* ── SUBLINE ── */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: fontSize * 0.22,
          opacity: sublineVisible ? 1 : 0,
          transition: "opacity 0.5s ease",
        }}
      >
        <Rule visible={sublineVisible} color={subColor} width={fontSize * 0.75} />
        <span
          style={{
            fontFamily: "'Outfit', Inter, sans-serif",
            fontWeight: 200,
            fontSize: Math.max(10, fontSize * 0.115),
            letterSpacing: "0.28em",
            color: subColor,
            whiteSpace: "nowrap",
            opacity: sublineVisible ? 1 : 0,
            transition: "opacity 0.4s ease 0.18s",
          }}
        >
          Pilates Studio
        </span>
        <Rule visible={sublineVisible} color={subColor} width={fontSize * 0.75} />
      </div>
    </div>
  );
};

// ── Sub-components ──

function Letter({ char, visible, delay: ms, fontSize, color }: {
  char: string; visible: boolean; delay: number; fontSize: number; color: string;
}) {
  return (
    <span
      style={{
        fontFamily: "'Playfair Display', Georgia, serif",
        fontWeight: 400,
        fontSize,
        color,
        lineHeight: 1,
        letterSpacing: "0.04em",
        display: "inline-block",
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(14px)",
        transition: visible
          ? `opacity 0.62s cubic-bezier(0.22,1,0.36,1) ${ms}ms, transform 0.62s cubic-bezier(0.22,1,0.36,1) ${ms}ms`
          : "none",
      }}
    >
      {char}
    </span>
  );
}

function Rule({ visible, color, width }: { visible: boolean; color: string; width: number }) {
  return (
    <div
      style={{
        height: 1,
        background: color,
        width: visible ? width : 0,
        transition: visible ? "width 0.5s cubic-bezier(0.4,0,0.2,1)" : "none",
        opacity: 0.7,
      }}
    />
  );
}

function wait(ms: number) {
  return new Promise<void>(r => setTimeout(r, ms));
}

export default EvolvWordmark;
