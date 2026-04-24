import { formatExpenseRubles, formatRubles } from "@/lib/utils/formatters";
import type { DashboardMonthData } from "@/types/expense";
import type { ReactNode } from "react";

interface SummaryCardsProps {
  monthlyExpenses: number;
  monthlyBudget: number | null;
  monthData: DashboardMonthData;
  previousMonthData: DashboardMonthData | null;
  isCurrentMonth: boolean;
}

function Surface({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <section
      className={`rounded-[28px] border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015)_35%,rgba(12,12,13,0.94))] p-5 shadow-[0_20px_44px_rgba(0,0,0,0.42)] ${className ?? ""}`}
    >
      {children}
    </section>
  );
}

function roundMoney(value: number): number {
  return Math.round(value);
}

function clampPercent(value: number): number {
  if (!Number.isFinite(value)) return 0;
  return Math.round(Math.abs(value));
}

export function SummaryCards({
  monthlyExpenses,
  monthlyBudget,
  monthData,
  previousMonthData,
  isCurrentMonth,
}: SummaryCardsProps) {
  const daysInMonth = Math.max(monthData.dailyExpenses.length, 1);
  const now = new Date();
  const elapsedDays = isCurrentMonth ? Math.min(Math.max(now.getDate(), 1), daysInMonth) : daysInMonth;

  const dailyPlan = monthlyBudget === null ? 0 : roundMoney(monthlyBudget / daysInMonth);
  const averagePerDay = roundMoney(monthlyExpenses / Math.max(elapsedDays, 1));

  const spentElapsed = monthData.dailyExpenses
    .slice(0, elapsedDays)
    .reduce((sum, point) => sum + point.amount, 0);
  const joyAmount = monthlyBudget === null
    ? 0
    : Math.max(0, roundMoney(dailyPlan * elapsedDays - spentElapsed));

  const previousAveragePerDay = previousMonthData
    ? roundMoney(previousMonthData.totalExpenses / Math.max(previousMonthData.dailyExpenses.length, 1))
    : 0;
  const averageDiffRatio = previousAveragePerDay > 0
    ? (averagePerDay - previousAveragePerDay) / previousAveragePerDay
    : 0;
  const trendPercent = clampPercent(averageDiffRatio * 100);
  const trendState = previousAveragePerDay <= 0 || trendPercent === 0
    ? "neutral"
    : averageDiffRatio > 0
      ? "up"
      : "down";

  return (
    <div className="space-y-3">
      <Surface className="py-8 text-center">
        <p className="text-6xl font-medium leading-none tracking-[-0.02em] text-white">{formatExpenseRubles(monthlyExpenses)}</p>
        <p className="mt-2 text-base font-medium text-[#A1A1A6]">Расходы за месяц</p>
      </Surface>

      <div className="grid grid-cols-3 gap-3">
        <Surface>
          <p className="text-sm font-medium text-[#A1A1A6]">На день по плану</p>
          <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-[2.05rem] font-medium leading-none tracking-tight text-[#9BE274]">
            {formatRubles(dailyPlan)}
          </p>
        </Surface>

        <Surface className="relative">
          <p className="text-sm font-medium text-[#A1A1A6]">Средний расход в день</p>
          <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-[2.05rem] font-medium leading-none tracking-tight text-[#9BE274]">
            {formatRubles(averagePerDay)}
          </p>
          <span
            className={`absolute right-5 top-4 text-[1.75rem] font-medium leading-none ${
              trendState === "up" ? "text-[#E785BD]" : trendState === "down" ? "text-[#9BE274]" : "text-[#A1A1A6]"
            }`}
          >
            {trendState === "up" ? `↑ ${trendPercent}%` : trendState === "down" ? `↓ ${trendPercent}%` : "0%"}
          </span>
        </Surface>

        <Surface>
          <p className="text-sm font-medium text-[#A1A1A6]">На радости</p>
          <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-[2.05rem] font-medium leading-none tracking-tight text-[#9BE274]">
            {formatRubles(joyAmount)}
          </p>
        </Surface>
      </div>
    </div>
  );
}
