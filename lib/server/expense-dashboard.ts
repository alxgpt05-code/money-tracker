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
import { formatMonthLabel, formatWeekdayShort } from "@/lib/utils/formatters";

const SYSTEM_OTHER_CATEGORY_NAME = "Прочее";

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;
}

function startOfMonth(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), 1);
}

function addMonths(date: Date, diff: number): Date {
  return new Date(date.getFullYear(), date.getMonth() + diff, 1);
}

function getDaysInMonth(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
}

function startOfDay(date: Date): Date {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

function toCategoryMap(categories: ExpenseCategory[]): Map<string, ExpenseCategory> {
  return new Map(categories.map((category) => [category.id, category]));
}

function buildDailyPoints(monthDate: Date): DailyExpensePoint[] {
  const days = getDaysInMonth(monthDate);

  return Array.from({ length: days }, (_, index) => {
    const day = index + 1;
    const pointDate = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);

    return {
      dateIso: pointDate.toISOString(),
      day,
      weekdayShort: formatWeekdayShort(pointDate),
      amount: 0,
    };
  });
}

function buildHistory(
  monthDate: Date,
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
    const spent = new Date(expense.spentAt);
    const dayStart = startOfDay(spent);
    const key = dayStart.toISOString();
    const category = categoryMap.get(expense.categoryId) ?? systemOther;

    if (!category) {
      continue;
    }

    const item: ExpenseHistoryItem = {
      id: expense.id,
      category,
      amount: expense.amount,
      dateIso: spent.toISOString(),
    };

    if (!grouped.has(key)) {
      grouped.set(key, []);
    }

    grouped.get(key)!.push(item);
  }

  return [...grouped.entries()]
    .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
    .map(([dateIso, items]) => {
      const date = new Date(dateIso);

      return {
        id: `group-${dateIso}`,
        label: `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`,
        dateIso,
        items: [...items].sort((a, b) => new Date(b.dateIso).getTime() - new Date(a.dateIso).getTime()),
      };
    });
}

export async function getDashboardDataForUser(userId: string, referenceDate = new Date()): Promise<DashboardMockData> {
  const currentMonthStart = startOfMonth(referenceDate);
  const currentMonthKey = monthKey(currentMonthStart);

  const monthOffsets = [-5, -4, -3, -2, -1, 0];
  const monthStarts = monthOffsets.map((offset) => addMonths(currentMonthStart, offset));
  const rangeStart = monthStarts[0];
  const rangeEnd = addMonths(currentMonthStart, 1);

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
      `${budget.year}-${String(budget.month).padStart(2, "0")}`,
      Number(budget.amount),
    ]),
  );

  const months: DashboardMonthData[] = monthStarts.map((monthStart) => {
    const key = monthKey(monthStart);
    const monthExpenses = expenses.filter((expense) => {
      const spent = new Date(expense.spentAt);
      return spent.getFullYear() === monthStart.getFullYear() && spent.getMonth() === monthStart.getMonth();
    });

    const dailyExpenses = buildDailyPoints(monthStart);
    for (const expense of monthExpenses) {
      const spent = new Date(expense.spentAt);
      const index = spent.getDate() - 1;
      if (dailyExpenses[index]) {
        dailyExpenses[index].amount += Number(expense.amount);
      }
    }

    const totalExpenses = dailyExpenses.reduce((sum, point) => sum + point.amount, 0);

    return {
      monthKey: key,
      monthStartIso: monthStart.toISOString(),
      monthLabel: formatMonthLabel(monthStart),
      budget: budgetMap.get(key) ?? null,
      totalExpenses,
      dailyExpenses,
      history: buildHistory(
        monthStart,
        monthExpenses.map((expense) => ({
          id: expense.id,
          amount: Number(expense.amount),
          spentAt: expense.spentAt,
          categoryId: expense.categoryId,
        })),
        categories,
      ),
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
  const currentMonthStart = startOfMonth(referenceDate);
  const currentMonthKey = monthKey(currentMonthStart);
  const monthOffsets = [-5, -4, -3, -2, -1, 0];
  const monthStarts = monthOffsets.map((offset) => addMonths(currentMonthStart, offset));

  const months: DashboardMonthData[] = monthStarts.map((monthStart) => {
    const dailyExpenses = buildDailyPoints(monthStart);
    return {
      monthKey: monthKey(monthStart),
      monthStartIso: monthStart.toISOString(),
      monthLabel: formatMonthLabel(monthStart),
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
