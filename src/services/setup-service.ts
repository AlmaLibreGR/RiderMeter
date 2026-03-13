import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors";
import { calculateVehicleDerivedCosts } from "@/lib/calculations";
import { roundCurrency, toSafeNumber } from "@/lib/utils";
import { listExpenseCategories, listRecentExpenses, replaceExpenseCategories, summarizeRecurringCategories } from "@/services/expense-service";
import type {
  ExpenseCategorySnapshot,
  SetupSnapshot,
  VehicleProfileSnapshot,
  VehicleType,
} from "@/types/domain";

type SaveSetupArgs = {
  vehicle: {
    vehicleType: VehicleType;
    fuelType: string;
    fuelConsumptionPer100Km: number;
    fuelPricePerLiter: number;
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
  recurringCategories: Array<Omit<ExpenseCategorySnapshot, "id">>;
};

export async function getSetupSnapshot(userId: number): Promise<SetupSnapshot> {
  const [vehicleProfile, recurringCategories, recentExpenses] = await Promise.all([
    getVehicleSetupSnapshot(userId),
    listExpenseCategories(userId),
    listRecentExpenses(userId),
  ]);

  return {
    vehicleProfile,
    recurringCategories,
    recentExpenses,
  };
}

export async function saveSetupSnapshot(userId: number, payload: SaveSetupArgs) {
  const derived = calculateVehicleDerivedCosts(payload.vehicle);
  const categories = payload.recurringCategories;
  const recurringSummary = summarizeRecurringCategories(
    categories.map((category, index) => ({
      id: index + 1,
      ...category,
    }))
  );

  let canonicalVehicle = null;

  try {
    canonicalVehicle = await prisma.vehicleProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }
  }

  const legacyVehicle = await prisma.vehicle.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  const legacyCostProfile = await prisma.fixedCost.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  let canonicalCostProfile = null;

  try {
    canonicalCostProfile = await prisma.costProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }
  }

  await prisma.$transaction(async (tx) => {
    if (canonicalVehicle) {
      await tx.vehicleProfile.update({
        where: { id: canonicalVehicle.id },
        data: buildCanonicalVehiclePayload(userId, payload.vehicle, derived),
      });
    } else {
      try {
        await tx.vehicleProfile.create({
          data: buildCanonicalVehiclePayload(userId, payload.vehicle, derived),
        });
      } catch (error) {
        if (!isPrismaSchemaMismatchError(error)) {
          throw error;
        }
      }
    }

    const legacyVehicleData = {
      userId,
      vehicleType: payload.vehicle.vehicleType,
      fuelType: payload.vehicle.fuelType,
      consumptionPer100Km: payload.vehicle.fuelConsumptionPer100Km,
      fuelPrice: payload.vehicle.fuelPricePerLiter,
      maintenancePerKm: derived.maintenanceCostPerKm,
      tiresPerKm: derived.tiresCostPerKm,
      depreciationPerKm: derived.depreciationCostPerKm,
    };

    if (legacyVehicle) {
      await tx.vehicle.update({
        where: { id: legacyVehicle.id },
        data: legacyVehicleData,
      });
    } else {
      await tx.vehicle.create({
        data: legacyVehicleData,
      });
    }

    const monthlyEquivalent = recurringSummary.monthlyEquivalent;
    const costProfileData = {
      insuranceMonthly: 0,
      phoneMonthly: 0,
      accountantMonthly: 0,
      roadTaxMonthly: 0,
      kteoMonthly: 0,
      otherMonthly: monthlyEquivalent,
      dailyFixedCost: recurringSummary.dailyFixedCost,
    };

    if (canonicalCostProfile) {
      try {
        await tx.costProfile.update({
          where: { id: canonicalCostProfile.id },
          data: costProfileData,
        });
      } catch (error) {
        if (!isPrismaSchemaMismatchError(error)) {
          throw error;
        }
      }
    } else {
      try {
        await tx.costProfile.create({
          data: {
            userId,
            ...costProfileData,
          },
        });
      } catch (error) {
        if (!isPrismaSchemaMismatchError(error)) {
          throw error;
        }
      }
    }

    if (legacyCostProfile) {
      await tx.fixedCost.update({
        where: { id: legacyCostProfile.id },
        data: {
          insuranceMonthly: 0,
          phoneMonthly: 0,
          accountantMonthly: 0,
          roadTaxMonthly: 0,
          kteoMonthly: 0,
          otherMonthly: monthlyEquivalent,
        },
      });
    } else {
      await tx.fixedCost.create({
        data: {
          userId,
          insuranceMonthly: 0,
          phoneMonthly: 0,
          accountantMonthly: 0,
          roadTaxMonthly: 0,
          kteoMonthly: 0,
          otherMonthly: monthlyEquivalent,
        },
      });
    }

    try {
      await tx.appSettings.upsert({
        where: { userId },
        update: {
          onboardingCompleted: true,
        },
        create: {
          userId,
          onboardingCompleted: true,
        },
      });
    } catch (error) {
      if (!isPrismaSchemaMismatchError(error)) {
        throw error;
      }
    }
  });

  const savedCategories = await replaceExpenseCategories(userId, categories);
  const setup = await getSetupSnapshot(userId);

  return {
    ...setup,
    recurringCategories: savedCategories,
  };
}

