import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { forecastPeriodLabels } from "@/lib/constants/finance";
import { formatCurrency, formatPercent } from "@/lib/formatters/currency";

export function ForecastPanel({
  items,
}: {
  items: {
    period: keyof typeof forecastPeriodLabels;
    projectedCapital: number;
    averageMonthlyIncome: number;
    averageMonthlyExpense: number;
    expenseTrend: number;
  }[];
}) {
  return (
    <Card className="metric-card">
      <CardHeader>
        <CardTitle>Прогноз капитала</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {items.map((item) => (
          <div key={item.period} className="glass-panel rounded-[24px] p-4">
            <div className="flex items-center justify-between">
              <p className="strong-text font-medium">{forecastPeriodLabels[item.period]}</p>
              <Badge tone="positive">{formatPercent(item.expenseTrend * 100)}</Badge>
            </div>
            <p className="strong-text mt-3 text-2xl font-semibold tracking-tight">{formatCurrency(item.projectedCapital)}</p>
            <div className="muted-text mt-3 grid grid-cols-2 gap-2 text-xs">
              <span>Доход {formatCurrency(item.averageMonthlyIncome)}</span>
              <span>Расход {formatCurrency(item.averageMonthlyExpense)}</span>
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
