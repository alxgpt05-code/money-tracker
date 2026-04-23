"use client";

import { useMemo, useState } from "react";
import { Input } from "@/components/ui/input";

type RatePreset = { label: string; value: number };

const ratePresets: RatePreset[] = [
  { label: "Надёжно", value: 12 },
  { label: "Сбалансированно", value: 14 },
  { label: "Доходно", value: 17 },
];

function formatNumber(value: number) {
  return value.toLocaleString("ru-RU", { maximumFractionDigits: 0 });
}

export function CapitalGrowthCalculator() {
  const [salary, setSalary] = useState(100_000);
  const [monthlyContribution, setMonthlyContribution] = useState(20_000);
  const [initialAmount, setInitialAmount] = useState(0);
  const [years, setYears] = useState<1 | 2 | 3>(3);
  const [rate, setRate] = useState(14);
  const [inflation, setInflation] = useState(6);
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);

  const months = Math.max(1, years * 12);
  const totalDays = Math.max(1, years * 365);
  const annualRate = Number.isFinite(rate) ? rate : 0;
  const dailyRate = annualRate / 100 / 365;
  const monthlyContributionSafe = Number.isFinite(monthlyContribution) ? monthlyContribution : 0;
  const dailyContribution = monthlyContributionSafe / 30;
  const initialAmountSafe = Number.isFinite(initialAmount) ? initialAmount : 0;

  const projection = useMemo(() => {
    const n = months;
    const r = annualRate / 100 / 12;

    if (r === 0) {
      const fv = initialAmountSafe + monthlyContributionSafe * n;
      return {
        futureValue: fv,
        totalContribution: initialAmountSafe + monthlyContributionSafe * n,
        interestEarned: 0,
      };
    }

    const growth = Math.pow(1 + r, n);
    const fv = initialAmountSafe * growth + monthlyContributionSafe * ((growth - 1) / r);
    const totalContribution = initialAmountSafe + monthlyContributionSafe * n;
    const interestEarned = fv - totalContribution;

    return { futureValue: fv, totalContribution, interestEarned };
  }, [initialAmountSafe, monthlyContributionSafe, months, annualRate]);

  const passiveIncomeMonthly = projection.futureValue * (annualRate / 100) / 12;

  const realProjection = useMemo(() => {
    const inflMonthly = (Number.isFinite(inflation) ? inflation : 0) / 100 / 12;
    if (inflMonthly === 0) return projection.futureValue;
    const discount = Math.pow(1 + inflMonthly, months);
    return projection.futureValue / discount;
  }, [inflation, months, projection.futureValue]);

  const series = useMemo(() => {
    const data: number[] = [];
    let balance = initialAmountSafe;
    let dayInMonth = 0;
    for (let day = 1; day <= totalDays; day++) {
      balance = balance * (1 + dailyRate) + dailyContribution;
      dayInMonth += 1;
      const isMonthEnd = dayInMonth >= 30 || day === totalDays;
      if (isMonthEnd) {
        data.push(balance);
        dayInMonth = 0;
      }
    }
    return data;
  }, [initialAmountSafe, dailyContribution, dailyRate, totalDays]);

  const highlightedValue = selectedMonth ? series[selectedMonth - 1] ?? projection.futureValue : projection.futureValue;

  return (
    <div className="space-y-6">
      <div className="rounded-[28px] border border-white/10 bg-[radial-gradient(circle_at_top_right,rgba(182,255,77,0.06),transparent_32%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0)),rgba(10,13,11,0.9)] p-5 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.24em] text-white/60">Интерактив</p>
        <h2 className="mt-2 text-2xl font-semibold text-white">Калькулятор роста капитала</h2>
        <p className="mt-2 text-sm text-white/70">Играйте параметрами: срок, ставка, пополнения. Пересчёт мгновенный.</p>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1.05fr_0.95fr]">
        <div className="space-y-4 min-w-0">
          <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
            <Field label="Зарплата, ₽">
              <Input
                type="number"
                inputMode="numeric"
                value={salary}
                onChange={(e) => setSalary(Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Откладывает в месяц, ₽">
              <Input
                type="number"
                inputMode="numeric"
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value) || 0)}
              />
              <input
                aria-label="Слайдер суммы"
                type="range"
                min={0}
                max={Math.max(50_000, salary || 0, monthlyContribution || 0)}
                step={1000}
                value={monthlyContribution}
                onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                className="mt-2 h-1 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-[#b6ff4d]"
              />
            </Field>
            <Field label="Начальная сумма, ₽">
              <Input
                type="number"
                inputMode="numeric"
                value={initialAmount}
                onChange={(e) => setInitialAmount(Number(e.target.value) || 0)}
              />
            </Field>
            <Field label="Срок">
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                {[1, 2, 3].map((y) => (
                  <button
                    key={y}
                    type="button"
                    onClick={() => setYears(y as 1 | 2 | 3)}
                    className={`rounded-2xl border px-3 py-2 text-sm font-medium leading-tight text-center transition ${years === y ? "border-primary/60 bg-primary/10 text-white shadow-glow" : "border-white/12 bg-white/5 text-white/80 hover:border-white/30"}`}
                  >
                    {y} {y === 1 ? "год" : "года"}
                  </button>
                ))}
              </div>
            </Field>
            <Field label="Режим доходности">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {ratePresets.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setRate(preset.value)}
                    className={`rounded-[18px] border px-4 py-3.5 text-sm sm:text-base font-semibold leading-tight text-center whitespace-normal transition ${rate === preset.value ? "border-primary/60 bg-primary/12 text-white shadow-glow" : "border-white/15 bg-white/6 text-white/80 hover:border-white/30"}`}
                  >
                    {preset.label}
                    <span className="mt-1 block text-[12px] text-white/60">{preset.value}%</span>
                  </button>
                ))}
              </div>
            </Field>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Field label="Ставка, % (вручную)">
                <div className="rounded-[18px] border border-white/12 bg-white/6 px-3.5 py-3 shadow-glow/40">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={rate}
                    className="bg-transparent border-0 px-0 text-base font-semibold text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                    onChange={(e) => setRate(Number(e.target.value) || 0)}
                  />
                </div>
              </Field>
              <Field label="Инфляция, %">
                <div className="rounded-[18px] border border-white/12 bg-white/6 px-3.5 py-3 shadow-glow/40">
                  <Input
                    type="number"
                    inputMode="decimal"
                    value={inflation}
                    className="bg-transparent border-0 px-0 text-base font-semibold text-white focus-visible:ring-0 focus-visible:ring-offset-0"
                    onChange={(e) => setInflation(Number(e.target.value) || 0)}
                  />
                </div>
              </Field>
            </div>
          </div>
        </div>

        <div className="space-y-4 min-w-0">
          <div className="rounded-[24px] border border-white/10 bg-[rgba(255,255,255,0.03)] p-4 shadow-glow">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">Итоговая сумма</p>
            <div className="mt-1 text-4xl sm:text-5xl font-semibold text-white leading-tight whitespace-nowrap overflow-hidden text-ellipsis">
              {formatNumber(highlightedValue)} ₽
            </div>
            <p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/60">
              {selectedMonth ? `Месяц ${selectedMonth}` : "Итоговый срок"}
            </p>
            <div className="mt-2 grid grid-cols-2 gap-2 text-sm text-white/80">
              <Info label="Заработано проценты" value={`+${formatNumber(projection.interestEarned)} ₽`} />
              <Info label="Вложено своими" value={`${formatNumber(projection.totalContribution)} ₽`} />
              <Info label="Потенц. доход в мес" value={`${formatNumber(passiveIncomeMonthly)} ₽`} />
              <Info label="С учётом инфляции" value={`${formatNumber(realProjection)} ₽`} />
            </div>
          </div>

          <div className="rounded-[24px] border border-white/10 bg-[rgba(12,16,13,0.72)] p-4">
            <p className="text-xs uppercase tracking-[0.24em] text-white/60">Сравнение</p>
            <div className="mt-3 space-y-2 text-sm text-white/80">
              <Info label="Если бы не инвестировал" value={`${formatNumber(initialAmount + monthlyContribution * months)} ₽`} />
              <Info label="С инвестициями" value={`${formatNumber(projection.futureValue)} ₽`} />
              <Info label="Разница" value={`+${formatNumber(projection.futureValue - (initialAmount + monthlyContribution * months))} ₽`} />
            </div>
          </div>

          {series.length > 0 ? (
            <div className="rounded-[24px] border border-white/10 bg-[rgba(12,16,13,0.6)] p-4">
              <p className="text-xs uppercase tracking-[0.24em] text-white/60">Рост по месяцам</p>
              <MonthlyBars data={series} onSelect={(month) => setSelectedMonth(month)} selected={selectedMonth} />
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="space-y-1 text-sm text-white/80">
      <span className="text-xs uppercase tracking-[0.2em] text-white/60">{label}</span>
      {children}
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between rounded-xl border border-white/5 bg-white/5 px-3 py-2">
      <span className="text-white/60">{label}</span>
      <span className="font-semibold text-white">{value}</span>
    </div>
  );
}

