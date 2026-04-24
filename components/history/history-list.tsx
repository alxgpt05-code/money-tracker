"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { DeleteExpenseModal } from "@/components/history/delete-expense-modal";
import { MonthSwitcher } from "@/components/dashboard/month-switcher";
import { EditExpenseModal } from "@/components/history/edit-expense-modal";
import { HistoryDayGroup } from "@/components/history/history-day-group";
import { BottomNav } from "@/components/shared/bottom-nav";
import type { DashboardMockData, ExpenseCategory, ExpenseHistoryGroup, ExpenseHistoryItem } from "@/types/expense";
import { getUtcDayKey } from "@/lib/utils/expense-date";

interface HistoryListProps {
  data: DashboardMockData;
}

function resolveInitialMonthIndex(data: DashboardMockData): number {
  return Math.max(
    data.months.findIndex((month) => month.monthKey === data.currentMonthKey),
    0,
  );
}

function sortGroups(groups: ExpenseHistoryGroup[]): ExpenseHistoryGroup[] {
  return [...groups]
    .sort((a, b) => {
      const aDate = new Date(a.dateIso);
      const bDate = new Date(b.dateIso);
      const aKey = Number.isFinite(aDate.getTime()) ? getUtcDayKey(aDate) : "";
      const bKey = Number.isFinite(bDate.getTime()) ? getUtcDayKey(bDate) : "";
      return bKey.localeCompare(aKey);
    })
    .map((group) => ({
      ...group,
      items: [...group.items].sort((a, b) => b.dateIso.localeCompare(a.dateIso)),
    }));
}

export function HistoryList({ data }: HistoryListProps) {
  const router = useRouter();
  const [historyData, setHistoryData] = useState<DashboardMockData>(data);
  const [monthIndex, setMonthIndex] = useState(() => resolveInitialMonthIndex(data));
  const [editorCategories, setEditorCategories] = useState<ExpenseCategory[]>([]);
  const [defaultCategoryId, setDefaultCategoryId] = useState<string | null>(null);
  const [editingExpense, setEditingExpense] = useState<ExpenseHistoryItem | null>(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deletingExpense, setDeletingExpense] = useState<ExpenseHistoryItem | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [deletingExpenseId, setDeletingExpenseId] = useState<string | null>(null);
  const [isDeleteSubmitting, setIsDeleteSubmitting] = useState(false);

  useEffect(() => {
    setHistoryData(data);
  }, [data]);

  useEffect(() => {
    const loadCategories = async () => {
      const response = await fetch("/api/expense-categories");
      const payload = (await response.json()) as {
        ok: boolean;
        data?: { categories: ExpenseCategory[]; defaultCategoryId: string | null };
        error?: string;
      };

      if (!response.ok || !payload.ok || !payload.data) {
        if (process.env.NODE_ENV === "development") {
          console.error("[history:categories:error]", payload.error);
        }
        return;
      }

      setEditorCategories(payload.data.categories);
      setDefaultCategoryId(payload.data.defaultCategoryId);
    };

    loadCategories().catch((error) => {
      if (process.env.NODE_ENV === "development") {
        console.error("[history:categories:network]", error);
      }
    });
  }, []);

  useEffect(() => {
    setMonthIndex((prev) => {
      const prevMonthKey = historyData.months[prev]?.monthKey;
      if (prevMonthKey) {
        const sameMonthIndex = historyData.months.findIndex((month) => month.monthKey === prevMonthKey);
        if (sameMonthIndex >= 0) {
          return sameMonthIndex;
        }
      }

      return resolveInitialMonthIndex(historyData);
    });
  }, [historyData]);

  const selectedMonth = historyData.months[monthIndex] ?? historyData.months[0];
  const canPrev = monthIndex > 0;
  const canNext = monthIndex < historyData.months.length - 1;
  const groupedHistory = useMemo(() => sortGroups(selectedMonth.history), [selectedMonth.history]);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060607] text-white">
      <div className="mx-auto w-full max-w-[430px] px-3 pb-32 pt-safe-page">
        <div className="space-y-3">
          <MonthSwitcher
            monthLabel={selectedMonth.monthLabel}
            canPrev={canPrev}
            canNext={canNext}
            onPrev={() => canPrev && setMonthIndex((prev) => prev - 1)}
            onNext={() => canNext && setMonthIndex((prev) => prev + 1)}
          />

          {groupedHistory.length === 0 ? (
            <section className="rounded-[28px] border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015)_35%,rgba(12,12,13,0.94))] p-5 shadow-[0_20px_44px_rgba(0,0,0,0.42)]">
              <p className="text-sm text-[#8A8A90]">В выбранном месяце пока нет расходов.</p>
            </section>
          ) : (
            <div className="space-y-4">
              {groupedHistory.map((group) => (
                <HistoryDayGroup
                  key={group.id}
                  dateIso={group.dateIso}
                  items={group.items}
                  onEdit={(item) => {
                    setEditingExpense(item);
                    setIsEditModalOpen(true);
                  }}
                  onRequestDelete={(item) => {
                    setDeletingExpense(item);
                    setIsDeleteModalOpen(true);
                  }}
                  deletingExpenseId={deletingExpenseId}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      <EditExpenseModal
        isOpen={isEditModalOpen}
        expense={editingExpense}
        categories={editorCategories}
        defaultCategoryId={defaultCategoryId}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingExpense(null);
        }}
        onSave={async (payload) => {
          const response = await fetch(`/api/expenses/${payload.expenseId}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              amount: payload.amount,
              categoryId: payload.categoryId,
              spentAtDayKey: payload.spentAtDayKey,
            }),
          });
          const result = (await response.json()) as { ok: boolean; error?: string };

          if (!response.ok || !result.ok) {
            throw new Error(result.error ?? "Не удалось сохранить изменения");
          }

          router.refresh();
          setIsEditModalOpen(false);
          setEditingExpense(null);
        }}
      />

      <DeleteExpenseModal
        isOpen={isDeleteModalOpen}
        isDeleting={isDeleteSubmitting}
        onClose={() => {
          if (isDeleteSubmitting) {
            return;
          }
          setIsDeleteModalOpen(false);
          setDeletingExpense(null);
        }}
        onConfirm={async () => {
          if (!deletingExpense) {
            setIsDeleteModalOpen(false);
            return;
          }

          setIsDeleteSubmitting(true);
          setDeletingExpenseId(deletingExpense.id);
          setIsDeleteModalOpen(false);

          await new Promise((resolve) => setTimeout(resolve, 220));

          const response = await fetch(`/api/expenses/${deletingExpense.id}`, { method: "DELETE" });
          const result = (await response.json()) as { ok: boolean; error?: string };
          setDeletingExpenseId(null);
          setIsDeleteSubmitting(false);
          setDeletingExpense(null);

          if (!response.ok || !result.ok) {
            if (process.env.NODE_ENV === "development") {
              console.error("[history:delete:error]", result.error);
            }
            return;
          }

          router.refresh();
        }}
      />

      <BottomNav />
    </main>
  );
}
