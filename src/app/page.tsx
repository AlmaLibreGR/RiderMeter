import Link from "next/link";
import { ArrowRight, CircleAlert } from "lucide-react";
import CompositionChart from "@/components/charts/composition-chart";
import TrendChart from "@/components/charts/trend-chart";
import WeekdayPerformanceChart from "@/components/charts/weekday-performance-chart";
import DashboardControls from "@/components/dashboard/dashboard-controls";
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
    <main className="rm-page-shell">
      <div className="rm-page-container">
        <section className="rm-hero">
          <div className="grid gap-8 xl:grid-cols-[1.4fr_0.7fr]">
            <div>
              <div className="rm-pill">{t("dashboard.eyebrow")}</div>
              <h1 className="mt-5 max-w-4xl text-4xl font-semibold tracking-tight text-white md:text-6xl">
                {t("dashboard.title")}
              </h1>
              <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300 md:text-base">
                {t("dashboard.body")}
              </p>

              <div className="mt-8">
                <DashboardControls period={dataset.period} range={dataset.range} />
              </div>
            </div>

            <div className="flex flex-col gap-4 xl:items-stretch">
              <div className="flex flex-col gap-3 sm:flex-row xl:flex-col">
                <LanguageSwitcher />
                <LogoutButton />
              </div>

              <div className="rounded-[32px] border border-sky-400/20 bg-[radial-gradient(circle_at_top_right,rgba(56,189,248,0.16),transparent_28%),linear-gradient(180deg,rgba(12,18,34,0.96)_0%,rgba(7,12,24,1)_100%)] p-6 shadow-[0_30px_80px_rgba(2,6,23,0.45)]">
                <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">
                  {t(`dashboard.period.${dataset.period}`)}
                </p>
                <p className="mt-4 text-4xl font-semibold tracking-tight text-white">
                  {formatCurrency(dataset.selected.netProfit, locale, currency)}
                </p>
                <p className="mt-2 text-sm text-slate-300">
                  {formatCurrency(dataset.selected.netProfitPerHour, locale, currency)} /{" "}
                  {t("dashboard.hero.hours").toLowerCase()}
                </p>

                <div className="mt-6 grid gap-3 sm:grid-cols-2">
                  <MiniSummary
                    label={t("dashboard.hero.revenue")}
                    value={formatCurrency(dataset.selected.totalRevenue, locale, currency)}
                  />
                  <MiniSummary
                    label={t("dashboard.hero.margin")}
                    value={formatPercent(dataset.selected.marginPercent, locale)}
                  />
                </div>
              </div>
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
          <section className="rm-empty-state">
            <h2 className="text-2xl font-semibold text-white">{t("dashboard.empty.title")}</h2>
            <p className="mt-3 text-sm leading-6 text-slate-300">{t("dashboard.empty.body")}</p>
            <Link href="/new-shift" className="rm-button-primary mt-6">
              {t("dashboard.empty.cta")}
            </Link>
          </section>
        ) : null}

        <section className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
          <Panel
            eyebrow={t("dashboard.sections.trends")}
            title={t("dashboard.charts.trendTitle")}
            description={t("dashboard.charts.trendBody")}
          >
            <TrendChart data={dataset.trend} currency={currency} />
          </Panel>

          <div className="space-y-6">
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
                        ? "border-emerald-400/16 bg-emerald-400/8"
                        : insight.tone === "caution"
                          ? "border-amber-400/18 bg-amber-400/10"
                          : "border-slate-700/70 bg-slate-900/60"
                    }`}
                  >
                    <p className="text-sm font-semibold text-white">{t(insight.titleKey)}</p>
                    <p className="mt-2 text-sm leading-6 text-slate-300">
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
                  href="/setup"
                  status={dataset.setup.hasVehicleProfile ? t("common.setupReady") : t("common.setupNeeded")}
                  statusReady={dataset.setup.hasVehicleProfile}
                  title={t("dashboard.setup.vehicleTitle")}
                  body={t("dashboard.setup.vehicleBody")}
                />
                <SetupItem
                  href="/setup"
                  status={dataset.setup.hasCostProfile ? t("common.setupReady") : t("common.setupNeeded")}
                  statusReady={dataset.setup.hasCostProfile}
                  title={t("dashboard.setup.costTitle")}
                  body={t("dashboard.setup.costBody")}
                />
              </div>
            </Panel>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-2">
          <Panel
            eyebrow={t("dashboard.sections.operations")}
            title={t("dashboard.charts.weekdayTitle")}
            description={t("dashboard.charts.weekdayBody")}
          >
            <WeekdayPerformanceChart data={dataset.weekdayPerformance} currency={currency} />
          </Panel>

          <Panel
            eyebrow={t("dashboard.sections.costs")}
            title={t("dashboard.charts.costCompositionTitle")}
            description={t("dashboard.charts.costCompositionBody")}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <CompositionChart
                data={dataset.costComposition.map((slice) => ({
                  ...slice,
                  label: t(slice.label),
                }))}
                currency={currency}
              />
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
              <div className="mt-5 flex items-start gap-3 rounded-3xl border border-amber-400/18 bg-amber-400/10 p-4 text-sm leading-6 text-amber-100">
                <CircleAlert className="mt-0.5 shrink-0" size={18} />
                <p>{`${t("dashboard.setup.vehicleBody")} ${t("dashboard.setup.costBody")}`}</p>
              </div>
            )}
          </Panel>

          <Panel
            eyebrow={t("dashboard.sections.costs")}
            title={t("dashboard.charts.revenueCompositionTitle")}
            description={t("dashboard.charts.revenueCompositionBody")}
          >
            <div className="grid gap-5 lg:grid-cols-[1fr_auto] lg:items-center">
              <CompositionChart
                data={dataset.revenueComposition.map((slice) => ({
                  ...slice,
                  label: t(slice.label),
                }))}
                currency={currency}
              />
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
    <section className="rm-surface-strong p-5 md:p-6">
      <div className="rm-pill">{eyebrow}</div>
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-white">{title}</h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
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
      className="flex items-start justify-between rounded-[24px] border border-slate-700/70 bg-slate-950/55 p-4 hover:border-slate-500"
    >
      <div className="pr-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
            statusReady
              ? "bg-emerald-400/12 text-emerald-300"
              : "bg-amber-400/12 text-amber-200"
          }`}
        >
          {status}
        </span>
        <p className="mt-3 font-semibold text-white">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-300">{body}</p>
      </div>
          <ArrowRight className="mt-1 shrink-0 text-slate-400" size={18} />
    </Link>
  );
}

function LegendList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.label} className="rm-stat-tile min-w-[15rem]">
          <p className="rm-stat-kicker">{item.label}</p>
          <p className="mt-2 font-semibold text-white">{item.value}</p>
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
          className="flex items-center justify-between rounded-[24px] border border-slate-700/60 bg-slate-950/55 px-4 py-4"
        >
          <p className="text-sm text-slate-300">{item.label}</p>
          <p className="text-lg font-semibold text-white">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function MiniSummary({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-slate-700/70 bg-slate-950/55 px-4 py-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">
        {label}
      </p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}
