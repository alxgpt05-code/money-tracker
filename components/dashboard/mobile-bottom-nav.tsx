"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Menu, Plus } from "lucide-react";

const NAV_ITEMS = [
  {
    href: "/dashboard",
    label: "Главная",
    icon: House,
  },
  {
    href: "/add",
    label: "Добавить",
    icon: Plus,
    center: true,
  },
  {
    href: "/history",
    label: "Меню",
    icon: Menu,
  },
];

export function MobileBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/5 bg-[rgba(24,24,25,0.94)] px-4 pb-[calc(env(safe-area-inset-bottom,0px)+0.7rem)] pt-3 backdrop-blur-xl">
      <div className="mx-auto grid w-full max-w-[430px] grid-cols-3 items-center">
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
                    ? "bg-white/10 text-white"
                    : "text-white/90 hover:bg-white/5"
              }`}
              aria-label={item.label}
            >
              <Icon className={item.center ? "h-8 w-8" : "h-7 w-7"} />
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
