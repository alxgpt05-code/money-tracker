"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AmountInputCard } from "@/components/add/amount-input-card";
import { MonthBudgetFullscreenModal } from "@/components/budget/month-budget-fullscreen-modal";
import { CategoryCloud } from "@/components/add/category-cloud";
import { CreateCategoryInput } from "@/components/add/create-category-input";
import { DateSwitcher } from "@/components/add/date-switcher";
import { MonthBudgetCard } from "@/components/add/month-budget-card";
import { SaveExpenseButton } from "@/components/add/save-expense-button";
import { BottomNav } from "@/components/shared/bottom-nav";
import {
  formatDateInputValue,
} from "@/lib/utils/formatters";
import type { ExpenseCategory, MonthlyBudget } from "@/types/expense";

function normalizeDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

export default function AddExpensePage() {
  const router = useRouter();
  const [selectedDate, setSelectedDate] = useState<Date>(() => normalizeDay(new Date()));
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [budget, setBudget] = useState<MonthlyBudget | null>(null);
  const [activeUserId, setActiveUserId] = useState<string>("");
  const [isBudgetModalOpen, setIsBudgetModalOpen] = useState(false);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [amountRaw, setAmountRaw] = useState("");
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryErrorText, setCategoryErrorText] = useState("");
  const [formErrorText, setFormErrorText] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    const loadAddData = async () => {
      const dateParam = formatDateInputValue(selectedDate);
      const response = await fetch(`/api/expenses/add-data?date=${encodeURIComponent(dateParam)}`);
      const payload = (await response.json()) as {
        ok: boolean;
        data?: {
          categories: ExpenseCategory[];
          budget: MonthlyBudget | null;
          defaultCategoryId: string | null;
          userId: string;
        };
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.data) {
        setFormErrorText(payload.error ?? "Не удалось загрузить данные");
        return;
      }

      setCategories(payload.data.categories);
      setBudget(payload.data.budget);
      setDefaultCategoryId(payload.data.defaultCategoryId);
      setActiveUserId(payload.data.userId);
      setSelectedCategoryId((prev) => {
        if (prev && payload.data!.categories.some((category) => category.id === prev)) {
          return prev;
        }
        return null;
      });
      setFormErrorText("");
    };

    loadAddData().catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[add:load:error]", error);
      }
      setFormErrorText("Не удалось загрузить данные");
    });
  }, [selectedDate]);

  const selectedYear = selectedDate.getFullYear();
  const selectedMonth = selectedDate.getMonth() + 1;

  const hasBudget = useMemo(() => {
    if (!budget) {
      return false;
    }

    return budget.year === selectedYear && budget.month === selectedMonth && budget.amount > 0;
  }, [budget, selectedMonth, selectedYear]);

  useEffect(() => {
    if (!activeUserId) {
      return;
    }

    // Автооткрытие на первом рендере и при смене месяца, если бюджет не задан
    // для userId + year + month в едином persistence layer.
    setIsBudgetModalOpen(!hasBudget);
  }, [activeUserId, hasBudget, selectedMonth, selectedYear]);

  const amount = useMemo(() => {
    const parsed = Number.parseInt(amountRaw || "0", 10);
    return Number.isFinite(parsed) ? parsed : 0;
  }, [amountRaw]);

  const handleSave = async () => {
    if (amount <= 0) {
      setFormErrorText("Введите сумму больше нуля");
      return;
    }

    const categoryId = selectedCategoryId || defaultCategoryId;
    if (!categoryId) {
      setFormErrorText("Не удалось определить категорию");
      return;
    }

    setIsSaving(true);
    setFormErrorText("");

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount,
          spentAt: selectedDate.toISOString(),
          categoryId,
        }),
      });
      const payload = (await response.json()) as { ok: boolean; error?: string };

      if (!response.ok || !payload.ok) {
        setFormErrorText(payload.error ?? "Не удалось сохранить трату");
        return;
      }

      router.push("/dashboard");
      router.refresh();
    } finally {
      setIsSaving(false);
    }
  };

  const handleCreateCategory = async () => {
    const response = await fetch("/api/expense-categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategoryName }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data?: { category: ExpenseCategory };
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.data?.category) {
      setCategoryErrorText(payload.error ?? "Не удалось создать категорию");
      return;
    }

    setCategories((prev) => [...prev, payload.data!.category]);
    setSelectedCategoryId(payload.data.category.id);
    setNewCategoryName("");
    setCategoryErrorText("");
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const response = await fetch(`/api/expense-categories/${categoryId}/archive`, { method: "POST" });
    const payload = (await response.json()) as { ok: boolean; error?: string };

    if (!response.ok || !payload.ok) {
      setCategoryErrorText(payload.error ?? "Не удалось удалить категорию");
      return;
    }

    const refreshResponse = await fetch("/api/expense-categories");
    const refreshPayload = (await refreshResponse.json()) as {
      ok: boolean;
      data?: { categories: ExpenseCategory[]; defaultCategoryId: string | null };
      error?: string;
    };

    if (!refreshResponse.ok || !refreshPayload.ok || !refreshPayload.data) {
      setCategoryErrorText(refreshPayload.error ?? "Не удалось обновить категории");
      return;
    }

    setCategories(refreshPayload.data.categories);
    setDefaultCategoryId(refreshPayload.data.defaultCategoryId);
    setCategoryErrorText("");

    if (selectedCategoryId === categoryId) {
      setSelectedCategoryId(refreshPayload.data.defaultCategoryId ?? null);
    }
  };

  const handleSaveMonthlyBudget = async (amountValue: number) => {
    const response = await fetch("/api/monthly-budgets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        year: selectedYear,
        month: selectedMonth,
        amount: amountValue,
      }),
    });
    const payload = (await response.json()) as {
      ok: boolean;
      data?: { budget: MonthlyBudget };
      error?: string;
    };

    if (!response.ok || !payload.ok || !payload.data?.budget) {
      throw new Error(payload.error ?? "Не удалось сохранить бюджет");
    }

    setBudget(payload.data.budget);
    setIsBudgetModalOpen(false);
    setFormErrorText("");
  };

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060607] text-white">
      <div className="mx-auto w-full max-w-[430px] px-3 pb-32 pt-6">
        <div className="space-y-3">
          <DateSwitcher
            date={selectedDate}
            onChange={(nextDate) => setSelectedDate(normalizeDay(nextDate))}
            onPrev={() => setSelectedDate((prev) => normalizeDay(new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() - 1)))}
            onNext={() => setSelectedDate((prev) => normalizeDay(new Date(prev.getFullYear(), prev.getMonth(), prev.getDate() + 1)))}
          />

          <MonthBudgetCard budget={budget} />

          <AmountInputCard amount={amount} rawValue={amountRaw} onRawValueChange={setAmountRaw} />

          <CategoryCloud
            categories={categories}
            selectedCategoryId={selectedCategoryId}
            onSelect={(categoryId) => {
              setSelectedCategoryId(categoryId);
              setFormErrorText("");
            }}
            onDelete={handleDeleteCategory}
          />

          <div className="pt-2">
            <CreateCategoryInput
              value={newCategoryName}
              onChange={(value) => {
                setNewCategoryName(value);
                setCategoryErrorText("");
              }}
              onCreate={handleCreateCategory}
              errorText={categoryErrorText}
            />
          </div>

          <div className="pt-2">
            <SaveExpenseButton disabled={isSaving} onClick={handleSave} />
            {formErrorText ? <p className="mt-2 text-center text-xs text-[#F6A3C7]">{formErrorText}</p> : null}
          </div>
        </div>
      </div>

      <BottomNav />

      {isBudgetModalOpen ? (
        <MonthBudgetFullscreenModal
          isOpen
          onClose={() => setIsBudgetModalOpen(false)}
          onSave={handleSaveMonthlyBudget}
        />
      ) : null}
    </main>
  );
}
