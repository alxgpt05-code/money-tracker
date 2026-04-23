import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { CLIENT_USER_ID_COOKIE, SESSION_COOKIE, signSessionValue } from "@/lib/auth/dev-auth";

function isSecureCookie() {
  return process.env.NODE_ENV === "production";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function buildDisplayName(email: string): string {
  const [localPart] = email.split("@");
  const normalized = localPart?.replace(/[^a-zA-Z0-9а-яА-Я]/g, " ").trim();
  if (!normalized) {
    return "User";
  }
  return normalized.slice(0, 80);
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
      | { email?: string; password?: string; confirmPassword?: string }
      | null;

    const email = normalizeEmail(body?.email ?? "");
    const password = body?.password ?? "";
    const confirmPassword = body?.confirmPassword ?? "";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Введите корректную почту" }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json(
        { ok: false, error: "Пароль должен быть не короче 8 символов" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      return NextResponse.json({ ok: false, error: "Пароли не совпадают" }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return NextResponse.json(
        { ok: false, error: "Пользователь с таким email уже существует" },
        { status: 409 },
      );
    }

    const passwordHash = await bcrypt.hash(password, 12);
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: buildDisplayName(email),
      },
    });
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
    console.error("[register] error", error);

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json(
        { ok: false, error: "Пользователь с таким email уже существует" },
        { status: 409 },
      );
    }

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
      { ok: false, error: "Внутренняя ошибка сервера при регистрации" },
      { status: 500 },
    );
  }
}
