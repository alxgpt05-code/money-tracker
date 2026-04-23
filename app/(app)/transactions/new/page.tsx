import { TransactionType } from "@prisma/client";
import { TransactionForm } from "@/components/forms/transaction-form";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserContext } from "@/lib/auth/session";
import { getAppData } from "@/lib/services/finance";

export default async function NewTransactionPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | undefined>>;
}) {
  const params = await searchParams;
  const { user, activeWallet } = await requireUserContext();
  const data = await getAppData(user.id, { activeWalletId: activeWallet?.id, scoped: true });
  if (!activeWallet) {
    return <EmptyState title="Некуда сохранить операцию" description="Сначала создай активный кошелёк." actionHref="/settings/wallet" actionLabel="Открыть настройки" />;
  }
  const presetType = params.type && Object.values(TransactionType).includes(params.type as TransactionType) ? (params.type as TransactionType) : TransactionType.EXPENSE;
  const activeWalletData = data.wallets[0];
  const presetAccountId =
    params.accountId && activeWalletData?.accounts.some((account) => account.id === params.accountId)
      ? params.accountId
      : undefined;

  return (
    <div className="app-page overflow-x-hidden">
      <div className="space-y-1">
        <h1 className="page-title">Новая операция</h1>
        <p className="page-subtitle">Сначала сумма, потом счёт. Остальное только при необходимости.</p>
      </div>

      <div className="mx-auto w-full min-w-0 max-w-3xl">
        <TransactionForm
          wallets={data.wallets.map((wallet) => ({
            id: wallet.id,
            name: wallet.name,
            accounts: wallet.accounts.map((account) => ({ id: account.id, name: account.name, type: account.type, currentBalance: Number(account.currentBalance) })),
          }))}
          categories={data.categories.map((category) => ({ id: category.id, name: category.name, kind: category.kind }))}
          defaultWalletId={data.wallets[0]?.id ?? ""}
          redirectTo="/transactions"
          initialValues={{
            walletId: data.wallets[0]?.id ?? "",
            type: presetType,
            amount: 0,
            sourceAccountId: presetAccountId,
            transactionDate: new Date().toISOString().slice(0, 10),
          }}
        />
      </div>
    </div>
  );
}
