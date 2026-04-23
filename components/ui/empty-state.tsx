import Link from "next/link";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function EmptyState({
  title,
  description,
  actionHref,
  actionLabel,
}: {
  title: string;
  description: string;
  actionHref?: string;
  actionLabel?: string;
}) {
  return (
    <Card className="border-dashed border-white/10 bg-[#0b120d]/62">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-10 text-center">
        <div className="rounded-[24px] border border-white/10 bg-black/20 p-4">
          <Inbox className="h-5 w-5 text-primary" />
        </div>
        <div className="space-y-2">
          <h3 className="strong-text text-lg font-medium">{title}</h3>
          <p className="muted-text max-w-sm text-sm">{description}</p>
        </div>
        {actionHref && actionLabel ? (
          <Button asChild>
            <Link href={actionHref}>{actionLabel}</Link>
          </Button>
        ) : null}
      </CardContent>
    </Card>
  );
}
