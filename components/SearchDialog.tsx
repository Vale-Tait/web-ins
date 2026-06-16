"use client";

import Link from "next/link";
import { useMemo, useRef, useState, useEffect } from "react";
import { ArrowsDownUp } from "@phosphor-icons/react";
import { useApp } from "@/components/AppProvider";

export function SearchDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { links, folders } = useApp();
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (!open) return;
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      window.clearTimeout(id);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, onClose]);

  const tags = useMemo(() => {
    const values = new Set<string>();
    links.forEach((link) => link.tags.forEach((tag) => values.add(tag)));
    return Array.from(values).slice(0, 8);
  }, [links]);

  const results = useMemo(() => {
    const value = query.trim().replace(/^#/, "").toLowerCase();
    if (!value) return [];
    return links.filter((link) => {
      const folderNames = link.folderIds.map((id) => folders.find((folder) => folder.id === id)?.name ?? "");
      return (
        link.domain.toLowerCase().includes(value) ||
        link.url.toLowerCase().includes(value) ||
        link.note.toLowerCase().includes(value) ||
        link.tags.some((tag) => tag.toLowerCase().includes(value)) ||
        folderNames.some((name) => name.toLowerCase().includes(value))
      );
    });
  }, [folders, links, query]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4" onMouseDown={onClose}>
      <section
        onMouseDown={(event) => event.stopPropagation()}
        className="dialog-surface flex h-[100dvh] w-full max-w-[100vw] flex-col overflow-hidden rounded-[3px] sm:h-auto sm:w-[860px] sm:max-w-[860px]"
      >
        <div className="flex h-12 items-center gap-3 border-b border-[var(--line)] px-4">
          <ArrowsDownUp size={20} className="text-[var(--muted)]" />
          <input
            ref={inputRef}
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search by title, URL, or type #tag to filter..."
            className="h-full flex-1 border-0 bg-transparent text-base text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
          />
        </div>
        <div className="soft-scrollbar min-h-0 flex-1 overflow-auto px-4 py-4 sm:h-[520px] sm:flex-none">
          <p className="dialog-label-muted mono mb-3 text-sm uppercase">Tags</p>
          <div className="mb-6 flex flex-wrap gap-2">
            {tags.map((tag) => (
              <button
                key={tag}
                onClick={() => setQuery(`#${tag}`)}
                className="dialog-muted-surface mono rounded px-2 py-1 text-sm hover:text-[var(--text)]"
              >
                # {tag}
              </button>
            ))}
          </div>
          {query.trim() ? (
            <div className="space-y-1">
              {results.map((link) => (
                <Link
                  key={link.id}
                  href={`/links/${link.id}`}
                  onClick={onClose}
                  className="grid grid-cols-[1fr_auto] rounded-[3px] px-3 py-3 hover:bg-[var(--muted-panel)]"
                >
                  <span className="mono text-sm font-semibold">{link.domain}</span>
                  <span className="mono text-xs text-[var(--muted)]">{link.tags.slice(0, 2).join(" / ")}</span>
                  <span className="col-span-2 mt-1 truncate text-sm text-[var(--muted)]">{link.url}</span>
                </Link>
              ))}
              {!results.length ? <p className="mono text-sm text-[var(--muted)]">No results</p> : null}
            </div>
          ) : null}
        </div>
        <div className="hidden h-14 border-t border-[var(--line)] sm:block" aria-hidden="true" />
      </section>
    </div>
  );
}
