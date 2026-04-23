import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireUserId } from "@/lib/server/auth";

export async function GET() {
  const { userId, response } = await requireUserId();
  if (!userId) return response!;

  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" }
  });

  return NextResponse.json(categories);
}
