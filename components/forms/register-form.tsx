"use client";

import Link from "next/link";
import { useActionState } from "react";
import { registerAction } from "@/lib/services/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RegisterForm() {
  const [state, formAction, isPending] = useActionState(registerAction, null);

  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit rounded-full bg-primary/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
          Новый аккаунт
        </div>
        <CardTitle className="text-2xl">Создать аккаунт</CardTitle>
        <CardDescription>Локальная авторизация для личного трекера капитала. Всё хранится в твоей базе.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Имя</Label>
            <Input id="name" name="name" autoComplete="name" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" name="password" type="password" autoComplete="new-password" required />
          </div>
          <FormMessage>{state?.error}</FormMessage>
          <Button className="w-full" disabled={isPending}>
            {isPending ? "Создаю..." : "Создать аккаунт"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Уже есть аккаунт?{" "}
          <Link href="/login" className="text-primary">
            Войти
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
