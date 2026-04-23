import * as React from "react";
import { cn } from "@/lib/utils";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(
  ({ className, ...props }, ref) => {
    return (
      <textarea
        ref={ref}
        className={cn(
          "flex min-h-24 w-full rounded-2xl border border-white/8 bg-[#0b120d]/70 px-4 py-3 text-sm text-foreground outline-none placeholder:text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.03)] backdrop-blur-xl focus:ring-2 focus:ring-ring",
          className,
        )}
        {...props}
      />
    );
  },
);
Textarea.displayName = "Textarea";
