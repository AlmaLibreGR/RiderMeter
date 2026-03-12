import { z } from "zod";
import {
  expenseCadences,
  supportedExpenseScopes,
  supportedVehicleTypes,
} from "@/types/domain";

export const vehicleProfileSchema = z.object({
  vehicleType: z.enum(supportedVehicleTypes),
  fuelType: z.string().trim().min(1).max(50),
  fuelConsumptionPer100Km: z.coerce.number().min(0).max(50),
  fuelPricePerLiter: z.coerce.number().min(0).max(10),
  maintenanceCostPerKm: z.coerce.number().min(0).max(10),
  tiresCostPerKm: z.coerce.number().min(0).max(10).optional().default(0),
  depreciationCostPerKm: z.coerce.number().min(0).max(10),
  routineServiceIntervalKm: z.coerce.number().min(0).max(200000).nullable().optional(),
  routineServiceCost: z.coerce.number().min(0).max(10000).nullable().optional(),
  majorServiceIntervalKm: z.coerce.number().min(0).max(200000).nullable().optional(),
  majorServiceCost: z.coerce.number().min(0).max(10000).nullable().optional(),
  tireReplacementIntervalKm: z.coerce.number().min(0).max(200000).nullable().optional(),
  tireReplacementCost: z.coerce.number().min(0).max(10000).nullable().optional(),
  purchasePrice: z.coerce.number().min(0).max(1000000).nullable().optional(),
  resaleValue: z.coerce.number().min(0).max(1000000).nullable().optional(),
  expectedLifecycleKm: z.coerce.number().min(0).max(1000000).nullable().optional(),
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

export const expenseCategorySchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1).max(80),
  scope: z.enum(supportedExpenseScopes),
  cadence: z.enum(expenseCadences),
  defaultAmount: z.coerce.number().min(0).max(100000).default(0),
  isActive: z.boolean().optional().default(true),
});

export const expenseEntrySchema = z.object({
  date: z.string().min(1),
  categoryId: z.coerce.number().int().positive().nullable().optional(),
  category: z.string().trim().min(1).max(80).optional(),
  amount: z.coerce.number().min(0).max(100000),
  description: z.string().trim().max(500).optional().nullable(),
});

export const setupPayloadSchema = z.object({
  vehicle: vehicleProfileSchema,
  recurringCategories: z.array(expenseCategorySchema).max(30).default([]),
});
