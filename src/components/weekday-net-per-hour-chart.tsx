"use client";

import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
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
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="day" tick={{ fontSize: 12 }} />
          <YAxis tickFormatter={(value) => `€${value}`} tick={{ fontSize: 12 }} />
          <Tooltip
            formatter={(value) => [formatCurrency(Number(value)), "Καθαρά / ώρα"]}
            labelFormatter={(label) => `Ημέρα: ${label}`}
          />
          <Bar dataKey="netPerHour" radius={[8, 8, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}