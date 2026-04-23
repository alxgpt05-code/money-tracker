import { AccountType, ForecastPeriod, TransactionType } from "@prisma/client";

export const accountTypeLabels: Record<AccountType, string> = {
  CARD: "Карта",
  SAVINGS: "Накопительный",
  DEPOSIT: "Вклад",
  PORTFOLIO: "Портфель",
  CASH: "Наличные",
};

export const transactionTypeLabels: Record<TransactionType, string> = {
  INCOME: "Доход",
  EXPENSE: "Расход",
  TRANSFER: "Перевод",
  COUPON: "Купон",
  SALARY: "Зарплата",
  ADVANCE: "Аванс",
  SIDE_INCOME: "Подработка",
  ADJUSTMENT: "Корректировка",
  SAVINGS_TOPUP: "Пополнение накопительного",
  DEPOSIT_TOPUP: "Пополнение вклада",
  BALANCE_UPDATE: "Изменение остатка",
};

export const forecastPeriodLabels: Record<ForecastPeriod, string> = {
  THREE_MONTHS: "3 месяца",
  SIX_MONTHS: "6 месяцев",
  TWELVE_MONTHS: "12 месяцев",
};

export const capitalPositiveTypes = new Set<TransactionType>([
  "INCOME",
  "COUPON",
  "SALARY",
  "ADVANCE",
  "SIDE_INCOME",
  "ADJUSTMENT",
  "BALANCE_UPDATE",
]);

export const capitalNegativeTypes = new Set<TransactionType>(["EXPENSE"]);

export const internalTransferTypes = new Set<TransactionType>([
  "TRANSFER",
  "SAVINGS_TOPUP",
  "DEPOSIT_TOPUP",
]);
