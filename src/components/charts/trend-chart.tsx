"use client";

import { useLocale } from "next-intl";
import {
  Area,
  AreaChart,
  CartesianGrid,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import type { TimeSeriesPoint } from "@/types/domain";

type TrendChartProps = {
  data: TimeSeriesPoint[];
  currency: "EUR";
};

export default function TrendChart({ data, currency }: TrendChartProps) {
  const locale = useLocale() as "en" | "el";

  if (!data.length) {
    return (
      <div className="rm-empty-state flex h-80 items-center justify-center text-sm text-slate-500">
        {locale === "el" ? "Δεν υπάρχουν αρκετά δεδομένα για trend." : "Not enough data for a trend yet."}
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendRevenue" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#475569" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#475569" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="trendCost" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#94a3b8" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#94a3b8" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#64748b" }}
            tickFormatter={(value) => formatCurrency(Number(value), locale, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid rgba(148,163,184,0.18)",
              boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
              backgroundColor: "rgba(255,255,255,0.98)",
            }}
            formatter={(value, name) => [
              formatCurrency(Number(value), locale, currency),
              String(name),
            ]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#334155"
            fill="url(#trendRevenue)"
            strokeWidth={2}
            name={locale === "el" ? "Έσοδα" : "Revenue"}
          />
          <Area
            type="monotone"
            dataKey="costs"
            stroke="#94a3b8"
            fill="url(#trendCost)"
            strokeWidth={1.8}
            name={locale === "el" ? "Κόστος" : "Costs"}
          />
          <Line
            type="monotone"
            dataKey="netProfit"
            stroke="#0f766e"
            strokeWidth={2.2}
            dot={false}
            name={locale === "el" ? "Καθαρό κέρδος" : "Net profit"}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
