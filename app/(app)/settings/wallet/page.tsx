import { ArchiveWalletForm, CreateWalletForm, MonthlySnapshotForm, WalletSettingsForm } from "@/components/forms/settings-form";
import { WalletSummaryPanel } from "@/components/settings/wallet-settings-panel";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserContext } from "@/lib/auth/session";
import { formatCurrency, formatPercent } from "@/lib/formatters/currency";
import { formatMonthLabel } from "@/lib/formatters/date";
import { getAppData } from "@/lib/services/finance";

export default async function WalletSettingsPage() {
  const { user, activeWallet } = await requireUserContext();
  const data = await getAppData(user.id);
  const wallet = data.walletList.find((item) => item.id === activeWallet?.id) ?? data.walletList.find((item) => !item.isArchived) ?? null;

  if (!wallet) {
    return (
      <div className="app-page">
        <div className="space-y-1">
          <h1 className="page-title">Кошельки и настройки</h1>
          <p className="page-subtitle">Сначала создай первый кошелёк, потом появятся счета и аналитика.</p>
        </div>
        <EmptyState title="Кошельков пока нет" description="Создай первый кошелёк, чтобы начать вести личный капитал." />
        <CreateWalletForm />
      </div>
    );
  }

  const scopedData = await getAppData(user.id, { activeWalletId: wallet.id, scoped: true });
  const scopedWallet = scopedData.wallets[0];

  if (!scopedWallet) {
    return <EmptyState title="Активный кошелёк не найден" description="Выбери другой кошелёк в переключателе или создай новый." actionHref="/dashboard" actionLabel="На главную" />;
  }

  return (
    <div className="app-page">
      <div className="space-y-1">
        <h1 className="page-title">Кошельки и настройки</h1>
        <p className="page-subtitle">Переключение кошельков, стартовые суммы, график выплат и ставки.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <div className="space-y-4">
          <WalletSettingsForm
            wallet={{
              id: scopedWallet.id,
              name: scopedWallet.name,
              description: scopedWallet.description,
              trackingStartDate: scopedWallet.trackingStartDate.toISOString().slice(0, 10),
              salarySchedules: scopedWallet.salarySchedules.map((item) => ({
                ...item,
                amount: Number(item.amount),
              })),
              accounts: scopedWallet.accounts.map((account) => ({
                id: account.id,
                name: account.name,
                initialBalance: Number(account.initialBalance),
                currentInterestRate: account.currentInterestRate ? Number(account.currentInterestRate) : null,
              })),
            }}
          />
          <ArchiveWalletForm walletId={scopedWallet.id} />
          <CreateWalletForm />
        </div>

        <WalletSummaryPanel
          wallets={data.wallets.map((item) => ({
            id: item.id,
            name: item.name,
            description: item.description,
            isArchived: item.isArchived,
            salarySchedules: item.salarySchedules,
            accounts: item.accounts.map((account) => ({
              id: account.id,
              name: account.name,
              initialBalance: account.initialBalance,
              currentInterestRate: account.currentInterestRate,
            })),
          }))}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Ставки накопительного и вкладов</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {scopedWallet.accounts
              .filter((account) => account.currentInterestRate)
              .map((account) => (
                <div key={account.id} className="panel rounded-[24px] p-4">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="strong-text font-medium">{account.name}</p>
                      <p className="muted-text text-sm">{account.interestType}</p>
                    </div>
                    <Badge tone="positive">{formatPercent(account.currentInterestRate?.toString() ?? "0")}</Badge>
                  </div>
                  <div className="muted-text mt-3 space-y-2 text-sm">
                    {account.interestHistory.map((item) => (
                      <div key={item.id} className="flex items-center justify-between">
                        <span>{formatMonthLabel(item.effectiveFrom)}</span>
                        <span>{formatPercent(item.rate.toString())}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Фактические остатки по месяцу</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {scopedWallet.accounts.map((account) => {
              const latestSnapshot = scopedWallet.snapshots.find((snapshot) => snapshot.accountId === account.id);
              return (
                <div key={account.id} className="panel rounded-[24px] p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="strong-text font-medium">{account.name}</p>
                      <p className="muted-text text-sm">Расчётный остаток {formatCurrency(account.currentBalance.toString())}</p>
                    </div>
                    {latestSnapshot?.deviation ? <Badge tone={Number(latestSnapshot.deviation) >= 0 ? "positive" : "negative"}>{formatCurrency(latestSnapshot.deviation.toString())}</Badge> : null}
                  </div>
                  <div className="muted-text my-3 text-xs">
                    {latestSnapshot ? `Последний факт ${formatMonthLabel(latestSnapshot.monthDate)}: ${formatCurrency(latestSnapshot.actualBalance?.toString() ?? "0")}` : "Факт месяца ещё не заполнен"}
                  </div>
                  <MonthlySnapshotForm walletId={scopedWallet.id} accountId={account.id} />
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
