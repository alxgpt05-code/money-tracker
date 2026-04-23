"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ExpenseForm } from "@/components/ui/expense-form";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { monthKey } from "@/lib/client/format";

type Category = { id: string; name: string; color: string };

export default function NewExpensePage() {
  const router = useRouter();
  const [month] = useState(monthKey());
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((response) => response.json())
      .then((data) => setCategories(data))
      .catch(() => setCategories([]));
  }, []);

  if (!categories.length) return <div className="card">Загрузка категорий...</div>;

  return (
    <div className="stack">
      <MonthSwitcher month={month} />
      <ExpenseForm
        categories={categories}
        onSubmit={async (payload) => {
          const response = await fetch("/api/expenses", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload)
          });

          if (!response.ok) throw new Error("save_failed");
          router.push("/dashboard");
        }}
      />
    </div>
  );
}
