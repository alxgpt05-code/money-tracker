import crypto from "node:crypto";
import { cookies } from "next/headers";

const COOKIE_NAME = "expense_session";

type SessionPayload = {
  userId: string;
  exp: number;
};

function getSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error("JWT_SECRET is not set");
  }
  return secret;
}

function encode(payload: SessionPayload) {
  const json = JSON.stringify(payload);
  const body = Buffer.from(json).toString("base64url");
  const signature = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");

  return `${body}.${signature}`;
}

function decode(token: string): SessionPayload | null {
  const [body, signature] = token.split(".");
  if (!body || !signature) return null;

  const expectedSignature = crypto
    .createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url");

  if (expectedSignature !== signature) return null;

  const payload = JSON.parse(Buffer.from(body, "base64url").toString("utf-8")) as SessionPayload;
  if (!payload.userId || typeof payload.exp !== "number") return null;
  if (Date.now() > payload.exp) return null;

  return payload;
}

export async function createSession(userId: string) {
  const token = encode({
    userId,
    exp: Date.now() + 1000 * 60 * 60 * 24 * 30
  });

  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 60 * 60 * 24 * 30
  });
}

export async function clearSession() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUserId() {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;

  const payload = decode(token);
  if (!payload) return null;

  return payload.userId;
}
