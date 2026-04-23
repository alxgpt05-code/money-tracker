import { SESSION_COOKIE, verifySessionValue } from "@/lib/auth/dev-auth";

export function getRequestUserId(request: Request): string | null {
  const cookieHeader = request.headers.get("cookie");
  const sessionRaw = cookieHeader
    ?.split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${SESSION_COOKIE}=`))
    ?.slice(SESSION_COOKIE.length + 1);

  return verifySessionValue(sessionRaw);
}
