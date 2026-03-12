import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import CompositionChart from "@/components/charts/composition-chart";
import DashboardControls from "@/components/dashboard/dashboard-controls";
import TrendChart from "@/components/charts/trend-chart";
import WeekdayPerformanceChart from "@/components/charts/weekday-performance-chart";
import HeroKpiCard from "@/components/dashboard/hero-kpi-card";
import LogoutButton from "@/components/logout-button";
import ShiftPerformanceTable from "@/components/tables/shift-performance-table";
import LanguageSwitcher from "@/components/ui/language-switcher";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { formatCurrency, formatNumber, formatPercent } from "@/lib/formatters";
import { getCurrentLocale, getMessages, translateMessage } from "@/lib/i18n";
import { getDashboardDataset } from "@/services/dashboard-service";

type HomePageProps = {
  searchParams?: Promise<{
    period?: string;
    from?: string;
    to?: string;
  }>;
};

export default async function HomePage({ searchParams }: HomePageProps) {
  const currentUser = await getCurrentUserFromCookie();
  const locale = await getCurrentLocale();
  const messages = getMessages(locale);
  const params = searchParams ? await searchParams : undefined;

  if (!currentUser) {
    return null;
  }

  const dataset = await getDashboardDataset({
    userId: currentUser.userId,
    period:
      params?.period === "today" ||
      params?.period === "week" ||
      params?.period === "month" ||
      params?.period === "custom"
        ? params.period
        : undefined,
    from: params?.from,
    to: params?.to,
  });

  const t = (key: string, values?: Record<string, string | number>) =>
    translateMessage(messages, key, values);

  const currency = dataset.settings.currency;
  const hasShifts = dataset.shifts.length > 0;
  const marginTrend = dataset.trend.map((point) =>
    point.revenue > 0 ? (point.netProfit / point.revenue) * 100 : 0
  );

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[36px] border border-white/70 bg-white/90 p-6 shadow-[0_28px_90px_rgba(15,23,42,0.06)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold text-slate-700">
                {t("dashboard.eyebrow")}
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                {t("dashboard.title")}
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-600 md:text-base">
                {t("dashboard.body")}
              </p>
              <div className="mt-6">
                <DashboardControls period={dataset.period} range={dataset.range} />
              </div>
            </div>

            <div className="flex flex-col items-stretch gap-3 xl:items-end">
              <LanguageSwitcher />
              <div className="rounded-[28px] border border-slate-200 bg-slate-950 px-6 py-5 text-white shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                  {t(`dashboard.period.${dataset.period}`)}
                </p>
                <p className="mt-3 text-4xl font-semibold">
                  {formatCurrency(dataset.selected.netProfit, locale, currency)}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {formatCurrency(dataset.selected.netProfitPerHour, locale, currency)} /{" "}
                  {t("dashboard.hero.hours").toLowerCase()}
                </p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
          <HeroKpiCard
            label={t("dashboard.hero.revenue")}
            value={formatCurrency(dataset.selected.totalRevenue, locale, currency)}
            helper={`${formatCurrency(
              dataset.selected.averageRevenuePerShift,
              locale,
              currency
            )} / ${t("common.shift")}`}
            delta={formatDelta(dataset.comparisons.revenue.changePercent, locale)}
            deltaDirection={dataset.comparisons.revenue.direction}
            sparklineValues={dataset.trend.map((point) => point.revenue)}
          />
          <HeroKpiCard
            label={t("dashboard.hero.netProfit")}
            value={formatCurrency(dataset.selected.netProfit, locale, currency)}
            helper={`${formatCurrency(
              dataset.selected.netProfitPerHour,
              locale,
              currency
            )} / ${t("common.hour")}`}
            delta={formatDelta(dataset.comparisons.netProfit.changePercent, locale)}
            deltaDirection={dataset.comparisons.netProfit.direction}
            sparklineValues={dataset.trend.map((point) => point.netProfit)}
          />
          <HeroKpiCard
            label={t("dashboard.hero.orders")}
            value={formatNumber(dataset.selected.totalOrders, locale, 0)}
            helper={`${formatNumber(dataset.selected.ordersPerHour, locale)} / ${t("common.hour")}`}
            delta={formatDelta(dataset.comparisons.orders.changePercent, locale)}
            deltaDirection={dataset.comparisons.orders.direction}
            sparklineValues={dataset.trend.map((point) => point.orders)}
          />
          <HeroKpiCard
            label={t("dashboard.hero.hours")}
            value={formatNumber(dataset.selected.totalHours, locale)}
            helper={`${formatCurrency(
              dataset.selected.averageRevenuePerHour,
              locale,
              currency
            )} / ${t("common.hour")}`}
            delta={formatDelta(dataset.comparisons.hours.changePercent, locale)}
            deltaDirection={dataset.comparisons.hours.direction}
            sparklineValues={dataset.trend.map((point) => point.hours)}
          />
          <HeroKpiCard
            label={t("dashboard.hero.kilometers")}
            value={formatNumber(dataset.selected.totalKilometers, locale)}
            helper={`${formatNumber(dataset.selected.kilometersPerOrder, locale)} / ${t("common.order")}`}
            delta={formatDelta(dataset.comparisons.kilometers.changePercent, locale)}
            deltaDirection={dataset.comparisons.kilometers.direction}
            sparklineValues={dataset.trend.map((point) => point.kilometers)}
          />
          <HeroKpiCard
            label={t("dashboard.hero.margin")}
            value={formatPercent(dataset.selected.marginPercent, locale)}
            helper={`${formatCurrency(dataset.selected.totalCost, locale, currency)} ${t("common.cost")}`}
            delta={formatDelta(dataset.comparisons.margin.changePercent, locale)}
            deltaDirection={dataset.comparisons.margin.direction}
            sparklineValues={marginTrend}
          />
        </section>

        {!hasShifts ? (
          <section className="rounded-[32px] border border-dashed border-slate-300 bg-white/82 p-8 text-center shadow-sm">
            <h2 className="text-2xl font-semibold text-slate-950">{t("dashboard.empty.title")}</h2>
            <p className="mt-2 text-sm text-slate-600">{t("dashboard.empty.body")}</p>
            <Link
              href="/new-shift"
              className="mt-5 inline-flex rounded-2xl bg-slate-950 px-5 py-3 font-medium text-white"
            >
              {t("dashboard.empty.cta")}
            </Link>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <section className="rounded-[32px] border border-white/70 bg-white/82 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
            <SectionHeading
              eyebrow={t("dashboard.sections.trends")}
              title={t("dashboard.charts.trendTitle")}
              description={t("dashboard.charts.trendBody")}
            />
            <div className="mt-6">
              <TrendChart data={dataset.trend} currency={currency} />
            </div>
          </section>

          <section className="space-y-6">
            <Panel
              eyebrow={t("dashboard.sections.insights")}
              title={t("dashboard.sections.insights")}
              description={t("nav.cockpit")}
            >
              <div className="space-y-3">
                {dataset.insights.map((insight) => (
                  <div
                    key={insight.id}
                    className={`rounded-[24px] border p-4 ${
                      insight.tone === "positive"
                        ? "border-emerald-200 bg-emerald-50/70"
                        : insight.tone === "caution"
                          ? "border-amber-200 bg-amber-50/70"
                          : "border-slate-200 bg-slate-50/80"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-950">
                      {t(insight.titleKey)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-slate-700">
                      {t(insight.bodyKey, formatInsightValues(insight.values, locale, currency))}
                    </p>
                  </div>
                ))}
              </div>
            </Panel>

            <Panel
              eyebrow={t("dashboard.sections.setup")}
              title={t("dashboard.sections.setup")}
              description={t("dashboard.body")}
            >
              <div className="space-y-3">
                <SetupItem
                  href="/vehicle"
                  status={dataset.setup.hasVehicleProfile ? t("common.setupReady") : t("common.setupNeeded")}
                  statusReady={dataset.setup.hasVehicleProfile}
                  title={t("dashboard.setup.vehicleTitle")}
                  body={t("dashboard.setup.vehicleBody")}
                />
                <SetupItem
                  href="/fixed-costs"
                  status={dataset.setup.hasCostProfile ? t("common.setupReady") : t("common.setupNeeded")}
                  statusReady={dataset.setup.hasCostProfile}
                  title={t("dashboard.setup.costTitle")}
                  body={t("dashboard.setup.costBody")}
                />
              </div>
            </Panel>
          </section>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel
            eyebrow={t("dashboard.sections.operations")}
            title={t("dashboard.charts.weekdayTitle")}
            description={t("dashboard.charts.weekdayBody")}
          >
            <WeekdayPerformanceChart
              data={dataset.weekdayPerformance}
              currency={currency}
            />
          </Panel>

          <Panel
            eyebrow={t("dashboard.sections.costs")}
            title={t("dashboard.charts.costCompositionTitle")}
            description={t("dashboard.charts.costCompositionBody")}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <CompositionChart
                  data={dataset.costComposition.map((slice) => ({
                    ...slice,
                    label: t(slice.label),
                  }))}
                  currency={currency}
                />
              </div>
              <LegendList
                items={dataset.costComposition.map((slice) => ({
                  label: t(slice.label),
                  value: formatCurrency(slice.value, locale, currency),
                }))}
              />
            </div>
          </Panel>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
          <Panel
            eyebrow={t("dashboard.sections.today")}
            title={t("dashboard.period.today")}
            description={t("dashboard.sections.operations")}
          >
            <InlineMetrics
              items={[
                {
                  label: t("dashboard.hero.revenue"),
                  value: formatCurrency(dataset.today.totalRevenue, locale, currency),
                },
                {
                  label: t("dashboard.hero.netProfit"),
                  value: formatCurrency(dataset.today.netProfit, locale, currency),
                },
                {
                  label: t("dashboard.cards.netPerHour"),
                  value: formatCurrency(dataset.today.netProfitPerHour, locale, currency),
                },
                {
                  label: t("dashboard.cards.costPerKm"),
                  value: formatCurrency(
                    dataset.today.totalKilometers > 0
                      ? dataset.today.totalCost / dataset.today.totalKilometers
                      : 0,
                    locale,
                    currency
                  ),
                },
              ]}
            />

            {(!dataset.setup.hasVehicleProfile || !dataset.setup.hasCostProfile) && (
              <div className="mt-5 flex items-start gap-3 rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-950">
                <CircleAlert className="mt-0.5 shrink-0" size={18} />
                <p>
                  {dataset.setup.hasVehicleProfile && dataset.setup.hasCostProfile
                    ? ""
                    : `${t("dashboard.setup.vehicleBody")} ${t("dashboard.setup.costBody")}`}
                </p>
              </div>
            )}
          </Panel>

          <Panel
            eyebrow={t("dashboard.sections.costs")}
            title={t("dashboard.charts.revenueCompositionTitle")}
            description={t("dashboard.charts.revenueCompositionBody")}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <div>
                <CompositionChart
                  data={dataset.revenueComposition.map((slice) => ({
                    ...slice,
                    label: t(slice.label),
                  }))}
                  currency={currency}
                />
              </div>
              <LegendList
                items={dataset.revenueComposition.map((slice) => ({
                  label: t(slice.label),
                  value: formatCurrency(slice.value, locale, currency),
                }))}
              />
            </div>
          </Panel>
        </section>

        <ShiftPerformanceTable
          locale={locale}
          currency={currency}
          timezone={dataset.settings.timezone}
          title={t("dashboard.table.title")}
          columns={{
            date: t("dashboard.table.date"),
            hours: t("dashboard.table.hours"),
            orders: t("dashboard.table.orders"),
            kilometers: t("dashboard.table.kilometers"),
            revenue: t("dashboard.table.revenue"),
            cost: t("dashboard.table.cost"),
            netProfit: t("dashboard.table.netProfit"),
            netPerHour: t("dashboard.table.netPerHour"),
            margin: t("dashboard.table.margin"),
            actions: t("dashboard.table.actions"),
          }}
          shifts={dataset.shifts.slice(0, 10)}
        />
      </div>
    </main>
  );
}

function formatDelta(value: number, locale: "en" | "el") {
  const formatted = formatNumber(Math.abs(value), locale, 1);
  const sign = value > 0 ? "+" : value < 0 ? "-" : "";
  return `${sign}${formatted}%`;
}

function formatInsightValues(
  values: Record<string, string | number> | undefined,
  locale: "en" | "el",
  currency: "EUR"
) {
  if (!values) {
    return undefined;
  }

  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => {
      if (typeof value !== "number") {
        return [key, value];
      }

      if (key === "value") {
        return [key, formatCurrency(value, locale, currency)];
      }

      return [key, formatNumber(value, locale)];
    })
  );
}

function SectionHeading({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <div>
      <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-600">
        {eyebrow}
      </div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function Panel({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[32px] border border-white/70 bg-white/82 p-5 shadow-[0_24px_70px_rgba(15,23,42,0.08)] backdrop-blur md:p-6">
      <SectionHeading eyebrow={eyebrow} title={title} description={description} />
      <div className="mt-6">{children}</div>
    </section>
  );
}

function SetupItem({
  href,
  status,
  statusReady,
  title,
  body,
}: {
  href: string;
  status: string;
  statusReady: boolean;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-start justify-between rounded-[24px] border border-slate-200 bg-white p-4 shadow-sm"
    >
      <div className="pr-4">
        <span
          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
            statusReady ? "bg-emerald-50 text-emerald-700" : "bg-amber-50 text-amber-700"
          }`}
        >
          {status}
        </span>
        <p className="mt-3 font-semibold text-slate-950">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      </div>
      <ArrowRight className="mt-1 shrink-0 text-slate-400" size={18} />
    </Link>
  );
}

function LegendList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.label} className="rounded-2xl bg-slate-50 px-4 py-3">
          <p className="text-sm text-slate-500">{item.label}</p>
          <p className="mt-1 font-semibold text-slate-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function InlineMetrics({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div
          key={item.label}
          className="flex items-center justify-between rounded-3xl bg-slate-50 px-4 py-4"
        >
          <p className="text-sm text-slate-600">{item.label}</p>
          <p className="text-lg font-semibold text-slate-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}
