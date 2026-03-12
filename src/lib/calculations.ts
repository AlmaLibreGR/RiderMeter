export function calculateShiftMetrics(
  shift: {
    platformEarnings: number;
    tipsCard: number;
    tipsCash: number;
    bonus: number;
    hours: number;
    ordersCount: number;
    kilometers: number;
  },
  vehicle?: {
    fuelPrice: number;
    consumptionPer100Km: number;
    maintenancePerKm: number;
    tiresPerKm: number;
    depreciationPerKm: number;
  } | null,
  fixedCosts?: {
    insuranceMonthly: number;
    phoneMonthly: number;
    accountantMonthly: number;
    roadTaxMonthly: number;
    kteoMonthly: number;
    otherMonthly: number;
  } | null
) {
  const tipsTotal = Number(shift.tipsCard) + Number(shift.tipsCash);

  const totalRevenue =
    Number(shift.platformEarnings) + Number(shift.bonus) + tipsTotal;

  const grossPerHour =
    Number(shift.hours) > 0 ? totalRevenue / Number(shift.hours) : 0;

  const revenuePerOrder =
    Number(shift.ordersCount) > 0
      ? totalRevenue / Number(shift.ordersCount)
      : 0;

  let fuelCostPerKm = 0;
  let totalCostPerKm = 0;
  let variableCost = 0;
  let dailyFixedCost = 0;
  let totalShiftCost = 0;
  let netProfit = totalRevenue;
  let netPerHour = Number(shift.hours) > 0 ? netProfit / Number(shift.hours) : 0;

  if (vehicle) {
    fuelCostPerKm =
      (Number(vehicle.fuelPrice) * Number(vehicle.consumptionPer100Km)) / 100;

    totalCostPerKm =
      fuelCostPerKm +
      Number(vehicle.maintenancePerKm) +
      Number(vehicle.tiresPerKm) +
      Number(vehicle.depreciationPerKm);

    variableCost = Number(shift.kilometers) * totalCostPerKm;
  }

  if (fixedCosts) {
    const monthlyFixedTotal =
      Number(fixedCosts.insuranceMonthly) +
      Number(fixedCosts.phoneMonthly) +
      Number(fixedCosts.accountantMonthly) +
      Number(fixedCosts.roadTaxMonthly) +
      Number(fixedCosts.kteoMonthly) +
      Number(fixedCosts.otherMonthly);

    dailyFixedCost = monthlyFixedTotal / 30;
  }

  totalShiftCost = variableCost + dailyFixedCost;
  netProfit = totalRevenue - totalShiftCost;
  netPerHour = Number(shift.hours) > 0 ? netProfit / Number(shift.hours) : 0;

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