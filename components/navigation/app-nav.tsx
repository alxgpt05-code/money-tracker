"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { BarChart3, CreditCard, Plus, Wallet2 } from "lucide-react";
import { cn } from "@/lib/utils";

export const appNavItems = [
  { href: "/dashboard", label: "Главная", icon: Wallet2 },
  { href: "/accounts", label: "Счета", icon: CreditCard },
  { href: "/transactions", label: "Операции", icon: Plus },
  { href: "/analytics", label: "Аналитика", icon: BarChart3 },
];

export function DesktopSidebar() {
  const pathname = usePathname();

  return (
    <aside className="hidden w-[280px] shrink-0 xl:block">
      <div className="glass-panel sticky top-24 rounded-[32px] p-3">
        <div className="mb-4 rounded-[28px] border border-white/8 bg-[radial-gradient(circle_at_top_right,rgba(182,255,77,0.08),transparent_30%),linear-gradient(180deg,rgba(255,255,255,0.012),rgba(255,255,255,0)),rgba(11,18,13,0.72)] p-5">
          <p className="text-xs uppercase tracking-[0.3em] text-primary/80">Капитал</p>
          <h2 className="strong-text mt-3 text-2xl font-semibold tracking-tight">Личный трекер</h2>
          <p className="muted-text mt-2 text-sm leading-6">Главное здесь: капитал, счета и быстрый ввод ежедневных операций.</p>
        </div>
        <nav className="space-y-2">
          {appNavItems.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-[24px] px-4 py-3 text-sm transition duration-200",
                  active ? "bg-primary text-primary-foreground shadow-glow" : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </div>
    </aside>
  );
}

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-white/8 bg-[rgba(8,11,9,0.68)] px-3 pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)] pt-3 backdrop-blur-2xl xl:hidden">
      <div className="mx-auto grid max-w-xl grid-cols-5 gap-2">
        {appNavItems.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href || pathname.startsWith(`${item.href}/`);
          const isCenter = item.href === "/transactions";
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex min-h-14 flex-col items-center justify-center gap-1 rounded-[22px] text-[11px] transition duration-200 active:scale-[0.98]",
                active ? "bg-primary text-primary-foreground" : "text-muted-foreground",
                isCenter && !active ? "bg-black/25 text-foreground" : "",
              )}
            >
              <Icon className={cn("h-4 w-4", isCenter ? "h-5 w-5" : "")} />
              {item.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
