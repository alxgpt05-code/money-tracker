"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { ChartNoAxesColumn, History, House, LogOut, Menu, Plus, Settings, UserCircle2 } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Главная", icon: House },
  { href: "/add", label: "Добавить", icon: Plus, center: true },
];

const MENU_ITEMS = [
  { href: "/history", label: "История", icon: History },
  { href: "/analytics", label: "Аналитика", icon: ChartNoAxesColumn },
  { href: "/settings", label: "Настройки", icon: Settings },
  { href: "/account", label: "Аккаунт", icon: UserCircle2 },
];

export function BottomNav() {
  const pathname = usePathname();
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  return (
    <>
      {isMenuOpen ? (
        <div
          className="fixed inset-0 z-40 bg-black/50 backdrop-blur-md"
          onClick={() => setIsMenuOpen(false)}
          aria-hidden="true"
        >
          <div
            className="absolute inset-x-0 bottom-[calc(env(safe-area-inset-bottom,0px)+5.3rem)] px-4"
            onClick={(event) => event.stopPropagation()}
          >
            <section
              id="bottom-nav-menu-sheet"
              className="mx-auto w-full max-w-[430px] rounded-[26px] border border-white/10 bg-[linear-gradient(160deg,rgba(34,34,36,0.98),rgba(20,20,22,0.95))] p-3 shadow-[0_24px_48px_rgba(0,0,0,0.45)]"
            >
              <div className="space-y-1.5">
                {MENU_ITEMS.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center gap-3 rounded-2xl px-3 py-3 text-[15px] font-medium text-white transition hover:bg-white/8 active:scale-[0.99]"
                      onClick={() => setIsMenuOpen(false)}
                    >
                      <Icon className="h-5 w-5 text-white/85" />
                      <span>{item.label}</span>
                    </Link>
                  );
                })}

                <button
                  type="button"
                  className="flex w-full items-center gap-3 rounded-2xl px-3 py-3 text-left text-[15px] font-medium text-white transition hover:bg-white/8 active:scale-[0.99]"
                  disabled={isLoggingOut}
                  onClick={async () => {
                    if (isLoggingOut) return;
                    setIsLoggingOut(true);
                    setIsMenuOpen(false);
                    try {
                      await fetch("/api/auth/logout", { method: "POST" });
                    } finally {
                      router.replace("/login");
                      router.refresh();
                      setIsLoggingOut(false);
                    }
                  }}
                >
                  <LogOut className="h-5 w-5 text-white/85" />
                  <span>Выйти</span>
                </button>
              </div>
            </section>
          </div>
        </div>
      ) : null}

      <nav className="fixed inset-x-0 bottom-0 z-50 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.55rem)] pt-3">
        <div className="mx-auto grid w-full max-w-[430px] grid-cols-3 items-center rounded-[30px] border border-white/15 bg-[linear-gradient(165deg,rgba(42,42,46,0.36),rgba(18,18,20,0.24))] px-2.5 py-2.5 shadow-[0_12px_38px_rgba(0,0,0,0.34),inset_0_1px_0_rgba(255,255,255,0.1)] backdrop-blur-2xl">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = pathname === item.href;

            return (
              <Link
                key={item.href}
              href={item.href}
              className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full transition active:scale-95 ${
                item.center
                  ? "h-16 w-16 bg-[#A9E67C] text-black"
                  : active
                    ? "text-white drop-shadow-[0_0_10px_rgba(255,255,255,0.18)]"
                    : "text-white/90 hover:bg-white/5"
              }`}
              aria-label={item.label}
            >
                <Icon className={item.center ? "h-8 w-8" : "h-7 w-7"} />
              </Link>
            );
          })}

          <button
            type="button"
            className={`mx-auto flex h-14 w-14 items-center justify-center rounded-full text-white/90 transition hover:bg-white/5 active:scale-95 ${
              isMenuOpen ? "bg-white/10 text-white" : ""
            }`}
            onClick={() => setIsMenuOpen((prev) => !prev)}
            aria-label="Открыть меню"
            aria-expanded={isMenuOpen}
            aria-controls="bottom-nav-menu-sheet"
          >
            <Menu className="h-7 w-7" />
          </button>
        </div>
      </nav>
    </>
  );
}
