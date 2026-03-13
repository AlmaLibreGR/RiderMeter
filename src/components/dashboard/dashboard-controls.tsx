"use client";

import Link from "next/link";
import { Download, Plus } from "lucide-react";
import { useTranslations } from "next-intl";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTransition } from "react";
import type { DashboardPeriod } from "@/types/domain";

type DashboardControlsProps = {
  period: DashboardPeriod;
  range: {
    from: string;
    to: string;
  };
};

const periods: DashboardPeriod[] = ["today", "week", "month", "custom"];

export default function DashboardControls({
  period,
  range,
}: DashboardControlsProps) {
  const t = useTranslations();
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  function updateQuery(next: Partial<Record<"period" | "from" | "to", string>>) {
    const params = new URLSearchParams(searchParams.toString());

    Object.entries(next).forEach(([key, value]) => {
      if (!value) {
        params.delete(key);
        return;
      }

      params.set(key, value);
    });

    startTransition(() => {
      router.push(`${pathname}?${params.toString()}`);
    });
  }

  const exportHref = `/api/shifts/export?from=${encodeURIComponent(range.from)}&to=${encodeURIComponent(range.to)}`;

  return (
    <div className="space-y-4">
      <div className="rm-inline-chip-row">
        {periods.map((value) => (
          <button
            key={value}
            type="button"
            onClick={() =>
              updateQuery({
                period: value,
                from: value === "custom" ? range.from : "",
                to: value === "custom" ? range.to : "",
              })
            }
            className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
              period === value
                ? "border-orange-200 bg-orange-50 text-orange-700 shadow-[0_12px_26px_rgba(239,90,41,0.12)]"
                : "border-stone-200 bg-white text-slate-700 hover:border-orange-200 hover:bg-orange-50/60"
            }`}
            disabled={isPending}
          >
            {t(`dashboard.period.${value}`)}
          </button>
        ))}
      </div>

      <div className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end">
        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
          <input
            type="date"
            value={range.from}
            onChange={(event) =>
              updateQuery({
                period: "custom",
                from: event.target.value,
                to: searchParams.get("to") ?? range.to,
              })
            }
            className="rm-input px-4 py-2.5 text-sm"
          />
          <span className="justify-self-center px-1 text-sm text-stone-400">-</span>
          <input
            type="date"
            value={range.to}
            onChange={(event) =>
              updateQuery({
                period: "custom",
                from: searchParams.get("from") ?? range.from,
                to: event.target.value,
              })
            }
            className="rm-input px-4 py-2.5 text-sm"
          />
        </div>

        <div className="flex flex-wrap gap-3">
          <a href={exportHref} className="rm-button-secondary">
            <Download size={15} />
            {t("common.exportCsv")}
          </a>

          <Link href="/new-shift" className="rm-button-primary">
            <Plus size={15} />
            {t("common.newShift")}
          </Link>
        </div>
      </div>
    </div>
  );
}
