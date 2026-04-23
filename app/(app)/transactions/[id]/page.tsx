import { notFound } from "next/navigation";
import { TransactionDetailsCard } from "@/components/transactions/transaction-details-card";
import { TransactionForm } from "@/components/forms/transaction-form";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserContext } from "@/lib/auth/session";
import { getAppData } from "@/lib/services/finance";

export default async function TransactionEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { user, activeWallet } = await requireUserContext();
  const data = await getAppData(user.id, { activeWalletId: activeWallet?.id, scoped: true });
  if (!activeWallet) {
    return <EmptyState title="Нет активного кошелька" description="Выбери кошелёк, чтобы редактировать операции." actionHref="/settings/wallet" actionLabel="К настройкам" />;
  }
  const transaction = data.wallets
    .flatMap((wallet) => wallet.transactions.map((item) => ({ ...item, walletName: wallet.name })))
    .find((item) => item.id === id);

  if (!transaction) {
    notFound();
  }

  return (
    <div className="app-page">
      <div className="space-y-1">
        <h1 className="page-title">Редактирование операции</h1>
        <p className="page-subtitle">Измени данные или удали операцию. Балансы пересчитаются автоматически.</p>
      </div>

      <TransactionDetailsCard item={transaction} />

      <div className="mx-auto max-w-3xl">
        <TransactionForm
          wallets={data.wallets.map((wallet) => ({
            id: wallet.id,
            name: wallet.name,
            accounts: wallet.accounts.map((account) => ({ id: account.id, name: account.name, type: account.type, currentBalance: Number(account.currentBalance) })),
          }))}
          categories={data.categories.map((category) => ({ id: category.id, name: category.name, kind: category.kind }))}
          defaultWalletId={transaction.walletId}
          redirectTo="/transactions"
          initialValues={{
            id: transaction.id,
            walletId: transaction.walletId,
            sourceAccountId: transaction.sourceAccountId,
            destinationAccountId: transaction.destinationAccountId,
            categoryId: transaction.categoryId,
            type: transaction.type,
            amount: Number(transaction.amount),
            transactionDate: transaction.transactionDate.toISOString().slice(0, 10),
            note: transaction.note,
            isRecurring: transaction.isRecurring,
          }}
        />
      </div>
    </div>
  );
}
