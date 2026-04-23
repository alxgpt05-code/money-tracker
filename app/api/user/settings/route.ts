import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  SESSION_COOKIE,
  verifySessionValue,
} from "@/lib/auth/dev-auth";

function getUserIdFromCookieHeader(cookieHeader: string | null): string | null {
  const sessionRaw = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  return verifySessionValue(sessionRaw);
}

export async function GET(request: Request) {
  try {
    const userId = getUserIdFromCookieHeader(request.headers.get("cookie"));

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const settings = await prisma.notificationSettings.findUnique({
      where: { userId },
      select: {
        dailyReminderEnabled: true,
        dailyReminderTime: true,
      },
    });

    return NextResponse.json({
      ok: true,
      settings: settings ?? DEFAULT_NOTIFICATION_SETTINGS,
    });
  } catch (error: unknown) {
    console.error("[user/settings][GET] error", error);
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { ok: false, error: "База данных недоступна. Проверьте локальный PostgreSQL." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Не удалось загрузить настройки уведомлений" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const userId = getUserIdFromCookieHeader(request.headers.get("cookie"));

    if (!userId) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json().catch(() => null)) as
      | { dailyReminderEnabled?: boolean; dailyReminderTime?: string }
      | null;

    const dailyReminderEnabled = Boolean(body?.dailyReminderEnabled);
    const dailyReminderTime =
      typeof body?.dailyReminderTime === "string"
        ? body.dailyReminderTime
        : DEFAULT_NOTIFICATION_SETTINGS.dailyReminderTime;

    if (!/^\d{2}:\d{2}$/.test(dailyReminderTime)) {
      return NextResponse.json({ ok: false, error: "Некорректное время" }, { status: 400 });
    }

    // TODO: подключить реальную web push отправку через service worker + backend scheduler.
    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: {
        dailyReminderEnabled,
        dailyReminderTime,
      },
      create: {
        userId,
        dailyReminderEnabled,
        dailyReminderTime,
      },
      select: {
        dailyReminderEnabled: true,
        dailyReminderTime: true,
      },
    });

    return NextResponse.json({ ok: true, settings });
  } catch (error: unknown) {
    console.error("[user/settings][POST] error", error);
    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { ok: false, error: "База данных недоступна. Проверьте локальный PostgreSQL." },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Не удалось сохранить настройки уведомлений" },
      { status: 500 },
    );
  }
}
