import { buildInsights } from "@/lib/analytics/insights";
import { aggregateShiftMetrics, createEmptyAggregate, withShiftMetrics } from "@/lib/calculations";
import { getPeriodRange, nowIsoDate, toDateLabel, toRangeStrings, toWeekdayLabel } from "@/lib/dates";
import { groupBy } from "@/lib/utils";
import { getCostProfileSnapshot, getUserSettingsSnapshot, getVehicleProfileSnapshot } from "@/services/settings-service";
import { listUserShifts } from "@/services/shift-service";
import type { DashboardDataset, DashboardPeriod, ShiftWithMetrics, TimeSeriesPoint } from "@/types/domain";

export async function getDashboardDataset(args: {
  userId: number;
  period?: DashboardPeriod;
  from?: string;
  to?: string;
}) : Promise<DashboardDataset> {
  const settings = await getUserSettingsSnapshot(args.userId);
  const vehicleProfile = await getVehicleProfileSnapshot(args.userId);
  const costProfile = await getCostProfileSnapshot(args.userId);
  const allShifts = await listUserShifts(args.userId);
  const shiftsWithMetrics = withShiftMetrics(allShifts, {
    settings,
    vehicleProfile,
    costProfile,
  });

  const todayIso = nowIsoDate(settings.timezone);
  const selectedPeriod = args.period ?? settings.preferredDashboardPeriod ?? "week";
  const selectedRange = toRangeStrings(selectedPeriod, settings.timezone, args.from, args.to);
  const weekRange = toRangeStrings("week", settings.timezone);
  const monthRange = toRangeStrings("month", settings.timezone);

  const todayShifts = shiftsWithMetrics.filter((shift) => shift.date === todayIso);
  const weekShifts = filterShiftsByRange(shiftsWithMetrics, weekRange.from, weekRange.to);
  const monthShifts = filterShiftsByRange(shiftsWithMetrics, monthRange.from, monthRange.to);
  const selectedShifts = filterShiftsByRange(
    shiftsWithMetrics,
    selectedRange.from,
    selectedRange.to
  );

  const trend = buildTrend(selectedShifts, settings.locale, settings.timezone);
  const weekdayPerformance = buildWeekdayPerformance(selectedShifts, settings.locale, settings.timezone);

  const previousWeekRange = getPeriodRange("week", settings.timezone);
  const previousWeekShifts = shiftsWithMetrics.filter((shift) => {
    const shiftDate = new Date(`${shift.date}T00:00:00.000Z`);
    return shiftDate < previousWeekRange.from.toJSDate();
  });
  const previousWeekAggregate = aggregateShiftMetrics(previousWeekShifts.slice(0, 7));
  const currentWeekAggregate = aggregateShiftMetrics(weekShifts);

  return {
    period: selectedPeriod,
    range: selectedRange,
    hero: aggregateShiftMetrics(selectedShifts),
    today: aggregateShiftMetrics(todayShifts),
    week: aggregateShiftMetrics(weekShifts),
    month: aggregateShiftMetrics(monthShifts),
    selected: aggregateShiftMetrics(selectedShifts),
    shifts: selectedShifts,
    trend,
    weekdayPerformance,
    revenueComposition: [
      { key: "base", label: "dashboard.composition.base", value: selectedShifts.reduce((sum, shift) => sum + shift.baseEarnings, 0) },
      { key: "tips", label: "dashboard.composition.tips", value: selectedShifts.reduce((sum, shift) => sum + shift.tipsAmount, 0) },
      { key: "bonus", label: "dashboard.composition.bonus", value: selectedShifts.reduce((sum, shift) => sum + shift.bonusAmount, 0) },
    ],
    costComposition: [
      { key: "fuel", label: "dashboard.composition.fuel", value: selectedShifts.reduce((sum, shift) => sum + shift.metrics.estimatedFuelCost, 0) },
      { key: "maintenance", label: "dashboard.composition.maintenance", value: selectedShifts.reduce((sum, shift) => sum + shift.metrics.maintenanceCost + shift.metrics.tiresCost, 0) },
      { key: "depreciation", label: "dashboard.composition.depreciation", value: selectedShifts.reduce((sum, shift) => sum + shift.metrics.depreciationCost, 0) },
      { key: "fixed", label: "dashboard.composition.fixed", value: selectedShifts.reduce((sum, shift) => sum + shift.metrics.allocatedFixedCost, 0) },
      { key: "reserve", label: "dashboard.composition.reserve", value: selectedShifts.reduce((sum, shift) => sum + shift.metrics.taxReserveCost + shift.metrics.platformFeeCost, 0) },
    ],
    insights: buildInsights({
      shifts: selectedShifts,
      trend,
      weekdayPerformance,
      previousWeekNetProfitPerHour: previousWeekAggregate.netProfitPerHour,
      currentWeekNetProfitPerHour: currentWeekAggregate.netProfitPerHour,
    }),
    topShift: [...selectedShifts].sort(
      (left, right) => right.metrics.netPerHour - left.metrics.netPerHour
    )[0] ?? null,
    topDay: [...trend].sort((left, right) => right.netProfit - left.netProfit)[0] ?? null,
    setup: {
      hasVehicleProfile: Boolean(vehicleProfile),
      hasCostProfile: Boolean(costProfile),
    },
    settings,
  };
}

function filterShiftsByRange(shifts: ShiftWithMetrics[], from: string, to: string) {
  return shifts.filter((shift) => shift.date >= from && shift.date <= to);
}

function buildTrend(shifts: ShiftWithMetrics[], locale: "en" | "el", timezone: string): TimeSeriesPoint[] {
  const grouped = groupBy(shifts, (shift) => shift.date);

  return Object.entries(grouped)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, dayShifts]) => ({
      date,
      label: toDateLabel(date, locale, timezone),
      revenue: dayShifts.reduce((sum, shift) => sum + shift.metrics.totalRevenue, 0),
      costs: dayShifts.reduce((sum, shift) => sum + shift.metrics.totalShiftCost, 0),
      netProfit: dayShifts.reduce((sum, shift) => sum + shift.metrics.netProfit, 0),
      orders: dayShifts.reduce((sum, shift) => sum + shift.ordersCompleted, 0),
      hours: dayShifts.reduce((sum, shift) => sum + shift.hoursWorked, 0),
      kilometers: dayShifts.reduce((sum, shift) => sum + shift.kilometersDriven, 0),
    }));
}

function buildWeekdayPerformance(
  shifts: ShiftWithMetrics[],
  locale: "en" | "el",
  timezone: string
) {
  const grouped = groupBy(shifts, (shift) => toWeekdayLabel(shift.date, locale, timezone));

  return Object.entries(grouped).map(([weekday, dayShifts]) => {
    const aggregate = dayShifts.length ? aggregateShiftMetrics(dayShifts) : createEmptyAggregate();
    return {
      weekday,
      revenue: aggregate.totalRevenue,
      netProfit: aggregate.netProfit,
      netProfitPerHour: aggregate.netProfitPerHour,
    };
  });
}
