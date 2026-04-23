"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

interface MonthSwitcherProps {
  monthLabel: string;
  canPrev: boolean;
  canNext: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function MonthSwitcher({ monthLabel, canPrev, canNext, onPrev, onNext }: MonthSwitcherProps) {
  return (
    <div className="flex justify-center">
      <div className="flex items-center rounded-full border border-[#9BE274] px-1.5 py-1 text-white/95 shadow-[0_0_0_1px_rgba(155,226,116,0.08),0_8px_18px_rgba(0,0,0,0.3)]">
        <button
          type="button"
          onClick={onPrev}
          disabled={!canPrev}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[#CFEBC0] transition hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Предыдущий месяц"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <p className="min-w-[74px] whitespace-nowrap px-1 text-center text-base font-medium leading-none tracking-tight">{monthLabel}</p>

        <button
          type="button"
          onClick={onNext}
          disabled={!canNext}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[#CFEBC0] transition hover:bg-white/10 active:scale-95 disabled:cursor-not-allowed disabled:opacity-45"
          aria-label="Следующий месяц"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>
    </div>
  );
}
