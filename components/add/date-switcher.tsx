"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { formatDayMonthTitle, formatMonthFull } from "@/lib/utils/formatters";

interface DateSwitcherProps {
  date: Date;
  onChange: (nextDate: Date) => void;
  onPrev: () => void;
  onNext: () => void;
}

interface CalendarCell {
  date: Date;
  isCurrentMonth: boolean;
}

const WEEKDAY_LABELS = ["пн", "вт", "ср", "чт", "пт", "сб", "вс"];

function normalizeDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, diff: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + diff, 1);
}

function buildCalendarCells(monthDate: Date): CalendarCell[] {
  const monthStart = startOfMonth(monthDate);
  const jsWeekday = monthStart.getDay();
  const mondayFirstOffset = (jsWeekday + 6) % 7;

  const gridStart = new Date(monthStart);
  gridStart.setDate(monthStart.getDate() - mondayFirstOffset);

  const cells: CalendarCell[] = [];

  for (let index = 0; index < 42; index += 1) {
    const cellDate = new Date(gridStart);
    cellDate.setDate(gridStart.getDate() + index);

    cells.push({
      date: cellDate,
      isCurrentMonth: cellDate.getMonth() === monthDate.getMonth(),
    });
  }

  return cells;
}

export function DateSwitcher({ date, onChange, onPrev, onNext }: DateSwitcherProps) {
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState<Date>(() => startOfMonth(date));
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setCalendarMonth(startOfMonth(date));
  }, [date]);

  useEffect(() => {
    if (!isCalendarOpen) {
      return;
    }

    const handlePointerDownOutside = (event: MouseEvent | TouchEvent) => {
      if (!wrapperRef.current) {
        return;
      }

      const target = event.target as Node | null;
      if (target && !wrapperRef.current.contains(target)) {
        setIsCalendarOpen(false);
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsCalendarOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDownOutside);
    document.addEventListener("touchstart", handlePointerDownOutside);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDownOutside);
      document.removeEventListener("touchstart", handlePointerDownOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isCalendarOpen]);

  const today = useMemo(() => normalizeDay(new Date()), []);
  const selectedDate = normalizeDay(date);
  const monthLabel = `${formatMonthFull(calendarMonth)} ${calendarMonth.getFullYear()}`;
  const calendarCells = useMemo(() => buildCalendarCells(calendarMonth), [calendarMonth]);

  return (
    <div ref={wrapperRef} className="relative flex justify-center">
      <div className="flex items-center rounded-full border border-[#9BE274] px-1.5 py-1 text-white shadow-[0_0_0_1px_rgba(155,226,116,0.08),0_8px_18px_rgba(0,0,0,0.3)]">
        <button
          type="button"
          onClick={onPrev}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[#CFEBC0] transition hover:bg-white/10 active:scale-95"
          aria-label="Предыдущий день"
        >
          <ChevronLeft className="h-3.5 w-3.5" />
        </button>

        <button
          type="button"
          onClick={() => setIsCalendarOpen((prev) => !prev)}
          className="min-w-[74px] whitespace-nowrap rounded-full px-1 py-0.5 text-center text-base font-medium leading-none tracking-tight text-white transition hover:bg-white/5 active:scale-[0.99]"
          aria-label="Открыть календарь"
        >
          {formatDayMonthTitle(date)}
        </button>

        <button
          type="button"
          onClick={onNext}
          className="flex h-6 w-6 items-center justify-center rounded-full text-[#CFEBC0] transition hover:bg-white/10 active:scale-95"
          aria-label="Следующий день"
        >
          <ChevronRight className="h-3.5 w-3.5" />
        </button>
      </div>

      {isCalendarOpen ? (
        <div className="absolute top-[calc(100%+10px)] z-30 w-[296px] rounded-3xl border border-white/10 bg-[linear-gradient(170deg,rgba(255,255,255,0.03),rgba(14,15,17,0.95)_35%,rgba(11,12,14,0.98))] p-4 shadow-[0_24px_44px_rgba(0,0,0,0.55)] backdrop-blur-xl">
          <div className="mb-3 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setCalendarMonth((prev) => addMonths(prev, -1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10"
              aria-label="Предыдущий месяц"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <p className="text-sm font-semibold text-white">{monthLabel}</p>
            <button
              type="button"
              onClick={() => setCalendarMonth((prev) => addMonths(prev, 1))}
              className="flex h-8 w-8 items-center justify-center rounded-full text-white/80 transition hover:bg-white/10"
              aria-label="Следующий месяц"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {WEEKDAY_LABELS.map((weekday) => (
              <div key={weekday} className="py-1 text-center text-[11px] font-medium uppercase text-white/45">
                {weekday}
              </div>
            ))}

            {calendarCells.map((cell) => {
              const normalized = normalizeDay(cell.date);
              const isSelected = normalized.getTime() === selectedDate.getTime();
              const isToday = normalized.getTime() === today.getTime();

              return (
                <button
                  key={cell.date.toISOString()}
                  type="button"
                  onClick={() => {
                    onChange(normalized);
                    setIsCalendarOpen(false);
                  }}
                  className={`flex h-9 items-center justify-center rounded-xl text-sm font-medium transition ${
                    isSelected
                      ? "bg-[#A9E67C] text-black"
                      : isToday
                        ? "border border-white/35 text-white"
                        : cell.isCurrentMonth
                          ? "text-white hover:bg-white/8"
                          : "text-white/35 hover:bg-white/6"
                  }`}
                >
                  {cell.date.getDate()}
                </button>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
