"use client";

import { useEffect, useMemo, useState } from "react";
import type { DashboardMockData } from "@/types/expense";
import { ExpenseChartCard } from "@/components/dashboard/expense-chart-card";
import { ExpenseHistoryCard } from "@/components/dashboard/expense-history-card";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { SummaryCards } from "@/components/dashboard/summary-cards";
import { BottomNav } from "@/components/shared/bottom-nav";

interface MobileDashboardScreenProps {
  data: DashboardMockData;
}

function resolveInitialIndex(data: DashboardMockData): number {
  return Math.max(
    data.months.findIndex((month) => month.monthKey === data.currentMonthKey),
    0,
  );
}

export function MobileDashboardScreen({ data }: MobileDashboardScreenProps) {
  const [dashboardData, setDashboardData] = useState<DashboardMockData>(data);
  const [monthIndex, setMonthIndex] = useState(() => resolveInitialIndex(data));

  useEffect(() => {
    setDashboardData(data);
  }, [data]);

  useEffect(() => {
    const nextIndex = resolveInitialIndex(dashboardData);
    setMonthIndex(nextIndex);
  }, [dashboardData]);

  const selectedMonth = dashboardData.months[monthIndex] ?? dashboardData.months[0];
  const canPrev = monthIndex > 0;
  const canNext = monthIndex < dashboardData.months.length - 1;

  const isCurrentMonth = useMemo(
    () => selectedMonth.monthKey === dashboardData.currentMonthKey,
    [dashboardData.currentMonthKey, selectedMonth.monthKey],
  );

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060607] text-white">
      <div className="mobile-screen-shell">
        <div className="space-y-3">
          <MonthSwitcher
            monthLabel={selectedMonth.monthLabel}
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => canPrev && setMonthIndex((prev) => prev - 1)}
            onNext={() => canNext && setMonthIndex((prev) => prev + 1)}
          />

          <SummaryCards
            monthlyExpenses={selectedMonth.totalExpenses}
            monthlyBudget={selectedMonth.budget}
            monthData={selectedMonth}
            previousMonthData={monthIndex > 0 ? dashboardData.months[monthIndex - 1] : null}
            isCurrentMonth={isCurrentMonth}
          />

          <ExpenseChartCard monthData={selectedMonth} monthlySeries={dashboardData.monthlyExpenses} />

          <ExpenseHistoryCard monthData={selectedMonth} isCurrentMonth={isCurrentMonth} />
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
