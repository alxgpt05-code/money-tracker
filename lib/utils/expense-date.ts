const DAY_KEY_PATTERN = /^(\d{4})-(\d{2})-(\d{2})$/;

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

export interface ParsedDayKey {
  year: number;
  month: number;
  day: number;
}

export function getLocalDayKey(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

// Backward-compatible alias used by expense flows.
export function getLocalDateKey(date: Date): string {
  return getLocalDayKey(date);
}

export function getExpenseLocalDateKey(date: Date): string {
  return getLocalDayKey(date);
}

export function getUtcDayKey(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}-${pad2(date.getUTCDate())}`;
}

export function parseDayKey(dayKey: string): ParsedDayKey | null {
  const match = DAY_KEY_PATTERN.exec(dayKey);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  if (!Number.isInteger(year) || !Number.isInteger(month) || !Number.isInteger(day)) {
    return null;
  }

  if (month < 1 || month > 12 || day < 1 || day > 31) {
    return null;
  }

  const candidate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));
  if (
    candidate.getUTCFullYear() !== year ||
    candidate.getUTCMonth() !== month - 1 ||
    candidate.getUTCDate() !== day
  ) {
    return null;
  }

  return { year, month, day };
}

export function dayKeyToUtcDate(dayKey: string): Date | null {
  const parsed = parseDayKey(dayKey);
  if (!parsed) {
    return null;
  }

  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0, 0));
}

// Primary storage normalizer for expense calendar day.
// Converts selected local day key into canonical stored Date (UTC midnight).
export function normalizeExpenseDateForStorage(dayKey: string): Date | null {
  const parsed = parseDayKey(dayKey);
  if (!parsed) {
    return null;
  }

  // Midday UTC keeps the same calendar day in UTC-based grouping
  // and avoids accidental previous-day rendering in local-time parsing.
  return new Date(Date.UTC(parsed.year, parsed.month - 1, parsed.day, 12, 0, 0, 0));
}

export function dayKeyToUtcIso(dayKey: string): string | null {
  const date = dayKeyToUtcDate(dayKey);
  return date ? date.toISOString() : null;
}

export function dayKeyToLocalDate(dayKey: string): Date | null {
  const parsed = parseDayKey(dayKey);
  if (!parsed) {
    return null;
  }

  return new Date(parsed.year, parsed.month - 1, parsed.day, 0, 0, 0, 0);
}

// Parses stored expense date (ISO/Date/dayKey) into local calendar day Date for UI.
export function parseStoredExpenseDate(value: string | Date): Date | null {
  if (value instanceof Date) {
    if (Number.isNaN(value.getTime())) return null;
    const key = getUtcDayKey(value);
    return dayKeyToLocalDate(key);
  }

  const byDayKey = dayKeyToLocalDate(value);
  if (byDayKey) {
    return byDayKey;
  }

  return utcIsoToLocalDayDate(value);
}

export function formatExpenseCalendarDay(value: string | Date): string | null {
  const parsed = parseStoredExpenseDate(value);
  if (!parsed) {
    return null;
  }

  return getLocalDayKey(parsed);
}

export function getMonthKeyFromParsedDay(parsed: ParsedDayKey): string {
  return `${parsed.year}-${pad2(parsed.month)}`;
}

export function getMonthKeyFromUtcDate(date: Date): string {
  return `${date.getUTCFullYear()}-${pad2(date.getUTCMonth() + 1)}`;
}

export function getUtcYearMonth(date: Date): { year: number; month: number } {
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
  };
}

export function normalizeLegacyIsoToUtcDayDate(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const key = getUtcDayKey(parsed);
  return dayKeyToUtcDate(key);
}

export function utcIsoToLocalDayDate(value: string): Date | null {
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return null;
  }

  const key = getUtcDayKey(parsed);
  return dayKeyToLocalDate(key);
}
