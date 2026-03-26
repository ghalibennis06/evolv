interface SpineWatermarkProps {
  size?: number;
  opacity?: number;
  className?: string;
}

const SpineWatermark = ({ size = 600, opacity = 0.04, className = "" }: SpineWatermarkProps) => {
  const spineHeight = size * 0.52;
  const cx = size / 2;
  const cy = size / 2;
  const top = cy - spineHeight / 2;
  const bottom = cy + spineHeight / 2;

  // 4 notches at proportional positions along the spine
  const notchPositions = [0.18, 0.38, 0.62, 0.82];
  const notchWidths = [size * 0.14, size * 0.10, size * 0.10, size * 0.14];

  return (
    <div
      className={`pointer-events-none select-none ${className}`}
      style={{ opacity, display: "inline-block" }}
      aria-hidden
    >
      <svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Vertical spine line */}
        <line
          x1={cx}
          y1={top}
          x2={cx}
          y2={bottom}
          stroke="hsl(var(--foreground))"
          strokeWidth={size * 0.003}
          strokeLinecap="round"
        />
        {/* 4 horizontal notches */}
        {notchPositions.map((pos, i) => {
          const y = top + spineHeight * pos;
          const hw = notchWidths[i] / 2;
          return (
            <line
              key={i}
              x1={cx - hw}
              y1={y}
              x2={cx + hw}
              y2={y}
              stroke="hsl(var(--foreground))"
              strokeWidth={size * 0.0022}
              strokeLinecap="round"
            />
          );
        })}
      </svg>
    </div>
  );
};

export default SpineWatermark;
