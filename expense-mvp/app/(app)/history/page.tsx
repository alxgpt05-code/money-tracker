"use client";

import { useEffect, useMemo, useState } from "react";
import { monthKey, rub } from "@/lib/client/format";
import { MonthSwitcher } from "@/components/ui/month-switcher";

type Category = { id: string; name: string; color: string };
type Expense = { id: string; amount: number; date: string; note?: string; category: Category };

function ruWeekday(dateString: string) {
  const text = new Intl.DateTimeFormat("ru-RU", { weekday: "long" }).format(new Date(dateString));
  return text.slice(0, 1).toUpperCase() + text.slice(1);
}

export default function HistoryPage() {
  const [month, setMonth] = useState(monthKey());
  const [rows, setRows] = useState<Record<string, Expense[]>>({});
  const [categories, setCategories] = useState<Category[]>([]);
  const [editing, setEditing] = useState<Expense | null>(null);

  async function load() {
    const historyResponse = await fetch("/api/history?month=" + month);
    const categoriesResponse = await fetch("/api/categories");

    if (historyResponse.ok) setRows(await historyResponse.json());
    if (categoriesResponse.ok) setCategories(await categoriesResponse.json());
  }

  useEffect(() => {
    load().catch(() => null);
  }, [month]);

  const keys = useMemo(() => Object.keys(rows), [rows]);

  return (
    <div className="stack">
      <MonthSwitcher month={month} onChange={setMonth} />

      {keys.map((dateKey) =>
        rows[dateKey].map((item) => (
          <button key={item.id} className="card history-item" style={{ border: "none" }} onClick={() => setEditing(item)}>
            <div>
              <span className="day-badge">{ruWeekday(dateKey)}</span>
              <div className="history-date">{new Date(dateKey).toLocaleDateString("ru-RU")}</div>
              <div className="history-amount">{rub(item.amount)}</div>
            </div>
            <div style={{ fontSize: 26 }}>Редактировать</div>
          </button>
        ))
      )}

      {editing ? (
        <EditCard
          item={editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={async () => {
            setEditing(null);
            await load();
          }}
        />
      ) : null}
    </div>
  );
}

function EditCard({ item, categories, onClose, onSaved }: { item: Expense; categories: Category[]; onClose: () => void; onSaved: () => Promise<void> }) {
  const [amount, setAmount] = useState(String(item.amount));
  const [categoryId, setCategoryId] = useState(item.category.id);
  const [date, setDate] = useState(item.date.slice(0, 10));
  const [note, setNote] = useState(item.note || "");

  async function save() {
    const response = await fetch("/api/expenses/" + item.id, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: Number(amount), categoryId, date, note })
    });

    if (response.ok) await onSaved();
  }

  async function remove() {
    const response = await fetch("/api/expenses/" + item.id, { method: "DELETE" });
    if (response.ok) await onSaved();
  }

  return (
    <div className="card stack" style={{ border: "1px solid #2f3340" }}>
      <div style={{ fontSize: 30 }}>Редактирование</div>
      <input className="input" value={amount} onChange={(event) => setAmount(event.target.value)} />
      <select className="select" value={categoryId} onChange={(event) => setCategoryId(event.target.value)}>
        {categories.map((category) => (
          <option key={category.id} value={category.id}>
            {category.name}
          </option>
        ))}
      </select>
      <input className="input" type="date" value={date} onChange={(event) => setDate(event.target.value)} />
      <textarea className="textarea" rows={3} value={note} onChange={(event) => setNote(event.target.value)} />
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 8 }}>
        <button className="button button-primary" onClick={save}>Сохранить</button>
        <button className="button button-ghost" onClick={onClose}>Закрыть</button>
        <button className="button" style={{ background: "#3a1f26", color: "#f8bfd0" }} onClick={remove}>Удалить</button>
      </div>
    </div>
  );
}
