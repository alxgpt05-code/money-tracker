"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Lock, Wallet } from "lucide-react";
import { formatRubles, sanitizeNumericInput } from "@/lib/utils/formatters";

interface MonthBudgetFullscreenModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (amount: number) => Promise<void> | void;
}

export function MonthBudgetFullscreenModal({ isOpen, onClose, onSave }: MonthBudgetFullscreenModalProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [rawValue, setRawValue] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    setRawValue("");
    setErrorText("");
    setIsSaving(false);

    const focusTimeout = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.click();
    }, 40);

    return () => window.clearTimeout(focusTimeout);
  }, [isOpen]);

  const amount = useMemo(() => {
    const parsed = Number.parseInt(rawValue || "0", 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [rawValue]);

  if (!isOpen) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[80] bg-black/50 backdrop-blur-xl">
      <div className="flex min-h-full items-center justify-center px-4 py-6">
        <section className="w-full max-w-sm rounded-3xl border border-white/15 bg-[linear-gradient(160deg,rgba(176,232,141,0.22),rgba(18,23,19,0.88)_35%,rgba(9,11,10,0.94))] px-6 py-8 text-white shadow-[0_28px_60px_rgba(0,0,0,0.5)]">
          <header className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-white/12">
                <Wallet className="h-5 w-5" />
              </span>
              <h2 className="text-2xl font-semibold tracking-tight">Введите бюджет на месяц</h2>
            </div>
            <Lock className="h-6 w-6 text-white/75" />
          </header>

          <p className="mt-2 text-sm text-white/65">Укажите сумму один раз для текущего месяца</p>

          <div className="relative mt-8 rounded-[20px] bg-white/8 px-4 py-5">
            <input
              ref={inputRef}
              type="text"
              inputMode="numeric"
              value={rawValue}
              onChange={(event) => {
                setRawValue(sanitizeNumericInput(event.target.value));
                setErrorText("");
              }}
              className="absolute inset-0 h-full w-full rounded-[20px] opacity-0"
              aria-label="Сумма бюджета"
            />
            <p
              className="overflow-hidden whitespace-nowrap text-ellipsis text-center font-medium leading-none tracking-tight tabular-nums"
              style={{ fontSize: "clamp(2rem, 8vw, 2.6rem)" }}
            >
              {formatRubles(amount)}
            </p>
          </div>

          <div className="mt-5 h-px bg-white/20" />

          <div className="mt-5 grid grid-cols-2 gap-3">
            <button
              type="button"
              disabled={isSaving}
              onClick={async () => {
                if (amount <= 0) {
                  setErrorText("Введите сумму больше нуля");
                  return;
                }

                setIsSaving(true);
                try {
                  await onSave(amount);
                } catch (error) {
                  const message = error instanceof Error ? error.message : "Не удалось сохранить бюджет";
                  setErrorText(message);
                } finally {
                  setIsSaving(false);
                }
              }}
              className="rounded-full bg-[#A9E67C] px-5 py-3 text-lg font-semibold text-black transition hover:brightness-110 active:scale-95 disabled:opacity-60"
            >
              Сохранить
            </button>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full border border-white/25 bg-white/5 px-5 py-3 text-lg font-medium text-white transition hover:bg-white/10 active:scale-95"
            >
              Закрыть
            </button>
          </div>

          {errorText ? <p className="mt-3 text-center text-sm text-[#F6A3C7]">{errorText}</p> : null}
        </section>
      </div>
    </div>
  );
}
