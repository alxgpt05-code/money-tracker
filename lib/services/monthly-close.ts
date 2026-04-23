import { endOfMonth, startOfMonth } from "date-fns";
import { calculateAccountBalance, toNumber, type BalanceTransaction } from "@/lib/services/balances";

type AppData = Awaited<ReturnType<typeof import("./finance").getAppData>>;

export function buildMonthlyCloseData(data: AppData, monthDate: Date) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);

  return data.wallets.map((wallet) => {
    const transactions = wallet.transactions as BalanceTransaction[];
    const accounts = wallet.accounts.map((account) => {
      const calculatedBalance = calculateAccountBalance({
        initialBalance: account.initialBalance,
        accountId: account.id,
        transactions,
        asOf: monthEnd,
      });
      const snapshot = wallet.snapshots.find(
        (item) =>
          item.accountId === account.id &&
          item.monthDate.getFullYear() === monthStart.getFullYear() &&
          item.monthDate.getMonth() === monthStart.getMonth(),
      );

      return {
        id: account.id,
        name: account.name,
        calculatedBalance,
        actualBalance: snapshot?.actualBalance ? toNumber(snapshot.actualBalance) : null,
        deviation: snapshot?.deviation ? toNumber(snapshot.deviation) : null,
      };
    });

    return {
      walletId: wallet.id,
      walletName: wallet.name,
      monthDate: monthStart,
      accounts,
    };
  });
}
