"use server";

import { prisma } from "@/lib/db/prisma";

export async function resolveActiveWallet(userId: string, requestedWalletId?: string | null) {
  const wallets = await prisma.wallet.findMany({
    where: { userId },
    orderBy: [{ isArchived: "asc" }, { sortOrder: "asc" }],
  });

  const activeWallet =
    wallets.find((wallet) => wallet.id === requestedWalletId && !wallet.isArchived) ??
    wallets.find((wallet) => !wallet.isArchived) ??
    null;

  return {
    wallets,
    activeWallet,
  };
}
