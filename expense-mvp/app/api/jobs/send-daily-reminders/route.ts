import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { localTimeInTimezone } from "@/lib/server/dates";
import { sendPushNotification } from "@/lib/server/webpush";

export async function POST(request: Request) {
  const expectedSecret = process.env.CRON_SECRET;
  const providedSecret = request.headers.get("x-cron-secret");

  if (!expectedSecret || providedSecret !== expectedSecret) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const now = new Date();
  const settings = await prisma.notificationSettings.findMany({
    where: { enabled: true }
  });

  let sent = 0;

  for (const setting of settings) {
    const localTime = localTimeInTimezone(now, setting.timezone);
    if (localTime !== setting.time) continue;

    const subscriptions = await prisma.pushSubscription.findMany({
      where: { userId: setting.userId }
    });

    for (const sub of subscriptions) {
      const result = await sendPushNotification(
        {
          endpoint: sub.endpoint,
          p256dh: sub.p256dh,
          auth: sub.auth
        },
        {
          title: "Запиши траты за сегодня",
          body: "Не забудь внести сегодняшние расходы."
        }
      );

      if (!result.ok && result.reason === "expired") {
        await prisma.pushSubscription.delete({ where: { endpoint: sub.endpoint } });
      }

      if (result.ok) sent += 1;
    }
  }

  return NextResponse.json({ ok: true, sent });
}
