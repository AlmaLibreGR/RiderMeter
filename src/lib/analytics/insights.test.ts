import { describe, expect, it } from "vitest";
import { buildInsights } from "@/lib/analytics/insights";
import { calculateShiftMetrics } from "@/lib/calculations";
import type { ShiftWithMetrics } from "@/types/domain";

function createShift(weatherCondition: ShiftWithMetrics["weatherCondition"], baseEarnings: number): ShiftWithMetrics {
  const shift = {
    id: weatherCondition === "rain" ? 1 : 2,
    userId: 1,
    date: "2026-03-13",
    startTime: "10:00",
    endTime: "14:00",
    hoursWorked: 4,
    ordersCompleted: 8,
    kilometersDriven: 30,
    baseEarnings,
    tipsAmount: 5,
    bonusAmount: 0,
    fuelExpenseDirect: 0,
    tollsOrParking: 0,
    platform: "efood" as const,
    weatherCondition,
    area: null,
    notes: null,
    createdAt: "2026-03-13T10:00:00.000Z",
    updatedAt: null,
    metrics: {} as never,
  };

  return {
    ...shift,
    metrics: calculateShiftMetrics(shift, {
      vehicleProfile: null,
      costProfile: null,
      settings: {
        currency: "EUR",
        timezone: "Europe/Athens",
        locale: "en",
        preferredDashboardPeriod: "week",
        platformFeePercent: 0,
        taxReservePercent: 0,
      },
    }),
  };
}

describe("buildInsights", () => {
  it("includes a weather insight when weather-tagged shifts exist", () => {
    const rainShift = createShift("rain", 90);
    const sunnyShift = createShift("sunny", 60);

    const insights = buildInsights({
      shifts: [rainShift, sunnyShift],
      trend: [],
      weekdayPerformance: [
        { weekday: "Fri", revenue: 95, netProfit: 95, netProfitPerHour: 23.75 },
      ],
      weatherPerformance: [
        { weatherCondition: "rain", label: "Rain", revenue: 95, netProfit: 95, netProfitPerHour: 23.75, shifts: 1 },
        { weatherCondition: "sunny", label: "Sunny", revenue: 65, netProfit: 65, netProfitPerHour: 16.25, shifts: 1 },
      ],
      previousPeriodNetProfitPerHour: 10,
      currentPeriodNetProfitPerHour: 15,
    });

    expect(insights.some((insight) => insight.id === "best-weather")).toBe(true);
  });
});
