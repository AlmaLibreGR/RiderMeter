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
              <stop offset="0%" stopColor="#ef5a29" stopOpacity={0.28} />
              <stop offset="100%" stopColor="#ef5a29" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="trendCost" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#8b6f59" stopOpacity={0.18} />
              <stop offset="100%" stopColor="#8b6f59" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(148,116,89,0.16)" vertical={false} />
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#8b6f59" }}
          />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#8b6f59" }}
            tickFormatter={(value) => formatCurrency(Number(value), locale, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid rgba(164,128,97,0.16)",
              boxShadow: "0 20px 44px rgba(154,96,54,0.12)",
              backgroundColor: "rgba(255,255,255,0.98)",
              color: "#18212f",
            }}
            formatter={(value, name) => [
              formatCurrency(Number(value), locale, currency),
              String(name),
            ]}
            labelStyle={{ color: "#8b6f59" }}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#ef5a29"
            fill="url(#trendRevenue)"
            strokeWidth={2}
            name={locale === "el" ? "Έσοδα" : "Revenue"}
          />
          <Area
            type="monotone"
            dataKey="costs"
            stroke="#8b6f59"
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
