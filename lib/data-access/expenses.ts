import { Prisma } from "@prisma/client";
import { db } from "@/lib/db";
import { SYSTEM_OTHER_CATEGORY_NAME } from "@/lib/data-access/categories";

export interface CreateExpenseInput {
  userId: string;
  amount: number;
  categoryId?: string;
  spentAt: Date;
}

function getMonthBounds(year: number, month: number): { start: Date; end: Date } {
  const start = new Date(year, month - 1, 1, 0, 0, 0, 0);
  const end = new Date(year, month, 1, 0, 0, 0, 0);
  return { start, end };
}

function getDayBounds(date: Date): { start: Date; end: Date } {
  const start = new Date(date.getFullYear(), date.getMonth(), date.getDate(), 0, 0, 0, 0);
  const end = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1, 0, 0, 0, 0);
  return { start, end };
}

async function resolveCategoryId(userId: string, categoryId?: string): Promise<string> {
  if (categoryId) {
    const category = await db.expenseCategory.findFirst({
      where: {
        id: categoryId,
        isArchived: false,
        OR: [{ userId }, { isSystem: true }],
      },
    });

    if (!category) {
      throw new Error("Category not found or not accessible");
    }

    return category.id;
  }

  const systemOther = await db.expenseCategory.findFirst({
    where: {
      isSystem: true,
      isArchived: false,
      name: SYSTEM_OTHER_CATEGORY_NAME,
    },
  });

  if (!systemOther) {
    throw new Error("System category 'Прочее' not found");
  }

  return systemOther.id;
}

export async function createExpense(input: CreateExpenseInput) {
  if (input.amount <= 0) {
    throw new Error("Expense amount must be greater than zero");
  }

  const resolvedCategoryId = await resolveCategoryId(input.userId, input.categoryId);

  // Business rule: DB stores expense amount as positive value.
  // UI layer is responsible for rendering expenses with minus sign.
  return db.expense.create({
    data: {
      userId: input.userId,
      amount: new Prisma.Decimal(input.amount),
      categoryId: resolvedCategoryId,
      spentAt: input.spentAt,
    },
    include: {
      category: true,
    },
  });
}

export async function getExpensesByMonth(userId: string, year: number, month: number) {
  const { start, end } = getMonthBounds(year, month);

  return db.expense.findMany({
    where: {
      userId,
      spentAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: {
      spentAt: "desc",
    },
    include: {
      category: true,
    },
  });
}

export async function getExpensesByDay(userId: string, date: Date) {
  const { start, end } = getDayBounds(date);

  return db.expense.findMany({
    where: {
      userId,
      spentAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: {
      spentAt: "desc",
    },
    include: {
      category: true,
    },
  });
}
