"use client";

import { useLocale } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import type { CompositionSlice } from "@/types/domain";

const colors = ["#ef5a29", "#fb923c", "#f59e0b", "#fb7185", "#1f9d76", "#8b6f59"];

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
            stroke="rgba(5,8,22,0.88)"
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
              border: "1px solid rgba(164,128,97,0.16)",
              boxShadow: "0 20px 44px rgba(154,96,54,0.12)",
              backgroundColor: "rgba(255,255,255,0.98)",
              color: "#18212f",
            }}
            labelStyle={{ color: "#8b6f59" }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
