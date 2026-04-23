import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const token = request.cookies.get("expense_session")?.value;
  const isAuthPage = request.nextUrl.pathname.startsWith("/login");
  const isApiAuth = request.nextUrl.pathname.startsWith("/api/auth");
  const isPublic =
    request.nextUrl.pathname.startsWith("/_next") ||
    request.nextUrl.pathname.startsWith("/icons") ||
    request.nextUrl.pathname.startsWith("/sw.js") ||
    request.nextUrl.pathname.startsWith("/manifest") ||
    request.nextUrl.pathname === "/";

  if (!token && !isAuthPage && !isApiAuth && !isPublic) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (token && isAuthPage) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api/jobs/send-daily-reminders).*)"]
};
