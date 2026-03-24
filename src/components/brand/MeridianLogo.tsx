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
  dark: { ring: "#B8634A", dot: "#B8634A", ghost: "rgba(184,99,74,0.06)" },
  sand: { ring: "#1A1714", dot: "#B8634A", ghost: "rgba(26,23,20,0.06)" },
  terra: { ring: "rgba(250,246,241,0.85)", dot: "rgba(250,246,241,0.9)", ghost: "rgba(250,246,241,0.06)" },
  burgundy: { ring: "rgba(250,246,241,0.7)", dot: "#FAF6F1", ghost: "rgba(250,246,241,0.04)" },
  // "theme" uses --meridian CSS variable — darker in light mode, brighter in dark mode
  theme: { ring: "hsl(var(--meridian))", dot: "hsl(var(--meridian))", ghost: "hsl(var(--meridian) / 0.40)" },
};

const MeridianLogo = ({
  size = 60,
  variant = "dark",
  animate = true,
  className = "",
  floatAnimation = false,
  glowAnimation = false,
  spinDuration = 8,
}: MeridianLogoProps) => {
  const v = variants[variant];
  const [loaded, setLoaded] = useState(!animate);
  const [hovered, setHovered] = useState(false);
  const svgRef = useRef<SVGSVGElement>(null);
  const dotGroupRef = useRef<SVGGElement>(null);
  const ringRef = useRef<SVGCircleElement>(null);
  const glowRef = useRef<SVGCircleElement>(null);
  const blurRef = useRef<SVGFEGaussianBlurElement>(null);
  const solidDotRef = useRef<SVGCircleElement>(null);

  const angleRef = useRef(0);
  const speedRef = useRef(360 / spinDuration);
  const targetSpeedRef = useRef(360 / spinDuration);
  const directionRef = useRef(1);
  const lastMouseRef = useRef<{ x: number; y: number; t: number } | null>(null);
  const rafRef = useRef<number>(0);
  const isInsideRef = useRef(false);
  const sameDirectionStreakRef = useRef(0);

  useEffect(() => {
    if (animate) {
      const t = setTimeout(() => setLoaded(true), 100);
      return () => clearTimeout(t);
    }
  }, [animate]);

  // ── Animation tick loop ────────────────────────────────────────────────────
  useEffect(() => {
    if (!loaded) return;
    let lastTime = performance.now();
    const BASE = 360 / spinDuration;

    const tick = (now: number) => {
      const dt = Math.min((now - lastTime) / 1000, 0.1);
      lastTime = now;

      // Smooth spring — faible pour apprécier l'inertie, pas d'accélération brutale
      const springFactor = isInsideRef.current ? 2.5 : 0.9;
      speedRef.current += (targetSpeedRef.current - speedRef.current) * Math.min(dt * springFactor, 1);

      angleRef.current += speedRef.current * directionRef.current * dt;
      if (dotGroupRef.current) {
        dotGroupRef.current.style.transform = `rotate(${angleRef.current}deg)`;
      }

      const speedPct = Math.min((speedRef.current - BASE) / (800 - BASE), 1);
      const sp = Math.max(0, speedPct);

      if (ringRef.current) {
        ringRef.current.style.strokeWidth = String(2.2 + sp * 2.0);
      }
      if (glowRef.current) {
        glowRef.current.setAttribute("opacity", String(0.25 + sp * 0.55));
      }
      if (blurRef.current) {
        blurRef.current.setAttribute("stdDeviation", String(6 + sp * 16));
      }
      if (solidDotRef.current) {
        const r = (hovered ? 7 : 5.5) + sp * 3.5;
        solidDotRef.current.setAttribute("r", String(r));
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafRef.current);
  }, [loaded, spinDuration, hovered]);

  // ── Global mouse listener — bypasses pointer-events:none on parents ────────
  useEffect(() => {
    if (!loaded) return;

    const processMove = (clientX: number, clientY: number, cx: number, cy: number) => {
      const now = performance.now();
      if (lastMouseRef.current) {
        const dt = (now - lastMouseRef.current.t) / 1000;
        if (dt > 0.005) {
          const dx = clientX - lastMouseRef.current.x;
          const dy = clientY - lastMouseRef.current.y;
          const rx = clientX - cx;
          const ry = clientY - cy;
          const r = Math.sqrt(rx * rx + ry * ry);

          if (r > 8) {
            const tx = -ry / r;
            const ty = rx / r;
            const tangVel = (dx * tx + dy * ty) / dt;
            const newDir = tangVel > 0 ? 1 : -1;

            if (Math.abs(tangVel) > 6) {
              if (newDir === directionRef.current) {
                sameDirectionStreakRef.current = Math.min(sameDirectionStreakRef.current + 1, 40);
              } else {
                sameDirectionStreakRef.current = 0;
                // Inversion douce — on ralentit progressivement, pas brutalement
                targetSpeedRef.current = Math.max(targetSpeedRef.current * 0.65, 360 / spinDuration);
              }
              directionRef.current = newDir;
            }

            const BASE = 360 / spinDuration;
            const absVel = Math.abs(tangVel);
            if (absVel > 8) {
              // Boost très modéré — on apprécie l'interaction, pas une centrifugeuse
              const streakBoost = 1 + sameDirectionStreakRef.current * 0.04;
              targetSpeedRef.current = Math.min((BASE + absVel * 0.35) * streakBoost, 320);
            } else {
              targetSpeedRef.current = (360 / spinDuration) * 1.3;
            }
          }
        }
      }
      lastMouseRef.current = { x: clientX, y: clientY, t: now };
    };

    const onGlobalMove = (e: MouseEvent) => {
      const svg = svgRef.current;
      if (!svg) return;
      const rect = svg.getBoundingClientRect();
      const margin = rect.width * 0.25;
      const inside =
        e.clientX >= rect.left - margin &&
        e.clientX <= rect.right + margin &&
        e.clientY >= rect.top - margin &&
        e.clientY <= rect.bottom + margin;

      if (inside !== isInsideRef.current) {
        isInsideRef.current = inside;
        if (inside) {
          setHovered(true);
          sameDirectionStreakRef.current = 0;
        } else {
          setHovered(false);
          sameDirectionStreakRef.current = 0;
          targetSpeedRef.current = 360 / spinDuration;
          lastMouseRef.current = null;
        }
      }

      if (inside) {
        const cx = rect.left + rect.width / 2;
        const cy = rect.top + rect.height / 2;
        processMove(e.clientX, e.clientY, cx, cy);
      }
    };

    window.addEventListener("mousemove", onGlobalMove, { passive: true });
    return () => window.removeEventListener("mousemove", onGlobalMove);
  }, [loaded, spinDuration]);

  const wrapperClass = [className, floatAnimation ? "animate-float-slow" : "", glowAnimation ? "animate-logo-glow" : ""]
    .filter(Boolean)
    .join(" ");

  const uid = `meridian-${variant}-${size}`;

  return (
    <svg
      ref={svgRef}
      viewBox="0 0 290 290"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      className={wrapperClass}
      style={{ display: "block", cursor: "grab" }}
    >
      <defs>
        <radialGradient id={`glow-${uid}`} cx="50%" cy="50%" r="50%">
          <stop offset="0%" style={{ stopColor: v.dot, stopOpacity: 0.35 }} />
          <stop offset="100%" style={{ stopColor: v.dot, stopOpacity: 0 }} />
        </radialGradient>
        <filter id={`dot-blur-${uid}`} x="-200%" y="-200%" width="500%" height="500%">
          <feGaussianBlur ref={blurRef} in="SourceGraphic" stdDeviation="6" />
        </filter>
      </defs>

      {/* Speed-reactive glow */}
      <circle
        ref={glowRef}
        cx="145"
        cy="145"
        r="100"
        style={{ fill: `url(#glow-${uid})` }}
        opacity="0.25"
      />

      {/* Speed-reactive main ring */}
      <circle
        ref={ringRef}
        cx="145"
        cy="145"
        r="100"
        fill="none"
        style={{
          stroke: v.ring,
          strokeWidth: 2.2,
          animation: loaded ? "ring-breathe 5s ease-in-out infinite" : undefined,
          transition: "stroke 0.3s ease",
        }}
      />

      {/* Rotating dot group */}
      <g ref={dotGroupRef} style={{ transformOrigin: "145px 145px" }}>
        {/* Blurred halo */}
        <circle cx="145" cy="45" r="14" style={{ fill: v.dot }} filter={`url(#dot-blur-${uid})`} opacity="0.5" />
        {/* Solid dot */}
        <circle ref={solidDotRef} cx="145" cy="45" r="5.5" style={{ fill: v.dot }} />
      </g>
    </svg>
  );
};

export default MeridianLogo;
