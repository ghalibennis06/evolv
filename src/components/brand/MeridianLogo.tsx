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

const variants = {
  dark: { circle: "#1C1C1C", text: "#1C1C1C", sub: "#8B8278" },
  sand: { circle: "#1C1C1C", text: "#1C1C1C", sub: "#8B8278" },
  terra: { circle: "rgba(249,246,241,0.9)", text: "rgba(249,246,241,0.95)", sub: "rgba(249,246,241,0.65)" },
  burgundy: { circle: "rgba(249,246,241,0.75)", text: "rgba(249,246,241,0.9)", sub: "rgba(249,246,241,0.5)" },
  theme: { circle: "hsl(var(--foreground))", text: "hsl(var(--foreground))", sub: "hsl(var(--muted-foreground))" },
};

const MeridianLogo = ({
  size = 60,
  variant = "dark",
  animate = true,
  className = "",
  floatAnimation = false,
  glowAnimation = false,
  spinDuration = 12,
}: MeridianLogoProps) => {
  const v = variants[variant];
  const [loaded, setLoaded] = useState(!animate);
  const [hovered, setHovered] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const arcRef = useRef<SVGCircleElement>(null);
  const dotGroupRef = useRef<SVGGElement>(null);

  const angleRef = useRef(0);
  const speedRef = useRef(360 / spinDuration);
  const targetSpeedRef = useRef(360 / spinDuration);
  const lastMouseRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const rafRef = useRef<number>(0);
  const isInsideRef = useRef(false);

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setLoaded(true), 100);
      return () => clearTimeout(t);
    }
  }, [animate]);

  useEffect(() => {
    if (!loaded) return;
    let lastTime = performance.now();
    const BASE = 360 / spinDuration;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      const spring = isInsideRef.current ? 2.0 : 0.7;
      speedRef.current += (targetSpeedRef.current - speedRef.current) * Math.min(dt * spring, 1);

      angleRef.current += speedRef.current * dt;
      if (dotGroupRef.current) {
        dotGroupRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }

      const speedPct = Math.min((speedRef.current - BASE) / (400 - BASE), 1);
      const sp = Math.max(0, speedPct);

      if (arcRef.current) {
        arcRef.current.style.opacity = String(0.18 + sp * 0.4);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loaded, spinDuration]);

  useEffect(() => {
    if (!loaded) return;
    const BASE = 360 / spinDuration;

    const onGlobalMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const margin = rect.width * 0.3;
      const inside =
        e.clientX >= rect.left - margin &&
        e.clientX <= rect.right + margin &&
        e.clientY >= rect.top - margin &&
        e.clientY <= rect.bottom + margin;

      if (inside !== isInsideRef.current) {
        isInsideRef.current = inside;
        if (inside) {
          setHovered(true);
        } else {
          setHovered(false);
          targetSpeedRef.current = BASE;
          lastMouseRef.current = null;
        }
      }

      if (inside) {
        const now = performance.now();
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        if (lastMouseRef.current) {
          const dt = (now - lastMouseRef.current.t) / 1000;
          if (dt > 0.005) {
            const dx = e.clientX - lastMouseRef.current.x;
            const dy = e.clientY - lastMouseRef.current.y;
            const rx = e.clientX - cx;
            const ry = e.clientY - cy;
            const r = Math.sqrt(rx * rx + ry * ry);
            if (r > 6) {
              const tx = -ry / r;
              const ty = rx / r;
              const tangVel = (dx * tx + dy * ty) / dt;
              const absVel = Math.abs(tangVel);
              if (absVel > 6) {
                targetSpeedRef.current = Math.min(BASE + absVel * 0.3, 280);
              }
            }
          }
        }
        lastMouseRef.current = { x: e.clientX, y: e.clientY, t: now };
      }
    };

    window.addEventListener("mousemove", onGlobalMove, { passive: true });
    return () => window.removeEventListener("mousemove", onGlobalMove);
  }, [loaded, spinDuration]);

  const wrapperClass = [className, floatAnimation ? "animate-float-slow" : "", glowAnimation ? "animate-logo-glow" : ""]
    .filter(Boolean)
    .join(" ");

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={wrapperClass}
      style={{ display: "block", cursor: "grab", overflow: "visible" }}
    >
      {/* Outer circle — main brand ring */}
      <circle
        cx="100"
        cy="100"
        r="90"
        fill="none"
        stroke={v.circle}
        strokeWidth="1"
        style={{ opacity: hovered ? 0.8 : 0.5, transition: "opacity 0.4s" }}
      />

      {/* Speed-reactive arc ring */}
      <circle
        ref={arcRef}
        cx="100"
        cy="100"
        r="90"
        fill="none"
        stroke={v.circle}
        strokeWidth="0.5"
        strokeDasharray="8 12"
        style={{ opacity: 0.18, transition: "opacity 0.3s" }}
      />

      {/* Orbiting dot */}
      <g ref={dotGroupRef} style={{ transformOrigin: "100px 100px" }}>
        <circle cx="100" cy="10" r="2.5" fill={v.circle} opacity="0.7" />
      </g>

      {/* EVØLV wordmark */}
      <text
        x="100"
        y="95"
        textAnchor="middle"
        fontFamily="'Playfair Display', Georgia, serif"
        fontWeight="400"
        fontSize="28"
        letterSpacing="6"
        fill={v.text}
        style={{ userSelect: "none" }}
      >
        EV&#216;LV
      </text>

      {/* Hairline dividers */}
      <line x1="45" y1="108" x2="78" y2="108" stroke={v.sub} strokeWidth="0.75" opacity="0.6" />
      <line x1="122" y1="108" x2="155" y2="108" stroke={v.sub} strokeWidth="0.75" opacity="0.6" />

      {/* Pilates Studio subtitle */}
      <text
        x="100"
        y="124"
        textAnchor="middle"
        fontFamily="'DM Sans', Inter, sans-serif"
        fontWeight="400"
        fontSize="8"
        letterSpacing="3.5"
        fill={v.sub}
        style={{ userSelect: "none" }}
      >
        PILATES STUDIO
      </text>
    </svg>
  );
};

export default MeridianLogo;
