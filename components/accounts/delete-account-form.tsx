"use client";

import { useActionState, useState } from "react";
import { deleteAccountAction } from "@/lib/services/actions";
import { Button } from "@/components/ui/button";
import { FormMessage } from "@/components/ui/form-message";
import { Label } from "@/components/ui/label";
import { Select } from "@/components/ui/select";
import { cn } from "@/lib/utils";

export function DeleteAccountForm({
  accountId,
  accountName,
  transferTargets,
}: {
  accountId: string;
  accountName: string;
  transferTargets: { id: string; name: string }[];
}) {
  const [state, formAction, isPending] = useActionState(deleteAccountAction, null);
  const [mode, setMode] = useState<"transfer" | "writeoff">(transferTargets.length ? "transfer" : "writeoff");

  return (
    <form action={formAction} className="panel space-y-4 rounded-[28px] p-5">
      <input type="hidden" name="accountId" value={accountId} />
      <div className="space-y-1">
        <h3 className="strong-text text-base font-medium">Удалить счёт</h3>
        <p className="muted-text text-sm">Что сделать с балансом счёта «{accountName}»?</p>
      </div>

      <div className="grid gap-2">
        <button
          type="button"
          onClick={() => setMode("transfer")}
          disabled={!transferTargets.length}
          className={cn("panel rounded-[22px] px-4 py-3 text-left", mode === "transfer" ? "border-primary/30 shadow-glow" : "", !transferTargets.length ? "opacity-50" : "")}
        >
          <div className="strong-text text-sm font-medium">Перевести на другой счёт</div>
        </button>
        <button
          type="button"
          onClick={() => setMode("writeoff")}
          className={cn("panel rounded-[22px] px-4 py-3 text-left", mode === "writeoff" ? "border-primary/30 shadow-glow" : "")}
        >
          <div className="strong-text text-sm font-medium">Списать</div>
        </button>
      </div>

      <input type="hidden" name="mode" value={mode} readOnly />

      {mode === "transfer" ? (
        <div className="space-y-2">
          <Label htmlFor="targetAccountId">Счёт перевода</Label>
          <Select id="targetAccountId" name="targetAccountId" defaultValue={transferTargets[0]?.id ?? ""}>
            <option value="">Выберите счёт</option>
            {transferTargets.map((account) => (
              <option key={account.id} value={account.id}>
                {account.name}
              </option>
            ))}
          </Select>
        </div>
      ) : null}

      <FormMessage>{state?.error}</FormMessage>
      <Button type="submit" variant="outline" disabled={isPending} className="w-full">
        {isPending ? "Удаляю..." : "Удалить счёт"}
      </Button>
    </form>
  );
}
