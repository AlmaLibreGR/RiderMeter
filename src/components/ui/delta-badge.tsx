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
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ${
        isUp
          ? "bg-emerald-50 text-emerald-700"
          : isDown
            ? "bg-rose-50 text-rose-700"
            : "bg-slate-100 text-slate-600"
      }`}
    >
      {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : null}
      {value}
    </span>
  );
}
