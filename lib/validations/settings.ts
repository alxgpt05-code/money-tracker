import { z } from "zod";

export const walletSettingsSchema = z.object({
  walletId: z.string(),
  name: z.string().min(2, "Минимум 2 символа"),
  description: z.string().max(120).optional(),
  trackingStartDate: z.string().min(1, "Укажите стартовую дату"),
  salaryDayPrimary: z.coerce.number().min(1).max(31),
  salaryDayAdvance: z.coerce.number().min(1).max(31),
  salaryAmountPrimary: z.coerce.number().min(0),
  salaryAmountAdvance: z.coerce.number().min(0),
});

export const monthlySnapshotSchema = z.object({
  walletId: z.string(),
  accountId: z.string(),
  monthDate: z.string(),
  actualBalance: z.coerce.number(),
});
