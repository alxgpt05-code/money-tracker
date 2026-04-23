import { Lock } from "lucide-react";
import type { MonthlyBudget } from "@/types/expense";
import { formatRubles } from "@/lib/utils/formatters";

interface MonthBudgetCardProps {
  budget: MonthlyBudget | null;
}

export function MonthBudgetCard({ budget }: MonthBudgetCardProps) {
  return (
    <section className="rounded-[24px] border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015)_35%,rgba(12,12,13,0.94))] px-5 py-4 shadow-[0_14px_32px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between gap-4">
        <p className="text-sm font-medium leading-tight text-[#A1A1A6]">Бюджет на месяц</p>

        <div className="flex items-center gap-2">
          {budget ? (
            <p className="text-lg font-medium leading-none tracking-tight text-[#7E7E83]">{formatRubles(budget.amount)}</p>
          ) : (
            <p className="text-sm font-medium text-[#7E7E83]">Бюджет не задан</p>
          )}
          <Lock className="h-5 w-5 text-[#8E8E93]" />
        </div>
      </div>
    </section>
  );
}
