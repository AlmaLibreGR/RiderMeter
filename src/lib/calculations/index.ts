import type {
  AggregateMetrics,
  AppSettingsSnapshot,
  CanonicalShift,
  CostProfileSnapshot,
  ShiftMetrics,
  ShiftWithMetrics,
  VehicleProfileSnapshot,
} from "@/types/domain";
import { clampPercent, roundCurrency, safeDivide, toSafeNumber } from "@/lib/utils";

type CalculationContext = {
  vehicleProfile: VehicleProfileSnapshot | null;
  costProfile: CostProfileSnapshot | null;
  settings: AppSettingsSnapshot;
};

export function calculateShiftMetrics(
  shift: CanonicalShift,
  context: CalculationContext
): ShiftMetrics {
  const baseEarnings = toSafeNumber(shift.baseEarnings);
  const tipsAmount = toSafeNumber(shift.tipsAmount);
  const bonusAmount = toSafeNumber(shift.bonusAmount);
  const hoursWorked = toSafeNumber(shift.hoursWorked);
  const ordersCompleted = toSafeNumber(shift.ordersCompleted);
  const kilometersDriven = toSafeNumber(shift.kilometersDriven);
  const tollsOrParkingCost = toSafeNumber(shift.tollsOrParking);

  const totalRevenue = roundCurrency(baseEarnings + tipsAmount + bonusAmount);
  const fuelPricePerLiter = toSafeNumber(context.vehicleProfile?.fuelPricePerLiter);
  const fuelConsumptionPer100Km = toSafeNumber(
    context.vehicleProfile?.fuelConsumptionPer100Km
  );
  const maintenanceCostPerKm = toSafeNumber(
    context.vehicleProfile?.maintenanceCostPerKm
  );
  const depreciationCostPerKm = toSafeNumber(
    context.vehicleProfile?.depreciationCostPerKm
  );
  const tiresCostPerKm = toSafeNumber(context.vehicleProfile?.tiresCostPerKm);

  const estimatedFuelCostFromProfile = roundCurrency(
    safeDivide(kilometersDriven * fuelConsumptionPer100Km * fuelPricePerLiter, 100)
  );
  const estimatedFuelCost = roundCurrency(
    shift.fuelExpenseDirect != null
      ? toSafeNumber(shift.fuelExpenseDirect)
      : estimatedFuelCostFromProfile
  );
  const maintenanceCost = roundCurrency(kilometersDriven * maintenanceCostPerKm);
  const depreciationCost = roundCurrency(kilometersDriven * depreciationCostPerKm);
  const tiresCost = roundCurrency(kilometersDriven * tiresCostPerKm);
  const variableCost = roundCurrency(
    estimatedFuelCost + maintenanceCost + depreciationCost + tiresCost + tollsOrParkingCost
  );
  const allocatedFixedCost = roundCurrency(toSafeNumber(context.costProfile?.dailyFixedCost));
  const platformFeeCost = roundCurrency(
    totalRevenue * (clampPercent(context.settings.platformFeePercent) / 100)
  );
  const netProfitBeforeReserve = roundCurrency(
    totalRevenue - variableCost - allocatedFixedCost - platformFeeCost
  );
  const taxReserveCost = roundCurrency(
    Math.max(netProfitBeforeReserve, 0) * (clampPercent(context.settings.taxReservePercent) / 100)
  );
  const totalShiftCost = roundCurrency(
    variableCost + allocatedFixedCost + platformFeeCost + taxReserveCost
  );
  const netProfit = roundCurrency(totalRevenue - totalShiftCost);

  return {
    totalRevenue,
    grossPerHour: roundCurrency(safeDivide(totalRevenue, hoursWorked)),
    revenuePerOrder: roundCurrency(safeDivide(totalRevenue, ordersCompleted)),
    grossPerKm: roundCurrency(safeDivide(totalRevenue, kilometersDriven)),
    estimatedFuelCost,
    maintenanceCost,
    depreciationCost,
    tiresCost,
    tollsOrParkingCost,
    variableCost,
    allocatedFixedCost,
    totalShiftCost,
    netProfitBeforeReserve,
    platformFeeCost,
    taxReserveCost,
    netProfit,
    netPerHour: roundCurrency(safeDivide(netProfit, hoursWorked)),
    netPerKm: roundCurrency(safeDivide(netProfit, kilometersDriven)),
    costPerKm: roundCurrency(safeDivide(totalShiftCost, kilometersDriven)),
    profitMarginPercent: roundCurrency(safeDivide(netProfit, totalRevenue) * 100),
    ordersPerHour: roundCurrency(safeDivide(ordersCompleted, hoursWorked)),
    kilometersPerOrder: roundCurrency(safeDivide(kilometersDriven, ordersCompleted)),
    tipsSharePercent: roundCurrency(safeDivide(tipsAmount, totalRevenue) * 100),
  };
}

export function withShiftMetrics(
  shifts: CanonicalShift[],
  context: CalculationContext
): ShiftWithMetrics[] {
  return shifts.map((shift) => ({
    ...shift,
    metrics: calculateShiftMetrics(shift, context),
  }));
}

