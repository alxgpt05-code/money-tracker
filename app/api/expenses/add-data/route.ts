import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getRequestUserId } from "@/lib/auth/request-session";
import { parseDayKey } from "@/lib/utils/expense-date";

const SYSTEM_OTHER_CATEGORY_NAME = "Прочее";

function resolveYearMonth(rawDayKey: string | null): { year: number; month: number } {
  if (rawDayKey) {
    const parsed = parseDayKey(rawDayKey);
    if (parsed) {
      return { year: parsed.year, month: parsed.month };
    }
  }

  const now = new Date();
  return {
    year: now.getFullYear(),
    month: now.getMonth() + 1,
  };
}

export async function GET(request: Request) {
  try {
    const userId = getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const { year, month } = resolveYearMonth(url.searchParams.get("date"));

    const [categoriesRaw, budget] = await Promise.all([
      prisma.expenseCategory.findMany({
        where: {
          isArchived: false,
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
      prisma.monthlyBudget.findUnique({
        where: {
          userId_year_month: {
            userId,
            year,
            month,
          },
        },
        select: {
          id: true,
          userId: true,
          year: true,
          month: true,
          amount: true,
        },
      }),
    ]);

    const categories = categoriesRaw.map((category) => ({
      id: category.id,
      userId: category.userId ?? userId,
      name: category.name,
      color: category.color ?? undefined,
      isSystem: category.isSystem,
      isArchived: category.isArchived,
    }));

    const defaultCategory =
      categories.find((category) => category.isSystem) ??
      categories.find((category) => category.name.toLowerCase() === SYSTEM_OTHER_CATEGORY_NAME.toLowerCase()) ??
      categories[0] ??
      null;

    return NextResponse.json({
      ok: true,
      data: {
        userId,
        categories,
        defaultCategoryId: defaultCategory?.id ?? null,
        budget: budget
          ? {
              id: budget.id,
              userId: budget.userId,
              year: budget.year,
              month: budget.month,
              amount: Number(budget.amount),
            }
          : null,
      },
    });
  } catch (error: unknown) {
    console.error("[expenses/add-data][GET] error", error);
    return NextResponse.json({ ok: false, error: "Не удалось загрузить данные экрана" }, { status: 500 });
  }
}
