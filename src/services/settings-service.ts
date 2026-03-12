import { prisma } from "@/lib/prisma";
import { isPrismaSchemaMismatchError } from "@/lib/prisma-errors";
import { roundCurrency, toSafeNumber } from "@/lib/utils";
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
    vehicleType: profile.vehicleType,
    fuelType: profile.fuelType,
    fuelPricePerLiter: toSafeNumber("fuelPricePerLiter" in profile ? profile.fuelPricePerLiter : profile.fuelPrice),
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
  };
}

export async function getCostProfileSnapshot(
  userId: number
): Promise<CostProfileSnapshot | null> {
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
    return null;
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

  return {
    dailyFixedCost:
      explicitDailyFixedCost ??
      roundCurrency(
        (insuranceMonthly +
          phoneMonthly +
          accountantMonthly +
          roadTaxMonthly +
          kteoMonthly +
          otherMonthly) /
          30
      ),
    insuranceMonthly,
    phoneMonthly,
    accountantMonthly,
    roadTaxMonthly,
    kteoMonthly,
    otherMonthly,
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
      },
    });
  } catch (error) {
    if (isPrismaSchemaMismatchError(error)) {
      return null;
    }

    throw error;
  }
}
