"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, X } from "lucide-react";
import { DateSwitcher } from "@/components/add/date-switcher";
import type { ExpenseCategory, ExpenseHistoryItem } from "@/types/expense";
import { formatExpenseRubles, sanitizeNumericInput } from "@/lib/utils/formatters";

interface EditExpenseModalProps {
  isOpen: boolean;
  expense: ExpenseHistoryItem | null;
  categories: ExpenseCategory[];
  defaultCategoryId: string | null;
  onClose: () => void;
  onSave: (payload: { expenseId: string; amount: number; categoryId: string; spentAt: string }) => Promise<void>;
}

function normalizeDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export function EditExpenseModal({
  isOpen,
  expense,
  categories,
  defaultCategoryId,
  onClose,
  onSave,
}: EditExpenseModalProps) {
  const [selectedDate, setSelectedDate] = useState<Date>(() => normalizeDay(new Date()));
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [amountRaw, setAmountRaw] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!isOpen || !expense) {
      return;
    }

    const activeCategoryExists = categories.some((category) => category.id === expense.category.id);
    setSelectedDate(normalizeDay(new Date(expense.dateIso)));
    setAmountRaw(String(expense.amount));
    setSelectedCategoryId(activeCategoryExists ? expense.category.id : defaultCategoryId);
    setErrorText("");
  }, [categories, defaultCategoryId, expense, isOpen]);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  const amount = useMemo(() => {
    const parsed = Number.parseInt(amountRaw || "0", 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountRaw]);

  const selectedCategory = categories.find((category) => category.id === selectedCategoryId) ?? null;

  if (!isOpen || !expense) {
    return null;
  }

  return (
    <div className="fixed inset-0 z-[70] bg-black/55 backdrop-blur-xl" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center px-3 py-8">
        <section
          className="w-full max-w-[390px] rounded-[32px] border border-white/10 bg-[linear-gradient(160deg,rgba(40,40,44,0.85),rgba(21,21,24,0.82)_36%,rgba(14,14,16,0.88))] p-5 shadow-[0_32px_56px_rgba(0,0,0,0.55)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="flex justify-center">
            <DateSwitcher
              date={selectedDate}
              onChange={(nextDate) => setSelectedDate(normalizeDay(nextDate))}
              onPrev={() =>
                setSelectedDate((prev) => normalizeDay(new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1)))
              }
              onNext={() =>
                setSelectedDate((prev) => normalizeDay(new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1)))
              }
            />
          </div>

          <div className="mt-4 flex justify-center">
            <span className="inline-flex rounded-full bg-[#A9E67C] px-4 py-1.5 text-base font-medium leading-none text-[#182111]">
              {selectedCategory?.name ?? "Прочее"}
            </span>
          </div>

          <div className="mt-5">
            <p className="text-center text-sm font-medium text-white/60">Введите сумму ₽</p>
            <div className="relative mt-2">
              <input
                type="text"
                inputMode="numeric"
                value={amountRaw}
                onChange={(event) => {
                  setAmountRaw(sanitizeNumericInput(event.target.value));
                  setErrorText("");
                }}
                className="absolute inset-0 h-full w-full cursor-text rounded-2xl opacity-0"
                aria-label="Сумма траты"
              />
              <p className="select-none text-center text-6xl font-medium leading-none tracking-tight text-white">
                {amount > 0 ? formatExpenseRubles(amount) : "-0 ₽"}
              </p>
            </div>
          </div>

          <div className="mt-4 h-px bg-white/30" />

          <div className="mt-4 flex flex-wrap justify-center gap-2">
            {categories.map((category) => {
              const active = selectedCategoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => {
                    setSelectedCategoryId(category.id);
                    setErrorText("");
                  }}
                  className={`rounded-full border px-5 py-2 text-sm font-medium transition active:scale-95 ${
                    active
                      ? "border-[#9BE274] bg-[#11150D] text-white"
                      : "border-transparent bg-[#313237] text-white/90 hover:bg-[#3A3B40]"
                  }`}
                >
                  {category.name}
                </button>
              );
            })}
          </div>

          {errorText ? <p className="mt-3 text-center text-xs text-[#F6A3C7]">{errorText}</p> : null}

          <div className="mt-6 flex items-center justify-center gap-6">
            <button
              type="button"
              disabled={isSaving}
              onClick={async () => {
                const categoryId = selectedCategoryId || defaultCategoryId;
                if (amount <= 0) {
                  setErrorText("Введите сумму больше нуля");
                  return;
                }
                if (!categoryId) {
                  setErrorText("Выберите категорию");
                  return;
                }

                setIsSaving(true);
                setErrorText("");
                try {
                  await onSave({
                    expenseId: expense.id,
                    amount,
                    categoryId,
                    spentAt: selectedDate.toISOString(),
                  });
                } catch (error) {
                  setErrorText(error instanceof Error ? error.message : "Не удалось сохранить");
                } finally {
                  setIsSaving(false);
                }
              }}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#A9E67C] text-black transition hover:brightness-105 active:scale-95 disabled:opacity-60"
              aria-label="Сохранить изменения"
            >
              <Check className="h-8 w-8" />
            </button>

            <button
              type="button"
              disabled={isSaving}
              onClick={onClose}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-black/80 text-white transition hover:bg-black active:scale-95"
              aria-label="Закрыть без сохранения"
            >
              <X className="h-8 w-8" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
