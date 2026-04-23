import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

const protectedPaths = ["/dashboard", "/add", "/history", "/analytics", "/account", "/accounts", "/transactions", "/settings", "/monthly-close"];
const authPaths = ["/login", "/register", "/forgot-password"];
const SESSION_COOKIE = "capital_session";
const CLIENT_USER_ID_COOKIE = "capital_user_id";

async function verifySessionValue(raw: string | undefined): Promise<string | null> {
  if (!raw) return null;
  const [userId, signature] = raw.split(".");
  if (!userId || !signature) return null;

  const secret = process.env.AUTH_SECRET || "dev-insecure-secret-change-me";
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const expectedBuffer = await crypto.subtle.sign("HMAC", key, enc.encode(userId));
  const expectedHex = Array.from(new Uint8Array(expectedBuffer))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");

  // simple timing-safe-ish check (length equality + constant-time loop)
  if (expectedHex.length !== signature.length) return null;
  let result = 0;
  for (let i = 0; i < expectedHex.length; i += 1) {
    result |= expectedHex.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return result === 0 ? userId : null;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const session = request.cookies.get(SESSION_COOKIE)?.value;
  const sessionUserId = await verifySessionValue(session);
  const hasValidSession = Boolean(sessionUserId);
  const userIdCookie = request.cookies.get(CLIENT_USER_ID_COOKIE)?.value;
  const isProtected = protectedPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));
  const isAuth = authPaths.some((path) => pathname === path || pathname.startsWith(`${path}/`));

  if (isProtected && !hasValidSession) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    if (session) response.cookies.delete(SESSION_COOKIE);
    return response;
  }

  if (isAuth && hasValidSession) {
    const url = new URL("/dashboard", request.url);
    const response = NextResponse.redirect(url);
    if (sessionUserId && userIdCookie !== sessionUserId) {
      response.cookies.set(CLIENT_USER_ID_COOKIE, sessionUserId, {
        httpOnly: false,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 30,
      });
    }
    return response;
  }

  if (hasValidSession && sessionUserId && userIdCookie !== sessionUserId) {
    const response = NextResponse.next();
    response.cookies.set(CLIENT_USER_ID_COOKIE, sessionUserId, {
      httpOnly: false,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge: 60 * 60 * 24 * 30,
    });
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/add/:path*",
    "/history/:path*",
    "/analytics/:path*",
    "/account/:path*",
    "/accounts/:path*",
    "/transactions/:path*",
    "/settings/:path*",
    "/monthly-close/:path*",
    "/login",
    "/register",
    "/forgot-password",
  ],
};
