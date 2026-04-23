"use client";

import { useEffect, useState } from "react";
import { Check, X } from "lucide-react";

interface DeleteExpenseModalProps {
  isOpen: boolean;
  isDeleting: boolean;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function DeleteExpenseModal({ isOpen, isDeleting, onConfirm, onClose }: DeleteExpenseModalProps) {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const frame = window.requestAnimationFrame(() => setIsVisible(true));
    return () => window.cancelAnimationFrame(frame);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) {
      setIsVisible(false);
      return;
    }

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className={`fixed inset-0 z-[80] bg-black/55 backdrop-blur-xl transition-opacity duration-200 ${isVisible ? "opacity-100" : "opacity-0"}`}
      onClick={onClose}
    >
      <div className="flex min-h-full items-center justify-center px-4 py-8">
        <section
          className={`w-full max-w-[330px] rounded-[28px] border border-white/10 bg-[linear-gradient(160deg,rgba(40,40,44,0.86),rgba(21,21,24,0.84)_36%,rgba(14,14,16,0.9))] p-5 shadow-[0_32px_56px_rgba(0,0,0,0.55)] transition-all duration-200 ${
            isVisible ? "scale-100 opacity-100" : "scale-95 opacity-0"
          }`}
          onClick={(event) => event.stopPropagation()}
        >
          <p className="text-center text-xl font-medium tracking-tight text-white">Удалить запись?</p>

          <div className="mt-5 flex items-center justify-center gap-6">
            <button
              type="button"
              disabled={isDeleting}
              onClick={onConfirm}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-[#A9E67C] text-black transition hover:brightness-105 active:scale-95 disabled:opacity-60"
              aria-label="Подтвердить удаление"
            >
              <Check className="h-8 w-8" />
            </button>

            <button
              type="button"
              disabled={isDeleting}
              onClick={onClose}
              className="flex h-16 w-16 items-center justify-center rounded-full bg-black/80 text-white transition hover:bg-black active:scale-95 disabled:opacity-60"
              aria-label="Отменить удаление"
            >
              <X className="h-8 w-8" />
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
