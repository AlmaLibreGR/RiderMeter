type ShiftCalculationInput = {
  platformEarnings?: number | string;
  tipsCard?: number | string;
  tipsCash?: number | string;
  bonus?: number | string;
  hours?: number | string;
  ordersCount?: number | string;
  kilometers?: number | string;
};

type VehicleCostInput = {
  fuelPrice?: number | string;
  consumptionPer100Km?: number | string;
  maintenancePerKm?: number | string;
  tiresPerKm?: number | string;
  depreciationPerKm?: number | string;
} | null;

type FixedCostInput = {
  insuranceMonthly?: number | string;
  phoneMonthly?: number | string;
  accountantMonthly?: number | string;
  roadTaxMonthly?: number | string;
  kteoMonthly?: number | string;
  otherMonthly?: number | string;
} | null;

function safeNumber(value: unknown): number {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  if (typeof value === "string") {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  return 0;
}

export function calculateShiftMetrics(
  shift: ShiftCalculationInput,
  vehicle?: VehicleCostInput,
  fixedCosts?: FixedCostInput
) {
  const platformEarnings = safeNumber(shift.platformEarnings);
  const tipsCard = safeNumber(shift.tipsCard);
  const tipsCash = safeNumber(shift.tipsCash);
  const bonus = safeNumber(shift.bonus);
  const hours = safeNumber(shift.hours);
  const ordersCount = safeNumber(shift.ordersCount);
  const kilometers = safeNumber(shift.kilometers);

  const tipsTotal = tipsCard + tipsCash;
  const totalRevenue = platformEarnings + tipsTotal + bonus;
  const grossPerHour = hours > 0 ? totalRevenue / hours : 0;
  const revenuePerOrder = ordersCount > 0 ? totalRevenue / ordersCount : 0;

  let fuelCostPerKm = 0;
  let totalCostPerKm = 0;
  let variableCost = 0;
  let dailyFixedCost = 0;

  if (vehicle) {
    fuelCostPerKm =
      (safeNumber(vehicle.fuelPrice) * safeNumber(vehicle.consumptionPer100Km)) /
      100;

    totalCostPerKm =
      fuelCostPerKm +
      safeNumber(vehicle.maintenancePerKm) +
      safeNumber(vehicle.tiresPerKm) +
      safeNumber(vehicle.depreciationPerKm);

    variableCost = kilometers * totalCostPerKm;
  }

  if (fixedCosts) {
    const monthlyFixedTotal =
      safeNumber(fixedCosts.insuranceMonthly) +
      safeNumber(fixedCosts.phoneMonthly) +
      safeNumber(fixedCosts.accountantMonthly) +
      safeNumber(fixedCosts.roadTaxMonthly) +
      safeNumber(fixedCosts.kteoMonthly) +
      safeNumber(fixedCosts.otherMonthly);

    dailyFixedCost = monthlyFixedTotal / 30;
  }

  const totalShiftCost = variableCost + dailyFixedCost;
  const netProfit = totalRevenue - totalShiftCost;
  const netPerHour = hours > 0 ? netProfit / hours : 0;

  return {
    tipsTotal,
    totalRevenue,
    grossPerHour,
    revenuePerOrder,
    fuelCostPerKm,
    totalCostPerKm,
    variableCost,
    dailyFixedCost,
    totalShiftCost,
    netProfit,
    netPerHour,
  };
}
