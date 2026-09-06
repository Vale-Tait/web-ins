"use client";

import { useMemo, useState } from "react";
import { Check, MagnifyingGlass } from "@phosphor-icons/react";
import type { Folder } from "@/lib/types";

export function FolderMultiSelect({
  folders,
  value,
  onChange,
  className = "",
  listClassName = "h-[150px]"
}: {
  folders: Folder[];
  value: string[];
  onChange: (folderIds: string[]) => void;
  className?: string;
  listClassName?: string;
}) {
  const [query, setQuery] = useState("");
  const visibleFolders = useMemo(
    () =>
      folders.filter(
        (folder) => folder.id !== "all" && folder.name.toLowerCase().includes(query.toLowerCase())
      ),
    [folders, query]
  );

  function toggleFolder(id: string) {
    onChange(value.includes(id) ? value.filter((item) => item !== id) : [...value, id]);
  }

  return (
    <div className={`dialog-field rounded-none ${className}`}>
      <div className="flex h-[54px] items-center gap-3 border-b border-[var(--line)] px-5">
        <MagnifyingGlass size={27} className="text-[var(--muted)]" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search folders..."
          className="h-full flex-1 border-0 bg-transparent text-lg text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
        />
      </div>
      <div className={`soft-scrollbar overflow-auto p-2 ${listClassName}`}>
        {visibleFolders.map((folder) => {
          const checked = value.includes(folder.id);
          return (
            <label
              key={folder.id}
              className="flex h-12 cursor-pointer items-center gap-3 rounded-[3px] px-3 text-lg hover:bg-[var(--muted-panel)]"
            >
              <input
                type="checkbox"
                checked={checked}
                onChange={() => toggleFolder(folder.id)}
                className="sr-only"
              />
              <span
                aria-hidden="true"
                className={`grid h-7 w-7 shrink-0 place-items-center rounded-[3px] border transition ${
                  checked
                    ? "border-[var(--button)] bg-[var(--button)] text-[var(--button-text)]"
                    : "border-[var(--muted)] bg-transparent text-transparent"
                }`}
              >
                <Check size={22} weight="bold" />
              </span>
              <span className="min-w-0 truncate">{folder.name}</span>
            </label>
          );
        })}
      </div>
    </div>
  );
}
