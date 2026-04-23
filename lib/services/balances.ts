import { AccountType, Prisma, TransactionType } from "@prisma/client";
import { endOfDay, endOfMonth, startOfMonth } from "date-fns";
import { capitalPositiveTypes, internalTransferTypes } from "@/lib/constants/finance";

type DecimalLike = Prisma.Decimal | number | string | null | undefined;

export function toNumber(value: DecimalLike) {
  return Number(value ?? 0);
}

export function toDecimal(value: DecimalLike) {
  return new Prisma.Decimal(toNumber(value).toFixed(2));
}

export type BalanceTransaction = {
  id: string;
  type: TransactionType;
  amount: DecimalLike;
  transactionDate: Date;
  sourceAccountId?: string | null;
  destinationAccountId?: string | null;
  isRecurring?: boolean;
  category?: { id?: string; name?: string; color?: string; isFixed?: boolean | null } | null;
};

export function getAccountDeltaForTransaction(accountId: string, transaction: BalanceTransaction) {
  const amount = toNumber(transaction.amount);

  if (transaction.type === "EXPENSE" && transaction.sourceAccountId === accountId) {
    return -amount;
  }

  if (capitalPositiveTypes.has(transaction.type) && transaction.destinationAccountId === accountId) {
    return amount;
  }

  if (internalTransferTypes.has(transaction.type)) {
    if (transaction.sourceAccountId === accountId) return -amount;
    if (transaction.destinationAccountId === accountId) return amount;
  }

  return 0;
}

export function calculateAccountBalance(args: {
  initialBalance: DecimalLike;
  accountId: string;
  transactions: BalanceTransaction[];
  asOf?: Date;
}) {
  const limitDate = args.asOf ? endOfDay(args.asOf) : null;
  const delta = args.transactions
    .filter((transaction) => !limitDate || transaction.transactionDate <= limitDate)
    .reduce((sum, transaction) => sum + getAccountDeltaForTransaction(args.accountId, transaction), 0);

  return toNumber(args.initialBalance) + delta;
}

export function calculateAccountMonthlyChange(args: {
  accountId: string;
  transactions: BalanceTransaction[];
  monthDate?: Date;
}) {
  const baseDate = args.monthDate ?? new Date();
  const monthStart = startOfMonth(baseDate);
  const monthEnd = endOfMonth(baseDate);

  return args.transactions
    .filter((transaction) => transaction.transactionDate >= monthStart && transaction.transactionDate <= monthEnd)
    .reduce((sum, transaction) => sum + getAccountDeltaForTransaction(args.accountId, transaction), 0);
}

export function calculateBalancesByAccount(args: {
  accounts: { id: string; initialBalance: DecimalLike }[];
  transactions: BalanceTransaction[];
  asOf?: Date;
}) {
  return Object.fromEntries(
    args.accounts.map((account) => [
      account.id,
      calculateAccountBalance({
        initialBalance: account.initialBalance,
        accountId: account.id,
        transactions: args.transactions,
        asOf: args.asOf,
      }),
    ]),
  );
}

export function calculateWalletCapital(args: {
  accounts: { id: string; initialBalance: DecimalLike }[];
  transactions: BalanceTransaction[];
  asOf?: Date;
}) {
  return Object.values(calculateBalancesByAccount(args)).reduce((sum, value) => sum + value, 0);
}

export function calculateTotalCapital(args: {
  wallets: {
    accounts: { id: string; initialBalance: DecimalLike }[];
    transactions: BalanceTransaction[];
  }[];
  asOf?: Date;
}) {
  return args.wallets.reduce(
    (sum, wallet) =>
      sum +
      calculateWalletCapital({
        accounts: wallet.accounts,
        transactions: wallet.transactions,
        asOf: args.asOf,
      }),
    0,
  );
}

export function calculateCapitalStructureByType(args: {
  accounts: { id: string; type: AccountType; initialBalance: DecimalLike; name: string; color?: string }[];
  transactions: BalanceTransaction[];
  asOf?: Date;
}) {
  const balances = calculateBalancesByAccount({
    accounts: args.accounts,
    transactions: args.transactions,
    asOf: args.asOf,
  });

  return args.accounts.map((account) => ({
    name: account.name,
    type: account.type,
    value: balances[account.id] ?? 0,
    color: account.color ?? "#b6ff4d",
  }));
}

export function isFixedExpense(transaction: BalanceTransaction) {
  return Boolean(transaction.isRecurring || transaction.category?.isFixed);
}
