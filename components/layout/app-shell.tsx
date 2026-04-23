"use client";

import type React from "react";
import { DesktopSidebar, MobileBottomNav } from "@/components/navigation/app-nav";
import { TopHeader } from "@/components/navigation/top-header";

export function AppShell({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background bg-hero-glow text-foreground">
      <div className="mx-auto flex min-h-screen max-w-7xl flex-col">
        <TopHeader />

        <div className="flex flex-1 gap-6 px-4 pb-[calc(7rem+env(safe-area-inset-bottom,0px))] pt-4 md:px-5 xl:px-6 xl:pb-8">
          <DesktopSidebar />
          <main className="min-w-0 flex-1">{children}</main>
        </div>

        <MobileBottomNav />
      </div>
    </div>
  );
}
