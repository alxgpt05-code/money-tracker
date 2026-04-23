"use client";

import { useActionState, useState } from "react";
import { Pencil } from "lucide-react";
import { updateAccountNameAction } from "@/lib/services/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";

export function RenameAccountForm({
  accountId,
  defaultName,
}: {
  accountId: string;
  defaultName: string;
}) {
  const [state, formAction, isPending] = useActionState(updateAccountNameAction, null);
  const [isEditing, setIsEditing] = useState(false);

  if (!isEditing) {
    return (
      <button
        type="button"
        onClick={() => setIsEditing(true)}
        className="glass-button inline-flex h-10 w-10 items-center justify-center rounded-full"
        aria-label="Переименовать счёт"
      >
        <Pencil className="h-4 w-4" />
      </button>
    );
  }

  return (
    <form action={formAction} className="space-y-2">
      <input type="hidden" name="accountId" value={accountId} />
      <div className="flex flex-col gap-2 sm:flex-row">
        <Input name="name" defaultValue={defaultName} className="h-10" />
        <Button size="sm" disabled={isPending} className="sm:min-w-[72px]">
          Ок
        </Button>
        <Button type="button" size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="sm:min-w-[88px]">
          Отмена
        </Button>
      </div>
      <FormMessage>{state?.error}</FormMessage>
      <FormMessage type="success">{state?.success}</FormMessage>
    </form>
  );
}
