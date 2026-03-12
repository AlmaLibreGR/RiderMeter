import Link from "next/link";
import type { LucideIcon } from "lucide-react";
import {
  ArrowUpRight,
  Bike,
  ChartColumn,
  CircleAlert,
  Clock3,
  Coins,
  Package,
  Route,
  Sparkles,
  TrendingUp,
  Wallet,
} from "lucide-react";
import LogoutButton from "@/components/logout-button";
import WeekdayNetPerHourChart from "@/components/weekday-net-per-hour-chart";
import WeeklyNetChart from "@/components/weekly-net-chart";
import { getCurrentUserFromCookie } from "@/lib/auth";
import { calculateShiftMetrics } from "@/lib/calculations";
import { prisma } from "@/lib/prisma";

type SummaryTotals = {
  revenue: number;
  tips: number;
  hours: number;
  orders: number;
  kilometers: number;
  totalShiftCost: number;
  netProfit: number;
};

type OverallTotals = {
  revenue: number;
  tips: number;
  kilometers: number;
  totalShiftCost: number;
  netProfit: number;
};

type DayStats = {
  revenue: number;
  netProfit: number;
  hours: number;
  shifts: number;
};

type WeekdayStats = {
  netProfit: number;
  hours: number;
};

const weekdayOrder = [
  "Δευτέρα",
  "Τρίτη",
  "Τετάρτη",
  "Πέμπτη",
  "Παρασκευή",
  "Σάββατο",
  "Κυριακή",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value || 0);
}

function formatNumber(value: number) {
  return new Intl.NumberFormat("el-GR", {
    maximumFractionDigits: 2,
  }).format(value || 0);
}

