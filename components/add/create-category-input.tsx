"use client";

import { Plus } from "lucide-react";

interface CreateCategoryInputProps {
  value: string;
  onChange: (next: string) => void;
  onCreate: () => void;
  errorText?: string;
}

export function CreateCategoryInput({ value, onChange, onCreate, errorText }: CreateCategoryInputProps) {
  return (
    <section>
      <div className="flex items-center rounded-full bg-[linear-gradient(150deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015)_50%,rgba(12,12,13,0.95))] p-1">
        <input
          value={value}
          onChange={(event) => onChange(event.target.value)}
          placeholder="Создать категорию"
          className="h-9 flex-1 rounded-full bg-transparent px-4 text-sm text-white placeholder:text-[#7E7E83] outline-none"
          maxLength={32}
        />

        <button
          type="button"
          onClick={onCreate}
          className="flex h-9 w-9 items-center justify-center rounded-full bg-[#A9E67C] text-black transition hover:brightness-105 active:scale-95"
          aria-label="Добавить категорию"
        >
          <Plus className="h-5 w-5" />
        </button>
      </div>

      {errorText ? <p className="mt-2 px-3 text-xs text-[#F6A3C7]">{errorText}</p> : null}
    </section>
  );
}
