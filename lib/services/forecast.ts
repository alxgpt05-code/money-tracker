import { addMonths, endOfMonth, startOfMonth, subMonths } from "date-fns";
import { capitalPositiveTypes } from "@/lib/constants/finance";
import { isFixedExpense, toNumber, type BalanceTransaction } from "@/lib/services/balances";

type AppData = Awaited<ReturnType<typeof import("./finance").getAppData>>;

export function buildForecast(data: AppData) {
  const now = new Date();
  const allTransactions = data.wallets.flatMap((wallet) => wallet.transactions as BalanceTransaction[]);
  const allAccounts = data.wallets.flatMap((wallet) => wallet.accounts);
  const currentCapital = allAccounts.reduce((sum, account) => sum + Number(account.currentBalance), 0);
  const months = [subMonths(now, 3), subMonths(now, 2), subMonths(now, 1)];

  const monthStats = months.map((monthDate) => {
    const start = startOfMonth(monthDate);
    const end = endOfMonth(monthDate);
    const monthTransactions = allTransactions.filter((item) => item.transactionDate >= start && item.transactionDate <= end);
    const income = monthTransactions.filter((item) => capitalPositiveTypes.has(item.type)).reduce((sum, item) => sum + toNumber(item.amount), 0);
    const expense = monthTransactions.filter((item) => item.type === "EXPENSE").reduce((sum, item) => sum + toNumber(item.amount), 0);
    const recurringIncome = monthTransactions
      .filter((item) => capitalPositiveTypes.has(item.type) && item.isRecurring)
      .reduce((sum, item) => sum + toNumber(item.amount), 0);
    const recurringExpense = monthTransactions
      .filter((item) => item.type === "EXPENSE" && isFixedExpense(item))
      .reduce((sum, item) => sum + toNumber(item.amount), 0);
    return { income, expense, recurringIncome, recurringExpense };
  });

  const averageMonthlyIncome = monthStats.reduce((sum, item) => sum + item.income, 0) / monthStats.length;
  const averageMonthlyExpense = monthStats.reduce((sum, item) => sum + item.expense, 0) / monthStats.length;
  const recurringIncome = monthStats.reduce((sum, item) => sum + item.recurringIncome, 0) / monthStats.length;
  const recurringExpense = monthStats.reduce((sum, item) => sum + item.recurringExpense, 0) / monthStats.length;
  const trendBase = monthStats[0]?.expense || 1;
  const expenseTrend = (monthStats[monthStats.length - 1].expense - monthStats[0].expense) / trendBase;

  const salarySchedules = data.wallets.flatMap((wallet) => wallet.salarySchedules).filter((item) => item.isActive);
  const scheduledMonthlyIncome = salarySchedules.reduce((sum, item) => sum + Number(item.amount), 0);

  return [3, 6, 12].map((monthsCount) => {
    let projectedCapital = currentCapital;
    for (let step = 1; step <= monthsCount; step += 1) {
      const monthFactor = 1 + expenseTrend * (step / Math.max(monthsCount, 1)) * 0.35;
      const projectedIncome = Math.max(averageMonthlyIncome, scheduledMonthlyIncome) + recurringIncome;
      const projectedExpense = averageMonthlyExpense * monthFactor + recurringExpense;
      projectedCapital += projectedIncome - projectedExpense;
    }

    return {
      months: monthsCount,
      targetDate: addMonths(now, monthsCount),
      projectedCapital,
      averageMonthlyIncome,
      averageMonthlyExpense,
      recurringIncome,
      recurringExpense,
      expenseTrend,
    };
  });
}
