"use client";

interface SaveExpenseButtonProps {
  disabled?: boolean;
  onClick: () => void;
}

export function SaveExpenseButton({ disabled, onClick }: SaveExpenseButtonProps) {
  return (
    <div className="flex justify-center pt-1">
      <button
        type="button"
        disabled={disabled}
        onClick={onClick}
        className="min-w-[120px] rounded-full bg-[#A9E67C] px-5 py-2 text-base font-semibold text-black transition hover:brightness-105 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
      >
        Сохранить
      </button>
    </div>
  );
}
