"use client";

import { Pencil, Trash2 } from "lucide-react";
import type { ExpenseHistoryItem as ExpenseHistoryItemType } from "@/types/expense";
import { formatExpenseRubles } from "@/lib/utils/formatters";

interface HistoryItemProps {
  item: ExpenseHistoryItemType;
  onEdit: (item: ExpenseHistoryItemType) => void;
  onRequestDelete: (item: ExpenseHistoryItemType) => void;
  isDeleting?: boolean;
}

function hexToRgba(hexColor: string, alpha: number): string {
  const normalized = hexColor.replace("#", "");
  const safe = normalized.length === 3
    ? normalized
        .split("")
        .map((char) => char + char)
        .join("")
    : normalized;

  if (!/^[0-9a-fA-F]{6}$/.test(safe)) {
    return `rgba(255,255,255,${alpha})`;
  }

  const red = Number.parseInt(safe.slice(0, 2), 16);
  const green = Number.parseInt(safe.slice(2, 4), 16);
  const blue = Number.parseInt(safe.slice(4, 6), 16);

  return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function HistoryItem({ item, onEdit, onRequestDelete, isDeleting = false }: HistoryItemProps) {
  const chipColor = item.category.color ?? "#A9E67C";

  return (
    <article
      className={`overflow-hidden rounded-[24px] border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.016)_35%,rgba(12,12,13,0.94))] shadow-[0_16px_36px_rgba(0,0,0,0.35)] transition-all duration-200 ${
        isDeleting ? "scale-[0.98] opacity-0" : "opacity-100"
      }`}
    >
      <div className="flex items-stretch">
        <div className="flex-1 px-4 py-3">
          <span
            className="inline-flex rounded-full border px-3 py-1 text-sm font-medium leading-none"
            style={{
              color: chipColor,
              borderColor: hexToRgba(chipColor, 0.5),
              backgroundColor: hexToRgba(chipColor, 0.2),
            }}
          >
            {item.category.name}
          </span>
          <p className="mt-2 whitespace-nowrap text-lg font-medium leading-none tracking-tight text-white/85">
            {formatExpenseRubles(item.amount)}
          </p>
        </div>

        <div className="flex w-[88px] flex-col bg-[rgba(255,255,255,0.03)]">
          <button
            type="button"
            onClick={() => onEdit(item)}
            className="flex flex-1 items-center justify-center text-white/90 transition hover:bg-[rgba(255,255,255,0.08)] active:scale-[0.98]"
            aria-label="Редактировать трату"
          >
            <Pencil className="h-5 w-5" />
          </button>
          <div className="h-px bg-white/10" />
          <button
            type="button"
            onClick={() => onRequestDelete(item)}
            className="flex flex-1 items-center justify-center text-white/78 transition hover:bg-[rgba(255,255,255,0.08)] active:scale-[0.98]"
            aria-label="Удалить трату"
          >
            <Trash2 className="h-5 w-5" />
          </button>
        </div>
      </div>
    </article>
  );
}
