import type { Insight, ShiftWithMetrics, TimeSeriesPoint, WeekdayPerformancePoint } from "@/types/domain";
import { roundCurrency, safeDivide } from "@/lib/utils";

export function buildInsights(args: {
  shifts: ShiftWithMetrics[];
  trend: TimeSeriesPoint[];
  weekdayPerformance: WeekdayPerformancePoint[];
  previousPeriodNetProfitPerHour: number;
  currentPeriodNetProfitPerHour: number;
}): Insight[] {
  const insights: Insight[] = [];

  const topWeekday = [...args.weekdayPerformance].sort(
    (left, right) => right.netProfitPerHour - left.netProfitPerHour
  )[0];

  if (topWeekday && topWeekday.netProfitPerHour > 0) {
    insights.push({
      id: "best-weekday",
      titleKey: "insights.bestWeekday.title",
      bodyKey: "insights.bestWeekday.body",
      tone: "positive",
      values: {
        weekday: topWeekday.weekday,
        value: roundCurrency(topWeekday.netProfitPerHour),
      },
    });
  }

  if (args.previousPeriodNetProfitPerHour > 0 && args.currentPeriodNetProfitPerHour > 0) {
    const delta = roundCurrency(
      ((args.currentPeriodNetProfitPerHour - args.previousPeriodNetProfitPerHour) /
        args.previousPeriodNetProfitPerHour) *
        100
    );

    insights.push({
      id: "week-comparison",
      titleKey:
        delta >= 0 ? "insights.weekUp.title" : "insights.weekDown.title",
      bodyKey:
        delta >= 0 ? "insights.weekUp.body" : "insights.weekDown.body",
      tone: delta >= 0 ? "positive" : "caution",
      values: {
        delta: Math.abs(delta),
      },
    });
  }

  if (args.shifts.length > 0) {
    const highKmShifts = args.shifts.filter((shift) => shift.kilometersDriven >= 40);
    if (highKmShifts.length > 0) {
      const highKmMargin = safeDivide(
        highKmShifts.reduce((sum, shift) => sum + shift.metrics.netProfit, 0),
        highKmShifts.reduce((sum, shift) => sum + shift.metrics.totalRevenue, 0)
      );
      const overallMargin = safeDivide(
        args.shifts.reduce((sum, shift) => sum + shift.metrics.netProfit, 0),
        args.shifts.reduce((sum, shift) => sum + shift.metrics.totalRevenue, 0)
      );

      if (highKmMargin < overallMargin) {
        insights.push({
          id: "high-km-margin",
          titleKey: "insights.highKm.title",
          bodyKey: "insights.highKm.body",
          tone: "caution",
          values: {
            margin: roundCurrency(highKmMargin * 100),
          },
        });
      }
    }

    const tipsShare = roundCurrency(
      safeDivide(
        args.shifts.reduce((sum, shift) => sum + shift.tipsAmount, 0),
        args.shifts.reduce((sum, shift) => sum + shift.metrics.totalRevenue, 0)
      ) * 100
    );

    if (tipsShare > 0) {
      insights.push({
        id: "tips-share",
        titleKey: "insights.tips.title",
        bodyKey: "insights.tips.body",
        tone: "neutral",
        values: {
          share: tipsShare,
        },
      });
    }
  }

  return insights.slice(0, 4);
}
