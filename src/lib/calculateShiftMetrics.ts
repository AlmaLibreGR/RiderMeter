import { ShiftCalculationConfig, ShiftInput, ShiftMetrics, ShiftWithMetrics } from "@/types";

function safeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}

function safeDivide(value: number, by: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(by) || by <= 0) return 0;
  return value / by;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateShiftMetrics(
  shift: ShiftInput,
  config: ShiftCalculationConfig
): ShiftMetrics {
  const hours = safeNumber(shift.hours);
  const orders = safeNumber(shift.orders);
  const kilometers = safeNumber(shift.kilometers);
  const revenue = safeNumber(shift.revenue);
  const tips = safeNumber(shift.tips);

  const fuelCostPerKm = safeNumber(config.fuelCostPerKm);
  const dailyFixedCost = safeNumber(config.dailyFixedCost);

  const totalRevenue = revenue + tips;
  const variableCost = kilometers * fuelCostPerKm;
  const totalShiftCost = variableCost + dailyFixedCost;
  const netProfit = totalRevenue - totalShiftCost;

  const metrics: ShiftMetrics = {
    tipsTotal: round2(tips),
    totalRevenue: round2(totalRevenue),
    grossPerHour: round2(safeDivide(totalRevenue, hours)),
    revenuePerOrder: round2(safeDivide(totalRevenue, orders)),
    fuelCostPerKm: round2(fuelCostPerKm),
    totalCostPerKm: round2(safeDivide(totalShiftCost, kilometers)),
    variableCost: round2(variableCost),
    dailyFixedCost: round2(dailyFixedCost),
    totalShiftCost: round2(totalShiftCost),
    netProfit: round2(netProfit),
    netPerHour: round2(safeDivide(netProfit, hours)),
  };

  return metrics;
}

export function attachShiftMetrics(
  shift: ShiftInput,
  config: ShiftCalculationConfig
): ShiftWithMetrics {
  return {
    ...shift,
    metrics: calculateShiftMetrics(shift, config),
  };
}

export function attachMetricsToShifts(
  shifts: ShiftInput[],
  config: ShiftCalculationConfig
): ShiftWithMetrics[] {
  return shifts.map((shift) => attachShiftMetrics(shift, config));
}