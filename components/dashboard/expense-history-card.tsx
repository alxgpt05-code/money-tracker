import Link from "next/link";
import type { DashboardMonthData } from "@/types/expense";
import { formatExpenseRubles } from "@/lib/utils/formatters";
import { getLocalDayKey, getUtcDayKey } from "@/lib/utils/expense-date";

interface ExpenseHistoryCardProps {
  monthData: DashboardMonthData;
  isCurrentMonth: boolean;
}

export function ExpenseHistoryCard({ monthData, isCurrentMonth }: ExpenseHistoryCardProps) {
  const today = new Date();
  const todayKey = getLocalDayKey(today);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayKey = getLocalDayKey(yesterday);

  const groups = monthData.history
    .filter((group) => {
      const groupDate = new Date(group.dateIso);
      if (!Number.isFinite(groupDate.getTime())) return false;
      const groupKey = getUtcDayKey(groupDate);
      return groupKey === todayKey || groupKey === yesterdayKey;
    })
    .map((group) => {
      const groupDate = new Date(group.dateIso);
      const groupKey = Number.isFinite(groupDate.getTime()) ? getUtcDayKey(groupDate) : "";
      const label = groupKey === todayKey ? "Сегодня" : "Вчера";

      return {
        ...group,
        label,
        items: [...group.items].sort((a, b) => b.dateIso.localeCompare(a.dateIso)),
      };
    })
    .sort((a, b) => {
      const aDate = new Date(a.dateIso);
      const bDate = new Date(b.dateIso);
      const aKey = Number.isFinite(aDate.getTime()) ? getUtcDayKey(aDate) : "";
      const bKey = Number.isFinite(bDate.getTime()) ? getUtcDayKey(bDate) : "";
      return bKey.localeCompare(aKey);
    });

  return (
    <section className="rounded-[28px] border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015)_35%,rgba(12,12,13,0.94))] p-4 shadow-[0_20px_44px_rgba(0,0,0,0.42)]">
      <h2 className="text-2xl font-medium leading-none tracking-tight text-white/85">История</h2>

      <div className="mt-2 divide-y divide-white/10">
        {groups.length === 0 ? (
          <div className="py-6">
            <p className="text-sm text-[#8A8A90]">
              {isCurrentMonth ? "За сегодня и вчера пока нет расходов." : "Для этого месяца нет preview-истории."}
            </p>
          </div>
        ) : null}
        {groups.map((group) => (
          <div key={group.id} className="py-3">
            <p className="mb-2 text-lg font-medium leading-none text-white/35">{group.label}</p>

            <div className="divide-y divide-white/10 rounded-2xl bg-[#151618]/50">
              {group.items.map((item) => (
                <div key={item.id} className="flex items-center justify-between px-3 py-2">
                  <p className="text-sm font-medium text-white/95">{item.category.name}</p>
                  <p className="whitespace-nowrap text-base font-medium leading-none text-white">{formatExpenseRubles(item.amount)}</p>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      <Link
        href="/history"
        className="mx-auto mt-2 block w-fit rounded-full bg-black px-8 py-3 text-base font-medium text-white transition hover:bg-black/80 active:scale-95"
      >
        Вся история
      </Link>
    </section>
  );
}
