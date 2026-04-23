import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/server/auth";
import { expenseInputSchema } from "@/lib/server/validators";

type Params = {
  params: Promise<{ id: string }>;
};

export async function PATCH(request: Request, { params }: Params) {
  const { userId, response } = await requireUserId();
  if (!userId) return response!;

  const { id } = await params;

  try {
    const raw = await request.json();
    const parsed = expenseInputSchema.parse(raw);

    const existing = await prisma.expense.findFirst({
      where: { id, userId }
    });

    if (!existing) {
      return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
    }

    const updated = await prisma.expense.update({
      where: { id },
      data: {
        amount: parsed.amount,
        categoryId: parsed.categoryId,
        date: new Date(parsed.date),
        note: parsed.note || null
      },
      include: { category: true }
    });

    return NextResponse.json({
      id: updated.id,
      amount: Number(updated.amount),
      date: updated.date,
      note: updated.note,
      category: updated.category
    });
  } catch {
    return NextResponse.json({ error: "Не удалось обновить запись" }, { status: 400 });
  }
}

export async function DELETE(_: Request, { params }: Params) {
  const { userId, response } = await requireUserId();
  if (!userId) return response!;

  const { id } = await params;

  const existing = await prisma.expense.findFirst({
    where: { id, userId }
  });

  if (!existing) {
    return NextResponse.json({ error: "Запись не найдена" }, { status: 404 });
  }

  await prisma.expense.delete({ where: { id } });

  return NextResponse.json({ ok: true });
}
