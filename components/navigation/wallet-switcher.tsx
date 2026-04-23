"use client";

import { usePathname } from "next/navigation";
import { setActiveWalletAction } from "@/lib/services/actions";
import { Select } from "@/components/ui/select";

export function WalletSwitcher({
  wallets,
  activeWalletId,
}: {
  wallets: { id: string; name: string; isArchived: boolean }[];
  activeWalletId?: string | null;
}) {
  const pathname = usePathname();
  const visibleWallets = wallets.filter((wallet) => !wallet.isArchived);

  if (visibleWallets.length === 0) {
    return null;
  }

  return (
    <form action={setActiveWalletAction} className="min-w-0 w-full max-w-[14rem]">
      <input type="hidden" name="redirectTo" value={pathname || "/dashboard"} />
      <Select
        name="walletId"
        defaultValue={activeWalletId ?? visibleWallets[0]?.id}
        className="h-10 w-full rounded-[20px] border-white/8 bg-[#0b120d]/85 text-xs shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]"
        onChange={(event) => event.currentTarget.form?.requestSubmit()}
      >
        {visibleWallets.map((wallet) => (
          <option key={wallet.id} value={wallet.id}>
            {wallet.name}
          </option>
        ))}
      </Select>
    </form>
  );
}
