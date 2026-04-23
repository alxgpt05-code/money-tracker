import { NextResponse } from "next/server";
import { CLIENT_USER_ID_COOKIE } from "@/lib/auth/dev-auth";

const SESSION_COOKIE = "capital_session";
const ACTIVE_WALLET_COOKIE = "capital_active_wallet";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  response.cookies.delete(SESSION_COOKIE);
  response.cookies.delete(ACTIVE_WALLET_COOKIE);
  response.cookies.delete(CLIENT_USER_ID_COOKIE);
  return response;
}
