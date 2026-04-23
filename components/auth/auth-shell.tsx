import Link from "next/link";
import type { ReactNode } from "react";

interface AuthShellProps {
  children: ReactNode;
  topActionLabel?: string;
  topActionHref?: string;
}

export function AuthShell({ children, topActionLabel, topActionHref }: AuthShellProps) {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060607] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-[430px] flex-col px-4 pb-10 pt-5">
        <header className="flex justify-end">
          {topActionLabel && topActionHref ? (
            <Link
              href={topActionHref}
              className="rounded-full border border-white/12 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-white/90 transition hover:bg-white/[0.06] active:scale-95"
            >
              {topActionLabel}
            </Link>
          ) : null}
        </header>

        <div className="flex flex-1 flex-col justify-center">{children}</div>
      </div>
    </main>
  );
}
