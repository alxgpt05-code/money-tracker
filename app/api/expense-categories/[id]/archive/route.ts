import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getRequestUserId } from "@/lib/auth/request-session";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const userId = getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await context.params;
    const category = await prisma.expenseCategory.findUnique({
      where: { id },
      select: {
        id: true,
        userId: true,
        isSystem: true,
        name: true,
      },
    });

    if (!category || category.userId !== userId) {
      return NextResponse.json({ ok: false, error: "Категория не найдена" }, { status: 404 });
    }

    if (category.isSystem) {
      return NextResponse.json({ ok: false, error: "Системную категорию нельзя удалить" }, { status: 400 });
    }

    await prisma.expenseCategory.update({
      where: { id: category.id },
      data: { isArchived: true },
    });

    return NextResponse.json({ ok: true });
  } catch (error: unknown) {
    console.error("[expense-categories/archive][POST] error", error);
    return NextResponse.json({ ok: false, error: "Не удалось архивировать категорию" }, { status: 500 });
  }
}
