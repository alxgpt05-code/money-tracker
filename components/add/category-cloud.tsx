"use client";

import { useRef, useState } from "react";
import { X } from "lucide-react";
import type { ExpenseCategory } from "@/types/expense";

interface CategoryCloudProps {
  categories: ExpenseCategory[];
  selectedCategoryId: string | null;
  onSelect: (categoryId: string) => void;
  onDelete: (categoryId: string) => void;
}

const LONG_PRESS_MS = 500;

export function CategoryCloud({ categories, selectedCategoryId, onSelect, onDelete }: CategoryCloudProps) {
  const [deleteModeCategoryId, setDeleteModeCategoryId] = useState<string | null>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const longPressTriggeredRef = useRef(false);

  const clearTimer = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handlePointerDown = (categoryId: string) => {
    clearTimer();
    longPressTriggeredRef.current = false;

    timerRef.current = setTimeout(() => {
      setDeleteModeCategoryId(categoryId);
      longPressTriggeredRef.current = true;
    }, LONG_PRESS_MS);
  };

  const handlePointerUp = (categoryId: string) => {
    clearTimer();

    if (longPressTriggeredRef.current) {
      longPressTriggeredRef.current = false;
      return;
    }

    setDeleteModeCategoryId(null);
    onSelect(categoryId);
  };

  const handlePointerCancel = () => {
    clearTimer();
    longPressTriggeredRef.current = false;
  };

  return (
    <section className="flex flex-wrap gap-2">
      {categories.map((category) => {
        const active = selectedCategoryId === category.id;
        const inDeleteMode = deleteModeCategoryId === category.id;
        const canDelete = !category.isSystem;
        return (
          <div key={category.id} className="relative">
            <button
              type="button"
              onPointerDown={() => handlePointerDown(category.id)}
              onPointerUp={() => handlePointerUp(category.id)}
              onPointerLeave={handlePointerCancel}
              onPointerCancel={handlePointerCancel}
              onContextMenu={(event) => event.preventDefault()}
              onDragStart={(event) => event.preventDefault()}
              className={`rounded-full border px-5 py-2 text-sm font-medium transition active:scale-95 ${
                active
                  ? "border-[#9BE274] bg-[#11150D] text-white"
                  : "border-transparent bg-[#1C1D20] text-white/90 hover:bg-[#232427]"
              } ${inDeleteMode && canDelete ? "pr-10" : ""} select-none`}
              style={{
                WebkitUserSelect: "none",
                WebkitTouchCallout: "none",
                WebkitTapHighlightColor: "transparent",
              }}
            >
              <span className="pointer-events-none select-none">{category.name}</span>
            </button>

            {inDeleteMode && canDelete ? (
              <button
                type="button"
                onClick={(event) => {
                  event.stopPropagation();
                  setDeleteModeCategoryId(null);
                  onDelete(category.id);
                }}
                className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full border border-white/15 bg-[#2B1217] text-[#F6A3C7] transition hover:brightness-110 active:scale-95"
                aria-label={`Удалить категорию ${category.name}`}
              >
                <X className="h-3 w-3" />
              </button>
            ) : null}
          </div>
        );
      })}
    </section>
  );
}
