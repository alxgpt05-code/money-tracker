import { prisma } from "@/lib/db/prisma";
import { getSessionUserId } from "@/lib/auth/session";
import { rub } from "@/lib/client/format";
import { monthKey } from "@/lib/client/format";
import { MonthSwitcher } from "@/components/ui/month-switcher";

function groupByDayAmounts(data: Array<{ date: Date; amount: number }>) {
  const map = new Map<number, number>();
  for (const item of data) {
    const day = item.date.getUTCDate();
    map.set(day, (map.get(day) || 0) + item.amount);
  }

  const days = Array.from({ length: 14 }).map((_, index) => {
    const day = index + 1;
    return { day, amount: map.get(day) || 0 };
  });

  const max = Math.max(...days.map((item) => Math.abs(item.amount)), 1);
  return days.map((item) => ({ day: item.day, value: Math.max(6, Math.round((Math.abs(item.amount) / max) * 120)) }));
}

export default async function DashboardPage() {
  const userId = await getSessionUserId();
  if (!userId) return null;

  const now = new Date();
  const month = monthKey(now);
  const [year, monthNum] = month.split("-").map(Number);
  const start = new Date(Date.UTC(year, monthNum - 1, 1));
  const end = new Date(Date.UTC(year, monthNum, 1));

  const monthlyExpenses = await prisma.expense.findMany({
    where: { userId, date: { gte: start, lt: end } },
    include: { category: true },
    orderBy: [{ date: "desc" }, { createdAt: "desc" }]
  });

  const monthTotal = monthlyExpenses.reduce((sum, item) => sum + Number(item.amount), 0);
  const budget = 50000;
  const remaining = Math.max(0, budget - monthTotal);
  const bars = groupByDayAmounts(monthlyExpenses.map((item) => ({ date: item.date, amount: Number(item.amount) })));

  const todayKey = new Date().toISOString().slice(0, 10);
  const todayRows = monthlyExpenses.filter((item) => item.date.toISOString().slice(0, 10) === todayKey).slice(0, 2);
  const previousRows = monthlyExpenses.filter((item) => item.date.toISOString().slice(0, 10) !== todayKey).slice(0, 3);

  return (
    <div className="stack">
      <MonthSwitcher month={month} />

      <section className="metric-card" style={{ textAlign: "center" }}>
        <div className="metric-main">-{rub(Math.abs(monthTotal)).replace("₽", "").trim()} ₽</div>
        <div className="muted" style={{ fontSize: 22 }}>Расходы за месяц</div>
      </section>

      <section className="split-2">
        <div className="metric-card">
          <div className="muted" style={{ fontSize: 18 }}>Бюджет на месяц</div>
          <div className="h2">{rub(budget)}</div>
        </div>
        <div className="metric-card">
          <div className="muted" style={{ fontSize: 18 }}>Осталось до конца</div>
          <div className="h2">{rub(remaining)}</div>
        </div>
      </section>

      <section className="metric-card" style={{ paddingBottom: 14 }}>
        <div style={{ textAlign: "center", marginBottom: 8 }}>
          <div style={{ fontSize: 52, lineHeight: 1 }}>{rub(monthlyExpenses[0] ? Number(monthlyExpenses[0].amount) : 0)}</div>
          <div className="muted" style={{ fontSize: 18 }}>
            {monthlyExpenses[0] ? monthlyExpenses[0].date.toISOString().slice(5, 10).replace("-", "/") : "--/--"}
          </div>
        </div>

        <div style={{ height: 166, display: "flex", alignItems: "end", gap: 8, padding: "0 6px 4px" }}>
          {bars.map((bar, index) => (
            <div key={bar.day} style={{ flex: 1, display: "grid", justifyItems: "center", gap: 8 }}>
              <div
                style={{
                  width: 12,
                  height: bar.value,
                  borderRadius: 8,
                  background: index === 10 ? "var(--pink)" : "var(--accent)"
                }}
              />
              <div className="muted" style={{ fontSize: 14 }}>{String(bar.day).padStart(2, "0")}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="segmented">
        <button className="active">По дням</button>
        <button>По месяцам</button>
      </section>

      <section className="metric-card stack" style={{ gap: 12 }}>
        <div style={{ fontSize: 44, color: "#63666d" }}>Сегодня</div>
        {todayRows.length ? (
          todayRows.map((item) => (
            <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 32 }}>
              <span>{item.category.name}</span>
              <span>-{rub(Number(item.amount)).replace("₽", "").trim()} ₽</span>
            </div>
          ))
        ) : (
          <div className="muted" style={{ fontSize: 20 }}>Нет расходов за сегодня</div>
        )}

        {previousRows[0] ? <div style={{ fontSize: 44, color: "#63666d", marginTop: 8 }}>{previousRows[0].date.toISOString().slice(5, 10).replace("-", "/")}</div> : null}

        {previousRows.map((item) => (
          <div key={item.id} style={{ display: "flex", justifyContent: "space-between", fontSize: 32 }}>
            <span>{item.category.name}</span>
            <span>-{rub(Number(item.amount)).replace("₽", "").trim()} ₽</span>
          </div>
        ))}
      </section>
    </div>
  );
}
