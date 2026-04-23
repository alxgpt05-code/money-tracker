"use client";

import Link from "next/link";
import { useActionState } from "react";
import { loginAction } from "@/lib/services/actions";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FormMessage } from "@/components/ui/form-message";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function LoginForm() {
  const [state, formAction, isPending] = useActionState(loginAction, null);

  return (
    <Card className="mx-auto w-full max-w-md overflow-hidden">
      <CardHeader className="space-y-3">
        <div className="inline-flex w-fit rounded-full bg-primary/15 px-3 py-1 text-xs font-medium uppercase tracking-[0.24em] text-primary">
          Локальный вход
        </div>
        <CardTitle className="text-2xl">Вход в капитал</CardTitle>
        <CardDescription>Приложение использует локальную авторизацию по email и паролю без внешних сервисов.</CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" defaultValue="demo@capital.local" autoComplete="email" required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Пароль</Label>
            <Input id="password" name="password" type="password" defaultValue="demo12345" autoComplete="current-password" required />
          </div>
          <FormMessage>{state?.error}</FormMessage>
          <Button className="w-full" disabled={isPending}>
            {isPending ? "Входим..." : "Войти"}
          </Button>
        </form>
        <p className="mt-4 text-sm text-muted-foreground">
          Нет аккаунта?{" "}
          <Link href="/register" className="text-primary">
            Зарегистрироваться
          </Link>
        </p>
      </CardContent>
    </Card>
  );
}
