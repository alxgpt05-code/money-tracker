"use client";

import { useEffect, useMemo, useState } from "react";
import { useActionState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { AccountType, TransactionType } from "@prisma/client";
import { createCategoryAction, deleteTransactionAction, upsertTransactionAction } from "@/lib/services/actions";
import { transactionSchema } from "@/lib/validations/transaction";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatFullDate } from "@/lib/formatters/date";
import { cn } from "@/lib/utils";

type FormValues = {
  id?: string;
  redirectTo?: string;
  walletId: string;
  sourceAccountId?: string;
  destinationAccountId?: string;
  categoryId?: string;
  type: TransactionType;
  amount: number;
  transactionDate: string;
  note?: string;
  isRecurring?: boolean;
};

export function TransactionForm({
  wallets,
  categories,
  defaultWalletId,
  initialValues,
  redirectTo = "/transactions",
}: {
  wallets: {
    id: string;
    name: string;
    accounts: { id: string; name: string; type: AccountType; currentBalance?: number }[];
  }[];
  categories: { id: string; name: string; kind: TransactionType }[];
  defaultWalletId: string;
  redirectTo?: string;
  initialValues?: {
    id?: string;
    walletId: string;
    sourceAccountId?: string | null;
    destinationAccountId?: string | null;
    categoryId?: string | null;
    type: TransactionType;
    amount: number;
    transactionDate: string;
    note?: string | null;
    isRecurring?: boolean;
  };
}) {
  const [state, formAction, isPending] = useActionState(upsertTransactionAction, null);
  const today = new Date().toISOString().slice(0, 10);
  const [categoryState, categoryAction, isCategoryPending] = useActionState(createCategoryAction, null);
  const [newCategoryName, setNewCategoryName] = useState("");
  const form = useForm<FormValues>({
    resolver: zodResolver(transactionSchema),
    defaultValues: {
      id: initialValues?.id,
      redirectTo,
      walletId: initialValues?.walletId ?? defaultWalletId,
      sourceAccountId: initialValues?.sourceAccountId ?? undefined,
      destinationAccountId: initialValues?.destinationAccountId ?? undefined,
      categoryId: initialValues?.categoryId ?? undefined,
      type: initialValues?.type ?? TransactionType.EXPENSE,
      amount: initialValues?.amount ?? 0,
      transactionDate: initialValues?.transactionDate ?? today,
      note: initialValues?.note ?? undefined,
      isRecurring: initialValues?.isRecurring ?? false,
    },
  });

  const [categoryOptions, setCategoryOptions] = useState(categories);
  const selectedType = form.watch("type");
  const sourceAccountId = form.watch("sourceAccountId");
  const destinationAccountId = form.watch("destinationAccountId");
  const transactionDate = form.watch("transactionDate");
  const isRecurring = Boolean(form.watch("isRecurring"));
  const selectedWallet = wallets.find((wallet) => wallet.id === (initialValues?.walletId ?? defaultWalletId)) ?? wallets[0];
  const isTransfer = ["TRANSFER", "SAVINGS_TOPUP", "DEPOSIT_TOPUP"].includes(selectedType);
  const isExpense = selectedType === TransactionType.EXPENSE;
  const isIncome = !isTransfer && !isExpense;
  const displayType = isTransfer ? TransactionType.TRANSFER : isExpense ? TransactionType.EXPENSE : TransactionType.INCOME;
  const accountCards = selectedWallet?.accounts ?? [];
  const incomeTypes: TransactionType[] = [
    TransactionType.SALARY,
    TransactionType.ADVANCE,
    TransactionType.SIDE_INCOME,
    TransactionType.COUPON,
    TransactionType.INCOME,
  ];

  const filteredCategories = categoryOptions.filter((category) => {
    if (selectedType === TransactionType.EXPENSE) return category.kind === TransactionType.EXPENSE;
    if (incomeTypes.includes(selectedType)) {
      return incomeTypes.includes(category.kind);
    }
    return category.kind === selectedType;
  });
  const selectedCategoryId = form.watch("categoryId");
  const formattedDate = useMemo(() => {
    try {
      return formatFullDate(transactionDate || today);
    } catch {
      return formatFullDate(today);
    }
  }, [today, transactionDate]);

  useEffect(() => {
    if (isExpense) {
      form.setValue("destinationAccountId", undefined, { shouldValidate: false });
    }
    if (!isExpense) {
      form.setValue("categoryId", undefined, { shouldValidate: false });
    }
  }, [form, isExpense]);

  useEffect(() => {
    if (isIncome) {
      form.setValue("destinationAccountId", sourceAccountId ?? undefined, { shouldValidate: true });
    }
  }, [form, isIncome, sourceAccountId]);

  useEffect(() => {
    if (categoryState?.category) {
      setCategoryOptions((current) => {
        if (current.some((item) => item.id === categoryState.category.id)) return current;
        return [...current, categoryState.category];
      });
      form.setValue("categoryId", categoryState.category.id, { shouldValidate: true, shouldDirty: true });
      setNewCategoryName("");
    }
  }, [categoryState, form]);

  return (
    <Card className="w-full max-w-full overflow-hidden">
      <CardHeader>
        <CardTitle>{initialValues?.id ? "Редактировать операцию" : "Новая операция"}</CardTitle>
      </CardHeader>
      <CardContent className="min-w-0 max-w-full overflow-x-hidden">
        <form action={formAction} className="grid w-full min-w-0 max-w-full gap-3">
          <input type="hidden" {...form.register("id")} />
          <input type="hidden" {...form.register("redirectTo")} />
          <input type="hidden" {...form.register("walletId")} />
          {isIncome ? <input type="hidden" {...form.register("destinationAccountId")} value={sourceAccountId ?? ""} readOnly /> : null}
          <input type="hidden" name="isRecurring" value={isRecurring ? "on" : ""} readOnly />

          <div className="min-w-0">
            <div className="grid min-w-0 grid-cols-3 gap-1.5 rounded-[24px] border border-white/8 bg-black/20 p-1">
              {[
                { label: "Расход", value: TransactionType.EXPENSE },
                { label: "Доход", value: TransactionType.INCOME },
                { label: "Перевод", value: TransactionType.TRANSFER },
              ].map((item) => (
                <button
                  key={item.label}
                  type="button"
                  onClick={() => form.setValue("type", item.value, { shouldValidate: true, shouldDirty: true })}
                  className={cn(
                    "min-w-0 rounded-[20px] px-1.5 py-3 text-xs font-medium transition duration-200 sm:px-3 sm:text-sm",
                    displayType === item.value ? "bg-primary text-primary-foreground shadow-glow" : "muted-text hover:bg-white/[0.04] hover:text-foreground",
                  )}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>

          <input type="hidden" {...form.register("type")} />

          <div className="space-y-2">
            <Label htmlFor="amount" className="muted-text text-xs uppercase tracking-[0.24em]">
              Сумма
            </Label>
            <Input
              id="amount"
              type="number"
              inputMode="decimal"
              enterKeyHint="done"
              step="0.01"
              min="0"
              placeholder="0"
              className="h-18 rounded-[28px] px-5 text-4xl font-semibold tracking-[-0.04em] sm:h-20"
              {...form.register("amount", { valueAsNumber: true })}
              onFocus={(event) => {
                if (event.currentTarget.value === "0") {
                  event.currentTarget.value = "";
                  form.setValue("amount", Number.NaN, { shouldDirty: true, shouldValidate: false });
                }
              }}
            />
            <FormMessage>{form.formState.errors.amount?.message}</FormMessage>
          </div>

          <div className="space-y-2">
            <Label>{isTransfer ? "Со счёта" : "Счёт"}</Label>
            <Select
              value={sourceAccountId ?? ""}
              onChange={(event) => form.setValue("sourceAccountId", event.currentTarget.value || undefined, { shouldValidate: true, shouldDirty: true })}
              className="h-12 min-w-0"
            >
              <option value="">Выберите счёт</option>
              {accountCards.map((account) => (
                <option key={account.id} value={account.id}>
                  {account.name} · {formatCurrency(account.currentBalance ?? 0)}
                </option>
              ))}
            </Select>
            <FormMessage>{form.formState.errors.sourceAccountId?.message}</FormMessage>
          </div>

          {isTransfer ? (
            <div className="space-y-2">
              <Label>На счёт</Label>
              <Select
                value={destinationAccountId ?? ""}
                onChange={(event) => form.setValue("destinationAccountId", event.currentTarget.value || undefined, { shouldValidate: true, shouldDirty: true })}
                className="h-12 min-w-0"
              >
                <option value="">Выберите счёт</option>
                {accountCards
                  .filter((account) => account.id !== sourceAccountId)
                  .map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.name} · {formatCurrency(account.currentBalance ?? 0)}
                    </option>
                  ))}
              </Select>
              <FormMessage>{form.formState.errors.destinationAccountId?.message}</FormMessage>
            </div>
          ) : null}

          {isExpense ? (
            <div className="space-y-2">
              <Label>Категория</Label>
              <div className="flex flex-wrap gap-2">
                {filteredCategories.map((category) => (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => form.setValue("categoryId", category.id, { shouldValidate: true, shouldDirty: true })}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-sm transition",
                      selectedCategoryId === category.id ? "border-primary/25 bg-primary text-primary-foreground shadow-glow" : "border-white/8 bg-black/15 text-foreground",
                    )}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
              <FormMessage>{form.formState.errors.categoryId?.message}</FormMessage>

              <div className="space-y-1.5">
                <Label htmlFor="new-category">Новая категория</Label>
                <input type="hidden" name="name" value={newCategoryName} readOnly />
                <input type="hidden" name="walletId" value={initialValues?.walletId ?? defaultWalletId} readOnly />
                <div className="flex min-w-0 gap-2">
                  <Input
                    id="new-category"
                    placeholder="Добавить категорию"
                    value={newCategoryName}
                    onChange={(event) => setNewCategoryName(event.currentTarget.value)}
                    className="min-w-0"
                  />
                  <Button
                    type="submit"
                    formAction={categoryAction}
                    variant="secondary"
                    className="shrink-0"
                    disabled={isCategoryPending || newCategoryName.trim().length < 2}
                  >
                    +
                  </Button>
                </div>
                <FormMessage>{categoryState?.error}</FormMessage>
                <FormMessage type="success">{categoryState?.success}</FormMessage>
              </div>
            </div>
          ) : null}

          <div className="space-y-1.5">
            <Label htmlFor="note">Комментарий</Label>
            <Textarea id="note" placeholder="Короткая заметка" {...form.register("note")} />
          </div>

          <div className="grid min-w-0 gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <div className="min-w-0 space-y-2">
              <Label htmlFor="transactionDate">Дата</Label>
              <div className="muted-text text-xs">{formattedDate}</div>
              <Input id="transactionDate" type="date" className="h-11 min-w-0 bg-black/15 text-sm" {...form.register("transactionDate")} />
              <FormMessage>{form.formState.errors.transactionDate?.message}</FormMessage>
            </div>
            <button
              type="button"
              onClick={() => form.setValue("isRecurring", !isRecurring, { shouldDirty: true })}
              className={cn(
                "h-11 w-full min-w-0 rounded-[18px] border px-4 text-sm font-medium transition sm:w-auto sm:shrink-0",
                isRecurring ? "border-primary/25 bg-primary text-primary-foreground shadow-glow" : "glass-button",
              )}
            >
              Регулярная
            </button>
          </div>

          <div className="space-y-2">
            <FormMessage>{state?.error}</FormMessage>
            {destinationAccountId && sourceAccountId && destinationAccountId === sourceAccountId && isTransfer ? <FormMessage>Счета перевода должны отличаться</FormMessage> : null}
          </div>

          <div className="min-w-0">
            <Button className="w-full" disabled={isPending}>
              {isPending ? "Сохраняю..." : initialValues?.id ? "Обновить операцию" : "Сохранить операцию"}
            </Button>
          </div>
        </form>
        {initialValues?.id ? (
          <form action={deleteTransactionAction} className="mt-3">
            <input type="hidden" name="transactionId" value={initialValues.id} />
            <input type="hidden" name="redirectTo" value={redirectTo} />
            <Button type="submit" variant="outline" className="w-full">
              Удалить операцию
            </Button>
          </form>
        ) : null}
      </CardContent>
    </Card>
  );
}
