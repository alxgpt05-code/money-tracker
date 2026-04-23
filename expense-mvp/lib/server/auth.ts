import { NextResponse } from "next/server";
import { getSessionUserId } from "@/lib/auth/session";

export async function requireUserId() {
  const userId = await getSessionUserId();
  if (!userId) {
    return { userId: null, response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  return { userId, response: null };
}
