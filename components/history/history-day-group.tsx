"use client";

import type { ExpenseHistoryItem } from "@/types/expense";
import { formatWeekdayShortUtc } from "@/lib/utils/formatters";
import { HistoryItem } from "@/components/history/history-item";

interface HistoryDayGroupProps {
  dateKey: string;
  items: ExpenseHistoryItem[];
  onEdit: (item: ExpenseHistoryItem) => void;
  onRequestDelete: (item: ExpenseHistoryItem) => void;
  deletingExpenseId?: string | null;
}

function formatGroupTitle(dateKey: string): string {
  const [yearRaw, monthRaw, dayRaw] = dateKey.split("-");
  const year = Number(yearRaw);
  const month = Number(monthRaw);
  const day = Number(dayRaw);
  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return "—";
  }

  const date = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (!Number.isFinite(date.getTime())) {
    return "—";
  }
  const dayNumber = date.getUTCDate();
  const weekday = formatWeekdayShortUtc(date).toUpperCase();
  return `${dayNumber} — ${weekday}`;
}

export function HistoryDayGroup({ dateKey, items, onEdit, onRequestDelete, deletingExpenseId = null }: HistoryDayGroupProps) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-base font-medium leading-none tracking-tight text-white/50">
        {formatGroupTitle(dateKey)}
      </h2>

      <div className="space-y-2.5">
        {items.map((item) => (
          <HistoryItem
            key={item.id}
            item={item}
            onEdit={onEdit}
            onRequestDelete={onRequestDelete}
            isDeleting={deletingExpenseId === item.id}
          />
        ))}
      </div>
    </section>
  );
}
