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

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 12, right: 10, left: -18, bottom: 0 }}>
          <defs>
            <linearGradient id="trendRevenue" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#2563eb" stopOpacity={0.22} />
              <stop offset="100%" stopColor="#2563eb" stopOpacity={0.02} />
            </linearGradient>
            <linearGradient id="trendCost" x1="0" x2="0" y1="0" y2="1">
              <stop offset="0%" stopColor="#f97316" stopOpacity={0.16} />
              <stop offset="100%" stopColor="#f97316" stopOpacity={0.02} />
            </linearGradient>
          </defs>
          <CartesianGrid stroke="rgba(15,23,42,0.08)" strokeDasharray="3 3" />
          <XAxis dataKey="label" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} />
          <YAxis
            axisLine={false}
            tickLine={false}
            tick={{ fontSize: 12, fill: "#475569" }}
            tickFormatter={(value) => formatCurrency(Number(value), locale, currency)}
          />
          <Tooltip
            contentStyle={{
              borderRadius: "18px",
              border: "1px solid rgba(148,163,184,0.25)",
              boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
            }}
            formatter={(value, name) => [
              formatCurrency(Number(value), locale, currency),
              String(name),
            ]}
          />
          <Area
            type="monotone"
            dataKey="revenue"
            stroke="#2563eb"
            fill="url(#trendRevenue)"
            strokeWidth={2.2}
            name={locale === "el" ? "Έσοδα" : "Revenue"}
          />
          <Area
            type="monotone"
            dataKey="costs"
            stroke="#f97316"
            fill="url(#trendCost)"
            strokeWidth={2}
            name={locale === "el" ? "Κόστος" : "Costs"}
          />
          <Line
            type="monotone"
            dataKey="netProfit"
            stroke="#0f766e"
            strokeWidth={2.6}
            dot={{ r: 2 }}
            name={locale === "el" ? "Καθαρό κέρδος" : "Net profit"}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
