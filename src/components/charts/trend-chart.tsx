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
      <div className="rm-empty-state flex h-80 items-center justify-center text-sm text-slate-400">
        {locale === "el"
          ? "Δεν υπάρχουν ακόμη αρκετά δεδομένα για τάση."
          : "Not enough data for a trend yet."}
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendRevenue" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.32} />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="trendCost" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#64748b" stopOpacity={0.24} />
              <stop offset="100%" stopColor="#64748b" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(71,85,105,0.28)" vertical={false} />
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
              border: "1px solid rgba(148,163,184,0.16)",
              boxShadow: "0 24px 60px rgba(2,6,23,0.42)",
              backgroundColor: "rgba(10,15,28,0.96)",
              color: "#e2e8f0",
            }}
            formatter={(value, name) => [
              formatCurrency(Number(value), locale, currency),
              String(name),
            ]}
            labelStyle={{ color: "#94a3b8" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#38bdf8"
            fill="url(#trendRevenue)"
            strokeWidth={2}
            name={locale === "el" ? "Έσοδα" : "Revenue"}
          />
          <Area
            type="monotone"
            dataKey="costs"
            stroke="#64748b"
            fill="url(#trendCost)"
            strokeWidth={1.8}
            name={locale === "el" ? "Κόστος" : "Costs"}
          />
          <Line
            type="monotone"
            dataKey="netProfit"
            stroke="#34d399"
            strokeWidth={2.2}
            dot={false}
            name={locale === "el" ? "Καθαρό κέρδος" : "Net profit"}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
