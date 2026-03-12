type HeroKpiCardProps = {
  label: string;
  value: string;
  helper: string;
};

export default function HeroKpiCard({ label, value, helper }: HeroKpiCardProps) {
  return (
    <div className="rounded-[28px] border border-white/70 bg-white/85 p-5 shadow-sm backdrop-blur">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-3 text-3xl font-semibold tracking-tight text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
}
