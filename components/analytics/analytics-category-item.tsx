"use client";

import { formatExpenseRubles } from "@/lib/utils/formatters";
import type { AnalyticsCategoryRow } from "@/components/analytics/analytics-chart";

interface AnalyticsCategoryItemProps {
  item: AnalyticsCategoryRow;
  isActive: boolean;
  onSelect: (categoryId: string) => void;
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

export function AnalyticsCategoryItem({ item, isActive, onSelect }: AnalyticsCategoryItemProps) {
  return (
    <button
      type="button"
      onClick={() => onSelect(item.categoryId)}
      className="w-full rounded-[24px] border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.045),rgba(255,255,255,0.016)_35%,rgba(12,12,13,0.94))] px-4 py-3 text-left shadow-[0_16px_36px_rgba(0,0,0,0.35)] transition-all duration-300 active:scale-[0.99]"
      style={{
        borderColor: isActive ? hexToRgba(item.color, 0.68) : undefined,
        boxShadow: isActive ? `0 0 0 1px ${hexToRgba(item.color, 0.32)}, 0 16px 36px rgba(0,0,0,0.35)` : undefined,
        backgroundColor: isActive ? hexToRgba(item.color, 0.07) : undefined,
      }}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-xs font-medium leading-none" style={{ color: item.color }}>
            {item.percentShare}%
          </p>
          <p className="mt-1 truncate text-[15px] font-medium text-white/90">{item.categoryName}</p>
        </div>

        <p className="whitespace-nowrap text-[2rem] font-medium leading-none tracking-tight text-white">
          {formatExpenseRubles(item.totalAmount)}
        </p>
      </div>
    </button>
  );
}
