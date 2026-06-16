"use client";

import { useMemo, useState } from "react";
import { MagnifyingGlass, X } from "@phosphor-icons/react";
import { useApp } from "@/components/AppProvider";

export function SaveUrlDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { folders, dispatch } = useApp();
  const [url, setUrl] = useState("");
  const [folderQuery, setFolderQuery] = useState("");
  const [selected, setSelected] = useState<string[]>(["unsorted"]);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);

  const visibleFolders = useMemo(
    () => folders.filter((folder) => folder.name.toLowerCase().includes(folderQuery.toLowerCase())),
    [folderQuery, folders]
  );
  const canSave = url.trim().length > 0;

  if (!open) return null;

  function toggleFolder(id: string) {
    setSelected((current) => (current.includes(id) ? current.filter((item) => item !== id) : [...current, id]));
  }

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({
      type: "add-link",
      url,
      folderIds: selected,
      tags: [],
      note: "",
      includeAnalysis
    });
    setUrl("");
    onClose();
  }

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form onSubmit={submit} className="dialog-surface w-full max-w-[720px] rounded-[3px] p-9">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="mono text-[30px] font-medium uppercase tracking-normal">SAVE LINK</h2>
          <button type="button" onClick={onClose} className="dialog-icon-button grid h-12 w-12 place-items-center rounded-sm">
            <X size={27} />
          </button>
        </div>
        <label className="mono mb-4 block text-lg uppercase">URL</label>
        <input
          required
          value={url}
          onChange={(event) => setUrl(event.target.value)}
          placeholder="https://example.com"
          className="dialog-field mb-9 mt-3 h-[54px] w-full rounded-none px-5 text-lg outline-none"
        />
        <label className="dialog-label-muted mono mb-4 block text-lg uppercase">SAVE TO FOLDER(S):</label>
        <div className="dialog-field mb-6 rounded-none">
          <div className="flex h-[54px] items-center gap-3 border-b border-[var(--line)] px-5">
            <MagnifyingGlass size={27} className="text-[var(--muted)]" />
            <input
              value={folderQuery}
              onChange={(event) => setFolderQuery(event.target.value)}
              placeholder="Search folders..."
              className="h-full flex-1 border-0 bg-transparent text-lg text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
            />
          </div>
          <div className="soft-scrollbar h-[150px] overflow-auto p-2">
            {visibleFolders.map((folder) => (
              <label key={folder.id} className="flex h-12 cursor-pointer items-center gap-3 rounded-[3px] px-3 text-lg hover:bg-[var(--muted-panel)]">
                <input
                  type="checkbox"
                  checked={selected.includes(folder.id)}
                  onChange={() => toggleFolder(folder.id)}
                  className="h-6 w-6 rounded border-[var(--line)] accent-[var(--button)]"
                />
                {folder.name}
              </label>
            ))}
          </div>
        </div>
        <label className="mono mb-8 flex cursor-pointer items-center gap-3 text-lg text-[var(--text)]">
          <input
            type="checkbox"
            checked={includeAnalysis}
            onChange={(event) => setIncludeAnalysis(event.target.checked)}
            className="h-6 w-6 accent-[var(--button)]"
          />
          Include tech stack analysis
        </label>
        <div className="grid grid-cols-2 gap-5">
          <button type="button" onClick={onClose} className="dialog-secondary-button h-[54px] rounded-[3px] mono text-lg transition">
            Close
          </button>
          <button disabled={!canSave} className="dialog-primary-button h-[54px] rounded-[3px] mono text-lg font-semibold uppercase">
            SAVE URL
          </button>
        </div>
      </form>
    </div>
  );
}
