import { startOfMonth } from "date-fns";
import { MonthlySnapshotForm } from "@/components/forms/settings-form";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserContext } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/formatters/currency";
import { buildMonthlyCloseData, getAppData } from "@/lib/services/finance";

export default async function MonthlyClosePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { user, activeWallet } = await requireUserContext();
  const data = await getAppData(user.id, { activeWalletId: activeWallet?.id, scoped: true });
  if (!activeWallet) {
    return <EmptyState title="Нет активного кошелька" description="Закрытие месяца доступно после выбора кошелька." actionHref="/settings/wallet" actionLabel="Выбрать кошелёк" />;
  }
  const monthDate = params.month ? startOfMonth(new Date(params.month)) : startOfMonth(new Date());
  const monthlyClose = buildMonthlyCloseData(data, monthDate);
  const monthValue = monthDate.toISOString().slice(0, 10);

  return (
    <div className="app-page">
      <div className="space-y-1">
        <h1 className="page-title">Закрытие месяца</h1>
        <p className="page-subtitle">Сравни расчётный остаток с фактическим и сохрани отклонение.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Выбор месяца</CardTitle>
        </CardHeader>
        <CardContent>
          <form className="flex max-w-xs gap-3">
            <input
              type="month"
              name="month"
              defaultValue={monthValue.slice(0, 7)}
              className="flex h-11 w-full rounded-[24px] border border-white/8 bg-[#0b120d]/70 px-4 py-2 text-sm text-foreground"
            />
            <button className="rounded-[24px] bg-primary px-4 py-2 text-sm font-medium text-primary-foreground">Открыть</button>
          </form>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {monthlyClose.map((wallet) => (
          <Card key={wallet.walletId}>
            <CardHeader>
              <CardTitle>{wallet.walletName}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-4 lg:grid-cols-2">
              {wallet.accounts.map((account) => (
                <div key={account.id} className="panel rounded-[24px] p-4">
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <div>
                      <p className="strong-text font-medium">{account.name}</p>
                      <p className="muted-text text-sm">Расчётный остаток {formatCurrency(account.calculatedBalance)}</p>
                    </div>
                    {account.deviation !== null ? (
                      <Badge tone={account.deviation >= 0 ? "positive" : "negative"}>{formatCurrency(account.deviation)}</Badge>
                    ) : null}
                  </div>
                  <MonthlySnapshotForm walletId={wallet.walletId} accountId={account.id} monthDate={monthValue} defaultActualBalance={account.actualBalance} />
                </div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
