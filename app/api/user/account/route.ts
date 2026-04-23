import { NextResponse } from "next/server";
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

export async function GET(request: Request) {
  const userId = getUserIdFromCookieHeader(request.headers.get("cookie"));

  if (!userId) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      email: true,
    },
  });

  if (!user) {
    return NextResponse.json({ ok: false, error: "Пользователь не найден" }, { status: 404 });
  }

  return NextResponse.json({
    ok: true,
    email: user.email,
  });
}
