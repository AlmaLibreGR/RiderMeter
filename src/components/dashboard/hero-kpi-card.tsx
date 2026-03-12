import DeltaBadge from "@/components/ui/delta-badge";
import Sparkline from "@/components/ui/sparkline";

type HeroKpiCardProps = {
  label: string;
  value: string;
  helper: string;
  delta: string;
  deltaDirection: "up" | "down" | "flat";
  sparklineValues: number[];
};

export default function HeroKpiCard({
  label,
  value,
  helper,
  delta,
  deltaDirection,
  sparklineValues,
}: HeroKpiCardProps) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm text-slate-500">{label}</p>
          <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
        </div>
        <Sparkline
          values={sparklineValues}
          stroke={deltaDirection === "down" ? "#e11d48" : "#0f766e"}
        />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <DeltaBadge value={delta} direction={deltaDirection} />
        <p className="text-sm text-slate-600">{helper}</p>
      </div>
    </div>
  );
}
