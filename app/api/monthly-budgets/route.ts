import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getRequestUserId } from "@/lib/auth/request-session";

export async function POST(request: Request) {
  try {
    const userId = getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | { year?: number; month?: number; amount?: number }
      | null;

    const year = Number(body?.year);
    const month = Number(body?.month);
    const amount = Number(body?.amount);

    if (!Number.isInteger(year) || !Number.isInteger(month) || month < 1 || month > 12) {
      return NextResponse.json({ ok: false, error: "Некорректный месяц" }, { status: 400 });
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return NextResponse.json({ ok: false, error: "Введите сумму больше нуля" }, { status: 400 });
    }

    const budget = await prisma.monthlyBudget.create({
      data: {
        userId,
        year,
        month,
        amount: new Prisma.Decimal(Math.round(amount)),
      },
      select: {
        id: true,
        userId: true,
        year: true,
        month: true,
        amount: true,
      },
    });

    return NextResponse.json({
      ok: true,
      data: {
        budget: {
          id: budget.id,
          userId: budget.userId,
          year: budget.year,
          month: budget.month,
          amount: Number(budget.amount),
        },
      },
    });
  } catch (error: unknown) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ ok: false, error: "Бюджет на этот месяц уже задан" }, { status: 409 });
    }
    console.error("[monthly-budgets][POST] error", error);
    return NextResponse.json({ ok: false, error: "Не удалось сохранить бюджет" }, { status: 500 });
  }
}
