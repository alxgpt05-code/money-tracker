import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import {
  CLIENT_USER_ID_COOKIE,
  SESSION_COOKIE,
  signSessionValue,
} from "@/lib/auth/dev-auth";

function isSecureCookie() {
  return process.env.NODE_ENV === "production";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

export async function POST(request: Request) {
  try {
    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { ok: false, error: "DATABASE_URL не задан. Проверьте файл .env" },
        { status: 500 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { email?: string; password?: string }
      | null;

    const email = normalizeEmail(body?.email ?? "");
    const password = body?.password ?? "";

    if (!email || !password) {
      return NextResponse.json({ ok: false, error: "Введите почту и пароль" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return NextResponse.json({ ok: false, error: "Неверная почта или пароль" }, { status: 401 });
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      return NextResponse.json({ ok: false, error: "Неверная почта или пароль" }, { status: 401 });
    }

    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, signSessionValue(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: isSecureCookie(),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    response.cookies.set(CLIENT_USER_ID_COOKIE, user.id, {
      httpOnly: false,
      sameSite: "lax",
      secure: isSecureCookie(),
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    return response;
  } catch (error: unknown) {
    console.error("[login] error", error);

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        {
          ok: false,
          error:
            "База данных недоступна. Запустите Docker Desktop, затем выполните: npm run db:up && npm run prisma:migrate && npm run prisma:seed",
        },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Внутренняя ошибка сервера при входе" },
      { status: 500 },
    );
  }
}
