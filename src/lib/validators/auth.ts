import { z } from "zod";

export const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(8),
});

export const registerSchema = loginSchema.extend({
  locale: z.enum(["en", "el"]).optional(),
});
