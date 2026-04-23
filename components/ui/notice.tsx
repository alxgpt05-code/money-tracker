import type React from "react";
import { CheckCircle2, CircleAlert } from "lucide-react";
import { cn } from "@/lib/utils";

export function Notice({
  children,
  tone = "success",
}: {
  children: React.ReactNode;
  tone?: "success" | "error";
}) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded-[24px] border px-4 py-3 text-sm",
        tone === "success" ? "border-primary/20 bg-primary/10 text-foreground" : "border-destructive/20 bg-destructive/10 text-foreground",
      )}
    >
      {tone === "success" ? <CheckCircle2 className="h-4 w-4 text-primary" /> : <CircleAlert className="h-4 w-4 text-destructive" />}
      <span>{children}</span>
    </div>
  );
}
