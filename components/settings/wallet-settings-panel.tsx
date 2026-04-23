import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency, formatPercent } from "@/lib/formatters/currency";

export function WalletSummaryPanel({
  wallets,
}: {
  wallets: {
    id: string;
    name: string;
    description: string | null;
    isArchived?: boolean;
    salarySchedules: { title: string; dayOfMonth: number }[];
    accounts: { id: string; name: string; initialBalance: { toString(): string }; currentInterestRate?: { toString(): string } | null }[];
  }[];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Список кошельков</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {wallets.map((wallet) => (
          <div key={wallet.id} className="panel rounded-[24px] p-4">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="strong-text font-medium">{wallet.name}</p>
                <p className="muted-text text-sm">{wallet.description ?? "Без описания"}</p>
              </div>
              <Badge tone={wallet.isArchived ? "negative" : "muted"}>{wallet.isArchived ? "Архив" : "₽"}</Badge>
            </div>
            <div className="muted-text mt-3 grid gap-2 text-sm">
              <div>Стартовые суммы: {wallet.accounts.map((account) => `${account.name} ${formatCurrency(account.initialBalance.toString())}`).join(" · ")}</div>
              <div>Даты зарплаты: {wallet.salarySchedules.map((item) => `${item.title} ${item.dayOfMonth}`).join(" · ")}</div>
              <div>
                Ставки:{" "}
                {wallet.accounts
                  .filter((account) => account.currentInterestRate)
                  .map((account) => `${account.name} ${formatPercent(account.currentInterestRate?.toString() ?? "0")}`)
                  .join(" · ") || "нет"}
              </div>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
