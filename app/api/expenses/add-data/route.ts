import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getRequestUserId } from "@/lib/auth/request-session";

const SYSTEM_OTHER_CATEGORY_NAME = "Прочее";

function parseDate(raw: string | null): Date {
  if (!raw) {
    return new Date();
  }

  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) {
    return new Date();
  }

  return parsed;
}

export async function GET(request: Request) {
  try {
    const userId = getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const url = new URL(request.url);
    const selectedDate = parseDate(url.searchParams.get("date"));
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth() + 1;

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
