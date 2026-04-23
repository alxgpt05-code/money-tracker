import { ChartCard } from "@/components/charts/chart-card";
import { CapitalLineChart, CompositionPieChart, ExpenseBarChart, IncomeExpenseChart, PortfolioLineChart } from "@/components/charts/chart-wrappers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatCurrency } from "@/lib/formatters/currency";
import { EmptyState } from "@/components/ui/empty-state";
import { requireUserContext } from "@/lib/auth/session";
import { buildDashboardData, getAppData } from "@/lib/services/finance";

export default async function AnalyticsPage() {
  const { user, activeWallet } = await requireUserContext();
  const data = await getAppData(user.id, { activeWalletId: activeWallet?.id, scoped: true });
  if (!activeWallet) {
    return <EmptyState title="Нет активного кошелька" description="Аналитика появится после выбора кошелька." actionHref="/settings/wallet" actionLabel="Выбрать кошелёк" />;
  }
  const dashboard = buildDashboardData(data);

  const fixedVariableData = [
    { name: "Постоянные", value: dashboard.fixedExpenses, color: "#b6ff4d" },
    { name: "Переменные", value: dashboard.variableExpenses, color: "#8be9fd" },
  ];

  return (
    <div className="app-page">
      <div className="space-y-1">
        <h1 className="page-title">Аналитика</h1>
        <p className="page-subtitle">Тренды капитала, расходов и структуры счетов.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Линия общего капитала" description="Мягкая линия по месяцам">
          <CapitalLineChart data={dashboard.capitalHistory} />
        </ChartCard>
        <ChartCard title="Расходы по дням" description="Дневные расходы за текущий период">
          <ExpenseBarChart data={dashboard.dailySeries} />
        </ChartCard>
        <ChartCard title="Доходы и расходы" description="Сравнение потоков денег">
          <IncomeExpenseChart data={dashboard.dailySeries} />
        </ChartCard>
        <ChartCard title="Состав капитала по счетам" description="Текущая структура по балансам">
          <CompositionPieChart data={dashboard.accountComposition} />
        </ChartCard>
        <ChartCard title="Динамика портфеля" description="Отдельный график инвестиционного счёта">
          <PortfolioLineChart data={dashboard.portfolioTrend} />
        </ChartCard>
        <Card>
          <CardHeader>
            <CardTitle>Постоянные и переменные расходы</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {fixedVariableData.map((item) => (
                <div key={item.name} className="panel rounded-[24px] p-4">
                  <div className="mb-3 h-2 w-16 rounded-full" style={{ backgroundColor: item.color }} />
                  <p className="muted-text text-sm">{item.name}</p>
                  <p className="strong-text mt-2 text-2xl font-semibold tracking-tight">{formatCurrency(item.value)}</p>
                </div>
              ))}
            </div>
            <div className="panel overflow-hidden rounded-[24px] p-3">
              <div className="flex h-4 overflow-hidden rounded-full bg-white/6">
                <div className="rounded-full bg-primary" style={{ width: `${dashboard.expensesMonth ? (dashboard.fixedExpenses / dashboard.expensesMonth) * 100 : 0}%` }} />
                <div className="rounded-full bg-cyan-300" style={{ width: `${dashboard.expensesMonth ? (dashboard.variableExpenses / dashboard.expensesMonth) * 100 : 0}%` }} />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
