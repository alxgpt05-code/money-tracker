"use client";

import { humanMonth } from "@/lib/client/format";

type Props = {
  month: string;
  onChange?: (value: string) => void;
};

function shiftMonth(month: string, step: number) {
  const [year, monthNum] = month.split("-").map(Number);
  const date = new Date(year, monthNum - 1 + step, 1);
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function shortRuMonth(month: string) {
  const text = humanMonth(month);
  const [title, year] = text.split(" ");
  const yy = String(year || "").slice(-2);
  return `${title.slice(0, 1).toUpperCase()}${title.slice(1)}'${yy}`;
}

export function MonthSwitcher({ month, onChange }: Props) {
  return (
    <div style={{ display: "grid", placeItems: "center" }}>
      <div className="month-chip">
        <button aria-label="Предыдущий месяц" onClick={() => onChange?.(shiftMonth(month, -1))} disabled={!onChange}>
          ‹
        </button>
        <span>{shortRuMonth(month)}</span>
        <button aria-label="Следующий месяц" onClick={() => onChange?.(shiftMonth(month, 1))} disabled={!onChange}>
          ›
        </button>
      </div>
    </div>
  );
}
