"use client";

import type { ExpenseHistoryItem } from "@/types/expense";
import { formatWeekdayShort } from "@/lib/utils/formatters";
import { HistoryItem } from "@/components/history/history-item";

interface HistoryDayGroupProps {
  dateIso: string;
  items: ExpenseHistoryItem[];
  onEdit: (item: ExpenseHistoryItem) => void;
  onRequestDelete: (item: ExpenseHistoryItem) => void;
  deletingExpenseId?: string | null;
}

function formatGroupTitle(dateIso: string): string {
  const date = new Date(dateIso);
  const day = date.getDate();
  const weekday = formatWeekdayShort(date).toUpperCase();
  return `${day} — ${weekday}`;
}

export function HistoryDayGroup({ dateIso, items, onEdit, onRequestDelete, deletingExpenseId = null }: HistoryDayGroupProps) {
  return (
    <section>
      <h2 className="mb-2 px-1 text-base font-medium leading-none tracking-tight text-white/50">
        {formatGroupTitle(dateIso)}
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
