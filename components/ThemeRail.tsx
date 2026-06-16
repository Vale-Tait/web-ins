"use client";

import { useEffect, useRef, useState } from "react";
import { useApp } from "@/components/AppProvider";
import type { ThemeName } from "@/lib/types";

const themes: ThemeName[] = ["light", "dark", "dawn", "dusk", "system"];

export function ThemeRail() {
  const { theme, dispatch } = useApp();
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  return (
    <aside className="fixed bottom-0 left-0 top-0 z-40 flex w-[84px] flex-col items-center justify-end border-r border-[var(--line)] bg-[var(--bg)] pb-8">
      <div className="mb-4 h-px w-10 bg-[var(--muted)] opacity-50" />
      <div ref={menuRef} className="relative">
        <button
          onClick={() => setOpen((current) => !current)}
          className="mono text-[11px] uppercase tracking-normal text-[var(--muted)] hover:text-[var(--text)]"
        >
          Theme
        </button>
        {open ? (
          <div className="absolute bottom-7 left-0 min-w-32 rounded-lg border border-[var(--line)] bg-[var(--panel)] p-1 shadow-none">
            {themes.map((item) => (
              <button
                key={item}
                onClick={() => {
                  dispatch({ type: "set-theme", theme: item });
                  setOpen(false);
                }}
                className={`mono block w-full rounded-md px-3 py-2 text-left text-xs capitalize ${
                  theme === item ? "bg-[var(--muted-panel)] text-[var(--text)]" : "text-[var(--muted)] hover:text-[var(--text)]"
                }`}
              >
                {item}
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </aside>
  );
}
