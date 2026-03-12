import { formatCurrency, formatDate } from "@/lib/formatters";
import type { AppLocale, CurrencyCode, ShiftWithMetrics } from "@/types/domain";

type ShiftPerformanceTableProps = {
  locale: AppLocale;
  currency: CurrencyCode;
  timezone: string;
  title: string;
  columns: {
    date: string;
    platform: string;
    area: string;
    revenue: string;
    cost: string;
    netProfit: string;
    netPerHour: string;
  };
  shifts: ShiftWithMetrics[];
};

export default function ShiftPerformanceTable({
  locale,
  currency,
  timezone,
  title,
  columns,
  shifts,
}: ShiftPerformanceTableProps) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/80 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
      <h2 className="text-xl font-semibold text-slate-950">{title}</h2>
      <div className="mt-5 overflow-x-auto">
        <table className="min-w-full text-left">
          <thead>
            <tr className="border-b border-slate-200 text-sm text-slate-500">
              <th className="pb-3 pr-4 font-medium">{columns.date}</th>
              <th className="pb-3 pr-4 font-medium">{columns.platform}</th>
              <th className="pb-3 pr-4 font-medium">{columns.area}</th>
              <th className="pb-3 pr-4 font-medium">{columns.revenue}</th>
              <th className="pb-3 pr-4 font-medium">{columns.cost}</th>
              <th className="pb-3 pr-4 font-medium">{columns.netProfit}</th>
              <th className="pb-3 font-medium">{columns.netPerHour}</th>
            </tr>
          </thead>
          <tbody>
            {shifts.map((shift) => (
              <tr key={shift.id} className="border-b border-slate-100 text-sm text-slate-700">
                <td className="py-4 pr-4">{formatDate(shift.date, locale, timezone)}</td>
                <td className="py-4 pr-4">{shift.platform}</td>
                <td className="py-4 pr-4">{shift.area}</td>
                <td className="py-4 pr-4">
                  {formatCurrency(shift.metrics.totalRevenue, locale, currency)}
                </td>
                <td className="py-4 pr-4">
                  {formatCurrency(shift.metrics.totalShiftCost, locale, currency)}
                </td>
                <td className="py-4 pr-4 font-semibold text-slate-950">
                  {formatCurrency(shift.metrics.netProfit, locale, currency)}
                </td>
                <td className="py-4 font-medium text-emerald-700">
                  {formatCurrency(shift.metrics.netPerHour, locale, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
