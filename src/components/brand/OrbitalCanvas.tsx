import { useEffect, useRef } from "react";

interface OrbitalCanvasProps {
  className?: string;
}

interface Dot {
  angle: number;
  size: number;
  speed: number;
}

interface Ring {
  radiusX: number;
  radiusY: number;
  tilt: number;
  color: string;
  opacity: number;
  lineWidth: number;
  dots: Dot[];
}

const OrbitalCanvas = ({ className }: OrbitalCanvasProps) => {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    const resize = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const rings: Ring[] = [
      {
        radiusX: 280, radiusY: 100, tilt: -18, color: "#B8634A", opacity: 0.18, lineWidth: 0.6,
        dots: [{ angle: 0, size: 2.5, speed: 0.0022 }],
      },
      {
        radiusX: 420, radiusY: 160, tilt: 6, color: "#D4A853", opacity: 0.09, lineWidth: 0.4,
        dots: [{ angle: 2.2, size: 1.8, speed: 0.0014 }, { angle: 4.8, size: 1.4, speed: 0.0011 }],
      },
      {
        radiusX: 560, radiusY: 220, tilt: 25, color: "#B8634A", opacity: 0.06, lineWidth: 0.3,
        dots: [{ angle: 1.1, size: 2.8, speed: 0.0009 }],
      },
      {
        radiusX: 160, radiusY: 60, tilt: -35, color: "#9E7A5A", opacity: 0.22, lineWidth: 0.7,
        dots: [{ angle: 3.3, size: 1.6, speed: 0.0031 }],
      },
    ];

    let animId: number;

    const draw = () => {
      const W = canvas.offsetWidth;
      const H = canvas.offsetHeight;
      ctx.clearRect(0, 0, W, H);

      const cx = W / 2;
      const cy = H / 2;

      for (const ring of rings) {
        ctx.save();
        ctx.translate(cx, cy);
        ctx.rotate((ring.tilt * Math.PI) / 180);

        // Ring ellipse
        ctx.beginPath();
        ctx.ellipse(0, 0, ring.radiusX, ring.radiusY, 0, 0, Math.PI * 2);
        ctx.globalAlpha = ring.opacity;
        ctx.strokeStyle = ring.color;
        ctx.lineWidth = ring.lineWidth;
        ctx.stroke();

        // Orbiting dots
        for (const dot of ring.dots) {
          dot.angle += dot.speed;
          const dx = Math.cos(dot.angle) * ring.radiusX;
          const dy = Math.sin(dot.angle) * ring.radiusY;

          // Outer glow
          const grd = ctx.createRadialGradient(dx, dy, 0, dx, dy, dot.size * 5);
          grd.addColorStop(0, ring.color + "88");
          grd.addColorStop(1, ring.color + "00");
          ctx.globalAlpha = ring.opacity * 2.5;
          ctx.fillStyle = grd;
          ctx.beginPath();
          ctx.arc(dx, dy, dot.size * 5, 0, Math.PI * 2);
          ctx.fill();

          // Core
          ctx.globalAlpha = Math.min(1, ring.opacity * 8);
          ctx.fillStyle = ring.color;
          ctx.beginPath();
          ctx.arc(dx, dy, dot.size, 0, Math.PI * 2);
          ctx.fill();
        }

        ctx.restore();
      }

      animId = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animId);
      ro.disconnect();
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className={className}
      style={{ width: "100%", height: "100%" }}
    />
  );
};

export default OrbitalCanvas;
