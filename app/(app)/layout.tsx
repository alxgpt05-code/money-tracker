import type React from "react";
import { AppShell } from "@/components/layout/app-shell";
import { requireUserContext } from "@/lib/auth/session";

export default async function PrivateLayout({ children }: { children: React.ReactNode }) {
  await requireUserContext();
  return <AppShell>{children}</AppShell>;
}
