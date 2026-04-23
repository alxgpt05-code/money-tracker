import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/server/auth";
import { expenseInputSchema } from "@/lib/server/validators";
import { getMonthRange } from "@/lib/server/dates";

export async function GET(request: Request) {
  const { userId, response } = await requireUserId();
  if (!userId) return response!;

  const url = new URL(request.url);
  const month = url.searchParams.get("month");

  const where = month
    ? (() => {
        const { start, end } = getMonthRange(month);
        return {
          userId,
          date: {
            gte: start,
            lt: end
          }
        };
      })()
    : { userId };

  const expenses = await prisma.expense.findMany({
    where,
    orderBy: [{ date: "desc" }, { createdAt: "desc" }],
    include: {
      category: true
    }
  });

  return NextResponse.json(
    expenses.map((item) => ({
      id: item.id,
      amount: Number(item.amount),
      date: item.date,
      note: item.note,
      category: item.category
    }))
  );
}

export async function POST(request: Request) {
  const { userId, response } = await requireUserId();
  if (!userId) return response!;

  try {
    const raw = await request.json();
    const parsed = expenseInputSchema.parse(raw);

    const expense = await prisma.expense.create({
      data: {
        userId,
        amount: parsed.amount,
        categoryId: parsed.categoryId,
        date: new Date(parsed.date),
        note: parsed.note || null
      },
      include: { category: true }
    });

    return NextResponse.json({
      id: expense.id,
      amount: Number(expense.amount),
      date: expense.date,
      note: expense.note,
      category: expense.category
    });
  } catch {
    return NextResponse.json({ error: "Не удалось добавить расход" }, { status: 400 });
  }
}
