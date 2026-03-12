import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { calculateShiftMetrics } from "@/lib/calculations";
import { getCurrentUserFromCookie } from "@/lib/auth";
import LogoutButton from "@/components/logout-button";

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
      <main className="min-h-screen bg-slate-50 p-6">
        <div className="mx-auto max-w-3xl rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Rider KPI</h1>
          <p className="mt-3 text-slate-600">
            Πρέπει να συνδεθείς για να δεις το dashboard σου.
          </p>

          <div className="mt-6 flex gap-3">
            <Link
              href="/login"
              className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white"
            >
              Σύνδεση
            </Link>

            <Link
              href="/register"
              className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-900"
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

  const todayStr = new Date().toISOString().slice(0, 10);

  const todayShifts = shifts.filter((shift) => {
    const shiftDate = new Date(shift.date).toISOString().slice(0, 10);
    return shiftDate === todayStr;
  });

  const now = new Date();
  const day = now.getDay();
  const diffToMonday = day === 0 ? 6 : day - 1;

  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - diffToMonday);
  startOfWeek.setHours(0, 0, 0, 0);

  const weeklyShifts = shifts.filter((shift) => {
    const shiftDate = new Date(shift.date);
    return shiftDate >= startOfWeek;
  });

  const todayTotals = todayShifts.reduce(
    (acc, shift) => {
      const metrics = calculateShiftMetrics(
        {
          platformEarnings: Number(shift.platformEarnings),
          tipsCard: Number(shift.tipsCard),
          tipsCash: Number(shift.tipsCash),
          bonus: Number(shift.bonus),
          hours: Number(shift.hours),
          ordersCount: Number(shift.ordersCount),
          kilometers: Number(shift.kilometers),
        },
        vehicle
      );

      acc.revenue += metrics.totalRevenue;
      acc.tips += metrics.tipsTotal;
      acc.hours += Number(shift.hours);
      acc.orders += Number(shift.ordersCount);
      acc.kilometers += Number(shift.kilometers);
      acc.variableCost += metrics.variableCost;
      acc.netProfit += metrics.netProfit;

      return acc;
    },
    {
      revenue: 0,
      tips: 0,
      hours: 0,
      orders: 0,
      kilometers: 0,
      variableCost: 0,
      netProfit: 0,
    }
  );

  const overallTotals = shifts.reduce(
    (acc, shift) => {
      const metrics = calculateShiftMetrics(
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

      acc.revenue += metrics.totalRevenue;
      acc.tips += metrics.tipsTotal;
      acc.kilometers += Number(shift.kilometers);
      acc.variableCost += metrics.variableCost;
      acc.netProfit += metrics.netProfit;

      return acc;
    },
    {
      revenue: 0,
      tips: 0,
      kilometers: 0,
      variableCost: 0,
      netProfit: 0,
    }
  );

    const weeklyTotals = weeklyShifts.reduce(
    (acc, shift) => {
      const metrics = calculateShiftMetrics(
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

      acc.revenue += metrics.totalRevenue;
      acc.netProfit += metrics.netProfit;
      acc.hours += Number(shift.hours);
      acc.kilometers += Number(shift.kilometers);
      acc.orders += Number(shift.ordersCount);

      return acc;
    },
    {
      revenue: 0,
      netProfit: 0,
      hours: 0,
      kilometers: 0,
      orders: 0,
    }
  );

  const weeklyNetPerHour =
    weeklyTotals.hours > 0 ? weeklyTotals.netProfit / weeklyTotals.hours : 0;

  const shiftsWithMetrics = shifts.map((shift) => {
    const metrics = calculateShiftMetrics(
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

    return {
      ...shift,
      metrics,
    };
  });

  const bestShift = shiftsWithMetrics.reduce<
    (typeof shiftsWithMetrics)[number] | null
  >((best, current) => {
    if (!best) return current;
    return current.metrics.netPerHour > best.metrics.netPerHour ? current : best;
  }, null);

  const dayMap = new Map<
    string,
    {
      revenue: number;
      netProfit: number;
      hours: number;
      shifts: number;
    }
  >();

  shiftsWithMetrics.forEach((shift) => {
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
    .map(([day, stats]) => ({
      day,
      ...stats,
      netPerHour: stats.hours > 0 ? stats.netProfit / stats.hours : 0,
    }))
    .sort((a, b) => b.netPerHour - a.netPerHour)[0];

  const grossPerHour =
    todayTotals.hours > 0 ? todayTotals.revenue / todayTotals.hours : 0;

  const netPerHour =
    todayTotals.hours > 0 ? todayTotals.netProfit / todayTotals.hours : 0;

  const revenuePerOrder =
    todayTotals.orders > 0 ? todayTotals.revenue / todayTotals.orders : 0;

  const costPerKm = vehicle
    ? calculateShiftMetrics(
        {
          platformEarnings: 0,
          tipsCard: 0,
          tipsCash: 0,
          bonus: 0,
          hours: 0,
          ordersCount: 0,
          kilometers: 0,
        },
        vehicle,
        fixedCosts
      ).totalCostPerKm
    : 0;

  return (
    <main className="min-h-screen bg-slate-50 p-6">
      <div className="mx-auto max-w-6xl">
        <div className="rounded-3xl bg-white p-8 shadow-sm">
          <h1 className="text-3xl font-bold text-slate-900">Rider KPI</h1>
          <p className="mt-3 text-slate-600">
            Εφαρμογή για διανομείς efood / Wolt στην Ελλάδα.
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/new-shift"
              className="rounded-xl bg-slate-900 px-5 py-3 font-medium text-white"
            >
              Νέα Βάρδια
            </Link>

            <Link
              href="/history"
              className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-900"
            >
              Ιστορικό
            </Link>

            <Link
            href="/vehicle"
            className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-900"
            >
              Όχημα
            </Link>
            
            <Link
            href="/fixed-costs"
            className="rounded-xl border border-slate-300 px-5 py-3 font-medium text-slate-900"
            >
              Πάγια Έξοδα
            </Link>

            <LogoutButton />

          </div>

          <div className="rounded-2xl border p-5">
            <p className="text-sm text-slate-500">Ημερήσιο πάγιο</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">
              {formatCurrency(fixedCosts
              ? (
                Number(fixedCosts.insuranceMonthly) +
                Number(fixedCosts.phoneMonthly) +
                Number(fixedCosts.accountantMonthly) +
                Number(fixedCosts.roadTaxMonthly) +
                Number(fixedCosts.kteoMonthly) +
                Number(fixedCosts.otherMonthly)
              ) / 30
              : 0
              )}
              </p>
            </div>

          <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Μικτά σήμερα</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(todayTotals.revenue)}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Καθαρά σήμερα</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(todayTotals.netProfit)}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Tips σήμερα</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(todayTotals.tips)}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Κόστος / χλμ</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(costPerKm)}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Μικτά / ώρα</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(grossPerHour)}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Καθαρά / ώρα</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(netPerHour)}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Παραγγελίες σήμερα</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatNumber(todayTotals.orders)}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Χλμ σήμερα</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatNumber(todayTotals.kilometers)}
              </p>
            </div>

            <div className="rounded-2xl border p-5">
              <p className="text-sm text-slate-500">Έσοδα / παραγγελία</p>
              <p className="mt-2 text-2xl font-semibold text-slate-900">
                {formatCurrency(revenuePerOrder)}
              </p>
            </div>
          </div>

          <div className="mt-8 rounded-2xl border p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Συνολικά μέχρι τώρα
            </h2>

                      <div className="mt-8 rounded-2xl border p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Αυτή η εβδομάδα
            </h2>

          <div className="mt-8 rounded-2xl border p-5">
            <h2 className="text-lg font-semibold text-slate-900">
              Καλύτερες επιδόσεις
            </h2>

            <div className="mt-4 grid gap-4 md:grid-cols-2">
              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Καλύτερη βάρδια</p>

                {bestShift ? (
                  <>
                    <p className="mt-1 text-lg font-semibold text-slate-900">
                      {new Date(bestShift.date).toLocaleDateString("el-GR")} ·{" "}
                      {bestShift.area}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {bestShift.platform.toUpperCase()} ·{" "}
                      {formatCurrency(bestShift.metrics.netPerHour)} καθαρά / ώρα
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Καθαρά: {formatCurrency(bestShift.metrics.netProfit)} · Ώρες:{" "}
                      {formatNumber(bestShift.hours)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">
                    Δεν υπάρχουν ακόμα αρκετά δεδομένα.
                  </p>
                )}
              </div>

              <div className="rounded-2xl bg-slate-50 p-4">
                <p className="text-sm text-slate-500">Καλύτερη μέρα εβδομάδας</p>

                {bestDayEntry ? (
                  <>
                    <p className="mt-1 text-lg font-semibold capitalize text-slate-900">
                      {bestDayEntry.day}
                    </p>
                    <p className="mt-1 text-sm text-slate-600">
                      {formatCurrency(bestDayEntry.netPerHour)} καθαρά / ώρα
                    </p>
                    <p className="mt-2 text-sm text-slate-500">
                      Καθαρά: {formatCurrency(bestDayEntry.netProfit)} · Βάρδιες:{" "}
                      {formatNumber(bestDayEntry.shifts)}
                    </p>
                  </>
                ) : (
                  <p className="mt-1 text-sm text-slate-600">
                    Δεν υπάρχουν ακόμα αρκετά δεδομένα.
                  </p>
                )}
              </div>
            </div>
          </div>

            <div className="mt-4 grid gap-4 md:grid-cols-5">
              <div>
                <p className="text-sm text-slate-500">Μικτά εβδομάδας</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatCurrency(weeklyTotals.revenue)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Καθαρά εβδομάδας</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatCurrency(weeklyTotals.netProfit)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Ώρες εβδομάδας</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatNumber(weeklyTotals.hours)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Χλμ εβδομάδας</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatNumber(weeklyTotals.kilometers)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Καθαρά / ώρα</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatCurrency(weeklyNetPerHour)}
                </p>
              </div>
            </div>
          </div>

            <div className="mt-4 grid gap-4 md:grid-cols-4">
              <div>
                <p className="text-sm text-slate-500">Σύνολο βαρδιών</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatNumber(shifts.length)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Σύνολο μικτών</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatCurrency(overallTotals.revenue)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Σύνολο κόστους με πάγια</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatCurrency(overallTotals.variableCost)}
                </p>
              </div>

              <div>
                <p className="text-sm text-slate-500">Σύνολο καθαρών</p>
                <p className="mt-1 text-xl font-semibold text-slate-900">
                  {formatCurrency(overallTotals.netProfit)}
                </p>
              </div>
            </div>
          </div>


        

        

          {!vehicle ? (
            <div className="mt-6 rounded-2xl border border-amber-300 bg-amber-50 p-4 text-amber-900">
              Δεν έχει οριστεί όχημα. Τα καθαρά κέρδη δεν μπορούν να υπολογιστούν σωστά.
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}