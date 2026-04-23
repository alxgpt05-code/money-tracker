"use client";

import { useEffect, useState } from "react";
import { monthKey, rub } from "@/lib/client/format";
import { MonthSwitcher } from "@/components/ui/month-switcher";
import { DonutChart } from "@/components/ui/donut-chart";

type Item = { categoryId: string; name: string; color: string; total: number };
type AnalyticsResponse = { total: number; biggest: Item | null; smallest: Item | null; items: Item[] };

export default function AnalyticsPage() {
  const [month, setMonth] = useState(monthKey());
  const [data, setData] = useState<AnalyticsResponse | null>(null);

  useEffect(() => {
    fetch("/api/analytics?month=" + month)
      .then((response) => response.json())
      .then((json) => setData(json))
      .catch(() => setData(null));
  }, [month]);

  return (
    <div className="stack">
      <MonthSwitcher month={month} onChange={setMonth} />

      <div className="metric-card" style={{ background: "transparent", paddingTop: 0, paddingBottom: 0 }}>
        <div className="metric-main">-{rub(Math.abs(data?.total || 0)).replace("₽", "").trim()} ₽</div>
      </div>

      <DonutChart items={data?.items || []} />

      {(data?.items || []).map((item) => {
        const percent = data?.total ? Math.round((item.total / data.total) * 100) : 0;
        return (
          <div key={item.categoryId} className="analytics-row">
            <div>
              <div>{item.name}</div>
              <span className="percent-chip" style={{ background: item.color }}>{percent}%</span>
            </div>
            <div style={{ fontSize: 48 }}>-{rub(item.total).replace("₽", "").trim()} ₽</div>
          </div>
        );
      })}
    </div>
  );
}
