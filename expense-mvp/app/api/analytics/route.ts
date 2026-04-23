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

    const grouped = await prisma.expense.groupBy({
      by: ["categoryId"],
      where: {
        userId,
        date: {
          gte: start,
          lt: end
        }
      },
      _sum: {
        amount: true
      }
    });

    const categories = await prisma.category.findMany();
    const byId = new Map(categories.map((c) => [c.id, c]));

    const items = grouped
      .map((item) => {
        const category = byId.get(item.categoryId);
        if (!category) return null;

        return {
          categoryId: item.categoryId,
          name: category.name,
          color: category.color,
          total: Number(item._sum.amount || 0)
        };
      })
      .filter(Boolean)
      .sort((a, b) => b!.total - a!.total) as Array<{
      categoryId: string;
      name: string;
      color: string;
      total: number;
    }>;

    const total = items.reduce((sum, item) => sum + item.total, 0);

    return NextResponse.json({
      total,
      biggest: items[0] || null,
      smallest: items.length ? items[items.length - 1] : null,
      items
    });
  } catch {
    return NextResponse.json({ error: "Не удалось собрать аналитику" }, { status: 400 });
  }
}
