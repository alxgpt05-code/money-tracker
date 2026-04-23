import { AccountBalanceGrid } from "@/components/dashboard/account-balance-grid";
import { HeroBalanceCard } from "@/components/dashboard/hero-balance-card";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserContext } from "@/lib/auth/session";
import { buildDashboardData, getAppData } from "@/lib/services/finance";

export default async function DashboardPage() {
  const { user, activeWallet } = await requireUserContext();
  const data = await getAppData(user.id, { activeWalletId: activeWallet?.id, scoped: true });
  if (!activeWallet) {
    return <EmptyState title="Кошелёк ещё не создан" description="Создай первый кошелёк в настройках, и главная сразу наполнится данными." actionHref="/settings/wallet" actionLabel="Открыть настройки" />;
  }
  const dashboard = buildDashboardData(data);
  const activeWalletData = data.wallets[0];
  const accountCards = activeWalletData.accounts.map((account) => {
    return {
      id: account.id,
      name: account.name,
      value: dashboard.accountBalances[account.id] ?? Number(account.currentBalance),
      color: account.color,
      type: account.type,
    };
  });

  return (
    <div className="app-page">
      <div className="grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <HeroBalanceCard
          totalCapital={dashboard.totalCapital}
          monthCapitalChange={dashboard.monthCapitalChange}
        />
        <QuickActions />
      </div>

      <AccountBalanceGrid accounts={accountCards} />
    </div>
  );
}
