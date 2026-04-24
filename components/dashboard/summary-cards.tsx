import { formatExpenseRubles, formatRubles } from "@/lib/utils/formatters";
import type { DashboardMonthData } from "@/types/expense";
import type { ReactNode } from "react";
import { Gift, Shield, Sparkles, Target } from "lucide-react";

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
  const elapsedDays = isCurrentMonth
    ? Math.min(Math.max(now.getDate(), 1), daysInMonth)
    : daysInMonth;
  const remainingDaysIncludingToday = Math.max(daysInMonth - elapsedDays + 1, 1);
  const remainingBudget = monthlyBudget === null ? 0 : monthlyBudget - monthlyExpenses;

  const dailyPlan = monthlyBudget === null
    ? null
    : Math.max(0, roundMoney(remainingBudget / remainingDaysIncludingToday));
  const averagePerDay = roundMoney(monthlyExpenses / Math.max(elapsedDays, 1));

  const basePlanPerDay = monthlyBudget === null ? null : monthlyBudget / daysInMonth;
  const joyAmount = monthlyBudget === null || basePlanPerDay === null || remainingBudget <= 0
    ? null
    : roundMoney(
        monthData.dailyExpenses
          .slice(0, elapsedDays)
          .reduce((sum, point) => sum + Math.max(0, basePlanPerDay - point.amount), 0),
      );

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
        <Surface className="relative px-4 pb-4 pt-3.5">
          <div className="flex items-start gap-1 text-[#9BE274]">
            <Target className="h-8 w-8 stroke-[2.3]" />
            <Sparkles className="h-4 w-4 stroke-[2.2]" />
          </div>
          <p className="mt-2 text-[0.98rem] font-medium leading-[1.18] text-[#A1A1A6]">На день по плану</p>
          <p className="mt-3 whitespace-nowrap text-[clamp(2rem,5.1vw,2.45rem)] font-medium leading-none tracking-[-0.01em] text-[#9BE274]">
            {dailyPlan === null ? "—" : formatRubles(dailyPlan)}
          </p>
        </Surface>

        <Surface className="relative px-4 pb-4 pt-3.5">
          <div className="flex items-start gap-1 text-[#9BE274]">
            <Shield className="h-8 w-8 stroke-[2.3]" />
            <Sparkles className="h-4 w-4 stroke-[2.2]" />
          </div>
          <p className="mt-2 text-[0.98rem] font-medium leading-[1.18] text-[#A1A1A6]">Средний расход в день</p>
          <p className="mt-3 whitespace-nowrap text-[clamp(2rem,5.1vw,2.45rem)] font-medium leading-none tracking-[-0.01em] text-[#9BE274]">
            {formatRubles(averagePerDay)}
          </p>
          <span
            className={`absolute right-4 top-3 text-[1.05rem] font-medium leading-none ${
              trendState === "up" ? "text-[#E785BD]" : trendState === "down" ? "text-[#9BE274]" : "text-[#A1A1A6]"
            }`}
          >
            {trendState === "up" ? `↑ ${trendPercent}%` : trendState === "down" ? `↓ ${trendPercent}%` : "0%"}
          </span>
        </Surface>

        <Surface className="relative px-4 pb-4 pt-3.5">
          <div className="flex items-start gap-1 text-[#9BE274]">
            <Gift className="h-8 w-8 stroke-[2.3]" />
            <Sparkles className="h-4 w-4 stroke-[2.2]" />
          </div>
          <p className="mt-2 text-[0.98rem] font-medium leading-[1.18] text-[#A1A1A6]">На радости</p>
          <p className="mt-3 whitespace-nowrap text-[clamp(2rem,5.1vw,2.45rem)] font-medium leading-none tracking-[-0.01em] text-[#9BE274]">
            {joyAmount === null ? "—" : formatRubles(Math.max(0, joyAmount))}
          </p>
        </Surface>
      </div>
    </div>
  );
}
