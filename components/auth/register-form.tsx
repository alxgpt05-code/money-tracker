"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

interface RegisterResponse {
  ok: boolean;
  error?: string;
}

async function parseRegisterResponse(response: Response): Promise<RegisterResponse> {
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    return (await response.json()) as RegisterResponse;
  }

  const rawText = await response.text();
  return {
    ok: false,
    error: rawText ? "Сервер вернул некорректный ответ" : "Пустой ответ от сервера",
  };
}

export function RegisterForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [errorText, setErrorText] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isSubmitting) return;

    setIsSubmitting(true);
    setErrorText("");

    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          confirmPassword,
        }),
      });

      const payload = await parseRegisterResponse(response);
      if (!response.ok || !payload.ok) {
        if (response.status === 400) {
          setErrorText(payload.error ?? "Проверьте введенные данные");
          return;
        }
        if (response.status === 409) {
          setErrorText(payload.error ?? "Пользователь с таким email уже существует");
          return;
        }
        if (response.status >= 500) {
          setErrorText(payload.error ?? "Ошибка сервера. Попробуйте позже");
          return;
        }

        setErrorText(payload.error ?? "Не удалось зарегистрироваться");
        return;
      }

      router.replace("/dashboard");
      router.refresh();
    } catch {
      setErrorText("Ошибка сети. Проверьте подключение и повторите");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mx-auto mt-12 w-full max-w-[290px] space-y-2.5">
      <input
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="Почта"
        autoComplete="email"
        className="h-12 w-full rounded-full border border-white/5 bg-[#202125] px-5 text-[15px] text-white placeholder:text-white/55 outline-none transition focus:border-[#9BE274]/70 focus:ring-2 focus:ring-[#9BE274]/20"
      />

      <input
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Пароль"
        autoComplete="new-password"
        className="h-12 w-full rounded-full border border-white/5 bg-[#202125] px-5 text-[15px] text-white placeholder:text-white/55 outline-none transition focus:border-[#9BE274]/70 focus:ring-2 focus:ring-[#9BE274]/20"
      />

      <input
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Повторите пароль"
        autoComplete="new-password"
        className="h-12 w-full rounded-full border border-white/5 bg-[#202125] px-5 text-[15px] text-white placeholder:text-white/55 outline-none transition focus:border-[#9BE274]/70 focus:ring-2 focus:ring-[#9BE274]/20"
      />

      <button
        type="submit"
        disabled={isSubmitting}
        className="mx-auto mt-1 block h-9 min-w-[140px] rounded-full border border-[#9BE274] px-5 text-base font-medium leading-none text-white transition hover:bg-[#9BE274]/10 active:scale-95 disabled:opacity-60"
      >
        {isSubmitting ? "..." : "Создать аккаунт"}
      </button>

      {errorText ? <p className="pt-1 text-center text-xs text-[#F6A3C7]">{errorText}</p> : null}

      <div className="pt-2 text-center">
        <Link href="/login" className="text-xs text-white/65 transition hover:text-white">
          Уже есть аккаунт? Войти
        </Link>
      </div>
    </form>
  );
}
