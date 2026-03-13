import { TrendingDown, TrendingUp } from "lucide-react";

type DeltaBadgeProps = {
  value: string;
  direction: "up" | "down" | "flat";
};

export default function DeltaBadge({ value, direction }: DeltaBadgeProps) {
  const isUp = direction === "up";
  const isDown = direction === "down";

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] ${
        isUp
          ? "border-emerald-400/25 bg-emerald-400/10 text-emerald-300"
          : isDown
            ? "border-rose-400/25 bg-rose-400/10 text-rose-300"
            : "border-slate-600/70 bg-slate-800/80 text-slate-300"
      }`}
    >
      {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : null}
      {value}
    </span>
  );
}
