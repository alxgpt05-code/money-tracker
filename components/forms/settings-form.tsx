"use client";

import { useActionState } from "react";
import { archiveWalletAction, createWalletAction, saveMonthlySnapshotAction, updateWalletSettingsAction } from "@/lib/services/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function WalletSettingsForm({
  wallet,
}: {
  wallet: {
    id: string;
    name: string;
    description: string | null;
    trackingStartDate: string;
    salarySchedules: { id: string; title: string; dayOfMonth: number; amount: number }[];
    accounts: { id: string; name: string; initialBalance: number; currentInterestRate?: number | null }[];
  };
}) {
  const [state, formAction, isPending] = useActionState(updateWalletSettingsAction, null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Настройки кошелька</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="grid gap-4 md:grid-cols-2">
          <input type="hidden" name="walletId" value={wallet.id} />
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="name">Название</Label>
            <Input id="name" name="name" defaultValue={wallet.name} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="description">Описание</Label>
            <Input id="description" name="description" defaultValue={wallet.description ?? ""} />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="trackingStartDate">Стартовая дата учёта</Label>
            <Input id="trackingStartDate" name="trackingStartDate" type="date" defaultValue={wallet.trackingStartDate} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryDayPrimary">День зарплаты</Label>
            <Input id="salaryDayPrimary" name="salaryDayPrimary" type="number" defaultValue={wallet.salarySchedules[0]?.dayOfMonth ?? 5} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryDayAdvance">День аванса</Label>
            <Input id="salaryDayAdvance" name="salaryDayAdvance" type="number" defaultValue={wallet.salarySchedules[1]?.dayOfMonth ?? 20} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryAmountPrimary">Сумма зарплаты</Label>
            <Input id="salaryAmountPrimary" name="salaryAmountPrimary" type="number" defaultValue={wallet.salarySchedules[0]?.amount ?? 0} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="salaryAmountAdvance">Сумма аванса</Label>
            <Input id="salaryAmountAdvance" name="salaryAmountAdvance" type="number" defaultValue={wallet.salarySchedules[1]?.amount ?? 0} />
          </div>
          <div className="space-y-3 md:col-span-2">
            <Label>Стартовые суммы и ставки</Label>
            {wallet.accounts.map((account) => (
              <div key={account.id} className="panel grid gap-3 rounded-[24px] p-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor={`initialBalance:${account.id}`}>{account.name}</Label>
                  <Input id={`initialBalance:${account.id}`} name={`initialBalance:${account.id}`} type="number" defaultValue={account.initialBalance} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={`interestRate:${account.id}`}>Ставка</Label>
                  <Input id={`interestRate:${account.id}`} name={`interestRate:${account.id}`} type="number" step="0.01" defaultValue={account.currentInterestRate ?? 0} />
                </div>
              </div>
            ))}
          </div>
          <div className="space-y-2 md:col-span-2">
            <FormMessage>{state?.error}</FormMessage>
            <FormMessage type="success">{state?.success}</FormMessage>
          </div>
          <div className="md:col-span-2">
            <Button disabled={isPending}>Сохранить настройки</Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

export function ArchiveWalletForm({ walletId }: { walletId: string }) {
  return (
    <form action={archiveWalletAction}>
      <input type="hidden" name="walletId" value={walletId} />
      <Button type="submit" variant="outline" className="w-full">
        Архивировать кошелёк
      </Button>
    </form>
  );
}

export function MonthlySnapshotForm({
  walletId,
  accountId,
  monthDate,
  defaultActualBalance,
}: {
  walletId: string;
  accountId: string;
  monthDate?: string;
  defaultActualBalance?: number | null;
}) {
  const [state, formAction, isPending] = useActionState(saveMonthlySnapshotAction, null);
  const currentMonth = new Date();
  currentMonth.setDate(1);
  const resolvedMonthDate = monthDate ?? currentMonth.toISOString().slice(0, 10);
  return (
    <form action={formAction} className="panel grid gap-3 rounded-2xl p-4">
      <input type="hidden" name="walletId" value={walletId} />
      <input type="hidden" name="accountId" value={accountId} />
      <input type="hidden" name="monthDate" value={resolvedMonthDate} />
      <div className="space-y-2">
        <Label htmlFor={`actualBalance-${accountId}`}>Факт на конец месяца</Label>
        <Input id={`actualBalance-${accountId}`} name="actualBalance" type="number" step="0.01" defaultValue={defaultActualBalance ?? undefined} />
      </div>
      <FormMessage>{state?.error}</FormMessage>
      <FormMessage type="success">{state?.success}</FormMessage>
      <Button size="sm" disabled={isPending}>
        Сохранить факт
      </Button>
    </form>
  );
}

export function CreateWalletForm() {
  const [state, formAction, isPending] = useActionState(createWalletAction, null);
  return (
    <Card>
      <CardHeader>
        <CardTitle>Новый кошелёк</CardTitle>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="wallet-name">Название</Label>
            <Input id="wallet-name" name="name" placeholder="Например: Семейный бюджет" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wallet-description">Описание</Label>
            <Input id="wallet-description" name="description" placeholder="Необязательно" />
          </div>
          <FormMessage>{state?.error}</FormMessage>
          <FormMessage type="success">{state?.success}</FormMessage>
          <Button disabled={isPending}>Создать кошелёк</Button>
        </form>
      </CardContent>
    </Card>
  );
}
