export function formatCurrency(value: number | string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    maximumFractionDigits: 2,
  }).format(Number(value));
}

export function formatCompactCurrency(value: number | string) {
  return new Intl.NumberFormat("ru-RU", {
    style: "currency",
    currency: "RUB",
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value));
}

export function formatPercent(value: number | string) {
  return `${Number(value).toFixed(1)}%`;
}
