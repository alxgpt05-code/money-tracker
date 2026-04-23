import bcrypt from "bcryptjs";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { createSession } from "@/lib/auth/session";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const userId = String(body?.userId || "").trim();
    const password = String(body?.password || "");

    if (!userId || !password) {
      return NextResponse.json({ error: "Введите id пользователя и пароль" }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      return NextResponse.json({ error: "Пользователь не найден" }, { status: 401 });
    }

    const valid = await bcrypt.compare(password, user.passwordHash);
    if (!valid) {
      return NextResponse.json({ error: "Неверный пароль" }, { status: 401 });
    }

    await createSession(user.id);

    return NextResponse.json({ ok: true, userId: user.id });
  } catch {
    return NextResponse.json({ error: "Не удалось войти" }, { status: 500 });
  }
}
