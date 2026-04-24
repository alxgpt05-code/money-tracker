import type {
  DailyExpensePoint,
  DashboardMockData,
  DashboardMonthData,
  ExpenseCategory,
  ExpenseHistoryGroup,
  ExpenseHistoryItem,
  MonthlyExpensePoint,
} from "@/types/expense";
import { prisma } from "@/lib/db/prisma";
import { formatMonthLabel, formatWeekdayShortUtc } from "@/lib/utils/formatters";
import {
  dayKeyToUtcDate,
  getMonthKeyFromUtcDate,
  getUtcDayKey,
  getUtcYearMonth,
} from "@/lib/utils/expense-date";

const SYSTEM_OTHER_CATEGORY_NAME = "Прочее";

function pad2(value: number): string {
  return String(value).padStart(2, "0");
}

function monthKeyFromParts(year: number, month: number): string {
  return `${year}-${pad2(month)}`;
}

function startOfUtcMonth(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 0, 0, 0, 0));
}
function monthAnchorUtcDate(year: number, month: number): Date {
  return new Date(Date.UTC(year, month - 1, 1, 12, 0, 0, 0));
}

function getUtcDaysInMonth(year: number, month: number): number {
  return new Date(Date.UTC(year, month, 0, 0, 0, 0, 0)).getUTCDate();
}

function addUtcMonths(year: number, month: number, diff: number): { year: number; month: number } {
  const shifted = new Date(Date.UTC(year, month - 1 + diff, 1, 0, 0, 0, 0));
  return {
    year: shifted.getUTCFullYear(),
    month: shifted.getUTCMonth() + 1,
  };
}

function toCategoryMap(categories: ExpenseCategory[]): Map<string, ExpenseCategory> {
  return new Map(categories.map((category) => [category.id, category]));
}

function buildDailyPoints(year: number, month: number): DailyExpensePoint[] {
  const days = getUtcDaysInMonth(year, month);

  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const pointDate = new Date(Date.UTC(year, month - 1, day, 0, 0, 0, 0));

    return {
      dateIso: pointDate.toISOString(),
      dateKey: `${year}-${pad2(month)}-${pad2(day)}`,
      day,
      weekdayShort: formatWeekdayShortUtc(pointDate),
      amount: 0,
    };
  });
}

function buildHistory(
  monthExpenses: Array<{ id: string; amount: number; spentAt: Date; categoryId: string }>,
  categories: ExpenseCategory[],
): ExpenseHistoryGroup[] {
  if (monthExpenses.length === 0) {
    return [];
  }

  const categoryMap = toCategoryMap(categories);
  const systemOther =
    categories.find((category) => category.isSystem) ??
    categories.find((category) => category.name.toLowerCase() === SYSTEM_OTHER_CATEGORY_NAME.toLowerCase()) ??
    categories[0] ??
    null;

  const grouped = new Map<string, ExpenseHistoryItem[]>();

  for (const expense of monthExpenses) {
    if (!Number.isFinite(expense.spentAt.getTime())) {
      continue;
    }

    const dayKey = getUtcDayKey(expense.spentAt);
    const category = categoryMap.get(expense.categoryId) ?? systemOther;

    if (!category) {
      continue;
    }

    const item: ExpenseHistoryItem = {
      id: expense.id,
      category,
      amount: expense.amount,
      dateIso: expense.spentAt.toISOString(),
      dateKey: dayKey,
    };

    if (!grouped.has(dayKey)) {
      grouped.set(dayKey, []);
    }

    grouped.get(dayKey)!.push(item);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => b.localeCompare(a))
    .map(([dayKey, items]) => {
      const date = dayKeyToUtcDate(dayKey);
      if (!date) {
        return null;
      }

      const [, month, day] = dayKey.split("-");

      return {
        id: `group-${dayKey}`,
        label: `${day}/${month}`,
        dateIso: date.toISOString(),
        dateKey: dayKey,
        items: [...items].sort((a, b) => b.dateIso.localeCompare(a.dateIso)),
      } satisfies ExpenseHistoryGroup;
    })
    .filter((group): group is ExpenseHistoryGroup => Boolean(group));
}

