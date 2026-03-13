"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useMemo, useState } from "react";
import { formatCurrency, formatDate, formatNumber } from "@/lib/formatters";
import type { AppLocale, CurrencyCode, ShiftWithMetrics } from "@/types/domain";

type HistoryBrowserProps = {
  shifts: ShiftWithMetrics[];
  locale: AppLocale;
  currency: CurrencyCode;
  timezone: string;
};

export default function HistoryBrowser({
  shifts,
  locale,
  currency,
  timezone,
}: HistoryBrowserProps) {
  const t = useTranslations();
  const [platform, setPlatform] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const filteredShifts = useMemo(() => {
    return shifts.filter((shift) => {
      if (platform !== "all" && shift.platform !== platform) {
        return false;
      }

      if (dateFrom && shift.date < dateFrom) {
        return false;
      }

      if (dateTo && shift.date > dateTo) {
        return false;
      }

      return true;
    });
  }, [dateFrom, dateTo, platform, shifts]);

  const summary = useMemo(() => {
    return filteredShifts.reduce(
      (accumulator, shift) => {
        accumulator.shifts += 1;
        accumulator.revenue += shift.metrics.totalRevenue;
        accumulator.netProfit += shift.metrics.netProfit;
        accumulator.hours += shift.hoursWorked;
        return accumulator;
      },
      {
        shifts: 0,
        revenue: 0,
        netProfit: 0,
        hours: 0,
      }
    );
  }, [filteredShifts]);

  const hasActiveFilters = platform !== "all" || Boolean(dateFrom) || Boolean(dateTo);

  function resetFilters() {
    setPlatform("all");
    setDateFrom("");
    setDateTo("");
  }

  return (
    <div className="space-y-6">
      <section className="rm-surface p-5">
        <div className="grid gap-4 md:grid-cols-4">
          <Field label={t("history.filters.platform")}>
            <select
              value={platform}
              onChange={(event) => setPlatform(event.target.value)}
              className="rm-input"
            >
              <option value="all">{t("history.filters.allPlatforms")}</option>
              <option value="efood">efood</option>
              <option value="wolt">Wolt</option>
              <option value="freelance">Freelance</option>
              <option value="other">{t("table.other")}</option>
            </select>
          </Field>
          <Field label={t("history.filters.from")}>
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
              className="rm-input"
            />
          </Field>
          <Field label={t("history.filters.to")}>
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
              className="rm-input"
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="rm-button-secondary w-full disabled:opacity-50"
            >
              {t("history.filters.clear")}
            </button>
          </div>
        </div>
      </section>

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label={t("history.summary.shifts")}
          value={formatNumber(summary.shifts, locale, 0)}
        />
        <SummaryCard
          label={t("history.summary.revenue")}
          value={formatCurrency(summary.revenue, locale, currency)}
        />
        <SummaryCard
          label={t("history.summary.netProfit")}
          value={formatCurrency(summary.netProfit, locale, currency)}
        />
        <SummaryCard
          label={t("history.summary.hours")}
          value={formatNumber(summary.hours, locale)}
        />
      </section>

      {filteredShifts.length === 0 ? (
        <section className="rm-empty-state">
          <h2 className="text-2xl font-semibold text-white">{t("history.emptyTitle")}</h2>
          <p className="mt-2 text-sm text-slate-300">{t("history.emptyBody")}</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link href="/new-shift" className="rm-button-primary">
              {t("common.newShift")}
            </Link>
            <button type="button" onClick={resetFilters} className="rm-button-secondary">
              {t("history.filters.clear")}
            </button>
          </div>
        </section>
      ) : (
        <section className="space-y-4">
          {filteredShifts.map((shift) => (
            <article key={shift.id} className="rm-surface p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-slate-700/70 bg-slate-900/80 px-3 py-1 text-xs font-semibold text-slate-200">
                      {shift.platform}
                    </span>
                    <span className="rounded-full border border-slate-700/70 bg-slate-950/80 px-3 py-1 text-xs font-medium text-slate-300">
                      {formatDate(shift.date, locale, timezone)}
                    </span>
                  </div>
                  <h3 className="mt-3 text-xl font-semibold text-white">{shift.area}</h3>
                  <p className="mt-1 text-sm text-slate-300">
                    {formatNumber(shift.ordersCompleted, locale, 0)}{" "}
                    {t("dashboard.hero.orders").toLowerCase()} ·{" "}
                    {formatNumber(shift.kilometersDriven, locale)}{" "}
                    {t("dashboard.hero.kilometers").toLowerCase()} ·{" "}
                    {formatNumber(shift.hoursWorked, locale)}{" "}
                    {t("dashboard.hero.hours").toLowerCase()}
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                  <MetricPill
                    label={t("history.summary.revenue")}
                    value={formatCurrency(shift.metrics.totalRevenue, locale, currency)}
                  />
                  <MetricPill
                    label={t("history.summary.netProfit")}
                    value={formatCurrency(shift.metrics.netProfit, locale, currency)}
                  />
                  <MetricPill
                    label={t("dashboard.cards.netPerHour")}
                    value={formatCurrency(shift.metrics.netPerHour, locale, currency)}
                  />
                </div>
              </div>

              {shift.notes ? (
                <div className="mt-4 rounded-3xl border border-slate-800/90 bg-slate-950/70 p-4 text-sm leading-6 text-slate-300">
                  {shift.notes}
                </div>
              ) : null}
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="rm-field-label">{label}</label>
      {children}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rm-surface p-4">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800/80 bg-slate-950/65 p-4">
      <p className="text-xs uppercase tracking-[0.16em] text-slate-500">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
