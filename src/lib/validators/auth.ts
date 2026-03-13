import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const registerSchema = loginSchema.extend({
  locale: z.enum(["en", "el"]).optional(),
  birthDate: z
    .string()
    .min(1)
    .refine((value) => !Number.isNaN(Date.parse(value)), "Birth date is required."),
});

export const passwordChangeSchema = z
  .object({
    currentPassword: z.string().min(8),
    newPassword: z.string().min(8),
    confirmPassword: z.string().min(8),
  })
  .refine((payload) => payload.newPassword === payload.confirmPassword, {
    path: ["confirmPassword"],
    message: "Passwords do not match.",
  });
