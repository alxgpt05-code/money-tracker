import { ChartCard } from "@/components/charts/chart-card";
import { CompositionPieChart } from "@/components/charts/chart-wrappers";
import { AccountsList } from "@/components/accounts/accounts-list";
import { Card, CardContent } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserContext } from "@/lib/auth/session";
import { formatCurrency } from "@/lib/formatters/currency";
import { buildDashboardData, getAppData } from "@/lib/services/finance";

export default async function AccountsPage() {
  const { user, activeWallet } = await requireUserContext();
  const data = await getAppData(user.id, { activeWalletId: activeWallet?.id, scoped: true });
  if (!activeWallet) {
    return <EmptyState title="Нет активного кошелька" description="Создай или активируй кошелёк, чтобы увидеть счета." actionHref="/settings/wallet" actionLabel="К настройкам" />;
  }
  const dashboard = buildDashboardData(data);
  const accounts = data.wallets.flatMap((wallet) =>
    wallet.accounts.map((account) => ({
      id: account.id,
      name: account.name,
      type: account.type,
      color: account.color,
      balance: dashboard.accountBalances[account.id] ?? Number(account.currentBalance),
      monthlyDelta: dashboard.accountMonthChanges[account.id] ?? 0,
      interestRate: account.currentInterestRate?.toString() ?? null,
    })),
  );

  return (
    <div className="app-page">
      <div className="space-y-1">
        <h1 className="page-title">Счета</h1>
        <p className="page-subtitle">Баланс, динамика за месяц и структура капитала.</p>
      </div>

      <Card>
        <CardContent className="p-6">
          <p className="muted-text text-sm">Общий капитал</p>
          <p className="strong-text mt-3 text-4xl font-semibold tracking-[-0.04em]">{formatCurrency(dashboard.totalCapital)}</p>
        </CardContent>
      </Card>

      <div className="grid gap-4 xl:grid-cols-[1.05fr_0.95fr]">
        <AccountsList accounts={accounts} />
        <div className="space-y-4">
          <ChartCard title="Состав капитала" description="Распределение по счетам">
            <CompositionPieChart data={dashboard.accountComposition} />
          </ChartCard>
        </div>
      </div>
    </div>
  );
}
