import { createHmac } from "node:crypto";
import {
  DEFAULT_NOTIFICATION_SETTINGS,
  SESSION_COOKIE,
  CLIENT_USER_ID_COOKIE,
} from "@/lib/auth/shared";

export {
  SESSION_COOKIE,
  CLIENT_USER_ID_COOKIE,
  DEFAULT_NOTIFICATION_SETTINGS,
};

function getAuthSecret() {
  return process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
}

export function signSessionValue(userId: string) {
  const signature = createHmac("sha256", getAuthSecret()).update(userId).digest("hex");
  return `${userId}.${signature}`;
}

export function verifySessionValue(raw: string | undefined): string | null {
  if (!raw) return null;
  const [userId, signature] = raw.split(".");
  if (!userId || !signature) return null;
  const expected = createHmac("sha256", getAuthSecret()).update(userId).digest("hex");
  if (expected.length !== signature.length) return null;

  let diff = 0;
  for (let index = 0; index < expected.length; index += 1) {
    diff |= expected.charCodeAt(index) ^ signature.charCodeAt(index);
  }

  return diff === 0 ? userId : null;
}
