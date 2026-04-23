import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { getDatabaseUnavailableMessage } from "@/lib/db/error-messages";
import {
  CLIENT_USER_ID_COOKIE,
  SESSION_COOKIE,
  signSessionValue,
} from "@/lib/auth/dev-auth";

const AUTH_DEBUG = process.env.AUTH_DEBUG === "true";

function isSecureCookie(request: Request) {
  if (process.env.NODE_ENV !== "production") return false;
  const forwardedProto = request.headers.get("x-forwarded-proto");
  if (forwardedProto) {
    return forwardedProto.split(",")[0]?.trim() === "https";
  }
  return new URL(request.url).protocol === "https:";
}

function normalizeEmail(value: string): string {
  return value.trim().toLowerCase();
}

function authDebug(step: string, payload?: Record<string, unknown>) {
  if (!AUTH_DEBUG) return;
  if (payload) {
    console.info(`[auth][login] ${step}`, payload);
    return;
  }
  console.info(`[auth][login] ${step}`);
}

export async function POST(request: Request) {
  try {
    authDebug("route hit");

    if (!process.env.DATABASE_URL) {
      authDebug("missing DATABASE_URL");
      return NextResponse.json(
        { ok: false, error: getDatabaseUnavailableMessage() },
        { status: 500 },
      );
    }

    const body = (await request.json().catch(() => null)) as
      | { email?: string; password?: string }
      | null;
    authDebug("parsed body", {
      hasBody: Boolean(body),
      hasEmail: Boolean(body?.email),
      hasPassword: Boolean(body?.password),
    });

    const email = normalizeEmail(body?.email ?? "");
    const password = body?.password ?? "";

    if (!email || !password) {
      authDebug("validation failed: missing email or password");
      return NextResponse.json({ ok: false, error: "Введите почту и пароль" }, { status: 400 });
    }

    authDebug("user lookup", { email });
    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      authDebug("user not found", { email });
      return NextResponse.json({ ok: false, error: "Неверная почта или пароль" }, { status: 401 });
    }

    authDebug("password compare", { userId: user.id });
    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      authDebug("password mismatch", { userId: user.id });
      return NextResponse.json({ ok: false, error: "Неверная почта или пароль" }, { status: 401 });
    }

    authDebug("session creation", { userId: user.id });
    const secureCookie = isSecureCookie(request);
    authDebug("cookie policy", { secureCookie });
    const response = NextResponse.json({ ok: true });
    response.cookies.set(SESSION_COOKIE, signSessionValue(user.id), {
      httpOnly: true,
      sameSite: "lax",
      secure: secureCookie,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    response.cookies.set(CLIENT_USER_ID_COOKIE, user.id, {
      httpOnly: false,
      sameSite: "lax",
      secure: secureCookie,
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });

    authDebug("response ready", { userId: user.id });
    return response;
  } catch (error: unknown) {
    authDebug("caught error", {
      error: error instanceof Error ? error.message : String(error),
    });
    console.error("[login] error", error);

    if (error instanceof Prisma.PrismaClientInitializationError) {
      return NextResponse.json(
        { ok: false, error: getDatabaseUnavailableMessage() },
        { status: 500 },
      );
    }

    return NextResponse.json(
      { ok: false, error: "Внутренняя ошибка сервера при входе" },
      { status: 500 },
    );
  }
}
