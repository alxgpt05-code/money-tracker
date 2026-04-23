"use client";

import { useEffect, useState } from "react";
import { formatExpenseRubles } from "@/lib/utils/formatters";

export interface AnalyticsCategoryRow {
  categoryId: string;
  categoryName: string;
  color: string;
  totalAmount: number;
  percentShare: number;
}

interface AnalyticsChartProps {
  totalExpenses: number;
  items: AnalyticsCategoryRow[];
  activeCategoryId: string | null;
  onSelectCategory: (categoryId: string) => void;
}

interface Point {
  x: number;
  y: number;
}

function toPoint(center: number, radius: number, angleDeg: number): Point {
  const angleRad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: center + radius * Math.cos(angleRad),
    y: center + radius * Math.sin(angleRad),
  };
}

function buildDonutSegmentPath(
  center: number,
  outerRadius: number,
  innerRadius: number,
  startAngle: number,
  endAngle: number,
): string {
  const startOuter = toPoint(center, outerRadius, startAngle);
  const endOuter = toPoint(center, outerRadius, endAngle);
  const startInner = toPoint(center, innerRadius, startAngle);
  const endInner = toPoint(center, innerRadius, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startOuter.x} ${startOuter.y}`,
    `A ${outerRadius} ${outerRadius} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${startInner.x} ${startInner.y}`,
    "Z",
  ].join(" ");
}

export function AnalyticsChart({ totalExpenses, items, activeCategoryId, onSelectCategory }: AnalyticsChartProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, []);

  let cursor = 0;
  const gapAngle = 2.2;
  const center = 158;
  const outerRadius = 118;
  const innerRadius = 68;

  return (
    <section className="rounded-[28px] border border-white/5 bg-[linear-gradient(160deg,rgba(255,255,255,0.05),rgba(255,255,255,0.015)_35%,rgba(12,12,13,0.94))] p-3 shadow-[0_20px_44px_rgba(0,0,0,0.42)]">
      <div
        className={`transition-all duration-500 ease-out ${isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"}`}
      >
        <svg viewBox="0 0 316 316" className="mx-auto block h-[304px] w-[304px]" role="img" aria-label="Диаграмма трат по категориям">
          <circle cx={center} cy={center} r={outerRadius + 4} fill="rgba(255,255,255,0.02)" />

          {items.map((item) => {
            const rawAngle = (item.percentShare / 100) * 360;
            const segmentAngle = Math.max(rawAngle - gapAngle, 0.8);
            const start = cursor + gapAngle / 2;
            const end = start + segmentAngle;
            const path = buildDonutSegmentPath(center, outerRadius, innerRadius, start, end);
            const midAngle = start + segmentAngle / 2;
            const isActive = activeCategoryId === item.categoryId;
            const offset = isActive ? 7 : 0;
            const offsetPoint = toPoint(0, offset, midAngle);
            cursor += rawAngle;

            return (
              <path
                key={item.categoryId}
                d={path}
                fill={item.color}
                fillOpacity={isActive ? 1 : 0.9}
                transform={`translate(${offsetPoint.x}, ${offsetPoint.y})`}
                className="cursor-pointer transition-all duration-300"
                style={{ filter: isActive ? "brightness(1.08) saturate(1.08)" : "none" }}
                onClick={() => onSelectCategory(item.categoryId)}
              />
            );
          })}

          <circle cx={center} cy={center} r={innerRadius - 2} fill="#121316" />
          <text x={center} y={center - 4} textAnchor="middle" className="fill-white text-[18px] font-semibold tracking-tight">
            {formatExpenseRubles(totalExpenses)}
          </text>
          <text x={center} y={center + 18} textAnchor="middle" className="fill-[#8E9096] text-[11px] font-medium">
            За месяц
          </text>
        </svg>
      </div>
    </section>
  );
}
