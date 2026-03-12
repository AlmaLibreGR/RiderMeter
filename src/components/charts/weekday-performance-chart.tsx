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

  if (!data.length) {
    return (
      <div className="rm-empty-state flex h-72 items-center justify-center text-sm text-slate-500">
        {locale === "el" ? "Δεν υπάρχουν ακόμη weekday metrics." : "No weekday metrics yet."}
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 8, left: -18, bottom: 0 }}>
          <CartesianGrid stroke="rgba(148,163,184,0.18)" vertical={false} />
          <XAxis
            dataKey="weekday"
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
            formatter={(value) => [
              formatCurrency(Number(value), locale, currency),
              locale === "el" ? "Καθαρά / ώρα" : "Net / hour",
            ]}
          />
          <Bar dataKey="netProfitPerHour" radius={[10, 10, 0, 0]} fill="#334155" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
