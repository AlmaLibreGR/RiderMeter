type SparklineProps = {
  values: number[];
  stroke?: string;
};

export default function Sparkline({
  values,
  stroke = "#0f766e",
}: SparklineProps) {
  const points = buildPoints(values);

  if (!points) {
    return <div className="h-10 w-20 rounded-full bg-slate-100" />;
  }

  return (
    <svg viewBox="0 0 100 36" className="h-10 w-20 overflow-visible" aria-hidden="true">
      <path
        d={points}
        fill="none"
        stroke={stroke}
        strokeWidth="2.25"
        strokeLinecap="round"
        strokeLinejoin="round"
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