export async function getVehicleSetupSnapshot(
  userId: number
): Promise<VehicleProfileSnapshot | null> {
  let canonicalProfile = null;

  try {
    canonicalProfile = await prisma.vehicleProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }
  }

  const legacyVehicle = await prisma.vehicle.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  if (!canonicalProfile && !legacyVehicle) {
    return null;
  }

  const source = canonicalProfile ?? legacyVehicle;

  return {
    vehicleType: normalizeVehicleType(source?.vehicleType),
    fuelType: source?.fuelType ?? "petrol",
    fuelPricePerLiter: toSafeNumber(
      canonicalProfile?.fuelPricePerLiter ?? legacyVehicle?.fuelPrice
    ),
    fuelConsumptionPer100Km: toSafeNumber(
      canonicalProfile?.fuelConsumptionPer100Km ?? legacyVehicle?.consumptionPer100Km
    ),
    maintenanceCostPerKm: toSafeNumber(
      canonicalProfile?.maintenanceCostPerKm ?? legacyVehicle?.maintenancePerKm
    ),
    depreciationCostPerKm: toSafeNumber(
      canonicalProfile?.depreciationCostPerKm ?? legacyVehicle?.depreciationPerKm
    ),
    tiresCostPerKm: toSafeNumber(
      canonicalProfile?.tiresCostPerKm ?? legacyVehicle?.tiresPerKm
    ),
    routineServiceIntervalKm: canonicalProfile?.routineServiceIntervalKm == null ? null : toSafeNumber(canonicalProfile.routineServiceIntervalKm),
    routineServiceCost: canonicalProfile?.routineServiceCost == null ? null : toSafeNumber(canonicalProfile.routineServiceCost),
    majorServiceIntervalKm: canonicalProfile?.majorServiceIntervalKm == null ? null : toSafeNumber(canonicalProfile.majorServiceIntervalKm),
    majorServiceCost: canonicalProfile?.majorServiceCost == null ? null : toSafeNumber(canonicalProfile.majorServiceCost),
    tireReplacementIntervalKm:
      canonicalProfile?.tireReplacementIntervalKm == null
        ? null
        : toSafeNumber(canonicalProfile.tireReplacementIntervalKm),
    tireReplacementCost:
      canonicalProfile?.tireReplacementCost == null
        ? null
        : toSafeNumber(canonicalProfile.tireReplacementCost),
    purchasePrice: canonicalProfile?.purchasePrice == null ? null : toSafeNumber(canonicalProfile.purchasePrice),
    resaleValue: canonicalProfile?.resaleValue == null ? null : toSafeNumber(canonicalProfile.resaleValue),
    expectedLifecycleKm:
      canonicalProfile?.expectedLifecycleKm == null
        ? null
        : toSafeNumber(canonicalProfile.expectedLifecycleKm),
  };
}

function buildCanonicalVehiclePayload(
  userId: number,
  vehicle: SaveSetupArgs["vehicle"],
  derived: ReturnType<typeof calculateVehicleDerivedCosts>
) {
  return {
    userId,
    vehicleType: vehicle.vehicleType,
    fuelType: vehicle.fuelType,
    fuelConsumptionPer100Km: roundCurrency(vehicle.fuelConsumptionPer100Km),
    fuelPricePerLiter: roundCurrency(vehicle.fuelPricePerLiter),
    maintenanceCostPerKm: derived.maintenanceCostPerKm,
    tiresCostPerKm: derived.tiresCostPerKm,
    depreciationCostPerKm: derived.depreciationCostPerKm,
    routineServiceIntervalKm: nullableDecimal(vehicle.routineServiceIntervalKm),
    routineServiceCost: nullableDecimal(vehicle.routineServiceCost),
    majorServiceIntervalKm: nullableDecimal(vehicle.majorServiceIntervalKm),
    majorServiceCost: nullableDecimal(vehicle.majorServiceCost),
    tireReplacementIntervalKm: nullableDecimal(vehicle.tireReplacementIntervalKm),
    tireReplacementCost: nullableDecimal(vehicle.tireReplacementCost),
    purchasePrice: nullableDecimal(vehicle.purchasePrice),
    resaleValue: nullableDecimal(vehicle.resaleValue),
    expectedLifecycleKm: nullableDecimal(vehicle.expectedLifecycleKm),
  };
}

function nullableDecimal(value?: number | null) {
  if (value == null || !Number.isFinite(value) || value <= 0) {
    return null;
  }

  return roundCurrency(value);
}

function normalizeVehicleType(vehicleType?: string | null): VehicleType {
  if (vehicleType === "car" || vehicleType === "scooter" || vehicleType === "ebike") {
    return vehicleType;
  }

  return vehicleType === "motorcycle" ? "scooter" : "car";
}
