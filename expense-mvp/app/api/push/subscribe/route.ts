import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/server/auth";
import { subscriptionSchema } from "@/lib/server/validators";

export async function POST(request: Request) {
  const { userId, response } = await requireUserId();
  if (!userId) return response!;

  try {
    const raw = await request.json();
    const parsed = subscriptionSchema.parse(raw);

    await prisma.pushSubscription.upsert({
      where: { endpoint: parsed.endpoint },
      update: {
        userId,
        p256dh: parsed.keys.p256dh,
        auth: parsed.keys.auth
      },
      create: {
        userId,
        endpoint: parsed.endpoint,
        p256dh: parsed.keys.p256dh,
        auth: parsed.keys.auth
      }
    });

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить push подписку" }, { status: 400 });
  }
}
