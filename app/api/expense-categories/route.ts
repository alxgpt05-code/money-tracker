import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getRequestUserId } from "@/lib/auth/request-session";

const SYSTEM_OTHER_CATEGORY_NAME = "Прочее";
const CATEGORY_COLOR_PALETTE = [
  "#9AD97D",
  "#7EC9D8",
  "#AF9AE6",
  "#E6B07A",
  "#E294C3",
  "#D8CC78",
  "#76D2BE",
];

function resolveNextColor(nonSystemCount: number): string {
  return CATEGORY_COLOR_PALETTE[nonSystemCount % CATEGORY_COLOR_PALETTE.length];
}

export async function GET(request: Request) {
  try {
    const userId = getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const categoriesRaw = await prisma.expenseCategory.findMany({
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
    });

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
        categories,
        defaultCategoryId: defaultCategory?.id ?? null,
      },
    });
  } catch (error: unknown) {
    console.error("[expense-categories][GET] error", error);
    return NextResponse.json({ ok: false, error: "Не удалось загрузить категории" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const userId = getRequestUserId(request);
    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as { name?: string } | null;
    const name = body?.name?.trim() ?? "";

    if (!name) {
      return NextResponse.json({ ok: false, error: "Введите название категории" }, { status: 400 });
    }

    if (name.toLowerCase() === SYSTEM_OTHER_CATEGORY_NAME.toLowerCase()) {
      return NextResponse.json(
        { ok: false, error: `Категория \"${SYSTEM_OTHER_CATEGORY_NAME}\" уже системная` },
        { status: 400 },
      );
    }

    const existing = await prisma.expenseCategory.findFirst({
      where: {
        OR: [
          { userId, name: { equals: name, mode: "insensitive" } },
          { isSystem: true, name: { equals: name, mode: "insensitive" } },
        ],
      },
      select: {
        id: true,
        isArchived: true,
        userId: true,
        name: true,
        color: true,
        isSystem: true,
      },
    });

    if (existing && !existing.isArchived) {
      return NextResponse.json({ ok: false, error: "Такая категория уже существует" }, { status: 409 });
    }

    const nonSystemCount = await prisma.expenseCategory.count({
      where: {
        userId,
        isSystem: false,
      },
    });

    const color = resolveNextColor(nonSystemCount);

    const category = existing && existing.userId === userId
      ? await prisma.expenseCategory.update({
          where: { id: existing.id },
          data: {
            isArchived: false,
            color: existing.color ?? color,
            name,
          },
          select: {
            id: true,
            userId: true,
            name: true,
            color: true,
            isSystem: true,
            isArchived: true,
          },
        })
      : await prisma.expenseCategory.create({
          data: {
            userId,
            name,
            color,
            isSystem: false,
            isArchived: false,
          },
          select: {
            id: true,
            userId: true,
            name: true,
            color: true,
            isSystem: true,
            isArchived: true,
          },
        });

    return NextResponse.json({
      ok: true,
      data: {
        category: {
          id: category.id,
          userId: category.userId ?? userId,
          name: category.name,
          color: category.color ?? undefined,
          isSystem: category.isSystem,
          isArchived: category.isArchived,
        },
      },
    });
  } catch (error: unknown) {
    console.error("[expense-categories][POST] error", error);
    return NextResponse.json({ ok: false, error: "Не удалось сохранить категорию" }, { status: 500 });
  }
}
