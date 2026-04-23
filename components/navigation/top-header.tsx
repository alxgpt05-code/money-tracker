"use client";

import Link from "next/link";
import { BellDot, LogOut, Settings } from "lucide-react";
import { logoutAction } from "@/lib/services/actions";
import { Button } from "@/components/ui/button";

export function TopHeader() {
  return (
    <header className="sticky top-0 z-30 border-b border-white/6 bg-[rgba(8,11,9,0.16)] px-4 pb-3 pt-[calc(env(safe-area-inset-top,0px)+0.75rem)] backdrop-blur-2xl">
      <div className="mx-auto flex max-w-7xl min-w-0 items-center gap-3">
        <div className="min-w-0 flex-1">
          <div className="rounded-2xl border border-white/8 bg-[rgba(12,16,13,0.72)] px-4 py-2 shadow-glow">
            <div className="text-sm text-white/80">Capital Tracker</div>
            <div className="strong-text text-lg font-semibold leading-tight">Единый кабинет</div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Button asChild variant="ghost" size="icon" aria-label="Настройки">
            <Link href="/settings/wallet">
              <Settings className="h-4 w-4" />
            </Link>
          </Button>
          <Button variant="ghost" size="icon" aria-label="Уведомления">
            <BellDot className="h-4 w-4" />
          </Button>
          <form action={logoutAction}>
            <Button variant="ghost" size="icon" aria-label="Выйти">
              <LogOut className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </div>
    </header>
  );
}
