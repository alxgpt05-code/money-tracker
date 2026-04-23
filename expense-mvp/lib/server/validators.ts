import { z } from "zod";

export const expenseInputSchema = z.object({
  amount: z.coerce.number().positive(),
  categoryId: z.string().min(1),
  date: z.string().min(1),
  note: z.string().max(280).optional().or(z.literal(""))
});

export const settingsSchema = z.object({
  enabled: z.boolean(),
  time: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  timezone: z.string().min(2)
});

export const subscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1)
  })
});