export async function getDashboardDataForUser(userId: string, referenceDate = new Date()): Promise<DashboardMockData> {
  const { year: currentYear, month: currentMonth } = getUtcYearMonth(referenceDate);
  const currentMonthKey = monthKeyFromParts(currentYear, currentMonth);

  const monthOffsets = [-5, -4, -3, -2, -1, 0];
  const monthRange = monthOffsets.map((offset) => addUtcMonths(currentYear, currentMonth, offset));
  const rangeStart = startOfUtcMonth(monthRange[0].year, monthRange[0].month);
  const nextAfterCurrent = addUtcMonths(currentYear, currentMonth, 1);
  const rangeEnd = startOfUtcMonth(nextAfterCurrent.year, nextAfterCurrent.month);

  const [expenses, budgets, categoriesRaw] = await Promise.all([
    prisma.expense.findMany({
      where: {
        userId,
        spentAt: {
          gte: rangeStart,
          lt: rangeEnd,
        },
      },
      orderBy: {
        spentAt: "desc",
      },
      select: {
        id: true,
        amount: true,
        spentAt: true,
        categoryId: true,
      },
    }),
    prisma.monthlyBudget.findMany({
      where: { userId },
      select: {
        year: true,
        month: true,
        amount: true,
      },
    }),
    prisma.expenseCategory.findMany({
      where: {
        OR: [{ isSystem: true }, { userId }],
      },
      orderBy: [{ isSystem: "desc" }, { createdAt: "asc" }],
      select: {
        id: true,
        userId: true,
        name: true,
        color: true,
        isSystem: true,
        isArchived: true,
      },
    }),
  ]);

  const categories: ExpenseCategory[] = categoriesRaw.map((category) => ({
    id: category.id,
    userId: category.userId ?? "system",
    name: category.name,
    color: category.color ?? undefined,
    isSystem: category.isSystem,
    isArchived: category.isArchived,
  }));

  const budgetMap = new Map(
    budgets.map((budget) => [
      monthKeyFromParts(budget.year, budget.month),
      Number(budget.amount),
    ]),
  );

  const expensesByMonth = new Map<string, Array<{ id: string; amount: number; spentAt: Date; categoryId: string }>>();
  for (const expense of expenses) {
    if (!Number.isFinite(expense.spentAt.getTime())) {
      continue;
    }

    const key = getMonthKeyFromUtcDate(expense.spentAt);
    if (!expensesByMonth.has(key)) {
      expensesByMonth.set(key, []);
    }

    expensesByMonth.get(key)!.push({
      id: expense.id,
      amount: Number(expense.amount),
      spentAt: expense.spentAt,
      categoryId: expense.categoryId,
    });
  }

  const months: DashboardMonthData[] = monthRange.map(({ year, month }) => {
    const key = monthKeyFromParts(year, month);
    const monthExpenses = expensesByMonth.get(key) ?? [];

    const dailyExpenses = buildDailyPoints(year, month);
    for (const expense of monthExpenses) {
      if (!Number.isFinite(expense.spentAt.getTime())) {
        continue;
      }
      const index = expense.spentAt.getUTCDate() - 1;
      if (dailyExpenses[index]) {
        dailyExpenses[index].amount += expense.amount;
      }
    }

    const totalExpenses = dailyExpenses.reduce((sum, point) => sum + point.amount, 0);
    const monthAnchorDate = monthAnchorUtcDate(year, month);

    return {
      monthKey: key,
      monthStartIso: monthAnchorDate.toISOString(),
      monthLabel: formatMonthLabel(monthAnchorDate),
      budget: budgetMap.get(key) ?? null,
      totalExpenses,
      dailyExpenses,
      history: buildHistory(monthExpenses, categories),
    };
  });

  const monthlyExpenses: MonthlyExpensePoint[] = months.map((month) => ({
    monthStartIso: month.monthStartIso,
    monthLabel: month.monthLabel,
    amount: month.totalExpenses,
  }));

  return {
    currentMonthKey,
    months,
    monthlyExpenses,
  };
}

export function getEmptyDashboardData(referenceDate = new Date()): DashboardMockData {
  const { year: currentYear, month: currentMonth } = getUtcYearMonth(referenceDate);
  const currentMonthKey = monthKeyFromParts(currentYear, currentMonth);
  const monthOffsets = [-5, -4, -3, -2, -1, 0];
  const monthRange = monthOffsets.map((offset) => addUtcMonths(currentYear, currentMonth, offset));

  const months: DashboardMonthData[] = monthRange.map(({ year, month }) => {
    const dailyExpenses = buildDailyPoints(year, month);
    const monthAnchorDate = monthAnchorUtcDate(year, month);

    return {
      monthKey: monthKeyFromParts(year, month),
      monthStartIso: monthAnchorDate.toISOString(),
      monthLabel: formatMonthLabel(monthAnchorDate),
      budget: null,
      totalExpenses: 0,
      dailyExpenses,
      history: [],
    };
  });

  const monthlyExpenses: MonthlyExpensePoint[] = months.map((month) => ({
    monthStartIso: month.monthStartIso,
    monthLabel: month.monthLabel,
    amount: 0,
  }));

  return {
    currentMonthKey,
    months,
    monthlyExpenses,
  };
}
