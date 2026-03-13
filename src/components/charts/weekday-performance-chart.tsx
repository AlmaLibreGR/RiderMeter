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
      <div className="rm-empty-state flex h-72 items-center justify-center text-sm text-slate-400">
        {locale === "el" ? "Δεν υπάρχουν ακόμη μετρικές ανά ημέρα." : "No weekday metrics yet."}
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
              border: "1px solid rgba(148,163,184,0.16)",
              boxShadow: "0 20px 44px rgba(42,69,104,0.12)",
              backgroundColor: "rgba(255,255,255,0.98)",
              color: "#18212f",
            }}
            formatter={(value) => [
              formatCurrency(Number(value), locale, currency),
              locale === "el" ? "Καθαρά / ώρα" : "Net / hour",
            ]}
            labelStyle={{ color: "#64748b" }}
          />
          <Bar dataKey="netProfitPerHour" radius={[12, 12, 0, 0]} fill="#315efb" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
