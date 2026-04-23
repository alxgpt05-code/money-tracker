"use client";

import { formatExpenseRubles, sanitizeNumericInput } from "@/lib/utils/formatters";

interface AmountInputCardProps {
  amount: number;
  rawValue: string;
  onRawValueChange: (next: string) => void;
}

export function AmountInputCard({ amount, rawValue, onRawValueChange }: AmountInputCardProps) {
  return (
    <section className="rounded-[28px] border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015)_35%,rgba(12,12,13,0.94))] p-5 shadow-[0_20px_44px_rgba(0,0,0,0.42)]">
      <p className="text-sm font-medium text-[#A1A1A6]">Введите сумму ₽</p>

      <div className="relative mt-3 rounded-2xl bg-[#111214]/60 px-4 py-5">
        <input
          type="text"
          inputMode="numeric"
          value={rawValue}
          onChange={(event) => onRawValueChange(sanitizeNumericInput(event.target.value))}
          className="absolute inset-0 h-full w-full cursor-text rounded-2xl opacity-0"
          aria-label="Сумма расхода"
        />
        <p className="text-center text-6xl font-medium leading-none tracking-tight text-white">
          {amount > 0 ? formatExpenseRubles(amount) : "-0 ₽"}
        </p>
      </div>
    </section>
  );
}
