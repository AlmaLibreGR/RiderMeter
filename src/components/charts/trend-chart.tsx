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
        {locale === "el" ? "Δεν υπάρχουν ακόμη αρκετά δεδομένα για τάση." : "Not enough data for a trend yet."}
      </div>
    );
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={320}>
        <AreaChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendRevenue" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#315efb" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#315efb" stopOpacity={0.02} />
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
              border: "1px solid rgba(148,163,184,0.16)",
              boxShadow: "0 20px 44px rgba(42,69,104,0.12)",
              backgroundColor: "rgba(255,255,255,0.98)",
              color: "#18212f",
            }}
            formatter={(value, name) => [
              formatCurrency(Number(value), locale, currency),
              String(name),
            ]}
            labelStyle={{ color: "#64748b" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#315efb"
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
            stroke="#ff6b2c"
            strokeWidth={2.2}
            dot={false}
            name={locale === "el" ? "Καθαρό κέρδος" : "Net profit"}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
