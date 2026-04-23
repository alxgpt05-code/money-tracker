import { ArrowDownRight, ArrowUpRight } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { formatCompactCurrency, formatCurrency } from "@/lib/formatters/currency";

export function StatCard({
  title,
  value,
  delta,
  compact = false,
}: {
  title: string;
  value: number;
  delta?: number;
  compact?: boolean;
}) {
  const isPositive = (delta ?? 0) >= 0;
  return (
    <Card className="metric-card overflow-hidden">
      <CardHeader>
        <CardTitle className="muted-text text-sm">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="strong-text text-3xl font-semibold tracking-tight">
          {compact ? formatCompactCurrency(value) : formatCurrency(value)}
        </div>
        {typeof delta === "number" ? (
          <Badge tone={isPositive ? "positive" : "negative"} className="gap-1">
            {isPositive ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
            {formatCurrency(delta)}
          </Badge>
        ) : null}
      </CardContent>
    </Card>
  );
}
