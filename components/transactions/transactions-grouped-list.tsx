import Link from "next/link";
import { format } from "date-fns";
import { ru } from "date-fns/locale";
import { deleteTransactionAction } from "@/lib/services/actions";
import { transactionTypeLabels } from "@/lib/constants/finance";
import { EmptyState } from "@/components/ui/empty-state";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters/currency";

function groupByDay<T extends { transactionDate: Date }>(items: T[]) {
  return items.reduce<Record<string, T[]>>((acc, item) => {
    const key = format(item.transactionDate, "yyyy-MM-dd");
    acc[key] ??= [];
    acc[key].push(item);
    return acc;
  }, {});
}

export function TransactionsGroupedList({
  items,
  selectedId,
}: {
  items: {
    id: string;
    note: string | null;
    type: keyof typeof transactionTypeLabels;
    amount: { toString(): string };
    transactionDate: Date;
    sourceAccount?: { name: string } | null;
    destinationAccount?: { name: string } | null;
    category?: { name: string } | null;
  }[];
  selectedId?: string;
}) {
  if (items.length === 0) {
    return <EmptyState title="Ничего не найдено" description="Измени фильтры или добавь новую операцию, чтобы наполнить историю." actionHref="/transactions/new" actionLabel="Новая операция" />;
  }

  const grouped = groupByDay(items);

  return (
    <div className="space-y-4">
      {Object.entries(grouped).map(([day, dayItems]) => (
        <Card key={day}>
          <CardHeader>
            <CardTitle className="text-base capitalize">{format(new Date(day), "d MMMM, EEEE", { locale: ru })}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {dayItems.map((item) => {
              const selected = selectedId === item.id;
              return (
                <div
                  key={item.id}
                  className={`rounded-[24px] border p-4 transition duration-200 ${selected ? "glass-card border-primary/20" : "glass-panel"}`}
                >
                  <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge tone={item.type === "EXPENSE" ? "negative" : "positive"}>{transactionTypeLabels[item.type]}</Badge>
                        {item.category ? <Badge tone="muted">{item.category.name}</Badge> : null}
                      </div>
                      <p className="strong-text truncate font-medium">{item.note ?? "Без комментария"}</p>
                      <p className="muted-text truncate text-sm">
                        {item.sourceAccount?.name ?? "Источник"} → {item.destinationAccount?.name ?? "Назначение"}
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center justify-end gap-2 self-end md:self-auto">
                      <div className="text-right md:min-w-[120px]">
                        <div className="strong-text text-lg font-semibold">{formatCurrency(item.amount.toString())}</div>
                      </div>
                      <Button asChild variant="ghost" size="sm">
                        <Link href={`/transactions/${item.id}`}>Открыть</Link>
                      </Button>
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/transactions/${item.id}`}>Изменить</Link>
                      </Button>
                      <form action={deleteTransactionAction}>
                        <input type="hidden" name="transactionId" value={item.id} />
                        <input type="hidden" name="redirectTo" value="/transactions" />
                        <Button variant="outline" size="sm">
                          Удалить
                        </Button>
                      </form>
                    </div>
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
