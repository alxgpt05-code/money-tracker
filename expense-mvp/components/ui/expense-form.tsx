"use client";

import { FormEvent, useMemo, useState } from "react";

type Category = {
  id: string;
  name: string;
  color: string;
};

type ExpensePayload = {
  amount: number;
  categoryId: string;
  date: string;
  note?: string;
};

type Props = {
  categories: Category[];
  initial?: ExpensePayload;
  submitLabel?: string;
  onSubmit: (payload: ExpensePayload) => Promise<void>;
};

export function ExpenseForm({ categories, initial, submitLabel = "Сохранить", onSubmit }: Props) {
  const [amount, setAmount] = useState(initial?.amount ? String(initial.amount) : "");
  const [categoryId, setCategoryId] = useState(initial?.categoryId || categories[0]?.id || "");
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [note, setNote] = useState(initial?.note || "");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const selected = useMemo(() => categories.find((item) => item.id === categoryId), [categories, categoryId]);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setLoading(true);
    setError("");

    try {
      await onSubmit({ amount: Number(amount), categoryId, date, note });
    } catch {
      setError("Не удалось сохранить. Проверьте данные.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="stack" onSubmit={handleSubmit}>
      <div className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: 10, paddingBottom: 10 }}>
        <div>
          <div className="muted" style={{ fontSize: 16 }}>Бюджет на месяц</div>
          <div style={{ fontSize: 30, color: "#60646f" }}>55 000 ₽</div>
        </div>
        <span style={{ fontSize: 28, color: "#d0d2d8" }}>⌂</span>
      </div>

      <div className="card" style={{ paddingBottom: 18 }}>
        <div className="muted" style={{ fontSize: 16 }}>Введите сумму ₽</div>
        <input
          className="input"
          inputMode="decimal"
          required
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          style={{ fontSize: 60, borderRadius: 16, background: "transparent", padding: "8px 0 0", border: "none" }}
        />
      </div>

      <div className="category-grid">
        {categories.map((category) => {
          const active = category.id === categoryId;
          return (
            <button
              key={category.id}
              type="button"
              className={`pill ${active ? "active" : ""}`}
              onClick={() => setCategoryId(category.id)}
              style={{ fontSize: 16 }}
            >
              {category.name}
            </button>
          );
        })}
      </div>

      <div className="create-row">
        <span>Создать категорию</span>
        <button type="button" className="fab-plus" aria-label="Добавить">
          +
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8 }}>
        <button className="button button-primary" disabled={loading}>
          {loading ? "Сохраняем..." : submitLabel}
        </button>
        <button className="button button-ghost" type="button">
          Редактировать
        </button>
      </div>

      <div className="card" style={{ display: "grid", gap: 8 }}>
        <label className="muted" style={{ fontSize: 15 }}>Дата</label>
        <input className="input" type="date" required value={date} onChange={(event) => setDate(event.target.value)} style={{ fontSize: 16 }} />
        <label className="muted" style={{ fontSize: 15 }}>Комментарий</label>
        <textarea className="textarea" rows={3} value={note} onChange={(event) => setNote(event.target.value)} placeholder="Опционально" style={{ fontSize: 16 }} />
      </div>

      {selected ? (
        <div className="muted" style={{ fontSize: 14 }}>
          Выбрано: <span style={{ color: selected.color }}>{selected.name}</span>
        </div>
      ) : null}

      {error ? <p style={{ color: "#fda4af", margin: 0 }}>{error}</p> : null}
    </form>
  );
}
