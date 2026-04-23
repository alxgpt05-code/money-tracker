import Link from "next/link";
import { notFound } from "next/navigation";
import { eachDayOfInterval, format, startOfDay, subDays } from "date-fns";
import { ru } from "date-fns/locale";
import { RenameAccountForm } from "@/components/accounts/rename-account-form";
import { AccountFlowBarChart } from "@/components/charts/chart-wrappers";
import { DeleteAccountForm } from "@/components/accounts/delete-account-form";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserContext } from "@/lib/auth/session";
import { accountTypeLabels, transactionTypeLabels } from "@/lib/constants/finance";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatShortDate } from "@/lib/formatters/date";
import { getAppData } from "@/lib/services/finance";

export default async function AccountDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, activeWallet } = await requireUserContext();
  const data = await getAppData(user.id, { activeWalletId: activeWallet?.id, scoped: true });

  if (!activeWallet) {
    return <EmptyState title="Нет активного кошелька" description="Сначала выбери кошелёк." actionHref="/settings/wallet" actionLabel="К кошелькам" />;
  }

  const wallet = data.wallets[0];
  const account = wallet?.accounts.find((item) => item.id === id);

  if (!wallet || !account) {
    notFound();
  }

  const accountTransactions = wallet.transactions.filter((item) => item.sourceAccountId === account.id || item.destinationAccountId === account.id);
  const dailyMap = new Map<string, { income: number; expense: number }>();
  const start = subDays(startOfDay(new Date()), 29);
  const days = eachDayOfInterval({ start, end: startOfDay(new Date()) });

  for (const day of days) {
    dailyMap.set(format(day, "yyyy-MM-dd"), { income: 0, expense: 0 });
  }

  for (const item of accountTransactions) {
    const key = format(startOfDay(item.transactionDate), "yyyy-MM-dd");
    if (!dailyMap.has(key)) continue;
    const bucket = dailyMap.get(key)!;
    if (item.destinationAccountId === account.id && ["INCOME", "SALARY", "ADVANCE", "SIDE_INCOME", "COUPON", "ADJUSTMENT", "BALANCE_UPDATE", "TRANSFER", "SAVINGS_TOPUP", "DEPOSIT_TOPUP"].includes(item.type)) {
      bucket.income += Number(item.amount);
    }
    if (item.sourceAccountId === account.id && ["EXPENSE", "TRANSFER", "SAVINGS_TOPUP", "DEPOSIT_TOPUP"].includes(item.type)) {
      bucket.expense -= Number(item.amount);
    }
  }

  const chartData = Array.from(dailyMap.entries()).map(([date, value]) => ({
    date: format(new Date(date), "d MMM", { locale: ru }),
    income: value.income,
    expense: value.expense,
  }));

  const latestTransactions = accountTransactions.slice(0, 5);
  const transferTargets = wallet.accounts.filter((item) => item.id !== account.id).map((item) => ({ id: item.id, name: item.name }));

  return (
    <div className="app-page">
      <Card>
        <CardContent className="p-6">
          <p className="muted-text text-sm">{accountTypeLabels[account.type]}</p>
          <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <h1 className="strong-text min-w-0 break-words text-2xl font-semibold tracking-tight">{account.name}</h1>
            <RenameAccountForm accountId={account.id} defaultName={account.name} />
          </div>
          <p className="strong-text mt-4 break-words text-[clamp(2rem,9vw,2.5rem)] font-semibold tracking-[-0.04em]">{formatCurrency(account.currentBalance.toString())}</p>

          <div className="mt-5 grid grid-cols-2 gap-3">
            <Button asChild className="w-full">
              <Link href={`/transactions/new?type=EXPENSE&accountId=${account.id}`}>− Расход</Link>
            </Button>
            <Button asChild variant="secondary" className="w-full">
              <Link href={`/transactions/new?type=INCOME&accountId=${account.id}`}>+ Доход</Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="chart-card-surface">
        <CardHeader>
          <CardTitle>Движение за месяц</CardTitle>
        </CardHeader>
        <CardContent className="h-[180px] pt-1">
          <AccountFlowBarChart data={chartData} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle>Последние операции</CardTitle>
          <Button asChild variant="ghost" size="sm">
            <Link href={`/transactions?accountId=${account.id}`}>Все →</Link>
          </Button>
        </CardHeader>
        <CardContent className="space-y-2">
          {latestTransactions.length ? (
            latestTransactions.map((item) => (
              <Link key={item.id} href={`/transactions/${item.id}`} className="panel flex items-center justify-between gap-3 rounded-[20px] px-4 py-3">
                <div className="min-w-0">
                  <p className="strong-text truncate text-sm">{item.note ?? transactionTypeLabels[item.type]}</p>
                  <p className="muted-text truncate text-xs">{formatShortDate(item.transactionDate)}</p>
                </div>
                <p className="strong-text text-sm font-medium">{formatCurrency(item.amount.toString())}</p>
              </Link>
            ))
          ) : (
            <div className="muted-text panel rounded-[20px] px-4 py-4 text-sm">По счёту пока нет операций.</div>
          )}
        </CardContent>
      </Card>

      <DeleteAccountForm accountId={account.id} accountName={account.name} transferTargets={transferTargets} />
    </div>
  );
}
