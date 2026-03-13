"use client";

import Link from "next/link";
import { Filter, Sparkles } from "lucide-react";
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
    <div className="space-y-4">
      <section className="rm-flow-card">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <div className="flex items-center gap-2">
              <Filter size={16} className="text-blue-600" />
              <p className="rm-pill">{t("history.eyebrow")}</p>
            </div>
            <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
              {t("history.title")}
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">{t("history.body")}</p>
          </div>

          <div className="rm-home-hero-grid lg:w-[28rem]">
            <SummaryCard label={t("history.summary.shifts")} value={formatNumber(summary.shifts, locale, 0)} />
            <SummaryCard label={t("history.summary.netProfit")} value={formatCurrency(summary.netProfit, locale, currency)} />
          </div>
        </div>

        <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)]">
          <div>
            <label className="rm-field-label">{t("history.filters.platform")}</label>
            <div className="rm-inline-chip-row">
              {[
                { value: "all", label: t("history.filters.allPlatforms") },
                { value: "efood", label: "efood" },
                { value: "wolt", label: "Wolt" },
                { value: "freelance", label: "Freelance" },
                { value: "other", label: t("table.other") },
              ].map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPlatform(option.value)}
                  className={`rm-inline-chip ${platform === option.value ? "rm-inline-chip-active" : ""}`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_auto] sm:items-end">
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
            <button
              type="button"
              onClick={resetFilters}
              disabled={!hasActiveFilters}
              className="rm-button-secondary disabled:opacity-50"
            >
              {t("history.filters.clear")}
            </button>
          </div>
        </div>
      </section>

      <section className="rm-home-hero-grid xl:grid-cols-4">
        <SummaryCard label={t("history.summary.revenue")} value={formatCurrency(summary.revenue, locale, currency)} />
        <SummaryCard label={t("history.summary.netProfit")} value={formatCurrency(summary.netProfit, locale, currency)} />
        <SummaryCard label={t("history.summary.hours")} value={formatNumber(summary.hours, locale)} />
        <SummaryCard
          label={t("dashboard.cards.netPerHour")}
          value={formatCurrency(summary.hours > 0 ? summary.netProfit / summary.hours : 0, locale, currency)}
        />
      </section>

      {filteredShifts.length === 0 ? (
        <section className="rm-empty-state">
          <h2 className="text-2xl font-semibold text-slate-950">{t("history.emptyTitle")}</h2>
          <p className="mt-2 text-sm text-slate-600">{t("history.emptyBody")}</p>
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
        <section className="rm-timeline space-y-4">
          {filteredShifts.map((shift) => (
            <article key={shift.id} className="rm-timeline-item">
              <div className="rm-timeline-dot" />
              <div className="rm-journal-card">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="min-w-0">
                    <div className="rm-journal-meta">
                      <span className="rm-journal-chip">{formatDate(shift.date, locale, timezone)}</span>
                      <span className="rm-journal-chip">{shift.platform === "other" ? t("table.other") : shift.platform}</span>
                      <span className="rm-journal-chip">{t(`shiftForm.weather.${shift.weatherCondition}`)}</span>
                    </div>
                    <h3 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                      {formatCurrency(shift.metrics.netProfit, locale, currency)}
                    </h3>
                    <p className="mt-2 text-sm leading-6 text-slate-600">
                      {formatNumber(shift.ordersCompleted, locale, 0)} {t("dashboard.hero.orders").toLowerCase()} · {formatNumber(shift.kilometersDriven, locale)} {t("dashboard.hero.kilometers").toLowerCase()} · {formatNumber(shift.hoursWorked, locale)} {t("dashboard.hero.hours").toLowerCase()}
                    </p>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-3 lg:min-w-[360px]">
                    <MetricPill
                      label={t("history.summary.revenue")}
                      value={formatCurrency(shift.metrics.totalRevenue, locale, currency)}
                    />
                    <MetricPill
                      label={t("dashboard.table.cost")}
                      value={formatCurrency(shift.metrics.totalShiftCost, locale, currency)}
                    />
                    <MetricPill
                      label={t("dashboard.cards.netPerHour")}
                      value={formatCurrency(shift.metrics.netPerHour, locale, currency)}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-3">
                  <MetricPill
                    label={t("dashboard.table.margin")}
                    value={`${formatNumber(shift.metrics.profitMarginPercent, locale, 1)}%`}
                  />
                  <MetricPill
                    label={t("shiftForm.preview.grossRevenue")}
                    value={formatCurrency(shift.metrics.totalRevenue, locale, currency)}
                  />
                  <MetricPill
                    label={t("common.kilometer")}
                    value={formatNumber(shift.kilometersDriven, locale)}
                  />
                </div>

                {shift.notes ? (
                  <div className="mt-4 rounded-[24px] border border-stone-200 bg-stone-50 p-4 text-sm leading-6 text-slate-600">
                    <div className="mb-2 flex items-center gap-2 text-slate-500">
                      <Sparkles size={14} />
                    </div>
                    {shift.notes}
                  </div>
                ) : null}
              </div>
            </article>
          ))}
        </section>
      )}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="rm-field-label">{label}</label>
      {children}
    </div>
  );
}

function SummaryCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rm-home-hero-card">
      <p className="rm-stat-kicker">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function MetricPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[22px] border border-stone-200 bg-white p-4">
      <p className="rm-stat-kicker">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

