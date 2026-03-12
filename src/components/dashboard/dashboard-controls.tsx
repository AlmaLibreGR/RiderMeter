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
    <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
      <div className="flex flex-wrap items-center gap-2">
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
            className={`rounded-full px-3.5 py-2 text-sm font-medium transition ${
              period === value
                ? "bg-slate-950 text-white"
                : "border border-slate-200 bg-white text-slate-600"
            }`}
            disabled={isPending}
          >
            {t(`dashboard.period.${value}`)}
          </button>
        ))}
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
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
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900"
          />
          <span className="text-sm text-slate-400">-</span>
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
            className="rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-900"
          />
        </div>

        <a
          href={exportHref}
          className="inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700"
        >
          <Download size={15} />
          {t("common.exportCsv")}
        </a>

        <Link
          href="/new-shift"
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-2.5 text-sm font-medium text-white"
        >
          <Plus size={15} />
          {t("common.newShift")}
        </Link>
      </div>
    </div>
  );
}
