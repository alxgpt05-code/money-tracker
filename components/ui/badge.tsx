import type React from "react";
import { cn } from "@/lib/utils";

export function Badge({
  className,
  tone = "default",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { tone?: "default" | "positive" | "negative" | "muted" }) {
  const tones = {
    default: "border border-white/8 bg-white/[0.04] text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)]",
    positive: "border border-primary/20 bg-primary/12 text-primary",
    negative: "border border-destructive/20 bg-destructive/12 text-destructive",
    muted: "border border-white/6 bg-black/20 text-muted-foreground",
  };

  return <span className={cn("inline-flex items-center rounded-full px-3 py-1 text-xs font-medium backdrop-blur-md", tones[tone], className)} {...props} />;
}
