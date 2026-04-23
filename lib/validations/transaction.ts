import { TransactionType } from "@prisma/client";
import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (value === null || value === undefined || value === "") return undefined;
  return value;
}, z.string().optional());

const requiredText = (message: string) =>
  z.preprocess((value) => {
    if (value === null || value === undefined) return "";
    return value;
  }, z.string().min(1, message));

export const transactionSchema = z
  .object({
    id: optionalText,
    redirectTo: optionalText,
    walletId: requiredText("Активный кошелёк не найден"),
    sourceAccountId: optionalText,
    destinationAccountId: optionalText,
    categoryId: optionalText,
    type: z.nativeEnum(TransactionType),
    amount: z.coerce.number().positive("Сумма должна быть больше нуля"),
    transactionDate: requiredText("Укажите дату"),
    note: z.preprocess((value) => {
      if (value === null || value === undefined || value === "") return undefined;
      return value;
    }, z.string().max(160, "Комментарий слишком длинный").optional()),
    isRecurring: z.boolean().optional(),
  })
  .superRefine((value, ctx) => {
    if (value.type === "EXPENSE" && !value.sourceAccountId) {
      ctx.addIssue({ code: "custom", message: "Выберите счёт", path: ["sourceAccountId"] });
    }
    if (value.type === "EXPENSE" && !value.categoryId) {
      ctx.addIssue({ code: "custom", message: "Выберите категорию", path: ["categoryId"] });
    }

    if (["INCOME", "COUPON", "SALARY", "ADVANCE", "SIDE_INCOME", "ADJUSTMENT", "BALANCE_UPDATE"].includes(value.type) && !value.destinationAccountId) {
      ctx.addIssue({ code: "custom", message: "Выберите счёт", path: ["destinationAccountId"] });
    }

    if (["TRANSFER", "SAVINGS_TOPUP", "DEPOSIT_TOPUP"].includes(value.type)) {
      if (!value.sourceAccountId || !value.destinationAccountId) {
        ctx.addIssue({ code: "custom", message: "Выберите оба счёта", path: ["destinationAccountId"] });
      }
      if (value.sourceAccountId && value.destinationAccountId && value.sourceAccountId === value.destinationAccountId) {
        ctx.addIssue({ code: "custom", message: "Счета перевода должны отличаться", path: ["destinationAccountId"] });
      }
    }
  });

export const historyFilterSchema = z.object({
  walletId: z.string().optional(),
  accountId: z.string().optional(),
  categoryId: z.string().optional(),
  type: z.string().optional(),
  from: z.string().optional(),
  to: z.string().optional(),
});