export function aggregateShiftMetrics(shifts: ShiftWithMetrics[]): AggregateMetrics {
  const base = shifts.reduce<AggregateMetrics>(
    (accumulator, shift) => {
      accumulator.totalRevenue += shift.metrics.totalRevenue;
      accumulator.baseEarnings += shift.baseEarnings;
      accumulator.tipsAmount += shift.tipsAmount;
      accumulator.bonusAmount += shift.bonusAmount;
      accumulator.fuelCost += shift.metrics.estimatedFuelCost;
      accumulator.maintenanceCost += shift.metrics.maintenanceCost;
      accumulator.depreciationCost += shift.metrics.depreciationCost;
      accumulator.tiresCost += shift.metrics.tiresCost;
      accumulator.tollsOrParkingCost += shift.metrics.tollsOrParkingCost;
      accumulator.variableCost += shift.metrics.variableCost;
      accumulator.fixedCosts += shift.metrics.allocatedFixedCost;
      accumulator.platformFeeCost += shift.metrics.platformFeeCost;
      accumulator.taxReserveCost += shift.metrics.taxReserveCost;
      accumulator.totalCost += shift.metrics.totalShiftCost;
      accumulator.netProfitBeforeReserve += shift.metrics.netProfitBeforeReserve;
      accumulator.netProfit += shift.metrics.netProfit;
      accumulator.totalShifts += 1;
      accumulator.totalHours += shift.hoursWorked;
      accumulator.totalOrders += shift.ordersCompleted;
      accumulator.totalKilometers += shift.kilometersDriven;
      return accumulator;
    },
    createEmptyAggregate()
  );

  return finalizeAggregate(base);
}

export function createEmptyAggregate(): AggregateMetrics {
  return {
    totalRevenue: 0,
    baseEarnings: 0,
    tipsAmount: 0,
    bonusAmount: 0,
    fuelCost: 0,
    maintenanceCost: 0,
    depreciationCost: 0,
    tiresCost: 0,
    tollsOrParkingCost: 0,
    variableCost: 0,
    fixedCosts: 0,
    platformFeeCost: 0,
    taxReserveCost: 0,
    totalCost: 0,
    netProfitBeforeReserve: 0,
    netProfit: 0,
    marginPercent: 0,
    totalShifts: 0,
    totalHours: 0,
    totalOrders: 0,
    totalKilometers: 0,
    averageRevenuePerShift: 0,
    averageRevenuePerOrder: 0,
    averageRevenuePerHour: 0,
    netProfitPerHour: 0,
    netProfitPerOrder: 0,
    ordersPerHour: 0,
    kilometersPerOrder: 0,
    averageNetProfitPerShift: 0,
  };
}

function finalizeAggregate(aggregate: AggregateMetrics): AggregateMetrics {
  return {
    ...aggregate,
    totalRevenue: roundCurrency(aggregate.totalRevenue),
    baseEarnings: roundCurrency(aggregate.baseEarnings),
    tipsAmount: roundCurrency(aggregate.tipsAmount),
    bonusAmount: roundCurrency(aggregate.bonusAmount),
    fuelCost: roundCurrency(aggregate.fuelCost),
    maintenanceCost: roundCurrency(aggregate.maintenanceCost),
    depreciationCost: roundCurrency(aggregate.depreciationCost),
    tiresCost: roundCurrency(aggregate.tiresCost),
    tollsOrParkingCost: roundCurrency(aggregate.tollsOrParkingCost),
    variableCost: roundCurrency(aggregate.variableCost),
    fixedCosts: roundCurrency(aggregate.fixedCosts),
    platformFeeCost: roundCurrency(aggregate.platformFeeCost),
    taxReserveCost: roundCurrency(aggregate.taxReserveCost),
    totalCost: roundCurrency(aggregate.totalCost),
    netProfitBeforeReserve: roundCurrency(aggregate.netProfitBeforeReserve),
    netProfit: roundCurrency(aggregate.netProfit),
    marginPercent: roundCurrency(safeDivide(aggregate.netProfit, aggregate.totalRevenue) * 100),
    averageRevenuePerShift: roundCurrency(
      safeDivide(aggregate.totalRevenue, aggregate.totalShifts)
    ),
    averageRevenuePerOrder: roundCurrency(
      safeDivide(aggregate.totalRevenue, aggregate.totalOrders)
    ),
    averageRevenuePerHour: roundCurrency(
      safeDivide(aggregate.totalRevenue, aggregate.totalHours)
    ),
    netProfitPerHour: roundCurrency(safeDivide(aggregate.netProfit, aggregate.totalHours)),
    netProfitPerOrder: roundCurrency(safeDivide(aggregate.netProfit, aggregate.totalOrders)),
    ordersPerHour: roundCurrency(safeDivide(aggregate.totalOrders, aggregate.totalHours)),
    kilometersPerOrder: roundCurrency(
      safeDivide(aggregate.totalKilometers, aggregate.totalOrders)
    ),
    averageNetProfitPerShift: roundCurrency(
      safeDivide(aggregate.netProfit, aggregate.totalShifts)
    ),
  };
}
