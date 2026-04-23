"use server";

import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";

const SESSION_COOKIE = "capital_session";
const ACTIVE_WALLET_COOKIE = "capital_active_wallet";

function getAuthSecret() {
  return process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
}

async function isSecureRequest() {
  const headerStore = await headers();
  const proto = headerStore.get("x-forwarded-proto");
  if (proto) {
    return proto.split(",")[0]?.trim() === "https";
  }
  return process.env.NODE_ENV === "production";
}

function signSessionValue(userId: string) {
  const signature = createHmac("sha256", getAuthSecret()).update(userId).digest("hex");
  return `${userId}.${signature}`;
}

function verifySessionValue(raw: string | undefined) {
  if (!raw) return null;
  const [userId, signature] = raw.split(".");
  if (!userId || !signature) return null;
  const expected = createHmac("sha256", getAuthSecret()).update(userId).digest("hex");
  const valid =
    signature.length === expected.length &&
    timingSafeEqual(Buffer.from(signature, "utf8"), Buffer.from(expected, "utf8"));
  return valid ? userId : null;
}

export async function createSession(userId: string) {
  const cookieStore = await cookies();
  cookieStore.set(SESSION_COOKIE, signSessionValue(userId), {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function clearSession() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
  cookieStore.delete(ACTIVE_WALLET_COOKIE);
}

export async function setActiveWalletCookie(walletId: string) {
  const cookieStore = await cookies();
  cookieStore.set(ACTIVE_WALLET_COOKIE, walletId, {
    httpOnly: true,
    sameSite: "lax",
    secure: await isSecureRequest(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}

export async function getActiveWalletCookie() {
  const cookieStore = await cookies();
  return cookieStore.get(ACTIVE_WALLET_COOKIE)?.value ?? null;
}

export async function getCurrentUser() {
  const cookieStore = await cookies();
  const signedUserId = cookieStore.get(SESSION_COOKIE)?.value;
  const userId = verifySessionValue(signedUserId);

  if (!userId) {
    return null;
  }

  return prisma.user.findUnique({
    where: { id: userId },
    include: {
      wallets: {
        orderBy: [{ isArchived: "asc" }, { sortOrder: "asc" }],
      },
    },
  });
}

export async function getUserContext() {
  const user = await getCurrentUser();
  if (!user) return null;

  const walletCookie = await getActiveWalletCookie();
  const activeWallet =
    user.wallets.find((wallet) => wallet.id === walletCookie && !wallet.isArchived) ??
    user.wallets.find((wallet) => !wallet.isArchived) ??
    user.wallets[0] ??
    null;

  return {
    user,
    wallets: user.wallets,
    activeWallet,
  };
}

export async function requireUser() {
  const context = await getUserContext();
  if (!context?.user) {
    redirect("/login");
  }
  return context.user;
}

export async function requireUserContext() {
  const context = await getUserContext();
  if (!context?.user) {
    redirect("/login");
  }
  return context;
}

export async function authenticate(email: string, password: string) {
  const user = await prisma.user.findUnique({
    where: { email: email.toLowerCase() },
  });

  if (!user) {
    return null;
  }

  const isValid = await bcrypt.compare(password, user.passwordHash);
  return isValid ? user : null;
}

export async function registerUser(args: {
  email: string;
  password: string;
  name: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: args.email.toLowerCase() },
  });

  if (existing) {
    return { error: "Пользователь с таким email уже существует" as const };
  }

  const passwordHash = await bcrypt.hash(args.password, 12);

  const user = await prisma.user.create({
    data: {
      email: args.email.toLowerCase(),
      passwordHash,
      name: args.name,
    },
  });

  return { user };
}
