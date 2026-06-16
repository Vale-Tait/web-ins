"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import { Trash, X } from "@phosphor-icons/react";
import { useApp } from "@/components/AppProvider";
import type { Folder } from "@/lib/types";

export function EditFolderDialog({ folder, onClose }: { folder: Folder; onClose: () => void }) {
  const { dispatch } = useApp();
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description ?? "");
  const canSave = name.trim().length > 0;

  if (typeof document === "undefined") return null;

  const portalTarget = document.querySelector(".app-scale-root") ?? document.body;

  return createPortal(
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (!canSave) return;
          dispatch({ type: "update-folder", id: folder.id, name: name.trim(), description: description.trim() });
          onClose();
        }}
        className="dialog-surface w-full max-w-[768px] rounded-[4px] p-9"
      >
        <div className="mb-9 flex items-center justify-between">
          <h2 className="mono text-[30px] font-semibold">Edit Folder</h2>
          <button type="button" onClick={onClose} className="dialog-icon-button grid h-12 w-12 cursor-pointer place-items-center rounded-[3px]">
            <X size={28} />
          </button>
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <label className="mono text-lg font-semibold uppercase">Folder Name</label>
            <span className="dialog-label-muted mono text-base">{name.length}/30</span>
          </div>
          <input
            value={name}
            maxLength={30}
            autoFocus
            onChange={(event) => setName(event.target.value)}
            className="dialog-field mono h-[54px] w-full px-5 text-lg outline-none"
          />
        </div>

        <div className="mb-6">
          <div className="mb-3 flex items-center justify-between">
            <label className="mono text-lg font-semibold uppercase">Description</label>
            <span className="dialog-label-muted mono text-base">{description.length}/70</span>
          </div>
          <textarea
            value={description}
            maxLength={70}
            onChange={(event) => setDescription(event.target.value)}
            placeholder="Add a description..."
            className="dialog-field min-h-[120px] w-full resize-none px-5 py-3 text-lg outline-none"
          />
        </div>

        <div className="mb-6 h-[102px] border-t border-[var(--line)]" />

        <div className="flex items-center justify-between">
          <button type="button" className="dialog-danger-button mono flex h-[54px] items-center gap-3 rounded-md px-6 text-lg font-semibold">
            <Trash size={25} />
            Delete
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="dialog-secondary-button mono h-[54px] cursor-pointer rounded-md px-8 text-lg transition">
              Cancel
            </button>
            <button disabled={!canSave} className="dialog-primary-button mono h-[54px] rounded-md px-8 text-lg font-semibold">
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>,
    portalTarget
  );
}
