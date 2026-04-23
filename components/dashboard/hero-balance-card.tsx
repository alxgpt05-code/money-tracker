import { TrendingUp } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters/currency";

export function HeroBalanceCard({
  totalCapital,
  monthCapitalChange,
}: {
  totalCapital: number;
  monthCapitalChange: number;
}) {
  return (
    <Card className="overflow-hidden border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(182,255,77,0.08),transparent_28%),linear-gradient(180deg,rgba(255,255,255,0.02),rgba(255,255,255,0)),rgba(11,18,13,0.78)]">
      <CardContent className="p-6">
        <div className="space-y-4">
          <p className="muted-text text-sm">Общий капитал</p>
          <div className="strong-text text-5xl font-semibold tracking-[-0.05em] sm:text-6xl">{formatCurrency(totalCapital)}</div>
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs text-primary">
            <TrendingUp className="h-3 w-3" />
            Изменение за месяц {formatCurrency(monthCapitalChange)}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
