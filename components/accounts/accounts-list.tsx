import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { accountTypeLabels } from "@/lib/constants/finance";
import { formatCurrency, formatPercent } from "@/lib/formatters/currency";

export function AccountsList({
  accounts,
}: {
  accounts: {
    id: string;
    name: string;
    type: keyof typeof accountTypeLabels;
    color: string;
    balance: number;
    monthlyDelta: number;
    interestRate?: string | null;
  }[];
}) {
  return (
    <div className="space-y-3">
      {accounts.map((account) => (
        <Card key={account.id} className="metric-card">
          <CardContent className="p-5">
            <Link href={`/accounts/${account.id}`} className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0 space-y-2">
                <div className="flex items-center gap-2">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: account.color }} />
                  <p className="strong-text truncate font-medium">{account.name}</p>
                  <Badge tone="muted">{accountTypeLabels[account.type]}</Badge>
                </div>
                <div className="strong-text text-2xl font-semibold tracking-tight">{formatCurrency(account.balance)}</div>
              </div>
              <div className="text-left sm:text-right">
                <div className="inline-flex items-center gap-1 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
                  <ArrowUpRight className="h-3 w-3" />
                  {formatCurrency(account.monthlyDelta)}
                </div>
                {account.interestRate ? <p className="muted-text mt-3 text-xs">Ставка {formatPercent(account.interestRate)}</p> : null}
              </div>
            </Link>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
