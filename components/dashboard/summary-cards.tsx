import { formatExpenseRubles, formatRubles } from "@/lib/utils/formatters";
import type { ReactNode } from "react";

interface SummaryCardsProps {
  monthlyExpenses: number;
  monthlyBudget: number | null;
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

export function SummaryCards({ monthlyExpenses, monthlyBudget }: SummaryCardsProps) {
  const leftToSpend = monthlyBudget === null ? null : monthlyBudget - monthlyExpenses;

  return (
    <div className="space-y-3">
      <Surface className="py-8 text-center">
        <p className="text-6xl font-medium leading-none tracking-[-0.02em] text-white">{formatExpenseRubles(monthlyExpenses)}</p>
        <p className="mt-2 text-base font-medium text-[#A1A1A6]">Расходы за месяц</p>
      </Surface>

      <div className="grid grid-cols-2 gap-3">
        <Surface>
          <p className="text-sm font-medium text-[#A1A1A6]">Бюджет на месяц</p>
          <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-medium leading-none tracking-tight text-white">
            {monthlyBudget === null ? "Не задан" : formatRubles(monthlyBudget)}
          </p>
        </Surface>

        <Surface>
          <p className="text-sm font-medium text-[#A1A1A6]">Осталось до конца</p>
          <p className="mt-2 overflow-hidden text-ellipsis whitespace-nowrap text-2xl font-medium leading-none tracking-tight text-white">
            {leftToSpend === null ? "—" : `${leftToSpend < 0 ? "-" : ""}${formatRubles(Math.abs(leftToSpend))}`}
          </p>
        </Surface>
      </div>
    </div>
  );
}
