import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { SESSION_COOKIE, verifySessionValue } from "@/lib/auth/dev-auth";

function getUserIdFromCookieHeader(cookieHeader: string | null): string | null {
  const sessionRaw = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  return verifySessionValue(sessionRaw);
}

export async function POST(request: Request) {
  const userId = getUserIdFromCookieHeader(request.headers.get("cookie"));

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as
    | { newEmail?: string; currentPassword?: string }
    | null;

  const newEmail = body?.newEmail?.trim().toLowerCase() ?? "";
  const currentPassword = body?.currentPassword ?? "";

  if (!newEmail || !/^\S+@\S+\.\S+$/.test(newEmail)) {
    return NextResponse.json({ ok: false, error: "Введите корректную почту" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ ok: false, error: "Пользователь не найден" }, { status: 404 });
  }

  const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ ok: false, error: "Неверный пароль подтверждения" }, { status: 400 });
  }

  const duplicated = await prisma.user.findFirst({
    where: {
      email: newEmail,
      NOT: { id: userId },
    },
    select: { id: true },
  });

  if (duplicated) {
    return NextResponse.json({ ok: false, error: "Пользователь с таким email уже существует" }, { status: 409 });
  }

  const updated = await prisma.user.update({
    where: { id: userId },
    data: {
      email: newEmail,
    },
    select: {
      email: true,
    },
  });

  return NextResponse.json({ ok: true, email: updated.email });
}