function MonthlyBars({ data, onSelect, selected }: { data: number[]; onSelect: (month: number) => void; selected: number | null }) {
  const width = Math.max(960, data.length * 20);
  const height = 260;
  const max = Math.max(...data);

  const barWidth = Math.max(14, width / (data.length * 1.25));
  const ticks = (() => {
    if (data.length <= 12) return data.map((_, i) => i + 1);
    if (data.length <= 24) return Array.from({ length: 8 }, (_, i) => Math.min(data.length, i * 3 + 1));
    return Array.from({ length: 7 }, (_, i) => Math.min(data.length, i * 6 + 1));
  })();

  return (
    <div className="relative mt-3 overflow-x-auto rounded-[20px] border border-white/8 bg-black/20 px-3 py-3">
      <svg viewBox={`0 0 ${width} ${height + 40}`} className="h-72 min-w-full">
        <defs>
          <linearGradient id="barFill" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b6ff4d" stopOpacity="0.9" />
            <stop offset="100%" stopColor="#b6ff4d" stopOpacity="0.45" />
          </linearGradient>
          <linearGradient id="barFillActive" x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#d4ffa1" stopOpacity="1" />
            <stop offset="100%" stopColor="#b6ff4d" stopOpacity="0.7" />
          </linearGradient>
        </defs>
        <line x1="0" y1={height} x2={width} y2={height} stroke="rgba(255,255,255,0.12)" strokeWidth="1" />
        {data.map((value, idx) => {
          const x = idx * (barWidth * 1.25);
          const barHeight = max ? (value / max) * height : 0;
          const y = height - barHeight;
          const active = selected === idx + 1;
          return (
            <g key={`bar-${idx}`} className="cursor-pointer" onClick={() => onSelect(idx + 1)}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                rx={7}
                fill={active ? "url(#barFillActive)" : "url(#barFill)"}
                stroke={active ? "rgba(212,255,161,0.9)" : "rgba(182,255,77,0.5)"}
                strokeWidth={active ? 1.2 : 0.6}
                opacity={active ? 1 : 0.9}
              >
                <title>{`Месяц ${idx + 1}: ${formatNumber(value)} ₽`}</title>
              </rect>
            </g>
          );
        })}
        {ticks.map((tick) => {
          const idx = tick - 1;
          const x = idx * (barWidth * 1.25) + barWidth / 2;
          return (
            <text key={`tick-${tick}`} x={x} y={height + 26} textAnchor="middle" fontSize="11" fill="#9fb1a2">
              {tick}м
            </text>
          );
        })}
      </svg>
    </div>
  );
}
