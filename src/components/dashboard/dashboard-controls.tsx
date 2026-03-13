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
            className={`rounded-full border px-3.5 py-2 text-sm font-medium transition ${
              period === value
                ? "border-sky-400/40 bg-sky-400/14 text-sky-100 shadow-[0_12px_30px_rgba(14,165,233,0.12)]"
                : "border-slate-700/80 bg-slate-950/50 text-slate-300 hover:border-slate-500 hover:bg-slate-900/80"
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
            className="rm-input px-4 py-2.5 text-sm"
          />
            <span className="px-1 text-sm text-slate-400">-</span>
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

        <a
          href={exportHref}
          className="rm-button-secondary"
        >
          <Download size={15} />
          {t("common.exportCsv")}
        </a>

        <Link
          href="/new-shift"
          className="rm-button-primary"
        >
          <Plus size={15} />
          {t("common.newShift")}
        </Link>
      </div>
    </div>
  );
}
