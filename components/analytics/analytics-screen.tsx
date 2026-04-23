"use client";

import { useEffect, useMemo, useState } from "react";
import { AnalyticsCategoryList } from "@/components/analytics/analytics-category-list";
import { AnalyticsChart, type AnalyticsCategoryRow } from "@/components/analytics/analytics-chart";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { BottomNav } from "@/components/shared/bottom-nav";
import type { DashboardMockData, DashboardMonthData, ExpenseHistoryItem } from "@/types/expense";

interface AnalyticsScreenProps {
  data: DashboardMockData;
}

function resolveInitialMonthIndex(data: DashboardMockData): number {
  return Math.max(
    data.months.findIndex((month) => month.monthKey === data.currentMonthKey),
    0,
  );
}

function roundPercent(value: number): number {
  if (value >= 10) {
    return Math.round(value);
  }
  return Math.round(value * 10) / 10;
}

function buildCategoryRows(monthData: DashboardMonthData): {
  totalExpenses: number;
  rows: AnalyticsCategoryRow[];
} {
  const items: ExpenseHistoryItem[] = monthData.history.flatMap((group) => group.items);
  const totalExpenses = items.reduce((sum, item) => sum + item.amount, 0);

  if (totalExpenses <= 0) {
    return { totalExpenses: 0, rows: [] };
  }

  const grouped = new Map<string, AnalyticsCategoryRow>();

  for (const item of items) {
    const existing = grouped.get(item.category.id);
    if (existing) {
      existing.totalAmount += item.amount;
      continue;
    }

    grouped.set(item.category.id, {
      categoryId: item.category.id,
      categoryName: item.category.name,
      color: item.category.color ?? "#9AD97D",
      totalAmount: item.amount,
      percentShare: 0,
    });
  }

  const sortedRows = [...grouped.values()]
    .map((row) => ({
      ...row,
      percentShare: roundPercent((row.totalAmount / totalExpenses) * 100),
    }))
    .sort((a, b) => b.totalAmount - a.totalAmount);

  return { totalExpenses, rows: sortedRows };
}

export function AnalyticsScreen({ data }: AnalyticsScreenProps) {
  const [analyticsData, setAnalyticsData] = useState<DashboardMockData>(data);
  const [monthIndex, setMonthIndex] = useState(() => resolveInitialMonthIndex(data));
  const [activeCategoryId, setActiveCategoryId] = useState<string | null>(null);

  useEffect(() => {
    setAnalyticsData(data);
  }, [data]);

  useEffect(() => {
    setMonthIndex((prev) => {
      const previousMonthKey = analyticsData.months[prev]?.monthKey;
      if (previousMonthKey) {
        const sameIndex = analyticsData.months.findIndex((month) => month.monthKey === previousMonthKey);
        if (sameIndex >= 0) {
          return sameIndex;
        }
      }
      return resolveInitialMonthIndex(analyticsData);
    });
  }, [analyticsData]);

  const selectedMonth = analyticsData.months[monthIndex] ?? analyticsData.months[0];
  const canPrev = monthIndex > 0;
  const canNext = monthIndex < analyticsData.months.length - 1;

  const analytics = useMemo(() => buildCategoryRows(selectedMonth), [selectedMonth]);

  useEffect(() => {
    if (!activeCategoryId) {
      return;
    }

    const exists = analytics.rows.some((item) => item.categoryId === activeCategoryId);
    if (!exists) {
      setActiveCategoryId(null);
    }
  }, [activeCategoryId, analytics.rows]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060607] text-white">
      <div className="mx-auto w-full max-w-[430px] px-3 pb-32 pt-6">
        <div className="space-y-3">
          <MonthSwitcher
            monthLabel={selectedMonth.monthLabel}
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => canPrev && setMonthIndex((prev) => prev - 1)}
            onNext={() => canNext && setMonthIndex((prev) => prev + 1)}
          />

          {analytics.rows.length === 0 ? (
            <section className="rounded-[28px] border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015)_35%,rgba(12,12,13,0.94))] p-5 shadow-[0_20px_44px_rgba(0,0,0,0.42)]">
              <p className="text-sm text-[#8A8A90]">Нет данных за этот месяц.</p>
            </section>
          ) : (
            <>
              <AnalyticsChart
                totalExpenses={analytics.totalExpenses}
                items={analytics.rows}
                activeCategoryId={activeCategoryId}
                onSelectCategory={setActiveCategoryId}
              />
              <AnalyticsCategoryList
                items={analytics.rows}
                activeCategoryId={activeCategoryId}
                onSelectCategory={setActiveCategoryId}
              />
            </>
          )}
        </div>
      </div>

      <BottomNav />
    </main>
  );
}
