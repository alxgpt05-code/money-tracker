const MONTH_LABEL_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
  year: "2-digit",
});

const MONTH_FULL_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  month: "long",
});

const MONTH_SHORT_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  month: "short",
});

const WEEKDAY_SHORT_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
});

const WEEKDAY_SHORT_FORMATTER_UTC = new Intl.DateTimeFormat("ru-RU", {
  weekday: "short",
  timeZone: "UTC",
});

const DAY_MONTH_FORMATTER_UTC = new Intl.DateTimeFormat("ru-RU", {
  day: "2-digit",
  month: "2-digit",
  timeZone: "UTC",
});

const DAY_MONTH_TITLE_FORMATTER = new Intl.DateTimeFormat("ru-RU", {
  day: "numeric",
  month: "long",
});

function isValidDate(date: Date): boolean {
  return Number.isFinite(date.getTime());
}

export function formatRubles(value: number): string {
  const amount = Math.round(Math.abs(value)).toLocaleString("ru-RU");
  return `${amount} ₽`;
}

export function formatExpenseRubles(value: number): string {
  return `-${formatRubles(value)}`;
}

export function formatMonthLabel(date: Date): string {
  if (!isValidDate(date)) return "-";
  const [monthRaw, year] = MONTH_LABEL_FORMATTER.format(date).split(" ");
  const month = monthRaw ? monthRaw[0].toUpperCase() + monthRaw.slice(1) : "";
  return `${month}'${year}`;
}

export function formatMonthFull(date: Date): string {
  if (!isValidDate(date)) return "-";
  const month = MONTH_FULL_FORMATTER.format(date);
  return month[0].toUpperCase() + month.slice(1);
}

export function formatMonthShort(date: Date): string {
  if (!isValidDate(date)) return "-";
  return MONTH_SHORT_FORMATTER.format(date).replace(".", "").toLowerCase();
}

export function formatWeekdayShort(date: Date): string {
  if (!isValidDate(date)) return "-";
  return WEEKDAY_SHORT_FORMATTER.format(date).replace(".", "").toLowerCase();
}

export function formatWeekdayShortUtc(date: Date): string {
  if (!isValidDate(date)) return "-";
  return WEEKDAY_SHORT_FORMATTER_UTC.format(date).replace(".", "").toLowerCase();
}

export function formatDayAndWeekday(dateIso: string): string {
  const date = new Date(dateIso);
  if (!isValidDate(date)) return "-";
  return `${DAY_MONTH_FORMATTER_UTC.format(date)} ${formatWeekdayShortUtc(date)}`;
}

export function formatDayMonthTitle(date: Date): string {
  if (!isValidDate(date)) return "-";
  const raw = DAY_MONTH_TITLE_FORMATTER.format(date);
  const [day, monthRaw] = raw.split(" ");
  const month = monthRaw ? monthRaw[0].toUpperCase() + monthRaw.slice(1) : "";
  return `${day} ${month}`;
}

export function formatDateInputValue(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function sanitizeNumericInput(raw: string): string {
  return raw.replace(/\D+/g, "");
}
