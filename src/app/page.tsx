import Link from "next/link";
import { ArrowRight, ChevronDown, CircleAlert, Compass, History, PlusCircle, Radar, Settings2 } from "lucide-react";
import CompositionChart from "@/components/charts/composition-chart";
import TrendChart from "@/components/charts/trend-chart";
import WeekdayPerformanceChart from "@/components/charts/weekday-performance-chart";
import DashboardControls from "@/components/dashboard/dashboard-controls";
import HeroKpiCard from "@/components/dashboard/hero-kpi-card";
import QuickExpenseLauncher from "@/components/dashboard/quick-expense-launcher";
import LogoutButton from "@/components/logout-button";
import ShiftPerformanceTable from "@/components/tables/shift-performance-table";
import LanguageSwitcher from "@/components/ui/language-switcher";
import MobileTabBar from "@/components/ui/mobile-tab-bar";
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

  return (
    <main className="rm-page-shell">
      <div className="rm-page-container">
        <div className="rm-app-frame">
          <aside className="rm-side-rail">
            <div className="rm-side-card">
              <div className="rm-pill">{t("dashboard.eyebrow")}</div>
              <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                RiderMeter
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {t("dashboard.body")}
              </p>

              <div className="mt-6 space-y-2">
                <RailLink href="/" label={t("common.dashboard")} icon={<Compass size={16} />} />
                <RailLink href="/new-shift" label={t("common.newShift")} icon={<PlusCircle size={16} />} />
                <RailLink href="/history" label={t("common.viewHistory")} icon={<History size={16} />} />
                <RailLink href="/setup" label={t("common.settings")} icon={<Settings2 size={16} />} />
                {currentUser.roleType === "admin" ? (
                  <RailLink href="/admin" label={t("common.admin")} icon={<Radar size={16} />} />
                ) : null}
              </div>

              <div className="rm-section-divider mt-6" />

              <div className="mt-6 flex flex-wrap gap-2">
                <LanguageSwitcher />
                <LogoutButton />
              </div>
            </div>
          </aside>

          <div className="space-y-5">
            <section className="rm-spotlight">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="max-w-3xl">
                  <div className="rm-pill">{t("dashboard.eyebrow")}</div>
                  <h1 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 md:text-[3.2rem] md:leading-[1.04]">
                    {t("dashboard.title")}
                  </h1>
                  <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
                    {t("dashboard.body")}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 xl:hidden lg:justify-end">
                  <LanguageSwitcher />
                  <LogoutButton />
                </div>
              </div>

              <div className="mt-6 grid gap-4 xl:grid-cols-[minmax(0,1.1fr)_22rem]">
                <div className="space-y-4">
                  <DashboardControls period={dataset.period} range={dataset.range} />

                  <div className={`grid gap-3 sm:grid-cols-2 ${currentUser.roleType === "admin" ? "xl:grid-cols-4" : "xl:grid-cols-3"}`}>
                    <QuickLinkCard href="/new-shift" title={t("common.newShift")} body={t("shiftForm.body")} />
                    <QuickLinkCard href="/history" title={t("common.viewHistory")} body={t("history.body")} />
                    {dataset.settings.onboardingCompleted ? (
                      <QuickExpenseLauncher
                        currency={currency}
                        timezone={dataset.settings.timezone}
                        title={t("dashboard.addExpenseTitle")}
                        body={t("dashboard.quickExpense.launchBody")}
                      />
                    ) : (
                      <QuickLinkCard
                        href="/setup?onboarding=1"
                        title={t("common.settings")}
                        body={t("dashboard.settingsCardBody")}
                      />
                    )}
                    {currentUser.roleType === "admin" ? (
                      <QuickLinkCard href="/admin" title={t("common.admin")} body={t("admin.body")} />
                    ) : null}
                  </div>
                </div>

                <section className="rm-accent-panel">
                  <p className="rm-pill">{t(`dashboard.period.${dataset.period}`)}</p>
                  <p className="mt-4 text-sm text-blue-100/80">{t("dashboard.hero.netProfit")}</p>
                  <p className="mt-2 text-4xl font-semibold tracking-tight text-white">
                    {formatCurrency(dataset.selected.netProfit, locale, currency)}
                  </p>
                  <p className="mt-2 text-sm text-blue-100/80">
                    {formatCurrency(dataset.selected.netProfitPerHour, locale, currency)} / {t("dashboard.hero.hours").toLowerCase()}
                  </p>

                  <div className="mt-6 grid gap-3">
                    <AccentSummaryPair label={t("dashboard.hero.revenue")} value={formatCurrency(dataset.selected.totalRevenue, locale, currency)} />
                    <AccentSummaryPair label={t("dashboard.hero.orders")} value={formatNumber(dataset.selected.totalOrders, locale, 0)} />
                    <AccentSummaryPair label={t("dashboard.hero.margin")} value={formatPercent(dataset.selected.marginPercent, locale)} />
                  </div>
                </section>
              </div>
            </section>

            <section className="rm-home-hero-grid xl:grid-cols-3">
              <HeroKpiCard
                label={t("dashboard.hero.revenue")}
                value={formatCurrency(dataset.selected.totalRevenue, locale, currency)}
                helper={`${formatCurrency(dataset.selected.averageRevenuePerShift, locale, currency)} / ${t("common.shift")}`}
                delta={formatDelta(dataset.comparisons.revenue.changePercent, locale)}
                deltaDirection={dataset.comparisons.revenue.direction}
                sparklineValues={dataset.trend.map((point) => point.revenue)}
              />
              <HeroKpiCard
                label={t("dashboard.hero.netProfit")}
                value={formatCurrency(dataset.selected.netProfit, locale, currency)}
                helper={`${formatCurrency(dataset.selected.netProfitPerHour, locale, currency)} / ${t("common.hour")}`}
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
            </section>

            <section className="grid gap-3 md:grid-cols-3">
              <HomeHeroCard label={t("dashboard.hero.hours")} value={formatNumber(dataset.selected.totalHours, locale)} />
              <HomeHeroCard label={t("dashboard.hero.kilometers")} value={formatNumber(dataset.selected.totalKilometers, locale)} />
              <HomeHeroCard label={t("dashboard.hero.margin")} value={formatPercent(dataset.selected.marginPercent, locale)} />
            </section>

            {!hasShifts ? (
              <section className="rm-empty-state">
                <h2 className="text-2xl font-semibold text-slate-950">{t("dashboard.empty.title")}</h2>
                <p className="mt-3 text-sm leading-6 text-slate-600">{t("dashboard.empty.body")}</p>
                <Link href="/new-shift" className="rm-button-primary mt-6">
                  {t("dashboard.empty.cta")}
                </Link>
              </section>
            ) : null}

            {hasShifts ? (
              <>
                <section className="rm-home-stack">
                  <div className="rm-home-column">
                    <section className="rm-flow-card">
                      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                        <div className="max-w-2xl">
                          <div className="rm-pill">{t("dashboard.sections.today")}</div>
                          <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
                            {t("dashboard.quickRead.title")}
                          </h2>
                          <p className="mt-2 text-sm leading-6 text-slate-600">
                            {t("dashboard.quickRead.body")}
                          </p>
                        </div>

                        <div className="rm-home-hero-grid lg:w-[28rem]">
                          <HomeHeroCard label={t("dashboard.hero.revenue")} value={formatCurrency(dataset.today.totalRevenue, locale, currency)} />
                          <HomeHeroCard label={t("dashboard.hero.netProfit")} value={formatCurrency(dataset.today.netProfit, locale, currency)} />
                        </div>
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                        <InlineMetricCard label={t("dashboard.cards.netPerHour")} value={formatCurrency(dataset.today.netProfitPerHour, locale, currency)} />
                        <InlineMetricCard label={t("dashboard.hero.orders")} value={formatNumber(dataset.today.totalOrders, locale, 0)} />
                        <InlineMetricCard label={t("dashboard.hero.hours")} value={formatNumber(dataset.today.totalHours, locale)} />
                        <InlineMetricCard
                          label={t("dashboard.cards.costPerKm")}
                          value={formatCurrency(dataset.today.totalKilometers > 0 ? dataset.today.totalCost / dataset.today.totalKilometers : 0, locale, currency)}
                        />
                      </div>

                      <div className="mt-5 grid gap-3 md:grid-cols-3">
                        <PulseCard
                          title={t("dashboard.quickRead.paceTitle")}
                          body={t("dashboard.quickRead.paceBody", {
                            value: formatCurrency(dataset.selected.averageRevenuePerShift, locale, currency),
                          })}
                        />
                        <PulseCard
                          title={t("dashboard.quickRead.marginTitle")}
                          body={t("dashboard.quickRead.marginBody", {
                            margin: formatPercent(dataset.selected.marginPercent, locale),
                            cost: formatCurrency(dataset.selected.totalCost, locale, currency),
                          })}
                        />
                        <PulseCard
                          title={t("dashboard.quickRead.movementTitle")}
                          body={t("dashboard.quickRead.movementBody", {
                            value: formatNumber(dataset.selected.kilometersPerOrder, locale),
                            kilometer: t("common.kilometer"),
                            order: t("common.order"),
                          })}
                        />
                      </div>

                      <div className="mt-5 grid gap-3 sm:grid-cols-2">
                        <QuickLinkCard href="/new-shift" title={t("common.newShift")} body={t("shiftForm.body")} />
                        <QuickLinkCard href="/history" title={t("common.viewHistory")} body={t("history.body")} />
                      </div>

                      {(!dataset.settings.onboardingCompleted &&
                        (!dataset.setup.hasVehicleProfile || !dataset.setup.hasCostProfile)) && (
                        <div className="mt-5 flex items-start gap-3 rounded-[24px] border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-900">
                          <CircleAlert className="mt-0.5 shrink-0" size={18} />
                          <p>{`${t("dashboard.setup.vehicleBody")} ${t("dashboard.setup.costBody")}`}</p>
                        </div>
                      )}
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

                  <div className="rm-home-column">
                    <Panel eyebrow={t("dashboard.sections.insights")} title={t("dashboard.sections.insights")} description={t("nav.cockpit")}>
                      <div className="space-y-3">
                        {dataset.insights.map((insight) => (
                          <InsightCard
                            key={insight.id}
                            tone={insight.tone}
                            title={t(insight.titleKey)}
                            body={t(insight.bodyKey, formatInsightValues(insight.values, locale, currency))}
                          />
                        ))}
                        {dataset.insights.length === 0 ? (
                          <InsightCard tone="neutral" title={t("dashboard.insights.emptyTitle")} body={t("dashboard.insights.emptyBody")} />
                        ) : null}
                      </div>
                    </Panel>

                    <Panel
                      eyebrow={
                        dataset.settings.onboardingCompleted
                          ? t("dashboard.sections.operations")
                          : t("common.settings")
                      }
                      title={
                        dataset.settings.onboardingCompleted
                          ? t("dashboard.quickActionsTitle")
                          : t("common.settings")
                      }
                      description={
                        dataset.settings.onboardingCompleted
                          ? t("dashboard.quickActionsBody")
                          : t("dashboard.body")
                      }
                    >
                      <div className="space-y-3">
                        {!dataset.settings.onboardingCompleted ? (
                          <>
                            <SetupItem
                              href="/setup?onboarding=1"
                              status={dataset.setup.hasVehicleProfile ? t("common.setupReady") : t("common.setupNeeded")}
                              statusReady={dataset.setup.hasVehicleProfile}
                              title={t("dashboard.setup.vehicleTitle")}
                              body={t("dashboard.setup.vehicleBody")}
                            />
                            <SetupItem
                              href="/setup?onboarding=1"
                              status={dataset.setup.hasCostProfile ? t("common.setupReady") : t("common.setupNeeded")}
                              statusReady={dataset.setup.hasCostProfile}
                              title={t("dashboard.setup.costTitle")}
                              body={t("dashboard.setup.costBody")}
                            />
                          </>
                        ) : (
                          <QuickExpenseLauncher
                            currency={currency}
                            timezone={dataset.settings.timezone}
                            variant="panel"
                            title={t("dashboard.addExpenseTitle")}
                            body={t("dashboard.quickExpense.panelBody")}
                          />
                        )}
                      </div>
                    </Panel>

                    <Panel eyebrow={t("dashboard.sections.insights")} title={t("dashboard.benchmarks.title")} description={t("dashboard.benchmarks.body")}>
                      {dataset.benchmarks.enoughData ? (
                        <div className="grid gap-3">
                          {dataset.benchmarks.cards.map((card) => (
                            <InsightCard
                              key={card.id}
                              tone="neutral"
                              title={t(card.titleKey)}
                              body={t(card.bodyKey, formatInsightValues(card.values, locale, currency))}
                            />
                          ))}
                        </div>
                      ) : (
                        <div className="rm-empty-state min-h-[12rem]">
                          <h3 className="text-lg font-semibold text-slate-950">{t("dashboard.benchmarks.emptyTitle")}</h3>
                          <p className="mt-2 text-sm text-slate-600">{t("dashboard.benchmarks.emptyBody")}</p>
                        </div>
                      )}
                    </Panel>
                  </div>
                </section>

                <details className="rm-disclosure">
                  <summary>
                    <div>
                      <div className="rm-pill">{t("dashboard.sections.trends")}</div>
                      <h2 className="mt-3 text-xl font-semibold tracking-tight text-slate-950">
                        {t("dashboard.quickRead.deeperTitle")}
                      </h2>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {t("dashboard.quickRead.deeperBody")}
                      </p>
                    </div>
                    <ChevronDown className="shrink-0 text-slate-400" size={20} />
                  </summary>

                  <div className="rm-disclosure-body space-y-4">
                    <section className="grid gap-4 xl:grid-cols-2">
                      <Panel eyebrow={t("dashboard.sections.trends")} title={t("dashboard.charts.trendTitle")} description={t("dashboard.charts.trendBody")}>
                        <TrendChart data={dataset.trend} currency={currency} />
                      </Panel>

                      <Panel eyebrow={t("dashboard.sections.operations")} title={t("dashboard.charts.weekdayTitle")} description={t("dashboard.charts.weekdayBody")}>
                        <WeekdayPerformanceChart data={dataset.weekdayPerformance} currency={currency} />
                      </Panel>
                    </section>

                    <section className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
                      <Panel eyebrow={t("dashboard.sections.performance")} title={t("dashboard.weather.title")} description={t("dashboard.weather.body")}>
                        <div className="grid gap-3 md:grid-cols-2">
                          {dataset.weatherPerformance.length > 0 ? (
                            dataset.weatherPerformance.map((item) => (
                              <div key={item.weatherCondition} className="rm-stat-tile">
                                <p className="rm-stat-kicker">{item.label}</p>
                                <p className="mt-2 text-lg font-semibold text-slate-950">
                                  {formatCurrency(item.netProfitPerHour, locale, currency)} / {t("common.hour")}
                                </p>
                                <p className="mt-1 text-sm text-slate-500">
                                  {formatNumber(item.shifts, locale, 0)} {t("common.shift")} · {formatCurrency(item.revenue, locale, currency)}
                                </p>
                              </div>
                            ))
                          ) : (
                            <div className="rm-empty-state min-h-[12rem]">
                              <h3 className="text-lg font-semibold text-slate-950">{t("dashboard.weather.emptyTitle")}</h3>
                              <p className="mt-2 text-sm text-slate-600">{t("dashboard.weather.emptyBody")}</p>
                            </div>
                          )}
                        </div>
                      </Panel>
                      <Panel eyebrow={t("dashboard.sections.costs")} title={t("dashboard.charts.revenueCompositionTitle")} description={t("dashboard.charts.revenueCompositionBody")}>
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

                    <section className="grid gap-4 xl:grid-cols-2">
                      <Panel eyebrow={t("dashboard.sections.costs")} title={t("dashboard.charts.costCompositionTitle")} description={t("dashboard.charts.costCompositionBody")}>
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
                  </div>
                </details>
              </>
            ) : null}
          </div>
        </div>
      </div>
      <MobileTabBar isAdmin={currentUser.roleType === "admin"} />
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

      if (key === "value" || key === "revenueValue" || key === "netValue") {
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
    <section className="rm-surface p-5 md:p-6">
      <div className="rm-pill">{eyebrow}</div>
      <h2 className="mt-4 text-xl font-semibold tracking-tight text-slate-950 md:text-2xl">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
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
      className="flex items-start justify-between rounded-[24px] border border-stone-200 bg-white p-4 hover:border-orange-200 hover:bg-orange-50/50"
    >
      <div className="pr-4">
        <span
          className={`rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em] ${
            statusReady
              ? "bg-emerald-50 text-emerald-700"
              : "bg-amber-50 text-amber-700"
          }`}
        >
          {status}
        </span>
        <p className="mt-3 font-semibold text-slate-950">{title}</p>
        <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
      </div>
      <ArrowRight className="mt-1 shrink-0 text-stone-400" size={18} />
    </Link>
  );
}

