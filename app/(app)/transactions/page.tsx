import { EmptyState } from "@/components/ui/empty-state";
import { TransactionDetailsCard } from "@/components/transactions/transaction-details-card";
import { TransactionFilters } from "@/components/transactions/transaction-filters";
import { TransactionsGroupedList } from "@/components/transactions/transactions-grouped-list";
import { requireUserContext } from "@/lib/auth/session";
import { buildHistoryData, getAppData } from "@/lib/services/finance";

export default async function TransactionsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { user, activeWallet } = await requireUserContext();
  const data = await getAppData(user.id, { activeWalletId: activeWallet?.id, scoped: true });
  if (!activeWallet) {
    return <EmptyState title="Нет активного кошелька" description="Выбери или создай кошелёк, чтобы работать с операциями." actionHref="/settings/wallet" actionLabel="Настроить кошелёк" />;
  }
  const items = buildHistoryData(data, params);
  const selected = params.selected ? items.find((item) => item.id === params.selected) : undefined;

  return (
    <div className="relative app-page">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-[260px] -z-10 bg-[radial-gradient(circle_at_top_right,rgba(182,255,77,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)),rgba(11,18,13,0.78)]" />

      <div className="relative space-y-5">
        <div className="overflow-hidden rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(182,255,77,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)),rgba(11,18,13,0.78)] p-4 sm:p-5">
          <div className="space-y-4">
            <div className="space-y-1">
              <h1 className="page-title">Операции</h1>
              <p className="page-subtitle">История, поиск и быстрый переход к редактированию.</p>
            </div>

            {params.success === "created" ? (
              <div className="glass-card rounded-[24px] border border-white/8 px-4 py-3 text-sm text-foreground">Операция успешно создана</div>
            ) : null}
            {params.success === "updated" ? (
              <div className="glass-card rounded-[24px] border border-white/8 px-4 py-3 text-sm text-foreground">Операция успешно обновлена</div>
            ) : null}
            {params.success === "deleted" ? (
              <div className="glass-card rounded-[24px] border border-white/8 px-4 py-3 text-sm text-foreground">Операция удалена</div>
            ) : null}

            <TransactionFilters
              accounts={data.wallets.flatMap((wallet) => wallet.accounts.map((account) => ({ id: account.id, name: account.name })))}
              categories={data.categories.map((category) => ({ id: category.id, name: category.name }))}
              params={params}
            />

            {selected ? <TransactionDetailsCard item={selected} /> : null}
          </div>
        </div>

        <div className="space-y-4">
          <TransactionsGroupedList items={items} selectedId={params.selected} />
        </div>
      </div>
    </div>
  );
}
