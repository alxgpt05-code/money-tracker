import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { CLIENT_USER_ID_COOKIE, SESSION_COOKIE, signSessionValue } from "@/lib/auth/dev-auth";

const AUTH_DEBUG = process.env.AUTH_DEBUG === "true";

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

function authDebug(step: string, payload?: Record<string, unknown>) {
  if (!AUTH_DEBUG) return;
  if (payload) {
    console.info(`[auth][register] ${step}`, payload);
    return;
  }
  console.info(`[auth][register] ${step}`);
}

export async function POST(request: Request) {
  try {
    authDebug("route hit");

    if (!process.env.DATABASE_URL) {
      authDebug("missing DATABASE_URL");
      return NextResponse.json(
        { ok: false, error: "DATABASE_URL не задан. Проверьте файл .env" },
        { status: 500 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { email?: string; password?: string; confirmPassword?: string }
      | null;
    authDebug("parsed body", {
      hasBody: Boolean(body),
      hasEmail: Boolean(body?.email),
      hasPassword: Boolean(body?.password),
      hasConfirmPassword: Boolean(body?.confirmPassword),
    });

    const email = normalizeEmail(body?.email ?? "");
    const password = body?.password ?? "";
    const confirmPassword = body?.confirmPassword ?? "";

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      authDebug("validation failed: invalid email");
      return NextResponse.json({ ok: false, error: "Введите корректную почту" }, { status: 400 });
    }

    if (password.length < 8) {
      authDebug("validation failed: short password");
      return NextResponse.json(
        { ok: false, error: "Пароль должен быть не короче 8 символов" },
        { status: 400 },
      );
    }

    if (password !== confirmPassword) {
      authDebug("validation failed: password mismatch");
      return NextResponse.json({ ok: false, error: "Пароли не совпадают" }, { status: 400 });
    }

    authDebug("user lookup", { email });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      authDebug("duplicate email", { email, userId: existing.id });
      return NextResponse.json(
        { ok: false, error: "Пользователь с таким email уже существует" },
        { status: 409 },
      );
    }

    authDebug("password hash");
    const passwordHash = await bcrypt.hash(password, 12);
    authDebug("user create");
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash,
        name: buildDisplayName(email),
      },
    });
    authDebug("session creation", { userId: user.id });
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

    authDebug("response ready", { userId: user.id });
    return response;
  } catch (error: unknown) {
    authDebug("caught error", {
      error: error instanceof Error ? error.message : String(error),
    });
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
