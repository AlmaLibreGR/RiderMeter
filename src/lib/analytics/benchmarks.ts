import { prisma } from "@/lib/prisma";
import { getDurationHoursFromTimes } from "@/lib/dates";
import { roundCurrency, safeDivide } from "@/lib/utils";
import type { BenchmarkCard, NetworkBenchmarkDataset, WeatherCondition } from "@/types/domain";

const minimumBenchmarkSample = 5;

type RawShiftBenchmark = {
  date: Date;
  startTime: string | null;
  endTime: string | null;
  hoursWorked: number;
  ordersCompleted: number;
  kilometersDriven: number;
  totalRevenue: number;
  weatherCondition: WeatherCondition;
};

export async function getNetworkBenchmarkDataset(locale: "en" | "el"): Promise<NetworkBenchmarkDataset> {
  const shifts = await prisma.shift.findMany({
    select: {
      date: true,
      startTime: true,
      endTime: true,
      hoursWorked: true,
      ordersCompleted: true,
      kilometersDriven: true,
      weatherCondition: true,
      baseEarnings: true,
      platformEarnings: true,
      tipsAmount: true,
      tipsCard: true,
      tipsCash: true,
      bonusAmount: true,
      bonus: true,
    },
  });

  const normalized = shifts
    .map<RawShiftBenchmark>((shift) => {
      const hoursWorked =
        getDurationHoursFromTimes(shift.startTime, shift.endTime) ?? shift.hoursWorked ?? 0;
      const totalRevenue =
        Number(shift.baseEarnings ?? shift.platformEarnings ?? 0) +
        Number(shift.tipsAmount ?? shift.tipsCard + shift.tipsCash) +
        Number(shift.bonusAmount ?? shift.bonus ?? 0);

      return {
        date: shift.date,
        startTime: shift.startTime,
        endTime: shift.endTime,
        hoursWorked,
        ordersCompleted: shift.ordersCompleted ?? 0,
        kilometersDriven: shift.kilometersDriven ?? 0,
        totalRevenue: roundCurrency(totalRevenue),
        weatherCondition: normalizeWeatherCondition(shift.weatherCondition),
      };
    })
    .filter((shift) => shift.hoursWorked > 0 && shift.totalRevenue > 0);

  if (normalized.length < minimumBenchmarkSample) {
    return { sampleSize: normalized.length, enoughData: false, cards: [] };
  }

  const weekdayMap = new Map<string, { revenue: number; hours: number; shifts: number }>();
  const hourMap = new Map<string, { revenue: number; hours: number; shifts: number }>();

  for (const shift of normalized) {
    const weekday = shift.date.toLocaleDateString(locale === "el" ? "el-GR" : "en-US", {
      weekday: "short",
      timeZone: "Europe/Athens",
    });
    const weekdayEntry = weekdayMap.get(weekday) ?? { revenue: 0, hours: 0, shifts: 0 };
    weekdayEntry.revenue += shift.totalRevenue;
    weekdayEntry.hours += shift.hoursWorked;
    weekdayEntry.shifts += 1;
    weekdayMap.set(weekday, weekdayEntry);

    const bucket = toHourBucket(shift.startTime);
    if (bucket) {
      const bucketEntry = hourMap.get(bucket) ?? { revenue: 0, hours: 0, shifts: 0 };
      bucketEntry.revenue += shift.totalRevenue;
      bucketEntry.hours += shift.hoursWorked;
      bucketEntry.shifts += 1;
      hourMap.set(bucket, bucketEntry);
    }
  }

  const bestWeekday = [...weekdayMap.entries()]
    .filter(([, value]) => value.shifts >= minimumBenchmarkSample)
    .sort(
      (left, right) =>
        safeDivide(right[1].revenue, right[1].hours) - safeDivide(left[1].revenue, left[1].hours)
    )[0];
  const strongestWindow = [...hourMap.entries()]
    .filter(([, value]) => value.shifts >= minimumBenchmarkSample)
    .sort(
      (left, right) =>
        safeDivide(right[1].revenue, right[1].hours) - safeDivide(left[1].revenue, left[1].hours)
    )[0];

  const totalRevenue = normalized.reduce((sum, shift) => sum + shift.totalRevenue, 0);
  const totalHours = normalized.reduce((sum, shift) => sum + shift.hoursWorked, 0);
  const totalOrders = normalized.reduce((sum, shift) => sum + shift.ordersCompleted, 0);

  const cards: BenchmarkCard[] = [];

  if (bestWeekday) {
    cards.push({
      id: "network-best-weekday",
      titleKey: "benchmarks.bestWeekday.title",
      bodyKey: "benchmarks.bestWeekday.body",
      sampleSize: bestWeekday[1].shifts,
      values: {
        weekday: bestWeekday[0],
        revenueValue: roundCurrency(safeDivide(bestWeekday[1].revenue, bestWeekday[1].hours)),
      },
    });
  }

  if (strongestWindow) {
    cards.push({
      id: "network-best-window",
      titleKey: "benchmarks.bestWindow.title",
      bodyKey: "benchmarks.bestWindow.body",
      sampleSize: strongestWindow[1].shifts,
      values: {
        window: strongestWindow[0],
        revenueValue: roundCurrency(safeDivide(strongestWindow[1].revenue, strongestWindow[1].hours)),
      },
    });
  }

  cards.push({
    id: "network-revenue-hour",
    titleKey: "benchmarks.revenuePerHour.title",
    bodyKey: "benchmarks.revenuePerHour.body",
    sampleSize: normalized.length,
    values: {
      revenueValue: roundCurrency(safeDivide(totalRevenue, totalHours)),
    },
  });

  cards.push({
    id: "network-orders-hour",
    titleKey: "benchmarks.ordersPerHour.title",
    bodyKey: "benchmarks.ordersPerHour.body",
    sampleSize: normalized.length,
    values: {
      ordersValue: roundCurrency(safeDivide(totalOrders, totalHours)),
    },
  });

  return {
    sampleSize: normalized.length,
    enoughData: true,
    cards,
  };
}

function toHourBucket(value: string | null) {
  if (!value || !/^\d{2}:\d{2}$/.test(value)) {
    return null;
  }

  const [hours] = value.split(":").map(Number);
  const start = Math.floor(hours / 3) * 3;
  const end = (start + 3) % 24;
  const endLabel = end === 0 ? "00:00" : `${String(end).padStart(2, "0")}:00`;
  return `${String(start).padStart(2, "0")}:00-${endLabel}`;
}

function normalizeWeatherCondition(value: string | null | undefined): WeatherCondition {
  if (
    value === "sunny" ||
    value === "cloudy" ||
    value === "rain" ||
    value === "heatwave" ||
    value === "cold" ||
    value === "windy"
  ) {
    return value;
  }

  return "unknown";
}
