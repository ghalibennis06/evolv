import { useEffect, useState, useRef } from "react";

interface MeridianLogoProps {
  size?: number;
  variant?: "dark" | "sand" | "terra" | "burgundy" | "theme";
  animate?: boolean;
  className?: string;
  floatAnimation?: boolean;
  glowAnimation?: boolean;
  spinDuration?: number;
}

// ── Stroke measurements ───────────────────────────────────────────
// Ellipse rx=28 ry=36 centered at (100,100): perimeter ≈ 204
// Slash from (79,70) → (121,130): length ≈ 75
const ELLIPSE_LEN = 204;
const SLASH_LEN   = 75;

const variants = {
  dark:     { ring: "#1C1C1C", text: "#1C1C1C", sub: "#9A9690" },
  sand:     { ring: "#1C1C1C", text: "#1C1C1C", sub: "#9A9690" },
  terra:    { ring: "rgba(242,239,233,0.85)", text: "rgba(242,239,233,0.95)", sub: "rgba(242,239,233,0.45)" },
  burgundy: { ring: "rgba(242,239,233,0.7)",  text: "rgba(242,239,233,0.88)", sub: "rgba(242,239,233,0.4)" },
  theme:    { ring: "hsl(var(--foreground))",  text: "hsl(var(--foreground))",  sub: "hsl(var(--muted-foreground))" },
};

