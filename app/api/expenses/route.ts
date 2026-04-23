import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getRequestUserId } from "@/lib/auth/request-session";

const SYSTEM_OTHER_CATEGORY_NAME = "Прочее";

async function resolveCategoryId(userId: string, categoryId?: string): Promise<string> {
  if (categoryId) {
    const category = await prisma.expenseCategory.findFirst({
      where: {
        id: categoryId,
        isArchived: false,
        OR: [{ isSystem: true }, { userId }],
      },
      select: { id: true },
    });

    if (!category) {
      throw new Error("CATEGORY_NOT_FOUND");
    }

    return category.id;
  }

  const other = await prisma.expenseCategory.findFirst({
    where: {
      isSystem: true,
      isArchived: false,
      name: SYSTEM_OTHER_CATEGORY_NAME,
    },
    select: { id: true },
  });

  if (!other) {
    throw new Error("SYSTEM_CATEGORY_NOT_FOUND");
  }

  return other.id;
}

export async function POST(request: Request) {
  try {
    const userId = getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | { amount?: number; spentAt?: string; categoryId?: string }
      | null;

    const amount = Number(body?.amount);
    const spentAtRaw = body?.spentAt ?? "";
    const spentAt = new Date(spentAtRaw);

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Введите сумму больше нуля" }, { status: 400 });
    }

    if (Number.isNaN(spentAt.getTime())) {
      return NextResponse.json({ ok: false, error: "Некорректная дата" }, { status: 400 });
    }

    let categoryId: string;
    try {
      categoryId = await resolveCategoryId(userId, body?.categoryId);
    } catch (error) {
      if (error instanceof Error && error.message === "CATEGORY_NOT_FOUND") {
        return NextResponse.json({ ok: false, error: "Категория недоступна" }, { status: 400 });
      }

      return NextResponse.json({ ok: false, error: "Системная категория не найдена" }, { status: 500 });
    }

    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: new Prisma.Decimal(Math.round(amount)),
        categoryId,
        spentAt,
      },
      select: {
        id: true,
      },
    });

    return NextResponse.json({ ok: true, data: { expenseId: expense.id } });
  } catch (error: unknown) {
    console.error("[expenses][POST] error", error);
    return NextResponse.json({ ok: false, error: "Не удалось сохранить трату" }, { status: 500 });
  }
}
