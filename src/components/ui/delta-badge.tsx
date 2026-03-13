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
      className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] font-medium tracking-[0.02em] shadow-sm ${
        isUp
          ? "border-emerald-200 bg-emerald-50 text-emerald-700"
          : isDown
            ? "border-rose-200 bg-rose-50 text-rose-700"
            : "border-blue-100 bg-blue-50 text-blue-700"
      }`}
    >
      {isUp ? <TrendingUp size={12} /> : isDown ? <TrendingDown size={12} /> : null}
      {value}
    </span>
  );
}
