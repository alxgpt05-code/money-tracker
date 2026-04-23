import type { Metadata, Viewport } from "next";
import "./globals.css";
import { PwaRegister } from "@/components/ui/pwa-register";

export const metadata: Metadata = {
  title: "Moneyy MVP",
  description: "Учет ежедневных расходов и push-напоминания",
  applicationName: "Moneyy",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Moneyy"
  },
  formatDetection: {
    telephone: false
  }
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
  themeColor: "#0a0b0f"
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru" suppressHydrationWarning>
      <body>
        <PwaRegister />
        {children}
      </body>
    </html>
  );
}
