import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";

interface CanvasRevealEffectProps {
  animationSpeed?: number;
  containerClassName?: string;
  colors?: number[][];
  dotSize?: number;
}

export const CanvasRevealEffect = ({
  animationSpeed = 5,
  containerClassName,
  colors = [[196, 162, 74]],
  dotSize = 3,
}: CanvasRevealEffectProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>(0);
  const startTimeRef = useRef<number>(Date.now());

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };
    resize();
    const ro = new ResizeObserver(resize);
    ro.observe(canvas);

    const draw = () => {
      const elapsed = (Date.now() - startTimeRef.current) / 1000;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      const cols = Math.ceil(canvas.width / (dotSize * 4));
      const rows = Math.ceil(canvas.height / (dotSize * 4));

      for (let i = 0; i < cols; i++) {
        for (let j = 0; j < rows; j++) {
          const x = i * (dotSize * 4) + dotSize * 2;
          const y = j * (dotSize * 4) + dotSize * 2;
          const dist = Math.sqrt(
            Math.pow(x - canvas.width / 2, 2) + Math.pow(y - canvas.height / 2, 2)
          );
          const wave = Math.sin(dist / 20 - elapsed * animationSpeed) * 0.5 + 0.5;
          const alpha = Math.max(0, wave - 0.2);
          if (alpha <= 0) continue;

          const colorIdx = Math.floor(((i + j) % colors.length));
          const [r, g, b] = colors[colorIdx];
          ctx.beginPath();
          ctx.arc(x, y, dotSize * wave, 0, Math.PI * 2);
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha * 0.6})`;
          ctx.fill();
        }
      }

      animationRef.current = requestAnimationFrame(draw);
    };

    draw();

    return () => {
      cancelAnimationFrame(animationRef.current);
      ro.disconnect();
    };
  }, [animationSpeed, colors, dotSize]);

  return (
    <div className={cn("w-full h-full", containerClassName)}>
      <canvas ref={canvasRef} className="w-full h-full" />
    </div>
  );
};
