import { z } from "zod";
import { getDurationHoursFromTimes } from "@/lib/dates";
import { supportedPlatforms, supportedWeatherConditions } from "@/types/domain";

const numericString = z.union([z.number(), z.string(), z.null(), z.undefined()]);

const legacyShiftSchema = z.object({
  date: z.string().min(1),
  platform: z.string().min(1).default("other"),
  area: z.string().trim().max(100).optional(),
  hours: numericString.optional(),
  ordersCount: numericString.optional(),
  kilometers: numericString.optional(),
  platformEarnings: numericString.optional(),
  tipsCard: numericString.optional(),
  tipsCash: numericString.optional(),
  bonus: numericString.optional(),
  weatherCondition: z.enum(supportedWeatherConditions).optional(),
  notes: z.string().max(2000).optional().default(""),
});

export const canonicalShiftSchema = z
  .object({
    date: z.string().min(1),
    startTime: z.string().optional().nullable(),
    endTime: z.string().optional().nullable(),
    hoursWorked: numericString.optional(),
    ordersCompleted: numericString.optional(),
    kilometersDriven: numericString.optional(),
    baseEarnings: numericString.optional(),
    tipsAmount: numericString.optional(),
    bonusAmount: numericString.optional(),
    fuelExpenseDirect: numericString.optional(),
    fuelExpenseOverride: numericString.optional(),
    tollsOrParking: numericString.optional(),
    platform: z.enum(supportedPlatforms).optional(),
    weatherCondition: z.enum(supportedWeatherConditions).optional(),
    area: z.string().trim().max(100).optional().nullable(),
    notes: z.string().max(2000).optional().nullable(),
  })
  .superRefine((value, context) => {
    const startTime = value.startTime?.trim();
    const endTime = value.endTime?.trim();

    if ((startTime && !endTime) || (!startTime && endTime)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "Start and end time must be provided together.",
      });
    }

    const derivedDuration = getDurationHoursFromTimes(startTime, endTime);
    const hoursWorked = Number(value.hoursWorked ?? 0);

    if (startTime && endTime && (!derivedDuration || derivedDuration <= 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "Start time must be before end time.",
      });
    }

    if ((!startTime || !endTime) && (!Number.isFinite(hoursWorked) || hoursWorked <= 0)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hoursWorked"],
        message: "Hours worked must be greater than zero.",
      });
    }
  });

export const shiftPayloadSchema = z.union([canonicalShiftSchema, legacyShiftSchema]);

export const historyQuerySchema = z.object({
  from: z.string().optional(),
  to: z.string().optional(),
  platform: z.string().optional(),
  period: z.enum(["today", "week", "month", "custom"]).optional(),
});
