import Link from "next/link";
import { Plus } from "lucide-react";
import { accountTypeLabels } from "@/lib/constants/finance";
import { formatCurrency } from "@/lib/formatters/currency";

export function AccountBalanceGrid({
  accounts,
}: {
  accounts: {
    id: string;
    name: string;
    value: number;
    color: string;
    type: keyof typeof accountTypeLabels;
  }[];
}) {
  return (
    <section className="max-w-full">
      <div className="touch-carousel px-1 pb-1">
        <div className="touch-carousel-track">
          {accounts.map((account) => (
            <div key={account.id} className="panel w-[18rem] shrink-0 snap-start rounded-[28px] p-4 sm:p-5">
              <Link href={`/accounts/${account.id}`} className="block">
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex items-center gap-2">
                      <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: account.color }} />
                      <p className="strong-text font-medium">{account.name}</p>
                    </div>
                    <p className="muted-text text-xs">{accountTypeLabels[account.type]}</p>
                  </div>
                </div>

                <div className="strong-text text-3xl font-semibold tracking-[-0.04em]">{formatCurrency(account.value)}</div>
              </Link>

              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <Link
                  href={`/transactions/new?type=EXPENSE&accountId=${account.id}`}
                  className="glass-button flex h-11 items-center justify-center text-sm"
                >
                  − Расход
                </Link>
                <Link
                  href={`/transactions/new?type=INCOME&accountId=${account.id}`}
                  className="accent-button flex h-11 items-center justify-center text-sm"
                >
                  + Доход
                </Link>
              </div>
            </div>
          ))}

          <Link
            href="/settings/wallet"
            className="panel flex w-[18rem] shrink-0 snap-start flex-col items-center justify-center rounded-[28px] p-4 text-center sm:p-5"
          >
            <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-white/8 bg-black/20">
              <Plus className="h-5 w-5" />
            </div>
            <div className="strong-text text-base font-medium">Новый счёт</div>
            <div className="muted-text mt-1 text-sm">Добавить счёт в настройках кошелька</div>
          </Link>
        </div>
      </div>
    </section>
  );
}
