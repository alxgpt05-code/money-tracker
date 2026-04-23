import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/server/auth";

export async function POST(request: Request) {
  const { userId, response } = await requireUserId();
  if (!userId) return response!;

  const body = await request.json();
  const endpoint = String(body?.endpoint || "").trim();

  if (!endpoint) {
    return NextResponse.json({ error: "endpoint обязателен" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      endpoint,
      userId
    }
  });

  return NextResponse.json({ ok: true });
}
