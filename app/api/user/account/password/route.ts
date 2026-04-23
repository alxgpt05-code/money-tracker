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
    | { currentPassword?: string; newPassword?: string; confirmPassword?: string }
    | null;

  const currentPassword = body?.currentPassword ?? "";
  const newPassword = body?.newPassword ?? "";
  const confirmPassword = body?.confirmPassword ?? "";

  if (newPassword.length < 8) {
    return NextResponse.json({ ok: false, error: "Новый пароль должен быть не короче 8 символов" }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return NextResponse.json({ ok: false, error: "Пароли не совпадают" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) {
    return NextResponse.json({ ok: false, error: "Пользователь не найден" }, { status: 404 });
  }

  const passwordValid = await bcrypt.compare(currentPassword, user.passwordHash);
  if (!passwordValid) {
    return NextResponse.json({ ok: false, error: "Неверный текущий пароль" }, { status: 400 });
  }

  const passwordHash = await bcrypt.hash(newPassword, 12);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
    select: { id: true },
  });

  return NextResponse.json({ ok: true });
}
