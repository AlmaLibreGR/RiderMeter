"use client";

import { useLocale } from "next-intl";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { formatCurrency } from "@/lib/formatters";
import type { WeekdayPerformancePoint } from "@/types/domain";

type WeekdayPerformanceChartProps = {
  data: WeekdayPerformancePoint[];
  currency: "EUR";
};

export default function WeekdayPerformanceChart({
  data,
  currency,
}: WeekdayPerformanceChartProps) {
  const locale = useLocale() as "en" | "el";

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(15,23,42,0.08)" strokeDasharray="3 3" />
          <XAxis dataKey="weekday" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: "#475569" }} />
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
            formatter={(value) => [
              formatCurrency(Number(value), locale, currency),
              locale === "el" ? "Καθαρά / ώρα" : "Net / hour",
            ]}
          />
          <Bar dataKey="netProfitPerHour" radius={[12, 12, 0, 0]} fill="#0f766e" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