const MeridianLogo = ({
  size        = 60,
  variant     = "dark",
  animate     = true,
  className   = "",
  floatAnimation  = false,
  glowAnimation   = false,
  spinDuration    = 12,
}: MeridianLogoProps) => {
  const v = variants[variant];

  // ── Draw animation state ─────────────────────────────────────────
  const [slashDrawn,  setSlashDrawn]  = useState(!animate);
  const [circleDrawn, setCircleDrawn] = useState(!animate);

  useEffect(() => {
    if (!animate) return;
    setSlashDrawn(false);
    setCircleDrawn(false);
    const t1 = setTimeout(() => setSlashDrawn(true),  400);   // slash: starts at 400ms
    const t2 = setTimeout(() => setCircleDrawn(true), 1050);  // circle: after slash completes
    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, [animate]);

  // ── Orbital physics ──────────────────────────────────────────────
  const [loaded, setLoaded] = useState(!animate);

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setLoaded(true), 200);
      return () => clearTimeout(t);
    }
  }, [animate]);

  const arcRef      = useRef<SVGCircleElement>(null);
  const dotGroupRef = useRef<SVGGElement>(null);
  const svgRef      = useRef<SVGSVGElement>(null);
  const angleRef    = useRef(0);
  const speedRef    = useRef(360 / spinDuration);
  const targetRef   = useRef(360 / spinDuration);
  const lastMouseRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const isInsideRef  = useRef(false);
  const rafRef       = useRef<number>(0);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    if (!loaded) return;
    const BASE = 360 / spinDuration;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      const spring = isInsideRef.current ? 2.0 : 0.7;
      speedRef.current += (targetRef.current - speedRef.current) * Math.min(dt * spring, 1);
      angleRef.current += speedRef.current * dt;
      if (dotGroupRef.current) dotGroupRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      const sp = Math.max(0, Math.min((speedRef.current - BASE) / (400 - BASE), 1));
      if (arcRef.current) arcRef.current.style.opacity = String(0.15 + sp * 0.4);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loaded, spinDuration]);

  useEffect(() => {
    if (!loaded) return;
    const BASE = 360 / spinDuration;

    const onMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const margin = rect.width * 0.35;
      const inside =
        e.clientX >= rect.left - margin && e.clientX <= rect.right + margin &&
        e.clientY >= rect.top  - margin && e.clientY <= rect.bottom + margin;

      if (inside !== isInsideRef.current) {
        isInsideRef.current = inside;
        setHovered(inside);
        if (!inside) { targetRef.current = BASE; lastMouseRef.current = null; }
      }

      if (inside) {
        const now = performance.now();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top  + rect.height / 2;
        if (lastMouseRef.current) {
          const dt = (now - lastMouseRef.current.t) / 1000;
          if (dt > 0.005) {
            const dx = e.clientX - lastMouseRef.current.x;
            const dy = e.clientY - lastMouseRef.current.y;
            const rx = e.clientX - cx, ry = e.clientY - cy;
            const r  = Math.sqrt(rx * rx + ry * ry);
            if (r > 6) {
              const tx = -ry / r, ty = rx / r;
              const vel = Math.abs(dx * tx + dy * ty) / dt;
              if (vel > 6) targetRef.current = Math.min(BASE + vel * 0.3, 280);
            }
          }
        }
        lastMouseRef.current = { x: e.clientX, y: e.clientY, t: now };
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    return () => window.removeEventListener("mousemove", onMove);
  }, [loaded, spinDuration]);

  const cls = [
    className,
    floatAnimation ? "animate-float-slow" : "",
    glowAnimation  ? "animate-logo-glow"  : "",
  ].filter(Boolean).join(" ");

  // ── Subtext opacity — only visible at larger sizes (handled by SVG scaling) ─
  const subtextOpacity = loaded ? 1 : 0;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={cls}
      style={{ display: "block", cursor: "grab", overflow: "visible" }}
    >
      {/* ── Outer orbit ring ──────────────────────────────────────── */}
      <circle
        cx="100" cy="100" r="90"
        stroke={v.ring} strokeWidth="1" fill="none"
        style={{ opacity: hovered ? 0.75 : 0.4, transition: "opacity 0.5s" }}
      />

      {/* Speed-reactive dashed arc */}
      <circle
        ref={arcRef}
        cx="100" cy="100" r="90"
        stroke={v.ring} strokeWidth="0.5" fill="none"
        strokeDasharray="6 14"
        style={{ opacity: 0.15 }}
      />

      {/* Orbiting dot */}
      <g ref={dotGroupRef} style={{ transformOrigin: "100px 100px" }}>
        <circle cx="100" cy="10" r={hovered ? 3 : 2.5} fill={v.ring}
          style={{ opacity: hovered ? 0.9 : 0.65, transition: "r 0.3s, opacity 0.3s" }} />
      </g>

      {/* ── Ø MARK — SVG-drawn ellipse + slash ───────────────────── */}

      {/* Slash line — draws first */}
      <line
        x1="79" y1="70" x2="121" y2="130"
        stroke={v.ring} strokeWidth="1.5" strokeLinecap="round"
        strokeDasharray={SLASH_LEN}
        strokeDashoffset={slashDrawn ? 0 : SLASH_LEN}
        style={{ transition: slashDrawn ? "stroke-dashoffset 0.6s cubic-bezier(0.4,0,0.2,1)" : "none" }}
      />

      {/* Ellipse — draws after slash */}
      <ellipse
        cx="100" cy="100" rx="28" ry="36"
        fill="none" stroke={v.ring} strokeWidth="1.5" strokeLinecap="round"
        strokeDasharray={ELLIPSE_LEN}
        strokeDashoffset={circleDrawn ? 0 : ELLIPSE_LEN}
        style={{ transition: circleDrawn ? "stroke-dashoffset 0.85s cubic-bezier(0.4,0,0.2,1) 0.05s" : "none" }}
      />

      {/* ── Wordmark — only readable at sizes ≥ 120px ────────────── */}
      <g style={{ opacity: subtextOpacity, transition: "opacity 0.8s 1.8s" }}>
        {/* EVØLV */}
        <text
          x="100" y="153"
          textAnchor="middle"
          fontFamily="'Playfair Display', Georgia, serif"
          fontWeight="400"
          fontSize="22"
          letterSpacing="5"
          fill={v.text}
          style={{ userSelect: "none" }}
        >
          EV&#216;LV
        </text>

        {/* Hairline dividers */}
        <line x1="44" y1="162" x2="72" y2="162" stroke={v.sub} strokeWidth="0.6" opacity="0.7" />
        <line x1="128" y1="162" x2="156" y2="162" stroke={v.sub} strokeWidth="0.6" opacity="0.7" />

        {/* PILATES STUDIO */}
        <text
          x="100" y="174"
          textAnchor="middle"
          fontFamily="'DM Sans', Inter, sans-serif"
          fontWeight="400"
          fontSize="6.5"
          letterSpacing="3.2"
          fill={v.sub}
          style={{ userSelect: "none" }}
        >
          PILATES STUDIO
        </text>
      </g>
    </svg>
  );
};

export default MeridianLogo;
