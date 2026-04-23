import Link from "next/link";
import { CircleDollarSign, TrendingUp } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";

const actions = [
  { href: "/transactions/new?type=EXPENSE", label: "Расход", icon: CircleDollarSign, accent: "from-white/[0.03] via-white/[0.01] to-transparent" },
  { href: "/transactions/new?type=INCOME", label: "Доход", icon: TrendingUp, accent: "from-emerald-400/10 via-emerald-400/[0.03] to-transparent" },
];

export function QuickActions() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Быстро добавить</CardTitle>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        {actions.map((action) => {
          const Icon = action.icon;
          return (
            <Link
              key={action.href}
              href={action.href}
              className={cn(
                "glass-panel rounded-[24px] bg-gradient-to-br p-4 transition duration-200 hover:-translate-y-0.5 hover:border-white/10 active:scale-[0.98]",
                action.accent,
              )}
            >
              <div className="mb-6 inline-flex rounded-2xl border border-white/8 bg-black/20 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]">
                <Icon className="h-4 w-4" />
              </div>
              <div className="strong-text text-base font-medium">{action.label}</div>
              <div className="muted-text mt-1 text-xs">Открыть быстрый ввод</div>
            </Link>
          );
        })}
      </CardContent>
    </Card>
  );
}
