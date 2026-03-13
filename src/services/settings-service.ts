import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors";
import { roundCurrency, toSafeNumber } from "@/lib/utils";
import { listExpenseCategories, summarizeRecurringCategories } from "@/services/expense-service";
import type {
  AppSettingsSnapshot,
  AppLocale,
  CostProfileSnapshot,
  DashboardPeriod,
  VehicleProfileSnapshot,
} from "@/types/domain";

const defaultSettings: AppSettingsSnapshot = {
  currency: "EUR",
  timezone: "Europe/Athens",
  locale: "el",
  onboardingCompleted: false,
  preferredDashboardPeriod: "week",
  platformFeePercent: 0,
  taxReservePercent: 0,
};

export async function getUserSettingsSnapshot(userId: number): Promise<AppSettingsSnapshot> {
  let settings = null;

  try {
    settings = await prisma.appSettings.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }
  }

  if (!settings) {
    return defaultSettings;
  }

  return {
    currency: settings.currency as AppSettingsSnapshot["currency"],
    timezone: settings.timezone,
    locale: settings.locale as AppLocale,
    onboardingCompleted: settings.onboardingCompleted ?? false,
    preferredDashboardPeriod: settings.preferredDashboardPeriod as DashboardPeriod,
    platformFeePercent: toSafeNumber(settings.platformFeePercent),
    taxReservePercent: toSafeNumber(settings.taxReservePercent),
  };
}

export async function getVehicleProfileSnapshot(
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

  const profile =
    canonicalProfile ??
    (await prisma.vehicle.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }));

  if (!profile) {
    return null;
  }

  return {
    vehicleType:
      profile.vehicleType === "car" ||
      profile.vehicleType === "scooter" ||
      profile.vehicleType === "ebike"
        ? profile.vehicleType
        : profile.vehicleType === "motorcycle"
          ? "scooter"
          : "car",
    fuelType: profile.fuelType,
    fuelPricePerLiter: toSafeNumber(
      "fuelPricePerLiter" in profile ? profile.fuelPricePerLiter : profile.fuelPrice
    ),
    fuelConsumptionPer100Km: toSafeNumber(
      "fuelConsumptionPer100Km" in profile
        ? profile.fuelConsumptionPer100Km
        : profile.consumptionPer100Km
    ),
    maintenanceCostPerKm: toSafeNumber(
      "maintenanceCostPerKm" in profile
        ? profile.maintenanceCostPerKm
        : profile.maintenancePerKm
    ),
    depreciationCostPerKm: toSafeNumber(
      "depreciationCostPerKm" in profile
        ? profile.depreciationCostPerKm
        : profile.depreciationPerKm
    ),
    tiresCostPerKm: toSafeNumber(
      "tiresCostPerKm" in profile ? profile.tiresCostPerKm : profile.tiresPerKm
    ),
    routineServiceIntervalKm:
      "routineServiceIntervalKm" in profile && profile.routineServiceIntervalKm != null
        ? toSafeNumber(profile.routineServiceIntervalKm)
        : null,
    routineServiceCost:
      "routineServiceCost" in profile && profile.routineServiceCost != null
        ? toSafeNumber(profile.routineServiceCost)
        : null,
    majorServiceIntervalKm:
      "majorServiceIntervalKm" in profile && profile.majorServiceIntervalKm != null
        ? toSafeNumber(profile.majorServiceIntervalKm)
        : null,
    majorServiceCost:
      "majorServiceCost" in profile && profile.majorServiceCost != null
        ? toSafeNumber(profile.majorServiceCost)
        : null,
    tireReplacementIntervalKm:
      "tireReplacementIntervalKm" in profile && profile.tireReplacementIntervalKm != null
        ? toSafeNumber(profile.tireReplacementIntervalKm)
        : null,
    tireReplacementCost:
      "tireReplacementCost" in profile && profile.tireReplacementCost != null
        ? toSafeNumber(profile.tireReplacementCost)
        : null,
    purchasePrice:
      "purchasePrice" in profile && profile.purchasePrice != null
        ? toSafeNumber(profile.purchasePrice)
        : null,
    resaleValue:
      "resaleValue" in profile && profile.resaleValue != null
        ? toSafeNumber(profile.resaleValue)
        : null,
    expectedLifecycleKm:
      "expectedLifecycleKm" in profile && profile.expectedLifecycleKm != null
        ? toSafeNumber(profile.expectedLifecycleKm)
        : null,
  };
}

export async function getCostProfileSnapshot(
  userId: number
): Promise<CostProfileSnapshot | null> {
  const recurringCategories = await listExpenseCategories(userId);
  const recurringSummary = summarizeRecurringCategories(recurringCategories);
  let canonicalProfile = null;

  try {
    canonicalProfile = await prisma.costProfile.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
  } catch (error) {
    if (!isPrismaSchemaMismatchError(error)) {
      throw error;
    }
  }

  const profile =
    canonicalProfile ??
    (await prisma.fixedCost.findFirst({
      where: { userId },
      orderBy: { createdAt: "desc" },
    }));

  if (!profile) {
    return recurringSummary.recurringCategories.length > 0
      ? {
          dailyFixedCost: recurringSummary.dailyFixedCost,
          insuranceMonthly: 0,
          phoneMonthly: 0,
          accountantMonthly: 0,
          roadTaxMonthly: 0,
          kteoMonthly: 0,
          otherMonthly: recurringSummary.monthlyEquivalent,
          recurringCategories: recurringSummary.recurringCategories,
        }
      : null;
  }

  const insuranceMonthly = toSafeNumber(profile.insuranceMonthly);
  const phoneMonthly = toSafeNumber(profile.phoneMonthly);
  const accountantMonthly = toSafeNumber(profile.accountantMonthly);
  const roadTaxMonthly = toSafeNumber(profile.roadTaxMonthly);
  const kteoMonthly = toSafeNumber(profile.kteoMonthly);
  const otherMonthly = toSafeNumber(profile.otherMonthly);
  const explicitDailyFixedCost =
    "dailyFixedCost" in profile && profile.dailyFixedCost != null
      ? toSafeNumber(profile.dailyFixedCost)
      : null;
  const fallbackDailyFixedCost =
    explicitDailyFixedCost ??
    roundCurrency(
      (insuranceMonthly +
        phoneMonthly +
        accountantMonthly +
        roadTaxMonthly +
        kteoMonthly +
        otherMonthly) /
        30
    );

  return {
    dailyFixedCost:
      recurringSummary.recurringCategories.length > 0
        ? recurringSummary.dailyFixedCost
        : fallbackDailyFixedCost,
    insuranceMonthly,
    phoneMonthly,
    accountantMonthly,
    roadTaxMonthly,
    kteoMonthly,
    otherMonthly,
    recurringCategories: recurringSummary.recurringCategories,
  };
}

export async function upsertUserLocale(userId: number, locale: AppLocale) {
  try {
    return await prisma.appSettings.upsert({
      where: {
        userId,
      },
      update: {
        locale,
      },
      create: {
        userId,
        locale,
        onboardingCompleted: false,
      },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return null;
    }

    throw error;
  }
}
