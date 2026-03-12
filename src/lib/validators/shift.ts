import { z } from "zod";

const numericString = z.union([z.number(), z.string(), z.null(), z.undefined()]);

const legacyShiftSchema = z.object({
  date: z.string().min(1),
  platform: z.string().min(1).default("other"),
  area: z.string().trim().min(1).max(100),
  hours: numericString.optional(),
  ordersCount: numericString.optional(),
  kilometers: numericString.optional(),
  platformEarnings: numericString.optional(),
  tipsCard: numericString.optional(),
  tipsCash: numericString.optional(),
  bonus: numericString.optional(),
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
    tollsOrParking: numericString.optional(),
    platform: z.enum(["efood", "wolt", "freelance", "other"]).optional(),
    area: z.string().trim().min(1).max(100),
    notes: z.string().max(2000).optional().nullable(),
  })
  .superRefine((value, context) => {
    const hoursWorked = Number(value.hoursWorked ?? 0);

    if (!Number.isFinite(hoursWorked) || hoursWorked <= 0) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["hoursWorked"],
        message: "Hours worked must be greater than zero.",
      });
    }

    const startTime = value.startTime?.trim();
    const endTime = value.endTime?.trim();

    if ((startTime && !endTime) || (!startTime && endTime)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["endTime"],
        message: "Start and end time must be provided together.",
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
