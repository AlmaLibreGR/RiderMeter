type SparklineProps = {
  values: number[];
  stroke?: string;
};

export default function Sparkline({
  values,
  stroke = "#ef5a29",
}: SparklineProps) {
  const points = buildPoints(values);

  if (!points) {
    return <div className="h-10 w-20 rounded-full bg-orange-50" />;
  }

  return (
    <svg viewBox="0 0 100 36" className="h-10 w-20 overflow-visible" aria-hidden="true">
      <defs>
        <linearGradient id="sparklineGlow" x1="0" x2="1" y1="0" y2="0">
          <stop offset="0%" stopColor={stroke} stopOpacity="0.18" />
          <stop offset="100%" stopColor={stroke} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      <path
        d={`${points} L 100 36 L 0 36 Z`}
        fill="url(#sparklineGlow)"
        opacity="0.9"
      />
      <path
        d={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        opacity="0.96"
      />
    </svg>
  );
}

function buildPoints(values: number[]) {
  const usable = values.filter((value) => Number.isFinite(value));

  if (usable.length < 2) {
    return null;
  }

  const max = Math.max(...usable);
  const min = Math.min(...usable);
  const range = max - min || 1;

  return usable
    .map((value, index) => {
      const x = (index / (usable.length - 1)) * 100;
      const y = 32 - ((value - min) / range) * 24;
      return `${index === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}
