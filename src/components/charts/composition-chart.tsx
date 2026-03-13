"use client";

import { useLocale } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import type { CompositionSlice } from "@/types/domain";

const colors = ["#315efb", "#5b7cff", "#ff8a52", "#f59e0b", "#34d399", "#94a3b8"];

type CompositionChartProps = {
  data: CompositionSlice[];
  currency: "EUR";
};

export default function CompositionChart({ data, currency }: CompositionChartProps) {
  const locale = useLocale() as "en" | "el";
  const visibleData = data.filter((item) => item.value > 0);

  if (!visibleData.length) {
    return (
      <div className="rm-empty-state flex h-72 items-center justify-center text-sm text-slate-400">
        {locale === "el" ? "Δεν υπάρχουν ακόμη δεδομένα σύνθεσης." : "No composition data yet."}
      </div>
    );
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={visibleData}
            dataKey="value"
            nameKey="label"
            innerRadius={60}
            outerRadius={86}
            paddingAngle={3}
            stroke="rgba(255,255,255,0.95)"
            strokeWidth={2}
          >
            {visibleData.map((entry, index) => (
              <Cell key={entry.key} fill={colors[index % colors.length]} />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, label) => [
              formatCurrency(Number(value), locale, currency),
              String(label),
            ]}
            contentStyle={{
              borderRadius: "16px",
              border: "1px solid rgba(148,163,184,0.16)",
              boxShadow: "0 20px 44px rgba(42,69,104,0.12)",
              backgroundColor: "rgba(255,255,255,0.98)",
              color: "#18212f",
            }}
            labelStyle={{ color: "#64748b" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
