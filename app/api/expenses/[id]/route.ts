import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getRequestUserId } from "@/lib/auth/request-session";
import { normalizeExpenseDateForStorage, parseDayKey } from "@/lib/utils/expense-date";

async function resolveCategoryId(userId: string, categoryId: string): Promise<string> {
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const body = (await request.json().catch(() => null)) as
      | { amount?: number; spentAtDayKey?: string; spentAt?: string; categoryId?: string }
      | null;

    const amount = Number(body?.amount);
    const spentAtDayKeyInput = typeof body?.spentAtDayKey === "string" ? body.spentAtDayKey.trim() : "";
    const resolvedDayKey = parseDayKey(spentAtDayKeyInput) ? spentAtDayKeyInput : "";
    const spentAt = normalizeExpenseDateForStorage(resolvedDayKey);
    const categoryIdInput = body?.categoryId ?? "";

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Введите сумму больше нуля" }, { status: 400 });
    }

    if (!spentAt) {
      return NextResponse.json(
        { ok: false, error: "Некорректная дата. Передайте календарный день в формате YYYY-MM-DD." },
        { status: 400 },
      );
    }

    const existing = await prisma.expense.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Трата не найдена" }, { status: 404 });
    }

    let categoryId: string;
    try {
      categoryId = await resolveCategoryId(userId, categoryIdInput);
    } catch {
      return NextResponse.json({ ok: false, error: "Категория недоступна" }, { status: 400 });
    }

    await prisma.expense.update({
      where: { id: existing.id },
      data: {
        amount: new Prisma.Decimal(Math.round(amount)),
        spentAt,
        categoryId,
      },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[expenses/:id][PATCH] error", error);
    return NextResponse.json({ ok: false, error: "Не удалось обновить трату" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;

    const existing = await prisma.expense.findFirst({
      where: { id, userId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ ok: false, error: "Трата не найдена" }, { status: 404 });
    }

    await prisma.expense.delete({ where: { id: existing.id } });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[expenses/:id][DELETE] error", error);
    return NextResponse.json({ ok: false, error: "Не удалось удалить трату" }, { status: 500 });
  }
}
