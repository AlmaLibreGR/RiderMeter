import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";
import { aggregateShiftMetrics, calculateShiftMetrics } from "@/lib/calculations";
import { mapShiftRecordToCanonical, normalizeShiftPayload } from "@/services/shift-service";
import type { CanonicalShift } from "@/types/domain";

const baseShift: CanonicalShift = {
  id: 1,
  userId: 1,
  date: "2026-03-12",
  startTime: "10:00",
  endTime: "18:00",
  hoursWorked: 8,
  ordersCompleted: 20,
  kilometersDriven: 60,
  baseEarnings: 80,
  tipsAmount: 12,
  bonusAmount: 8,
  fuelExpenseDirect: null,
  tollsOrParking: 0,
  platform: "efood",
  weatherCondition: "sunny",
  area: null,
  notes: null,
  createdAt: "2026-03-12T10:00:00.000Z",
  updatedAt: null,
};

describe("calculateShiftMetrics", () => {
  it("calculates profitability with safe cost handling", () => {
    const metrics = calculateShiftMetrics(baseShift, {
      vehicleProfile: {
        vehicleType: "scooter",
        fuelType: "petrol",
        fuelPricePerLiter: 1.9,
        fuelConsumptionPer100Km: 3.5,
        maintenanceCostPerKm: 0.05,
        depreciationCostPerKm: 0.04,
        tiresCostPerKm: 0.01,
      },
      costProfile: {
        dailyFixedCost: 5,
        insuranceMonthly: 50,
        phoneMonthly: 20,
        accountantMonthly: 0,
        roadTaxMonthly: 0,
        kteoMonthly: 0,
        otherMonthly: 0,
      },
      settings: {
        currency: "EUR",
        timezone: "Europe/Athens",
        locale: "el",
        preferredDashboardPeriod: "week",
        platformFeePercent: 2,
        taxReservePercent: 10,
      },
    });

    expect(metrics.totalRevenue).toBe(100);
    expect(metrics.estimatedFuelCost).toBeCloseTo(3.99, 2);
    expect(metrics.variableCost).toBeCloseTo(9.99, 2);
    expect(metrics.totalShiftCost).toBeCloseTo(25.29, 2);
    expect(metrics.netProfit).toBeCloseTo(74.71, 2);
    expect(metrics.netPerHour).toBeCloseTo(9.34, 2);
  });

  it("never returns NaN on zero values", () => {
    const metrics = calculateShiftMetrics(
      {
        ...baseShift,
        hoursWorked: 0,
        ordersCompleted: 0,
        kilometersDriven: 0,
        baseEarnings: 0,
        tipsAmount: 0,
        bonusAmount: 0,
      },
      {
        vehicleProfile: null,
        costProfile: null,
        settings: {
          currency: "EUR",
          timezone: "Europe/Athens",
          locale: "el",
          preferredDashboardPeriod: "week",
          platformFeePercent: 0,
          taxReservePercent: 0,
        },
      }
    );

    expect(Number.isNaN(metrics.netPerHour)).toBe(false);
    expect(Number.isNaN(metrics.kilometersPerOrder)).toBe(false);
    expect(metrics.netProfit).toBe(0);
  });
});

describe("aggregateShiftMetrics", () => {
  it("aggregates totals and averages consistently", () => {
    const shifts = [
      {
        ...baseShift,
        metrics: calculateShiftMetrics(baseShift, {
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
      },
      {
        ...baseShift,
        id: 2,
        date: "2026-03-13",
        baseEarnings: 60,
        tipsAmount: 6,
        bonusAmount: 4,
        metrics: calculateShiftMetrics(
          {
            ...baseShift,
            id: 2,
            date: "2026-03-13",
            baseEarnings: 60,
            tipsAmount: 6,
            bonusAmount: 4,
          },
          {
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
          }
        ),
      },
    ];

    const aggregate = aggregateShiftMetrics(shifts);

    expect(aggregate.totalRevenue).toBe(170);
    expect(aggregate.totalShifts).toBe(2);
    expect(aggregate.averageRevenuePerShift).toBe(85);
    expect(aggregate.totalOrders).toBe(40);
    expect(aggregate.netProfitPerOrder).toBeCloseTo(4.25, 2);
  });
});

describe("mapShiftRecordToCanonical", () => {
  it("preserves Prisma Decimal monetary values when mapping shifts", () => {
    const shift = mapShiftRecordToCanonical({
      id: 99,
      userId: 1,
      date: new Date("2026-03-12T00:00:00.000Z"),
      shiftDate: new Date("2026-03-12T00:00:00.000Z"),
      startTime: "09:00",
      endTime: "15:00",
      platform: "efood",
      weatherCondition: "rain",
      area: null,
      hours: 6,
      hoursWorked: 6,
      ordersCount: 12,
      ordersCompleted: 12,
      kilometers: 42,
      kilometersDriven: 42,
      platformEarnings: 15,
      baseEarnings: new Prisma.Decimal("90.00"),
      tipsCard: 0,
      tipsCash: 0,
      tipsAmount: new Prisma.Decimal("5.50"),
      bonus: 0,
      bonusAmount: new Prisma.Decimal("4.50"),
      fuelExpenseDirect: new Prisma.Decimal("3.20"),
      tollsOrParking: new Prisma.Decimal("1.80"),
      notes: "Test",
      createdAt: new Date("2026-03-12T09:00:00.000Z"),
      updatedAt: new Date("2026-03-12T15:00:00.000Z"),
    } as never);

    expect(shift.baseEarnings).toBe(90);
    expect(shift.tipsAmount).toBe(5.5);
    expect(shift.bonusAmount).toBe(4.5);
    expect(shift.fuelExpenseDirect).toBe(3.2);
    expect(shift.tollsOrParking).toBe(1.8);
    expect(shift.weatherCondition).toBe("rain");
  });
});

describe("normalizeShiftPayload", () => {
  it("accepts canonical payloads without area when timer times are provided", () => {
    const payload = normalizeShiftPayload({
      date: "2026-03-13",
      startTime: "10:00",
      endTime: "14:00",
      ordersCompleted: 8,
      kilometersDriven: 42,
      baseEarnings: 90,
      tipsAmount: 5,
      bonusAmount: 0,
      platform: "efood",
      weatherCondition: "rain",
      notes: "Weather shift",
    });

    expect(payload.hoursWorked).toBe(4);
    expect(payload.area).toBeNull();
    expect(payload.weatherCondition).toBe("rain");
  });
});
