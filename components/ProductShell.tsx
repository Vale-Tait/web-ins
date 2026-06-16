"use client";

import { usePathname } from "next/navigation";
import { AppProvider } from "@/components/AppProvider";
import { AuthGate } from "@/components/AuthGate";
import { CreateFolderDialog } from "@/components/CreateFolderDialog";
import { ProductTopNav } from "@/components/ProductTopNav";
import { ThemeRail } from "@/components/ThemeRail";
import { useState } from "react";

function ShellInner({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [folderCreateOpen, setFolderCreateOpen] = useState(false);

  return (
    <div className="app-scale-root bg-[var(--bg)] text-[var(--text)]" style={{ overflow: "hidden" }}>
      <ThemeRail />
      <ProductTopNav />
      <main className="h-full min-w-0 overflow-x-hidden overflow-y-auto pb-20 lg:pb-0">{children}</main>
      {pathname === "/collections" ? (
        <button
          type="button"
          data-bottom-create
          aria-label="Create"
          onClick={() => setFolderCreateOpen(true)}
        className="group fixed bottom-8 left-1/2 z-40 grid h-14 w-14 -translate-x-1/2 cursor-pointer place-items-center overflow-hidden rounded-lg border-0 bg-[var(--button)] text-[var(--button-text)] shadow-none outline-none ring-0 transition-transform duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] hover:-translate-y-1.5 hover:scale-[1.04] active:scale-95"
          style={{
            transitionProperty: "transform, translate, scale, background-color, border-color, color",
            transitionDuration: "520ms, 520ms, 520ms, 180ms, 180ms, 180ms",
            transitionTimingFunction:
              "cubic-bezier(0.22, 1, 0.36, 1), cubic-bezier(0.22, 1, 0.36, 1), cubic-bezier(0.22, 1, 0.36, 1), ease, ease, ease",
          }}
        >
        <span className="pointer-events-none absolute inset-0 rounded-[inherit] bg-white opacity-0 transition-opacity duration-[520ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:opacity-10" />
          <svg
            className="relative z-10"
            width="32"
            height="34"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.75"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ transform: "scaleY(1.08)" }}
            aria-hidden="true"
          >
            <path d="M2.35 6.55h6.3l1.9 1.95h11.1v10.95H2.35z" />
            <path d="M12 12.3v3.9" />
            <path d="M10.05 14.25h3.9" />
          </svg>
        </button>
      ) : null}
      <CreateFolderDialog open={folderCreateOpen} onClose={() => setFolderCreateOpen(false)} />
    </div>
  );
}

export function ProductShell({ children }: { children: React.ReactNode }) {
  return (
    <AuthGate>
      <AppProvider>
        <ShellInner>{children}</ShellInner>
      </AppProvider>
    </AuthGate>
  );
}
