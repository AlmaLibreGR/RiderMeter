"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type WeekdayNetPerHourChartProps = {
  data: {
    day: string;
    netPerHour: number;
  }[];
};

function formatCurrency(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default function WeekdayNetPerHourChart({
  data,
}: WeekdayNetPerHourChartProps) {
  return (
    <div className="h-72 w-full" aria-label="Weekday Net Per Hour Chart" tabIndex={0}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 10, right: 8, left: -24, bottom: 0 }}
          barCategoryGap={20}
        >
          <CartesianGrid stroke="rgba(15, 23, 42, 0.08)" strokeDasharray="3 3" />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={(value) => `€${value}`}
            tick={{ fontSize: 12, fill: "#475569" }}
            axisLine={false}
            tickLine={false}
          />
          <Tooltip
            cursor={{ fill: "rgba(217, 119, 6, 0.06)" }}
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid rgba(15, 23, 42, 0.08)",
              boxShadow: "0 12px 30px rgba(15, 23, 42, 0.08)",
            }}
            formatter={(value) => [formatCurrency(Number(value)), "Καθαρά / ώρα"]}
            labelFormatter={(label) => `Ημέρα: ${label}`}
          />
          <Bar dataKey="netPerHour" radius={[10, 10, 0, 0]} fill="#d97706" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
