import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/server/auth";
import { settingsSchema } from "@/lib/server/validators";

export async function GET() {
  const { userId, response } = await requireUserId();
  if (!userId) return response!;

  const settings = await prisma.notificationSettings.findUnique({
    where: { userId }
  });

  if (!settings) {
    const created = await prisma.notificationSettings.create({
      data: { userId }
    });
    return NextResponse.json(created);
  }

  return NextResponse.json(settings);
}

export async function PUT(request: Request) {
  const { userId, response } = await requireUserId();
  if (!userId) return response!;

  try {
    const raw = await request.json();
    const parsed = settingsSchema.parse(raw);

    const settings = await prisma.notificationSettings.upsert({
      where: { userId },
      update: {
        enabled: parsed.enabled,
        time: parsed.time,
        timezone: parsed.timezone
      },
      create: {
        userId,
        enabled: parsed.enabled,
        time: parsed.time,
        timezone: parsed.timezone
      }
    });

    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ error: "Не удалось сохранить настройки" }, { status: 400 });
  }
}
