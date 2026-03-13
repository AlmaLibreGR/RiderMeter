import { z } from "zod";

export const adminBillingUpdateSchema = z.object({
  planType: z.enum(["free", "lifetime", "subscription"]),
  status: z.enum(["inactive", "trial", "active", "past_due", "cancelled"]),
  billingInterval: z.enum(["one_time", "monthly", "yearly"]).nullable(),
  priceAmount: z.number().min(0).nullable(),
  currency: z.literal("EUR"),
  currentPeriodEndsAt: z.string().datetime().nullable(),
  lifetimeAccessGrantedAt: z.string().datetime().nullable(),
});