export default async function HomePage() {
  const currentUser = await getCurrentUserFromCookie();

  if (!currentUser) {
    return (
      <main className="min-h-screen p-4 md:p-6">
        <div className="mx-auto max-w-4xl rounded-[32px] border border-white/70 bg-white/85 p-8 shadow-[0_24px_80px_rgba(15,23,42,0.08)]">
          <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            RiderMeter
          </div>
          <h1 className="mt-4 text-4xl font-semibold tracking-tight text-slate-950">
            Δες καθαρά τι σου μένει από κάθε βάρδια
          </h1>
          <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
            Οργάνωσε τις βάρδιες σου, δες μικτά και καθαρά κέρδη, σύγκρινε ημέρες
            και κράτα όλο το ιστορικό σου σε ένα σημείο.
          </p>

          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/login"
              className="rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white"
            >
              Σύνδεση
            </Link>
            <Link
              href="/register"
              className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900"
            >
              Εγγραφή
            </Link>
          </div>
        </div>
      </main>
    );
  }

  const shifts = await prisma.shift.findMany({
    where: {
      userId: currentUser.userId,
    },
    orderBy: {
      date: "desc",
    },
  });
  type ShiftRecord = (typeof shifts)[number];

  const vehicle = await prisma.vehicle.findFirst({
    where: {
      userId: currentUser.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const fixedCosts = await prisma.fixedCost.findFirst({
    where: {
      userId: currentUser.userId,
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const buildMetrics = (shift: ShiftRecord) =>
    calculateShiftMetrics(
      {
        platformEarnings: Number(shift.platformEarnings),
        tipsCard: Number(shift.tipsCard),
        tipsCash: Number(shift.tipsCash),
        bonus: Number(shift.bonus),
        hours: Number(shift.hours),
        ordersCount: Number(shift.ordersCount),
        kilometers: Number(shift.kilometers),
      },
      vehicle,
      fixedCosts
    );

  const todayStr = new Date().toISOString().slice(0, 10);
  const todayShifts = shifts.filter((shift: ShiftRecord) => {
    const shiftDate = new Date(shift.date).toISOString().slice(0, 10);
    return shiftDate === todayStr;
  });

  const now = new Date();
  const diffToMonday = now.getDay() === 0 ? 6 : now.getDay() - 1;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyShifts = shifts.filter((shift: ShiftRecord) => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= startOfWeek;
  });

  const todayTotals = todayShifts.reduce(
    (acc: SummaryTotals, shift: ShiftRecord) => {
      const metrics = buildMetrics(shift);

      acc.revenue += metrics.totalRevenue;
      acc.tips += metrics.tipsTotal;
      acc.hours += Number(shift.hours);
      acc.orders += Number(shift.ordersCount);
      acc.kilometers += Number(shift.kilometers);
      acc.totalShiftCost += metrics.totalShiftCost;
      acc.netProfit += metrics.netProfit;

      return acc;
    },
    {
      revenue: 0,
      tips: 0,
      hours: 0,
      orders: 0,
      kilometers: 0,
      totalShiftCost: 0,
      netProfit: 0,
    }
  );

  const weeklyTotals = weeklyShifts.reduce(
    (acc: SummaryTotals, shift: ShiftRecord) => {
      const metrics = buildMetrics(shift);

      acc.revenue += metrics.totalRevenue;
      acc.tips += metrics.tipsTotal;
      acc.hours += Number(shift.hours);
      acc.orders += Number(shift.ordersCount);
      acc.kilometers += Number(shift.kilometers);
      acc.totalShiftCost += metrics.totalShiftCost;
      acc.netProfit += metrics.netProfit;

      return acc;
    },
    {
      revenue: 0,
      tips: 0,
      hours: 0,
      orders: 0,
      kilometers: 0,
      totalShiftCost: 0,
      netProfit: 0,
    }
  );

  const overallTotals = shifts.reduce(
    (acc: OverallTotals, shift: ShiftRecord) => {
      const metrics = buildMetrics(shift);

      acc.revenue += metrics.totalRevenue;
      acc.tips += metrics.tipsTotal;
      acc.kilometers += Number(shift.kilometers);
      acc.totalShiftCost += metrics.totalShiftCost;
      acc.netProfit += metrics.netProfit;

      return acc;
    },
    {
      revenue: 0,
      tips: 0,
      kilometers: 0,
      totalShiftCost: 0,
      netProfit: 0,
    }
  );

  const shiftsWithMetrics = shifts.map((shift: ShiftRecord) => ({
    ...shift,
    metrics: buildMetrics(shift),
  }));
  type ShiftWithMetricsRecord = (typeof shiftsWithMetrics)[number];

  const bestShift = shiftsWithMetrics.reduce<ShiftWithMetricsRecord | null>(
    (best: ShiftWithMetricsRecord | null, current: ShiftWithMetricsRecord) => {
      if (!best) {
        return current;
      }

      return current.metrics.netPerHour > best.metrics.netPerHour ? current : best;
    },
    null
  );

  const dayMap = new Map<string, DayStats>();

  shiftsWithMetrics.forEach((shift: ShiftWithMetricsRecord) => {
    const dayName = new Date(shift.date).toLocaleDateString("el-GR", {
      weekday: "long",
    });
    const current = dayMap.get(dayName) ?? {
      revenue: 0,
      netProfit: 0,
      hours: 0,
      shifts: 0,
    };

    current.revenue += shift.metrics.totalRevenue;
    current.netProfit += shift.metrics.netProfit;
    current.hours += Number(shift.hours);
    current.shifts += 1;

    dayMap.set(dayName, current);
  });

  const bestDayEntry = Array.from(dayMap.entries())
    .map(([dayName, stats]: [string, DayStats]) => ({
      day: dayName,
      revenue: stats.revenue,
      netProfit: stats.netProfit,
      hours: stats.hours,
      shifts: stats.shifts,
      netPerHour: stats.hours > 0 ? stats.netProfit / stats.hours : 0,
    }))
    .sort((a, b) => b.netPerHour - a.netPerHour)[0];

  const weeklyDayMap = new Map<string, number>();

  weeklyShifts.forEach((shift: ShiftRecord) => {
    const dayName = new Date(shift.date).toLocaleDateString("el-GR", {
      weekday: "long",
    });
    const normalizedDay =
      dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();

    weeklyDayMap.set(
      normalizedDay,
      (weeklyDayMap.get(normalizedDay) ?? 0) + buildMetrics(shift).netProfit
    );
  });

  const weeklyChartData = weekdayOrder.map((weekday) => ({
    day: weekday.slice(0, 3),
    net: weeklyDayMap.get(weekday) ?? 0,
  }));

  const weekdayStatsMap = new Map<string, WeekdayStats>();

  shiftsWithMetrics.forEach((shift: ShiftWithMetricsRecord) => {
    const dayName = new Date(shift.date).toLocaleDateString("el-GR", {
      weekday: "long",
    });
    const normalizedDay =
      dayName.charAt(0).toUpperCase() + dayName.slice(1).toLowerCase();
    const current = weekdayStatsMap.get(normalizedDay) ?? {
      netProfit: 0,
      hours: 0,
    };

    current.netProfit += shift.metrics.netProfit;
    current.hours += Number(shift.hours);
    weekdayStatsMap.set(normalizedDay, current);
  });

  const weekdayNetPerHourData = weekdayOrder.map((weekday) => {
    const stats = weekdayStatsMap.get(weekday) ?? { netProfit: 0, hours: 0 };

    return {
      day: weekday.slice(0, 3),
      netPerHour: stats.hours > 0 ? stats.netProfit / stats.hours : 0,
    };
  });

  const dailyFixedCost = fixedCosts
    ? (
        Number(fixedCosts.insuranceMonthly) +
        Number(fixedCosts.phoneMonthly) +
        Number(fixedCosts.accountantMonthly) +
        Number(fixedCosts.roadTaxMonthly) +
        Number(fixedCosts.kteoMonthly) +
        Number(fixedCosts.otherMonthly)
      ) / 30
    : 0;

  const costPerKm = vehicle
    ? (Number(vehicle.fuelPrice) * Number(vehicle.consumptionPer100Km)) / 100 +
      Number(vehicle.maintenancePerKm) +
      Number(vehicle.tiresPerKm) +
      Number(vehicle.depreciationPerKm)
    : 0;

  const todayGrossPerHour =
    todayTotals.hours > 0 ? todayTotals.revenue / todayTotals.hours : 0;
  const todayNetPerHour =
    todayTotals.hours > 0 ? todayTotals.netProfit / todayTotals.hours : 0;
  const todayRevenuePerOrder =
    todayTotals.orders > 0 ? todayTotals.revenue / todayTotals.orders : 0;
  const weeklyNetPerHour =
    weeklyTotals.hours > 0 ? weeklyTotals.netProfit / weeklyTotals.hours : 0;
  const hasShifts = shifts.length > 0;

  const todayCards = [
    {
      label: "Καθαρά σήμερα",
      value: formatCurrency(todayTotals.netProfit),
      helper: todayTotals.hours > 0 ? `${formatCurrency(todayNetPerHour)} / ώρα` : "Χωρίς ώρες ακόμη",
      icon: Wallet,
      accent: "dark" as const,
    },
    {
      label: "Μικτά σήμερα",
      value: formatCurrency(todayTotals.revenue),
      helper:
        todayTotals.orders > 0
          ? `${formatCurrency(todayRevenuePerOrder)} / παραγγελία`
          : "Χωρίς παραγγελίες ακόμη",
      icon: TrendingUp,
      accent: "emerald" as const,
    },
    {
      label: "Παραγγελίες σήμερα",
      value: formatNumber(todayTotals.orders),
      helper: `${formatNumber(todayTotals.kilometers)} χλμ`,
      icon: Package,
      accent: "amber" as const,
    },
    {
      label: "Κόστος σήμερα",
      value: formatCurrency(todayTotals.totalShiftCost),
      helper: vehicle ? `${formatCurrency(costPerKm)} / χλμ` : "Λείπουν στοιχεία οχήματος",
      icon: Coins,
      accent: "slate" as const,
    },
  ];

  const setupItems = [
    {
      label: "Στοιχεία οχήματος",
      href: "/vehicle",
      ready: Boolean(vehicle),
      description: "Χρειάζονται για σωστό κόστος ανά χιλιόμετρο και καθαρά κέρδη.",
    },
    {
      label: "Πάγια έξοδα",
      href: "/fixed-costs",
      ready: Boolean(fixedCosts),
      description: "Σε βοηθούν να βλέπεις πιο ρεαλιστικά το καθαρό αποτέλεσμα κάθε ημέρας.",
    },
  ];

  return (
    <main className="min-h-screen p-4 md:p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        <section className="rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_24px_80px_rgba(15,23,42,0.08)] backdrop-blur md:p-8">
          <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
            <div className="max-w-3xl">
              <div className="inline-flex items-center rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
                RiderMeter · Dashboard freelancer
              </div>
              <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 md:text-5xl">
                Η καθημερινή εικόνα των βαρδιών σου, χωρίς θόρυβο
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-600 md:text-base">
                Μπες κατευθείαν στα πιο κρίσιμα νούμερα της ημέρας, δες τι αποδίδει
                καλύτερα και βρες γρήγορα πού αξίζει να δώσεις προσοχή.
              </p>

              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  href="/new-shift"
                  className="inline-flex items-center gap-2 rounded-2xl bg-slate-900 px-5 py-3 font-medium text-white"
                >
                  Νέα βάρδια
                  <ArrowUpRight size={16} />
                </Link>
                <Link
                  href="/history"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900"
                >
                  Ιστορικό
                </Link>
                <Link
                  href="/vehicle"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900"
                >
                  Όχημα
                </Link>
                <Link
                  href="/fixed-costs"
                  className="rounded-2xl border border-slate-300 bg-white px-5 py-3 font-medium text-slate-900"
                >
                  Πάγια έξοδα
                </Link>
              </div>
            </div>

            <div className="flex w-full flex-col gap-3 xl:max-w-sm">
              <div className="rounded-[28px] bg-slate-950 p-5 text-white shadow-sm">
                <p className="text-xs uppercase tracking-[0.2em] text-white/60">
                  Σήμερα
                </p>
                <p className="mt-3 text-4xl font-semibold">
                  {formatCurrency(todayTotals.netProfit)}
                </p>
                <p className="mt-2 text-sm text-white/70">
                  {todayTotals.hours > 0
                    ? `${formatCurrency(todayNetPerHour)} καθαρά / ώρα`
                    : "Καταχώρισε βάρδια για να ξεκινήσει η εικόνα της ημέρας."}
                </p>
              </div>
              <LogoutButton />
            </div>
          </div>
        </section>

        <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {todayCards.map((card) => (
            <HeroStatCard
              key={card.label}
              label={card.label}
              value={card.value}
              helper={card.helper}
              icon={card.icon}
              accent={card.accent}
            />
          ))}
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.6fr_1fr]">
          <div className="rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
            <SectionHeading
              eyebrow="Εβδομάδα"
              title="Η εβδομαδιαία εικόνα σου με μια ματιά"
              description="Χρησιμοποίησέ τη για να εντοπίσεις γρήγορα αν η εβδομάδα πηγαίνει καλύτερα ή χειρότερα από όσο περίμενες."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SoftStatCard
                label="Μικτά εβδομάδας"
                value={formatCurrency(weeklyTotals.revenue)}
                helper={`${formatNumber(weeklyTotals.orders)} παραγγελίες`}
                icon={TrendingUp}
              />
              <SoftStatCard
                label="Καθαρά εβδομάδας"
                value={formatCurrency(weeklyTotals.netProfit)}
                helper={`${formatCurrency(weeklyNetPerHour)} / ώρα`}
                icon={Wallet}
              />
              <SoftStatCard
                label="Ώρες εβδομάδας"
                value={formatNumber(weeklyTotals.hours)}
                helper={`${formatNumber(weeklyTotals.kilometers)} χλμ`}
                icon={Clock3}
              />
              <SoftStatCard
                label="Tips εβδομάδας"
                value={formatCurrency(weeklyTotals.tips)}
                helper={`${formatCurrency(dailyFixedCost)} ημερήσιο πάγιο`}
                icon={Sparkles}
              />
            </div>

            <div className="mt-6 grid gap-6 xl:grid-cols-2">
              <ChartShell
                title="Καθαρά ανά ημέρα"
                description="Δες ποιες ημέρες αυτής της εβδομάδας απέδωσαν περισσότερο."
                empty={!weeklyShifts.length}
                emptyText="Δεν υπάρχουν ακόμη βάρδιες αυτή την εβδομάδα."
              >
                <WeeklyNetChart data={weeklyChartData} />
              </ChartShell>

              <ChartShell
                title="Καθαρά ανά ώρα"
                description="Σου δείχνει ποιες ημέρες αφήνουν καλύτερο ρυθμό καθαρού κέρδους."
                empty={!hasShifts}
                emptyText="Χρειάζεται ιστορικό βαρδιών για να εμφανιστεί η σύγκριση."
              >
                <WeekdayNetPerHourChart data={weekdayNetPerHourData} />
              </ChartShell>
            </div>
          </div>

          <div className="space-y-6">
            <section className="rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
              <SectionHeading
                eyebrow="Setup"
                title="Τι λείπει για πιο ακριβή καθαρά"
                description="Αυτά τα δύο στοιχεία βελτιώνουν άμεσα την ποιότητα των υπολογισμών."
              />

              <div className="mt-5 space-y-3">
                {setupItems.map((item) => (
                  <Link
                    key={item.label}
                    href={item.href}
                    className="flex items-start justify-between rounded-3xl border border-slate-200/80 bg-white p-4 shadow-sm hover:-translate-y-0.5"
                  >
                    <div className="pr-4">
                      <div className="flex items-center gap-2">
                        <span
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.ready
                              ? "bg-emerald-50 text-emerald-700"
                              : "bg-amber-50 text-amber-700"
                          }`}
                        >
                          {item.ready ? "Έτοιμο" : "Χρειάζεται"}
                        </span>
                        <p className="font-medium text-slate-900">{item.label}</p>
                      </div>
                      <p className="mt-2 text-sm leading-6 text-slate-600">
                        {item.description}
                      </p>
                    </div>
                    <ArrowUpRight className="mt-1 shrink-0 text-slate-400" size={18} />
                  </Link>
                ))}
              </div>
            </section>

            <section className="rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
              <SectionHeading
                eyebrow="Insights"
                title="Τα πιο χρήσιμα συμπεράσματα"
                description="Γρήγορες παρατηρήσεις για να παίρνεις καλύτερες αποφάσεις."
              />

              <div className="mt-5 space-y-3">
                {bestShift ? (
                  <InsightCard
                    title="Καλύτερη βάρδια"
                    value={`${formatCurrency(bestShift.metrics.netPerHour)} / ώρα`}
                    body={`${new Date(bestShift.date).toLocaleDateString("el-GR")} · ${bestShift.area} · ${bestShift.platform.toUpperCase()}`}
                    icon={TrendingUp}
                  />
                ) : null}

                {bestDayEntry ? (
                  <InsightCard
                    title="Καλύτερη ημέρα"
                    value={bestDayEntry.day}
                    body={`${formatCurrency(bestDayEntry.netPerHour)} καθαρά / ώρα σε ${formatNumber(bestDayEntry.shifts)} βάρδιες`}
                    icon={Sparkles}
                  />
                ) : null}

                <InsightCard
                  title="Συνολικό κόστος / χλμ"
                  value={vehicle ? formatCurrency(costPerKm) : "Χωρίς δεδομένα"}
                  body={
                    vehicle
                      ? "Με βάση καύσιμο, συντήρηση, λάστιχα και απόσβεση."
                      : "Συμπλήρωσε στοιχεία οχήματος για πιο ακριβή εικόνα."
                  }
                  icon={Bike}
                />
              </div>
            </section>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.3fr_1fr]">
          <div className="rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
            <SectionHeading
              eyebrow="Σύνολο"
              title="Η συνολική εικόνα μέχρι τώρα"
              description="Όσα έχεις γράψει έως τώρα, συγκεντρωμένα σε μια λιτή σύνοψη."
            />

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SoftStatCard
                label="Βάρδιες"
                value={formatNumber(shifts.length)}
                helper={hasShifts ? "Συνολικές καταχωρίσεις" : "Καμία βάρδια ακόμη"}
                icon={ChartColumn}
              />
              <SoftStatCard
                label="Μικτά"
                value={formatCurrency(overallTotals.revenue)}
                helper={`Tips: ${formatCurrency(overallTotals.tips)}`}
                icon={TrendingUp}
              />
              <SoftStatCard
                label="Συνολικό κόστος"
                value={formatCurrency(overallTotals.totalShiftCost)}
                helper={`${formatNumber(overallTotals.kilometers)} χλμ`}
                icon={Coins}
              />
              <SoftStatCard
                label="Καθαρά"
                value={formatCurrency(overallTotals.netProfit)}
                helper={
                  hasShifts
                    ? `${formatCurrency(overallTotals.netProfit / shifts.length)} ανά βάρδια`
                    : "Χωρίς ιστορικό ακόμη"
                }
                icon={Wallet}
              />
            </div>
          </div>

          <section className="rounded-[32px] border border-white/70 bg-white/78 p-6 shadow-[0_20px_70px_rgba(15,23,42,0.06)] backdrop-blur">
            <SectionHeading
              eyebrow="Σημερινός ρυθμός"
              title="Τι λέει η σημερινή βάρδια"
              description="Χρήσιμο snapshot όταν θες να δεις αν αξίζει να συνεχίσεις με τον ίδιο ρυθμό."
            />

            <div className="mt-6 space-y-3">
              <InlineStat
                label="Μικτά / ώρα"
                value={formatCurrency(todayGrossPerHour)}
                icon={TrendingUp}
              />
              <InlineStat
                label="Καθαρά / ώρα"
                value={formatCurrency(todayNetPerHour)}
                icon={Wallet}
              />
              <InlineStat
                label="Παραγγελίες / σήμερα"
                value={formatNumber(todayTotals.orders)}
                icon={Package}
              />
              <InlineStat
                label="Χιλιόμετρα / σήμερα"
                value={formatNumber(todayTotals.kilometers)}
                icon={Route}
              />
            </div>

            {!vehicle || !fixedCosts ? (
              <div className="mt-5 rounded-3xl border border-amber-200 bg-amber-50/80 p-4 text-sm leading-6 text-amber-900">
                <div className="flex items-start gap-2">
                  <CircleAlert className="mt-0.5 shrink-0" size={16} />
                  <p>
                    Η εικόνα των καθαρών μπορεί να βελτιωθεί κι άλλο αν συμπληρώσεις
                    πλήρως στοιχεία οχήματος και πάγια έξοδα.
                  </p>
                </div>
              </div>
            ) : null}

            {!hasShifts ? (
              <div className="mt-5 rounded-3xl border border-dashed border-slate-300 bg-white/70 p-4 text-sm leading-6 text-slate-600">
                Δεν υπάρχουν ακόμη βάρδιες. Ξεκίνα με την πρώτη καταχώριση για να
                αποκτήσει νόημα το dashboard.
              </div>
            ) : null}
          </section>
        </section>
      </div>
    </main>
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
      <h2 className="mt-4 text-2xl font-semibold tracking-tight text-slate-950">
        {title}
      </h2>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">{description}</p>
    </div>
  );
}

function HeroStatCard({
  label,
  value,
  helper,
  icon: Icon,
  accent,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
  accent: "dark" | "emerald" | "amber" | "slate";
}) {
  const accentClass =
    accent === "dark"
      ? "bg-slate-950 text-white"
      : accent === "emerald"
        ? "bg-emerald-50 text-emerald-950"
        : accent === "amber"
          ? "bg-amber-50 text-amber-950"
          : "bg-white/90 text-slate-950";
  const helperClass = accent === "dark" ? "text-white/70" : "text-slate-600";

  return (
    <div className={`rounded-[28px] border border-white/70 p-5 shadow-sm ${accentClass}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm opacity-80">{label}</p>
          <p className="mt-3 text-3xl font-semibold">{value}</p>
          <p className={`mt-2 text-sm ${helperClass}`}>{helper}</p>
        </div>
        <div className="rounded-2xl bg-black/5 p-3">
          <Icon size={18} />
        </div>
      </div>
    </div>
  );
}

function SoftStatCard({
  label,
  value,
  helper,
  icon: Icon,
}: {
  label: string;
  value: string;
  helper: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/88 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon size={16} />
        {label}
      </div>
      <p className="mt-3 text-2xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm text-slate-600">{helper}</p>
    </div>
  );
}

function ChartShell({
  title,
  description,
  empty,
  emptyText,
  children,
}: {
  title: string;
  description: string;
  empty: boolean;
  emptyText: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-[28px] border border-slate-200/80 bg-white/88 p-5 shadow-sm">
      <h3 className="text-lg font-semibold text-slate-950">{title}</h3>
      <p className="mt-1 text-sm leading-6 text-slate-600">{description}</p>
      <div className="mt-4">
        {empty ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50 p-6 text-sm text-slate-600">
            {emptyText}
          </div>
        ) : (
          children
        )}
      </div>
    </div>
  );
}

function InsightCard({
  title,
  value,
  body,
  icon: Icon,
}: {
  title: string;
  value: string;
  body: string;
  icon: LucideIcon;
}) {
  return (
    <div className="rounded-[24px] border border-slate-200/80 bg-white/90 p-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm text-slate-500">
        <Icon size={16} />
        {title}
      </div>
      <p className="mt-3 text-xl font-semibold text-slate-950">{value}</p>
      <p className="mt-2 text-sm leading-6 text-slate-600">{body}</p>
    </div>
  );
}

function InlineStat({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between rounded-3xl bg-white/88 px-4 py-4 shadow-sm">
      <div className="flex items-center gap-3">
        <div className="rounded-2xl bg-slate-100 p-2 text-slate-600">
          <Icon size={16} />
        </div>
        <p className="text-sm font-medium text-slate-600">{label}</p>
      </div>
      <p className="text-lg font-semibold text-slate-950">{value}</p>
    </div>
  );
}