function LegendList({ items }: { items: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid gap-3">
      {items.map((item) => (
        <div key={item.label} className="rm-stat-tile min-w-[15rem]">
          <p className="rm-stat-kicker">{item.label}</p>
          <p className="mt-2 font-semibold text-slate-950">{item.value}</p>
        </div>
      ))}
    </div>
  );
}

function HomeHeroCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rm-home-hero-card">
      <p className="rm-stat-kicker">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-950">{value}</p>
    </div>
  );
}

function InlineMetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[24px] border border-stone-200 bg-white px-4 py-4">
      <p className="text-sm text-slate-600">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}

function PulseCard({ title, body }: { title: string; body: string }) {
  return (
    <div className="rm-home-hero-card">
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function AccentSummaryPair({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-[22px] border border-white/10 bg-white/6 px-4 py-3">
      <p className="text-sm text-blue-100/80">{label}</p>
      <p className="text-right text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function QuickLinkCard({
  href,
  title,
  body,
}: {
  href: string;
  title: string;
  body: string;
}) {
  return (
    <Link
      href={href}
      className="rm-quick-link-card"
    >
      <div className="min-w-0">
        <p className="text-sm font-semibold text-slate-950">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-600">{body}</p>
      </div>
      <span className="rm-quick-link-icon">
        <ArrowRight className="text-stone-400" size={18} />
      </span>
    </Link>
  );
}

function RailLink({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3 rounded-[20px] border border-transparent px-3 py-3 text-sm font-medium text-slate-700 hover:border-blue-100 hover:bg-blue-50/80"
    >
      <span className="inline-flex h-9 w-9 items-center justify-center rounded-2xl bg-white text-blue-700 shadow-sm">
        {icon}
      </span>
      <span>{label}</span>
    </Link>
  );
}

function InsightCard({
  tone,
  title,
  body,
}: {
  tone: "positive" | "caution" | "neutral";
  title: string;
  body: string;
}) {
  return (
    <div
      className={`rounded-[24px] border p-4 ${
        tone === "positive"
          ? "border-emerald-200 bg-emerald-50"
          : tone === "caution"
            ? "border-amber-200 bg-amber-50"
            : "border-stone-200 bg-stone-50"
      }`}
    >
      <p className="text-sm font-semibold text-slate-950">{title}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}
