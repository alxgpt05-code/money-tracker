"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { DashboardMonthData, MonthlyExpensePoint } from "@/types/expense";
import {
  formatDayAndWeekday,
  formatExpenseRubles,
  formatMonthShort,
} from "@/lib/utils/formatters";

interface ExpenseChartCardProps {
  monthData: DashboardMonthData;
  monthlySeries: MonthlyExpensePoint[];
}

const CHART_MODES = {
  DAYS: "days",
  MONTHS: "months",
} as const;

type ChartMode = (typeof CHART_MODES)[keyof typeof CHART_MODES];

function resolveBarHeight(value: number, maxValue: number): number {
  if (maxValue <= 0) {
    return 10;
  }

  return Math.max(10, Math.round((value / maxValue) * 140));
}

export function ExpenseChartCard({ monthData, monthlySeries }: ExpenseChartCardProps) {
  const [mode, setMode] = useState<ChartMode>(CHART_MODES.DAYS);
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(Math.max(monthData.dailyExpenses.length - 1, 0));
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number>(Math.max(monthlySeries.length - 1, 0));
  const dayScrollContainerRef = useRef<HTMLDivElement | null>(null);
  const dayItemRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const shouldAutoScrollDayRef = useRef(true);

  const lastDataDayIndex = useMemo(() => {
    for (let index = monthData.dailyExpenses.length - 1; index >= 0; index -= 1) {
      if (monthData.dailyExpenses[index]?.amount > 0) {
        return index;
      }
    }
    return -1;
  }, [monthData.dailyExpenses]);

  const maxScrollableDayIndex = useMemo(() => {
    const monthStart = new Date(monthData.monthStartIso);
    const now = new Date();
    const isCurrentMonth =
      monthStart.getFullYear() === now.getFullYear() && monthStart.getMonth() === now.getMonth();

    if (isCurrentMonth) {
      const todayIndex = Math.min(
        Math.max(now.getDate() - 1, 0),
        Math.max(monthData.dailyExpenses.length - 1, 0),
      );
      return Math.max(todayIndex, lastDataDayIndex);
    }

    return Math.max(monthData.dailyExpenses.length - 1, 0);
  }, [lastDataDayIndex, monthData.dailyExpenses.length, monthData.monthStartIso]);

  const resolveDayScrollLimit = useCallback(() => {
    const container = dayScrollContainerRef.current;
    const limitItem = dayItemRefs.current[maxScrollableDayIndex];
    if (!container || !limitItem) {
      return 0;
    }

    return Math.max(limitItem.offsetLeft + limitItem.offsetWidth - container.clientWidth, 0);
  }, [maxScrollableDayIndex]);

  useEffect(() => {
    const monthStart = new Date(monthData.monthStartIso);
    const now = new Date();
    const isCurrentMonth =
      monthStart.getFullYear() === now.getFullYear() && monthStart.getMonth() === now.getMonth();
    const initialDayIndex = isCurrentMonth
      ? Math.min(Math.max(now.getDate() - 1, 0), Math.max(monthData.dailyExpenses.length - 1, 0))
      : Math.max(monthData.dailyExpenses.length - 1, 0);

    shouldAutoScrollDayRef.current = true;
    setSelectedDayIndex(initialDayIndex);
    const currentMonthIndex = monthlySeries.findIndex((point) => point.monthStartIso === monthData.monthStartIso);
    setSelectedMonthIndex(currentMonthIndex >= 0 ? currentMonthIndex : Math.max(monthlySeries.length - 1, 0));
  }, [monthData, monthlySeries]);

  useEffect(() => {
    if (mode === CHART_MODES.DAYS) {
      shouldAutoScrollDayRef.current = true;
    }
  }, [mode]);

  useEffect(() => {
    if (mode !== CHART_MODES.DAYS || !shouldAutoScrollDayRef.current) {
      return;
    }

    const container = dayScrollContainerRef.current;
    const selectedItem = dayItemRefs.current[selectedDayIndex];
    if (!container || !selectedItem) {
      return;
    }

    const rafId = window.requestAnimationFrame(() => {
      const desiredLeft = Math.max(
        selectedItem.offsetLeft + selectedItem.offsetWidth - container.clientWidth,
        0,
      );
      const targetLeft = Math.min(desiredLeft, resolveDayScrollLimit());
      container.scrollTo({ left: targetLeft, behavior: "auto" });
      shouldAutoScrollDayRef.current = false;
    });

    return () => window.cancelAnimationFrame(rafId);
  }, [maxScrollableDayIndex, mode, monthData.monthStartIso, resolveDayScrollLimit, selectedDayIndex]);

  useEffect(() => {
    if (mode !== CHART_MODES.DAYS) {
      return;
    }

    const container = dayScrollContainerRef.current;
    if (!container) {
      return;
    }

    const clampScroll = () => {
      const maxScrollLeft = resolveDayScrollLimit();
      if (container.scrollLeft > maxScrollLeft) {
        container.scrollLeft = maxScrollLeft;
      }
    };

    clampScroll();

    container.addEventListener("scroll", clampScroll, { passive: true });
    window.addEventListener("resize", clampScroll);

    return () => {
      container.removeEventListener("scroll", clampScroll);
      window.removeEventListener("resize", clampScroll);
    };
  }, [maxScrollableDayIndex, mode, resolveDayScrollLimit]);

  const selectedDay = monthData.dailyExpenses[selectedDayIndex] ?? monthData.dailyExpenses[0];
  const selectedMonth = monthlySeries[selectedMonthIndex] ?? monthlySeries[0];

  const dayMax = useMemo(
    () => Math.max(...monthData.dailyExpenses.map((point) => point.amount), 1),
    [monthData.dailyExpenses],
  );

  const monthMax = useMemo(
    () => Math.max(...monthlySeries.map((point) => point.amount), 1),
    [monthlySeries],
  );

  const activeValue = mode === CHART_MODES.DAYS ? selectedDay?.amount ?? 0 : selectedMonth?.amount ?? 0;
  const activeLabel = mode === CHART_MODES.DAYS
    ? selectedDay
      ? formatDayAndWeekday(selectedDay.dateIso)
      : "-"
    : selectedMonth?.monthLabel ?? "-";

  return (
    <section className="rounded-[28px] border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015)_35%,rgba(12,12,13,0.94))] p-4 shadow-[0_20px_44px_rgba(0,0,0,0.42)]">
      <header className="mb-3 text-center">
        <p className="text-lg font-medium leading-none tracking-tight text-[#E785BD]">{formatExpenseRubles(activeValue)}</p>
        <p className="mt-1 text-sm font-medium text-[#A1A1A6]">{activeLabel}</p>
      </header>

      <div className="rounded-[20px] bg-[#111214]/70 px-2 pb-2 pt-1">
        {mode === CHART_MODES.DAYS ? (
          <div
            ref={dayScrollContainerRef}
            className="overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            <div
              className="grid items-end gap-x-2"
              style={{
                gridTemplateColumns: `repeat(${monthData.dailyExpenses.length}, minmax(0, 1fr))`,
                minWidth: `${Math.max(100, (monthData.dailyExpenses.length / 14) * 100)}%`,
              }}
            >
              {monthData.dailyExpenses.map((point, index) => {
                const isActive = index === selectedDayIndex;
                const isZero = point.amount === 0;
                const barHeight = isZero
                  ? (isActive ? 11 : 5)
                  : resolveBarHeight(point.amount, dayMax);
                const barWidth = isZero ? 2 : 12;
                const barColor = isZero
                  ? (isActive ? "#E785BD" : "rgba(169,230,124,0.28)")
                  : (isActive ? "#E785BD" : "#A9E67C");

                return (
                  <button
                    key={point.dateIso}
                    ref={(node) => {
                      dayItemRefs.current[index] = node;
                    }}
                    type="button"
                    onClick={() => setSelectedDayIndex(index)}
                    className="group flex flex-col items-center gap-2 rounded-xl py-1 transition active:scale-95"
                    aria-label={`День ${point.day}`}
                  >
                    <div className="flex h-[164px] items-end">
                      <div
                        className="rounded-full transition-colors"
                        style={{
                          width: `${barWidth}px`,
                          height: `${barHeight}px`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                    <div className="min-w-[18px] text-center leading-none">
                      <p className="text-xs font-medium text-[#8A8A90]">{String(point.day).padStart(2, "0")}</p>
                      <p className="mt-0.5 text-[11px] font-medium text-[#74747A]">{point.weekdayShort}</p>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-6 items-end gap-x-2">
            {monthlySeries.map((point, index) => {
              const isActive = index === selectedMonthIndex;
              const date = new Date(point.monthStartIso);
              return (
                <button
                  key={point.monthStartIso}
                  type="button"
                  onClick={() => setSelectedMonthIndex(index)}
                  className="group flex flex-col items-center gap-2 rounded-xl py-1 transition active:scale-95"
                  aria-label={point.monthLabel}
                >
                  <div className="flex h-[164px] items-end">
                    <div
                      className="w-[18px] rounded-full transition-colors"
                      style={{
                        height: `${resolveBarHeight(point.amount, monthMax)}px`,
                        backgroundColor: isActive ? "#E785BD" : "#A9E67C",
                      }}
                    />
                  </div>
                  <p className="text-xs font-medium text-[#85858C]">{formatMonthShort(date)}</p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      <div className="mt-3 grid grid-cols-2 rounded-full bg-[#1A1A1C] p-1">
        <button
          type="button"
          onClick={() => setMode(CHART_MODES.DAYS)}
          className={`rounded-full px-3 py-2 text-sm font-medium transition ${
            mode === CHART_MODES.DAYS ? "bg-black text-white" : "text-[#A1A1A6]"
          }`}
        >
          По дням
        </button>
        <button
          type="button"
          onClick={() => setMode(CHART_MODES.MONTHS)}
          className={`rounded-full px-3 py-2 text-sm font-medium transition ${
            mode === CHART_MODES.MONTHS ? "bg-black text-white" : "text-[#A1A1A6]"
          }`}
        >
          По месяцам
        </button>
      </div>
    </section>
  );
}
