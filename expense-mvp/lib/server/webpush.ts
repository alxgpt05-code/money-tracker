import webpush from "web-push";

let configured = false;

export function configureWebPush() {
  if (configured) return;

  const publicKey = process.env.VAPID_PUBLIC_KEY;
  const privateKey = process.env.VAPID_PRIVATE_KEY;
  const subject = process.env.VAPID_SUBJECT;

  if (!publicKey || !privateKey || !subject) {
    return;
  }

  webpush.setVapidDetails(subject, publicKey, privateKey);
  configured = true;
}

export async function sendPushNotification(
  subscription: { endpoint: string; p256dh: string; auth: string },
  payload: { title: string; body: string }
) {
  configureWebPush();

  if (!configured) {
    return { ok: false, reason: "vapid_not_configured" as const };
  }

  try {
    await webpush.sendNotification(
      {
        endpoint: subscription.endpoint,
        keys: {
          p256dh: subscription.p256dh,
          auth: subscription.auth
        }
      },
      JSON.stringify(payload)
    );

    return { ok: true as const };
  } catch (error: any) {
    const statusCode = error?.statusCode;
    if (statusCode === 404 || statusCode === 410) {
      return { ok: false, reason: "expired" as const };
    }

    return { ok: false, reason: "failed" as const };
  }
}
