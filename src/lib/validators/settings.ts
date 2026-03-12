import { z } from "zod";

export const vehicleProfileSchema = z.object({
  vehicleType: z.string().trim().min(1).max(50),
  fuelType: z.string().trim().min(1).max(50),
  fuelConsumptionPer100Km: z.coerce.number().min(0).max(50),
  fuelPricePerLiter: z.coerce.number().min(0).max(10),
  maintenanceCostPerKm: z.coerce.number().min(0).max(10),
  tiresCostPerKm: z.coerce.number().min(0).max(10).optional().default(0),
  depreciationCostPerKm: z.coerce.number().min(0).max(10),
});

export const costProfileSchema = z.object({
  insuranceMonthly: z.coerce.number().min(0).max(10000).default(0),
  phoneMonthly: z.coerce.number().min(0).max(10000).default(0),
  accountantMonthly: z.coerce.number().min(0).max(10000).default(0),
  roadTaxMonthly: z.coerce.number().min(0).max(10000).default(0),
  kteoMonthly: z.coerce.number().min(0).max(10000).default(0),
  otherMonthly: z.coerce.number().min(0).max(10000).default(0),
  dailyFixedCost: z.coerce.number().min(0).max(1000).optional(),
});

export const appSettingsSchema = z.object({
  locale: z.enum(["en", "el"]).optional(),
  currency: z.enum(["EUR"]).optional(),
  timezone: z.string().trim().min(1).optional(),
  preferredDashboardPeriod: z.enum(["today", "week", "month", "custom"]).optional(),
  platformFeePercent: z.coerce.number().min(0).max(100).optional(),
  taxReservePercent: z.coerce.number().min(0).max(100).optional(),
});
