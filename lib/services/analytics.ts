import { eachDayOfInterval, endOfDay, format, isSameDay, startOfDay, startOfMonth, subMonths } from "date-fns";
import { capitalPositiveTypes } from "@/lib/constants/finance";
import {
  calculateAccountMonthlyChange,
  calculateBalancesByAccount,
  calculateCapitalStructureByType,
  calculateTotalCapital,
  isFixedExpense,
  toNumber,
  type BalanceTransaction,
} from "@/lib/services/balances";

type AppData = Awaited<ReturnType<typeof import("./finance").getAppData>>;

export function buildAnalyticsSnapshot(data: AppData) {
  const now = new Date();
  const monthStart = startOfMonth(now);
  const todayStart = startOfDay(now);

  const wallets = data.wallets.map((wallet) => ({
    ...wallet,
    transactions: wallet.transactions as BalanceTransaction[],
  }));

  const allTransactions = wallets.flatMap((wallet) => wallet.transactions.map((transaction) => ({ ...transaction, walletName: wallet.name })));
  const allAccounts = wallets.flatMap((wallet) => wallet.accounts.map((account) => ({ ...account, walletName: wallet.name })));
  const totalCapital = calculateTotalCapital({
    wallets: wallets.map((wallet) => ({
      accounts: wallet.accounts,
      transactions: wallet.transactions,
    })),
  });

  const previousMonthCapital = calculateTotalCapital({
    wallets: wallets.map((wallet) => ({
      accounts: wallet.accounts,
      transactions: wallet.transactions,
    })),
    asOf: new Date(monthStart.getTime() - 1),
  });

  const monthCapitalChange = totalCapital - previousMonthCapital;

  const expensesToday = allTransactions
    .filter((item) => item.type === "EXPENSE" && item.transactionDate >= todayStart)
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  const expensesMonth = allTransactions
    .filter((item) => item.type === "EXPENSE" && item.transactionDate >= monthStart)
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  const incomeMonth = allTransactions
    .filter((item) => capitalPositiveTypes.has(item.type) && item.transactionDate >= monthStart)
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  const couponsMonth = allTransactions
    .filter((item) => item.type === "COUPON" && item.transactionDate >= monthStart)
    .reduce((sum, item) => sum + toNumber(item.amount), 0);

  const fixedExpenses = allTransactions
    .filter((item) => item.type === "EXPENSE" && item.transactionDate >= monthStart && isFixedExpense(item))
    .reduce((sum, item) => sum + toNumber(item.amount), 0);
  const variableExpenses = expensesMonth - fixedExpenses;

  const last90Days = eachDayOfInterval({ start: subMonths(now, 3), end: now });
  const dailySeries = eachDayOfInterval({ start: subMonths(now, 1), end: now }).map((day) => {
    const dayTransactions = allTransactions.filter((item) => isSameDay(item.transactionDate, day));
    return {
      date: format(day, "dd.MM"),
      income: dayTransactions.filter((item) => capitalPositiveTypes.has(item.type)).reduce((sum, item) => sum + toNumber(item.amount), 0),
      expense: dayTransactions.filter((item) => item.type === "EXPENSE").reduce((sum, item) => sum + toNumber(item.amount), 0),
    };
  });

  const capitalHistory = last90Days
    .filter((_, index) => index % 7 === 0)
    .map((day) => ({
      date: format(day, "dd.MM"),
      capital: calculateTotalCapital({
        wallets: wallets.map((wallet) => ({
          accounts: wallet.accounts,
          transactions: wallet.transactions,
        })),
        asOf: endOfDay(day),
      }),
    }));

  const categoryExpenseMap = new Map<string, { name: string; value: number; color: string }>();
  for (const item of allTransactions.filter((transaction) => transaction.type === "EXPENSE" && transaction.transactionDate >= monthStart)) {
    const key = item.category?.id ?? "other";
    const current = categoryExpenseMap.get(key) ?? {
      name: item.category?.name ?? "Прочее",
      value: 0,
      color: item.category?.color ?? "#b6ff4d",
    };
    current.value += toNumber(item.amount);
    categoryExpenseMap.set(key, current);
  }

  const accountBalances = calculateBalancesByAccount({
    accounts: allAccounts,
    transactions: allTransactions,
  });

  const accountComposition = calculateCapitalStructureByType({
    accounts: allAccounts,
    transactions: allTransactions,
  });

  const monthlyClosings = data.wallets.flatMap((wallet) =>
    wallet.accounts.map((account) => {
      const latestSnapshot = wallet.snapshots.find((snapshot) => snapshot.accountId === account.id);
      return {
        walletName: wallet.name,
        accountName: account.name,
        calculatedBalance: accountBalances[account.id] ?? 0,
        snapshot: latestSnapshot ?? null,
      };
    }),
  );

  const recentTransactions = allTransactions.slice(0, 8);

  const accountMonthChanges = Object.fromEntries(allAccounts.map((account) => [account.id, calculateAccountMonthlyChange({ accountId: account.id, transactions: allTransactions })]));

  const portfolioAccount = allAccounts.find((account) => account.type === "PORTFOLIO");
  const portfolioTrend = eachDayOfInterval({ start: subMonths(now, 2), end: now })
    .filter((_, index) => index % 4 === 0)
    .map((day) => ({
      date: format(day, "dd.MM"),
      value:
        portfolioAccount && portfolioAccount.id
          ? calculateBalancesByAccount({ accounts: [portfolioAccount], transactions: allTransactions, asOf: day })[portfolioAccount.id] ?? 0
          : 0,
    }));

  return {
    totalCapital,
    monthCapitalChange,
    expensesToday,
    expensesMonth,
    incomeMonth,
    couponsMonth,
    fixedExpenses,
    variableExpenses,
    dailySeries,
    capitalHistory,
    categoryExpenses: Array.from(categoryExpenseMap.values()),
    accountComposition,
    recentTransactions,
    monthlyClosings,
    accountBalances,
    accountMonthChanges,
    portfolioTrend,
    latestMovement: recentTransactions[0] ?? null,
  };
}
