"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { AuthShell } from "@/components/auth/auth-shell";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!email.trim()) return;
    setSubmitted(true);

    // TODO: заменить mock-логику на отправку письма через реальный email provider.
    // Здесь должен быть вызов server action / API для генерации нового пароля и отправки пользователю.
  };

  return (
    <AuthShell topActionLabel="Вход" topActionHref="/login">
      <section className="mx-auto w-full max-w-[320px] rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.04),rgba(14,15,17,0.94))] p-5 text-white shadow-[0_24px_46px_rgba(0,0,0,0.45)]">
        <h1 className="text-2xl font-semibold tracking-tight">Восстановить пароль</h1>
        <p className="mt-2 text-sm text-white/70">Введите почту, и мы отправим новый пароль на зарегистрированный адрес.</p>

        <form onSubmit={handleSubmit} className="mt-5 space-y-3">
          <input
            type="email"
            value={email}
            onChange={(event) => {
              setEmail(event.target.value);
              setSubmitted(false);
            }}
            placeholder="Почта"
            autoComplete="email"
            className="h-12 w-full rounded-full border border-white/8 bg-[#202125] px-5 text-sm text-white placeholder:text-white/55 outline-none transition focus:border-[#9BE274]/70 focus:ring-2 focus:ring-[#9BE274]/20"
          />

          <button
            type="submit"
            className="inline-flex h-11 min-w-[132px] items-center justify-center rounded-full border border-[#9BE274] px-6 text-base font-medium text-white transition hover:bg-[#9BE274]/10 active:scale-95"
          >
            Отправить
          </button>
        </form>

        {submitted ? (
          <p className="mt-3 text-sm text-[#9BE274]">Если почта существует, новый пароль отправлен письмом.</p>
        ) : null}

        <div className="mt-5">
          <Link href="/login" className="text-xs text-white/70 transition hover:text-white">
            Вернуться ко входу
          </Link>
        </div>
      </section>
    </AuthShell>
  );
}
