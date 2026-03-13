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
    <div className="rm-surface p-5 hover:-translate-y-0.5">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
            {label}
          </p>
          <p className="mt-3 text-[2rem] font-semibold tracking-tight text-white">{value}</p>
        </div>
        <Sparkline
          values={sparklineValues}
          stroke={deltaDirection === "down" ? "#fb7185" : "#38bdf8"}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DeltaBadge value={delta} direction={deltaDirection} />
        <p className="text-sm text-slate-300">{helper}</p>
      </div>
    </div>
  );
}
