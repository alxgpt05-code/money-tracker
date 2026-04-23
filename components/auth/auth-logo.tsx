"use client";

import { useState } from "react";

export function AuthLogo() {
  const [pressed, setPressed] = useState(false);

  return (
    <div
      className="relative mx-auto w-fit select-none pb-5 pt-2"
      onPointerDown={() => setPressed(true)}
      onPointerUp={() => setPressed(false)}
      onPointerCancel={() => setPressed(false)}
      onPointerLeave={() => setPressed(false)}
      style={{
        WebkitUserSelect: "none",
        WebkitTouchCallout: "none",
        WebkitTapHighlightColor: "transparent",
      }}
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute right-1 top-0 text-[6.6rem] font-semibold leading-none text-[#DE7DBC]/95"
        style={{
          transform: pressed ? "scale(1.1)" : "scale(1)",
          filter: pressed ? "drop-shadow(0 0 16px rgba(222,125,188,0.28))" : "none",
          transition: "transform 180ms ease, filter 220ms ease",
          animation: pressed ? "money-o-shake 220ms ease-in-out infinite" : "none",
          zIndex: 0,
        }}
      >
        O
      </div>

      <div className="relative z-10 text-white">
        <div className="grid grid-cols-2 gap-x-4 text-[6.2rem] font-semibold leading-[0.88] tracking-tight">
          <span>M</span>
          <span className="opacity-0">O</span>
          <span>N</span>
          <span>E</span>
        </div>
        <div className="mt-1 text-center text-[6.2rem] font-semibold leading-[0.88] tracking-tight">Y</div>
      </div>
    </div>
  );
}
