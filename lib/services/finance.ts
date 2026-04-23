import { prisma } from "@/lib/db/prisma";
import { buildAnalyticsSnapshot } from "@/lib/services/analytics";
import { getAccountDeltaForTransaction, type BalanceTransaction } from "@/lib/services/balances";
import { buildForecast } from "@/lib/services/forecast";

export async function getAppData(
  userId: string,
  options?: {
    activeWalletId?: string | null;
    scoped?: boolean;
  },
) {
  const walletList = await prisma.wallet.findMany({
    where: { userId },
    orderBy: [{ isArchived: "asc" }, { sortOrder: "asc" }],
  });

  const requestedActiveWallet =
    walletList.find((wallet) => wallet.id === options?.activeWalletId && !wallet.isArchived) ??
    walletList.find((wallet) => !wallet.isArchived) ??
    null;

  const walletWhere = options?.scoped
    ? requestedActiveWallet
      ? { userId, id: requestedActiveWallet.id }
      : { userId, id: "__no_wallet__" }
    : { userId };

  const wallets = await prisma.wallet.findMany({
    where: walletWhere,
    orderBy: [{ isArchived: "asc" }, { sortOrder: "asc" }],
    include: {
      accounts: {
        where: { isArchived: false },
        orderBy: { createdAt: "asc" },
        include: {
          interestHistory: {
            orderBy: { effectiveFrom: "desc" },
          },
        },
      },
      salarySchedules: {
        orderBy: { dayOfMonth: "asc" },
      },
      snapshots: {
        orderBy: { monthDate: "desc" },
        take: 36,
        include: { account: true },
      },
      transactions: {
        orderBy: [{ transactionDate: "desc" }, { createdAt: "desc" }],
        include: {
          sourceAccount: true,
          destinationAccount: true,
          category: true,
        },
      },
    },
  });

  const categories = await prisma.category.findMany({
    where: { userId },
    orderBy: [{ kind: "asc" }, { name: "asc" }],
  });

  const forecasts = await prisma.forecastSnapshot.findMany({
    where:
      options?.scoped && requestedActiveWallet
        ? {
            userId,
            OR: [{ walletId: requestedActiveWallet.id }, { walletId: null }],
          }
        : { userId },
    orderBy: [{ period: "asc" }, { snapshotDate: "desc" }],
  });

  return {
    walletList,
    activeWallet: requestedActiveWallet,
    activeWalletId: requestedActiveWallet?.id ?? null,
    wallets,
    categories,
    forecasts,
  };
}

export function buildDashboardData(data: Awaited<ReturnType<typeof getAppData>>) {
  const analytics = buildAnalyticsSnapshot(data);
  const forecasts = buildForecast(data);

  return {
    ...analytics,
    forecastCards: forecasts.map((item, index) => ({
      period: index === 0 ? "THREE_MONTHS" : index === 1 ? "SIX_MONTHS" : "TWELVE_MONTHS",
      projectedCapital: item.projectedCapital,
      averageMonthlyIncome: item.averageMonthlyIncome,
      averageMonthlyExpense: item.averageMonthlyExpense,
      expenseTrend: item.expenseTrend,
      fixedExpenses: analytics.fixedExpenses,
      variableExpenses: analytics.variableExpenses,
      recurringIncome: item.recurringIncome,
    })),
    allTransactions: analytics.recentTransactions.length
      ? data.wallets.flatMap((wallet) => wallet.transactions.map((transaction) => ({ ...transaction, walletName: wallet.name })))
      : [],
    allAccounts: data.wallets.flatMap((wallet) =>
      wallet.accounts.map((account) => ({
        ...account,
        walletName: wallet.name,
      })),
    ),
  };
}

export function buildHistoryData(data: Awaited<ReturnType<typeof getAppData>>, filters: Record<string, string | undefined>) {
  const allTransactions = data.wallets.flatMap((wallet) =>
    wallet.transactions.map((transaction) => ({
      ...transaction,
      walletName: wallet.name,
    })),
  );

  return allTransactions.filter((item) => {
    if (filters.walletId && item.walletId !== filters.walletId) return false;
    if (filters.accountId && item.sourceAccountId !== filters.accountId && item.destinationAccountId !== filters.accountId) return false;
    if (filters.categoryId && item.categoryId !== filters.categoryId) return false;
    if (filters.type && item.type !== filters.type) return false;
    if (filters.q) {
      const query = filters.q.toLowerCase();
      const haystack = [item.note, item.category?.name, item.sourceAccount?.name, item.destinationAccount?.name].filter(Boolean).join(" ").toLowerCase();
      if (!haystack.includes(query)) return false;
    }
    if (filters.from && item.transactionDate < new Date(filters.from)) return false;
    if (filters.to && item.transactionDate > new Date(`${filters.to}T23:59:59`)) return false;
    return true;
  });
}

export function calculateForecastFromTransactions(data: Awaited<ReturnType<typeof getAppData>>) {
  return buildForecast(data);
}

export function applyAccountBalanceChange(args: {
  type: BalanceTransaction["type"];
  amount: BalanceTransaction["amount"];
  accountId?: string | null;
  linkedAccountId?: string | null;
  sourceBalance?: BalanceTransaction["amount"];
  destinationBalance?: BalanceTransaction["amount"];
}) {
  const transaction = {
    id: "preview",
    type: args.type,
    amount: args.amount,
    transactionDate: new Date(),
    sourceAccountId: args.accountId ?? null,
    destinationAccountId: args.linkedAccountId ?? null,
  } as BalanceTransaction;

  const updates: { source?: number; destination?: number } = {};
  if (args.accountId) {
    updates.source = Number(args.sourceBalance ?? 0) + getAccountDeltaForTransaction(args.accountId, transaction);
  }
  if (args.linkedAccountId) {
    updates.destination = Number(args.destinationBalance ?? 0) + getAccountDeltaForTransaction(args.linkedAccountId, transaction);
  }
  return updates;
}

export { buildAnalyticsSnapshot } from "@/lib/services/analytics";
export { buildForecast } from "@/lib/services/forecast";
export { buildMonthlyCloseData } from "@/lib/services/monthly-close";
export { calculateAccountBalance, calculateAccountMonthlyChange, calculateBalancesByAccount, calculateCapitalStructureByType, calculateTotalCapital, calculateWalletCapital, getAccountDeltaForTransaction, isFixedExpense, toDecimal, toNumber } from "@/lib/services/balances";
