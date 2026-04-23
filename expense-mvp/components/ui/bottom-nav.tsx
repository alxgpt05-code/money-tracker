"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/dashboard", icon: "⌂", type: "default" },
  { href: "/expenses/new", icon: "+", type: "center" },
  { href: "/notifications", icon: "≡", type: "default" }
] as const;

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav className="bottom-nav">
      {links.map((link) => {
        const active = pathname.startsWith(link.href);

        return (
          <Link
            key={link.href}
            href={link.href}
            className={`nav-icon ${link.type === "center" ? "center" : ""} ${active && link.type !== "center" ? "active" : ""}`}
            aria-label={link.href}
          >
            {link.icon}
          </Link>
        );
      })}
    </nav>
  );
}
