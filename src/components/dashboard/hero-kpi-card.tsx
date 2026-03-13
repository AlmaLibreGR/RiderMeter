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
    <div className="rm-surface p-4 md:p-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="rm-stat-kicker">{label}</p>
          <p className="mt-2 text-[1.8rem] font-semibold tracking-tight text-slate-950 md:text-[2rem]">
            {value}
          </p>
        </div>
        <Sparkline
          values={sparklineValues}
          stroke={deltaDirection === "down" ? "#e11d48" : "#ef5a29"}
        />
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DeltaBadge value={delta} direction={deltaDirection} />
        <p className="text-sm leading-6 text-slate-600">{helper}</p>
      </div>
    </div>
  );
}
