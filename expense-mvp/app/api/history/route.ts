import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/server/auth";
import { getMonthRange } from "@/lib/server/dates";

export async function GET(request: Request) {
  const { userId, response } = await requireUserId();
  if (!userId) return response!;

  const url = new URL(request.url);
  const month = url.searchParams.get("month");

  if (!month) {
    return NextResponse.json({ error: "Параметр month обязателен" }, { status: 400 });
  }

  try {
    const { start, end } = getMonthRange(month);

    const expenses = await prisma.expense.findMany({
      where: {
        userId,
        date: { gte: start, lt: end }
      },
      include: { category: true },
      orderBy: [{ date: "desc" }, { createdAt: "desc" }]
    });

    const grouped = expenses.reduce<Record<string, any[]>>((acc, item) => {
      const key = item.date.toISOString().slice(0, 10);
      if (!acc[key]) acc[key] = [];
      acc[key].push({
        id: item.id,
        amount: Number(item.amount),
        date: item.date,
        note: item.note,
        category: item.category
      });
      return acc;
    }, {});

    return NextResponse.json(grouped);
  } catch {
    return NextResponse.json({ error: "Не удалось загрузить историю" }, { status: 400 });
  }
}
