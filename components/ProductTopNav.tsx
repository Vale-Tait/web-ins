"use client";

import { useState } from "react";
import type { CSSProperties } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { SaveUrlDialog } from "@/components/SaveUrlDialog";
import { SearchDialog } from "@/components/SearchDialog";

function HeaderNavLink({
  active,
  href,
  children
}: {
  active: boolean;
  href: string;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      style={{ "--nav-link-color": active ? "var(--text)" : "var(--muted)" } as CSSProperties}
      className="header-nav-link"
    >
      {children}
    </Link>
  );
}

export function ProductTopNav() {
  const pathname = usePathname();
  const [createOpen, setCreateOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const isUserActive = pathname.startsWith("/settings");
  const isCollectionsActive = pathname.startsWith("/collections") || pathname.startsWith("/links");
  const isCanvasActive = pathname.startsWith("/canvas");

  return (
    <>
      <header className="fixed left-[84px] right-0 top-0 z-30 flex h-[90px] items-center justify-between bg-[var(--bg)] px-7 md:px-10">
        <nav className="flex items-center gap-3 text-[28px] font-semibold tracking-normal md:text-[31px]" aria-label="Primary">
          <HeaderNavLink active={isUserActive} href="/settings">
            User
          </HeaderNavLink>
          <span className="font-normal text-[var(--line)]">/</span>
          <HeaderNavLink active={isCollectionsActive} href="/collections">
            Collections
          </HeaderNavLink>
          <span className="text-[var(--line)]">•</span>
          <HeaderNavLink active={isCanvasActive} href="/canvas">
            Canvas
          </HeaderNavLink>
        </nav>
        <div className="flex items-center gap-4 text-sm font-semibold text-[var(--muted)]">
          <button
            type="button"
            aria-label="Search"
            onClick={() => setSearchOpen(true)}
            className="grid h-9 w-9 cursor-pointer place-items-center rounded-md text-[var(--muted)] hover:text-[var(--text)]"
          >
            <MagnifyingGlass size={20} />
          </button>
          <Link href="/analyze" className="analyze-nav-link">
            Analyze
          </Link>
          <button
            type="button"
            onClick={() => setCreateOpen(true)}
            className="group relative flex h-11 cursor-pointer items-center gap-2 overflow-hidden rounded-lg bg-[var(--button)] px-5 text-[15px] font-semibold text-[var(--button-text)] shadow-[var(--shadow)] transition-transform duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98]"
          >
            <span className="pointer-events-none absolute inset-0 bg-white/0 transition-colors duration-300 ease-[cubic-bezier(0.23,1,0.32,1)] group-hover:bg-white/10" />
            <Plus className="relative z-10" size={18} weight="bold" />
            <span className="relative z-10">Create</span>
          </button>
        </div>
      </header>
      <div className="pointer-events-none fixed left-0 right-0 top-[90px] z-50 h-px bg-[var(--line)]" />
      <SearchDialog open={searchOpen} onClose={() => setSearchOpen(false)} />
      <SaveUrlDialog open={createOpen} onClose={() => setCreateOpen(false)} />
    </>
  );
}
