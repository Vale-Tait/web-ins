"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { useApp } from "@/components/AppProvider";
import { FolderMultiSelect } from "@/components/FolderMultiSelect";

export function SaveUrlDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { folders, dispatch } = useApp();
  const [url, setUrl] = useState("");
  const [selected, setSelected] = useState<string[]>(["unsorted"]);
  const [includeAnalysis, setIncludeAnalysis] = useState(true);

  const canSave = url.trim().length > 0;

  if (!open) return null;

  function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    dispatch({
      type: "add-link",
      url,
      folderIds: selected.length ? selected : ["unsorted"],
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
        <FolderMultiSelect folders={folders} value={selected} onChange={setSelected} className="mb-6" />
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
