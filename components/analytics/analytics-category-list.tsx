"use client";

import { AnalyticsCategoryItem } from "@/components/analytics/analytics-category-item";
import type { AnalyticsCategoryRow } from "@/components/analytics/analytics-chart";

interface AnalyticsCategoryListProps {
  items: AnalyticsCategoryRow[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

export function AnalyticsCategoryList({ items, activeCategoryId, onSelectCategory }: AnalyticsCategoryListProps) {
  return (
    <section className="space-y-2.5">
      {items.map((item) => (
        <AnalyticsCategoryItem
          key={item.categoryId}
          item={item}
          isActive={activeCategoryId === item.categoryId}
          onSelect={onSelectCategory}
        />
      ))}
    </section>
  );
}
