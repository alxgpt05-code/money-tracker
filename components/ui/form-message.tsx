import { cn } from "@/lib/utils";

export function FormMessage({
  children,
  type = "error",
}: {
  children?: string;
  type?: "error" | "success";
}) {
  if (!children) return null;
  return (
    <p className={cn("text-sm", type === "error" ? "text-destructive" : "text-primary")}>
      {children}
    </p>
  );
}
