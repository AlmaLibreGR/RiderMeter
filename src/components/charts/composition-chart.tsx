"use client";

import { useLocale } from "next-intl";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { formatCurrency } from "@/lib/formatters";
import type { CompositionSlice } from "@/types/domain";

const colors = ["#0f172a", "#334155", "#0f766e", "#94a3b8", "#cbd5e1", "#e2e8f0"];

type CompositionChartProps = {
  data: CompositionSlice[];
  currency: "EUR";
};

export default function CompositionChart({ data, currency }: CompositionChartProps) {
  const locale = useLocale() as "en" | "el";
  const visibleData = data.filter((item) => item.value > 0);

  if (!visibleData.length) {
    return (
      <div className="rm-empty-state flex h-72 items-center justify-center text-sm text-slate-500">
        {locale === "el" ? "Δεν υπάρχουν ακόμη composition δεδομένα." : "No composition data yet."}
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
            outerRadius={84}
            paddingAngle={2}
            strokeWidth={0}
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
              border: "1px solid rgba(148,163,184,0.18)",
              boxShadow: "0 18px 50px rgba(15,23,42,0.08)",
              backgroundColor: "rgba(255,255,255,0.98)",
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
