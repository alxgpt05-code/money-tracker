import Link from "next/link";
import { ArrowRightLeft } from "lucide-react";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { transactionTypeLabels } from "@/lib/constants/finance";
import { formatCurrency } from "@/lib/formatters/currency";
import { formatShortDate } from "@/lib/formatters/date";

export function LatestTransactionsPanel({
  items,
}: {
  items: {
    id: string;
    type: keyof typeof transactionTypeLabels;
    amount: { toString(): string };
    note: string | null;
    transactionDate: Date;
    sourceAccount?: { name: string } | null;
    destinationAccount?: { name: string } | null;
    category?: { name: string } | null;
  }[];
}) {
  if (items.length === 0) {
    return <EmptyState title="Операций пока нет" description="Добавь первую операцию, и здесь появится живая история движения денег." actionHref="/transactions/new" actionLabel="Добавить операцию" />;
  }

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between">
        <CardTitle>Последние операции</CardTitle>
        <Button asChild variant="ghost" size="sm">
          <Link href="/transactions">Все</Link>
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <Link
            key={item.id}
            href={`/transactions/${item.id}`}
            className="flex items-center justify-between gap-4 rounded-[24px] border border-white/8 bg-black/15 p-4 transition duration-200 hover:bg-white/[0.05]"
          >
            <div className="min-w-0 space-y-2">
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone={item.type === "EXPENSE" ? "negative" : "positive"}>{transactionTypeLabels[item.type]}</Badge>
                {item.category ? <Badge tone="muted">{item.category.name}</Badge> : null}
              </div>
              <div className="strong-text truncate font-medium">{item.note ?? "Без комментария"}</div>
              <div className="muted-text truncate text-xs">
                {item.sourceAccount?.name ?? "Источник"} <ArrowRightLeft className="mx-1 inline h-3 w-3" /> {item.destinationAccount?.name ?? "Назначение"}
              </div>
            </div>
            <div className="text-right">
              <div className="strong-text font-semibold">{formatCurrency(item.amount.toString())}</div>
              <div className="muted-text text-xs">{formatShortDate(item.transactionDate)}</div>
            </div>
          </Link>
        ))}
      </CardContent>
    </Card>
  );
}
