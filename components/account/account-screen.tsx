"use client";

import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { Check, Mail, ShieldCheck, X } from "lucide-react";
import { BottomNav } from "@/components/shared/bottom-nav";

interface AccountResponse {
  ok: boolean;
  email?: string;
  error?: string;
}

function ModalShell({
  title,
  children,
  isOpen,
  onClose,
}: {
  title: string;
  children: ReactNode;
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[80] bg-black/55 backdrop-blur-xl" onClick={onClose}>
      <div className="flex min-h-full items-center justify-center px-4 py-8">
        <section
          className="w-full max-w-[350px] rounded-[30px] border border-white/10 bg-[linear-gradient(160deg,rgba(40,40,44,0.86),rgba(21,21,24,0.82)_36%,rgba(14,14,16,0.9))] p-5 shadow-[0_32px_56px_rgba(0,0,0,0.55)]"
          onClick={(event) => event.stopPropagation()}
        >
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-xl font-semibold tracking-tight text-white">{title}</h3>
            <button
              type="button"
              onClick={onClose}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/5 text-white/80 transition hover:bg-white/10"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
          {children}
        </section>
      </div>
    </div>
  );
}

export function AccountScreen() {
  const [currentEmail, setCurrentEmail] = useState("");
  const [infoText, setInfoText] = useState("");
  const [errorText, setErrorText] = useState("");

  const [isEmailModalOpen, setIsEmailModalOpen] = useState(false);
  const [newEmail, setNewEmail] = useState("");
  const [emailConfirmPassword, setEmailConfirmPassword] = useState("");

  const [isPasswordModalOpen, setIsPasswordModalOpen] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const load = async () => {
      const response = await fetch("/api/user/account");
      const payload = (await response.json()) as AccountResponse;
      if (response.ok && payload.ok && payload.email) {
        setCurrentEmail(payload.email);
      }
    };
    load().catch(() => undefined);
  }, []);

  return (
    <main className="min-h-screen overflow-x-hidden bg-[#060607] text-white">
      <div className="mx-auto w-full max-w-[430px] px-3 pb-32 pt-6">
        <section className="rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(255,255,255,0.045),rgba(15,15,17,0.95))] p-5 shadow-[0_24px_46px_rgba(0,0,0,0.45)]">
          <h1 className="text-2xl font-semibold tracking-tight">Аккаунт</h1>
          <p className="mt-1 text-sm text-white/65">Управляйте логином и безопасностью аккаунта.</p>
          <p className="mt-4 rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
            Текущая почта: <span className="font-medium text-white">{currentEmail || "—"}</span>
          </p>

          <div className="mt-4 space-y-2.5">
            <button
              type="button"
              onClick={() => {
                setErrorText("");
                setInfoText("");
                setIsEmailModalOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#1B1C20] px-4 py-3 text-left transition hover:bg-[#22242A] active:scale-[0.99]"
            >
              <span className="text-base font-medium text-white">Сменить почту</span>
              <Mail className="h-5 w-5 text-[#9BE274]" />
            </button>

            <button
              type="button"
              onClick={() => {
                setErrorText("");
                setInfoText("");
                setIsPasswordModalOpen(true);
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-[#1B1C20] px-4 py-3 text-left transition hover:bg-[#22242A] active:scale-[0.99]"
            >
              <span className="text-base font-medium text-white">Сменить пароль</span>
              <ShieldCheck className="h-5 w-5 text-[#9BE274]" />
            </button>
          </div>

          {infoText ? <p className="mt-3 text-sm text-[#9BE274]">{infoText}</p> : null}
          {errorText ? <p className="mt-2 text-sm text-[#F6A3C7]">{errorText}</p> : null}
        </section>
      </div>

      <ModalShell title="Сменить почту" isOpen={isEmailModalOpen} onClose={() => setIsEmailModalOpen(false)}>
        <div className="space-y-3">
          <p className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-white/75">
            Текущая почта: <span className="font-medium text-white">{currentEmail || "—"}</span>
          </p>
          <input
            type="email"
            value={newEmail}
            onChange={(event) => setNewEmail(event.target.value)}
            placeholder="Новая почта"
            className="h-12 w-full rounded-full border border-white/8 bg-[#202125] px-5 text-sm text-white placeholder:text-white/55 outline-none transition focus:border-[#9BE274]/70 focus:ring-2 focus:ring-[#9BE274]/20"
          />
          <input
            type="password"
            value={emailConfirmPassword}
            onChange={(event) => setEmailConfirmPassword(event.target.value)}
            placeholder="Пароль для подтверждения"
            className="h-12 w-full rounded-full border border-white/8 bg-[#202125] px-5 text-sm text-white placeholder:text-white/55 outline-none transition focus:border-[#9BE274]/70 focus:ring-2 focus:ring-[#9BE274]/20"
          />

          <button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);
              setErrorText("");
              setInfoText("");
              const response = await fetch("/api/user/account/email", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  newEmail,
                  currentPassword: emailConfirmPassword,
                }),
              });
              const payload = (await response.json()) as AccountResponse;
              setIsSubmitting(false);
              if (!response.ok || !payload.ok || !payload.email) {
                setErrorText(payload.error ?? "Не удалось обновить почту");
                return;
              }

              setCurrentEmail(payload.email);
              setNewEmail("");
              setEmailConfirmPassword("");
              setInfoText("Почта успешно обновлена");
              setIsEmailModalOpen(false);
            }}
            className="mx-auto mt-1 flex h-12 min-w-[148px] items-center justify-center gap-2 rounded-full border border-[#9BE274] px-6 text-base font-medium text-white transition hover:bg-[#9BE274]/10 active:scale-95 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            Сохранить
          </button>
        </div>
      </ModalShell>

      <ModalShell title="Сменить пароль" isOpen={isPasswordModalOpen} onClose={() => setIsPasswordModalOpen(false)}>
        <div className="space-y-3">
          <input
            type="password"
            value={currentPassword}
            onChange={(event) => setCurrentPassword(event.target.value)}
            placeholder="Текущий пароль"
            className="h-12 w-full rounded-full border border-white/8 bg-[#202125] px-5 text-sm text-white placeholder:text-white/55 outline-none transition focus:border-[#9BE274]/70 focus:ring-2 focus:ring-[#9BE274]/20"
          />
          <input
            type="password"
            value={newPassword}
            onChange={(event) => setNewPassword(event.target.value)}
            placeholder="Новый пароль"
            className="h-12 w-full rounded-full border border-white/8 bg-[#202125] px-5 text-sm text-white placeholder:text-white/55 outline-none transition focus:border-[#9BE274]/70 focus:ring-2 focus:ring-[#9BE274]/20"
          />
          <input
            type="password"
            value={confirmNewPassword}
            onChange={(event) => setConfirmNewPassword(event.target.value)}
            placeholder="Повторите новый пароль"
            className="h-12 w-full rounded-full border border-white/8 bg-[#202125] px-5 text-sm text-white placeholder:text-white/55 outline-none transition focus:border-[#9BE274]/70 focus:ring-2 focus:ring-[#9BE274]/20"
          />

          <button
            type="button"
            disabled={isSubmitting}
            onClick={async () => {
              setIsSubmitting(true);
              setErrorText("");
              setInfoText("");
              const response = await fetch("/api/user/account/password", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                  currentPassword,
                  newPassword,
                  confirmPassword: confirmNewPassword,
                }),
              });
              const payload = (await response.json()) as AccountResponse;
              setIsSubmitting(false);

              if (!response.ok || !payload.ok) {
                setErrorText(payload.error ?? "Не удалось обновить пароль");
                return;
              }

              setCurrentPassword("");
              setNewPassword("");
              setConfirmNewPassword("");
              setInfoText("Пароль успешно обновлен");
              setIsPasswordModalOpen(false);
            }}
            className="mx-auto mt-1 flex h-12 min-w-[148px] items-center justify-center gap-2 rounded-full border border-[#9BE274] px-6 text-base font-medium text-white transition hover:bg-[#9BE274]/10 active:scale-95 disabled:opacity-60"
          >
            <Check className="h-4 w-4" />
            Сохранить
          </button>
        </div>
      </ModalShell>

      <BottomNav />
    </main>
  );
}
