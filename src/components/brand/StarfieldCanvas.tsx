import { useEffect, useRef } from "react";

const StarfieldCanvas = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const STARS = 280;

    interface Star {
      x: number; y: number; r: number; base: number;
      speed: number; phase: number; layer: number;
    }

    let stars: Star[] = [];
    let W = 0, H = 0;
    let t = 0;

    const resize = () => {
      W = canvas.width = window.innerWidth;
      H = canvas.height = document.documentElement.scrollHeight;
      stars = Array.from({ length: STARS }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: Math.random() * 1.2 + 0.2,
        base: Math.random(),
        speed: Math.random() * 0.4 + 0.05,
        phase: Math.random() * Math.PI * 2,
        layer: Math.floor(Math.random() * 3),
      }));
    };

    resize();
    window.addEventListener("resize", resize);

    const draw = () => {
      t += 0.004;
      ctx.clearRect(0, 0, W, H);
      stars.forEach(s => {
        const twinkle = 0.4 + 0.6 * (0.5 + 0.5 * Math.sin(t * s.speed * 5 + s.phase));
        const alpha = (s.base * 0.5 + 0.1) * twinkle;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(250,246,241,${alpha})`;
        ctx.fill();
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0, mixBlendMode: "screen", opacity: 0.5 }}
      aria-hidden="true"
    />
  );
};

export default StarfieldCanvas;
