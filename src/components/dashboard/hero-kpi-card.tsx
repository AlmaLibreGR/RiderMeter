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
    <div className="rm-home-hero-card">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="rm-stat-kicker">{label}</p>
          <p className="mt-3 text-[1.8rem] font-semibold tracking-tight text-slate-950 md:text-[2.05rem]">
            {value}
          </p>
          <p className="mt-1 text-sm leading-6 text-slate-600">{helper}</p>
        </div>
        <div className="rounded-[20px] border border-blue-100 bg-white px-3 py-3">
          <Sparkline
            values={sparklineValues}
            stroke={deltaDirection === "down" ? "#e11d48" : "#315efb"}
          />
        </div>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <DeltaBadge value={delta} direction={deltaDirection} />
      </div>
    </div>
  );
}
