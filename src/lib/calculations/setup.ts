import { roundCurrency, safeDivide, toSafeNumber } from "@/lib/utils";
import type { ExpenseCadence } from "@/types/domain";

export type VehicleSetupInputs = {
  fuelPricePerLiter: number;
  fuelConsumptionPer100Km: number;
  routineServiceIntervalKm?: number | null;
  routineServiceCost?: number | null;
  majorServiceIntervalKm?: number | null;
  majorServiceCost?: number | null;
  tireReplacementIntervalKm?: number | null;
  tireReplacementCost?: number | null;
  purchasePrice?: number | null;
  resaleValue?: number | null;
  expectedLifecycleKm?: number | null;
};

export function calculateVehicleDerivedCosts(inputs: VehicleSetupInputs) {
  const maintenanceCostPerKm = roundCurrency(
    safeDivide(
      toSafeNumber(inputs.routineServiceCost),
      toSafeNumber(inputs.routineServiceIntervalKm)
    ) +
      safeDivide(
        toSafeNumber(inputs.majorServiceCost),
        toSafeNumber(inputs.majorServiceIntervalKm)
      )
  );

  const tiresCostPerKm = roundCurrency(
    safeDivide(
      toSafeNumber(inputs.tireReplacementCost),
      toSafeNumber(inputs.tireReplacementIntervalKm)
    )
  );

  const depreciationCostPerKm = roundCurrency(
    safeDivide(
      Math.max(
        toSafeNumber(inputs.purchasePrice) - toSafeNumber(inputs.resaleValue),
        0
      ),
      toSafeNumber(inputs.expectedLifecycleKm)
    )
  );

  const energyCostPerKm = roundCurrency(
    safeDivide(
      toSafeNumber(inputs.fuelPricePerLiter) * toSafeNumber(inputs.fuelConsumptionPer100Km),
      100
    )
  );

  return {
    energyCostPerKm,
    maintenanceCostPerKm,
    tiresCostPerKm,
    depreciationCostPerKm,
    totalCostPerKm: roundCurrency(
      energyCostPerKm + maintenanceCostPerKm + tiresCostPerKm + depreciationCostPerKm
    ),
  };
}

export function normalizeCadenceToDailyAmount(amount: number, cadence: ExpenseCadence) {
  const safeAmount = toSafeNumber(amount);

  if (cadence === "daily") {
    return roundCurrency(safeAmount);
  }

  if (cadence === "weekly") {
    return roundCurrency(safeAmount / 7);
  }

  if (cadence === "monthly") {
    return roundCurrency(safeAmount / 30);
  }

  if (cadence === "yearly") {
    return roundCurrency(safeAmount / 365);
  }

  return 0;
}
