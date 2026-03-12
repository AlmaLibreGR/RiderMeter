"use client";

import { useLocale } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import type { CompositionSlice } from "@/types/domain";

const colors = ["#0f766e", "#2563eb", "#f59e0b", "#0f172a", "#ef4444", "#7c3aed"];

type CompositionChartProps = {
  data: CompositionSlice[];
  currency: "EUR";
};

export default function CompositionChart({ data, currency }: CompositionChartProps) {
  const locale = useLocale() as "en" | "el";

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.filter((item) => item.value > 0)}
            dataKey="value"
            nameKey="label"
            innerRadius={58}
            outerRadius={88}
            paddingAngle={3}
          >
            {data.map((entry, index) => (
              <Cell key={entry.key} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, label) => [
              formatCurrency(Number(value), locale, currency),
              String(label),
            ]}
            contentStyle={{
              borderRadius: "18px",
              border: "1px solid rgba(148,163,184,0.25)",
              boxShadow: "0 24px 60px rgba(15,23,42,0.12)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
