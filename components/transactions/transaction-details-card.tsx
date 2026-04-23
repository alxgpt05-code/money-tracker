import { ArrowRightLeft, CalendarDays } from "lucide-react";
import { transactionTypeLabels } from "@/lib/constants/finance";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatFullDate } from "@/lib/formatters/date";

export function TransactionDetailsCard({
  item,
}: {
  item: {
    type: keyof typeof transactionTypeLabels;
    amount: { toString(): string };
    note: string | null;
    transactionDate: Date;
    walletName: string;
    sourceAccount?: { name: string } | null;
    destinationAccount?: { name: string } | null;
    category?: { name: string } | null;
  };
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Карточка операции</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={item.type === "EXPENSE" ? "negative" : "positive"}>{transactionTypeLabels[item.type]}</Badge>
              <Badge tone="muted">{item.walletName}</Badge>
              {item.category ? <Badge tone="default">{item.category.name}</Badge> : null}
            </div>
            <p className="strong-text mt-3 text-2xl font-semibold tracking-tight">{formatCurrency(item.amount.toString())}</p>
          </div>
          <div className="muted-text glass-button rounded-[24px] p-3">
            <CalendarDays className="h-4 w-4" />
          </div>
        </div>
        <div className="panel rounded-[24px] p-4">
          <p className="strong-text text-sm font-medium">{item.note ?? "Без комментария"}</p>
          <p className="muted-text mt-2 text-sm">
            {item.sourceAccount?.name ?? "Источник"} <ArrowRightLeft className="mx-1 inline h-3 w-3" /> {item.destinationAccount?.name ?? "Назначение"}
          </p>
          <p className="muted-text mt-3 text-xs">{formatFullDate(item.transactionDate)}</p>
        </div>
      </CardContent>
    </Card>
  );
}
