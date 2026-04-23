import Link from "next/link";

const menu = [
  { href: "/analytics", title: "Аналитика" },
  { href: "/history", title: "История" },
  { href: "/dashboard", title: "Аккаунт" },
  { href: "/notifications", title: "Настройки" }
];

export default function NotificationsPage() {
  return (
    <div className="stack" style={{ paddingTop: 60 }}>
      {menu.map((item) => (
        <Link key={item.title} href={item.href} className="menu-link">
          {item.title}
        </Link>
      ))}
    </div>
  );
}
