"use client";

import { useState } from "react";
import { X } from "@phosphor-icons/react";
import { useApp } from "@/components/AppProvider";

type CreateFolderDialogProps = {
  open: boolean;
  onClose: () => void;
};

export function CreateFolderDialog({ open, onClose }: CreateFolderDialogProps) {
  const { dispatch } = useApp();
  const [name, setName] = useState("");
  const [closing, setClosing] = useState(false);

  if (!open) return null;

  const canCreate = name.trim().length > 0;

  const closeWithShapeCue = () => {
    setClosing(true);
    window.setTimeout(() => {
      setClosing(false);
      setName("");
      onClose();
    }, 120);
  };

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreate) return;
    dispatch({ type: "add-folder", name: name.trim() });
    setName("");
    setClosing(false);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) closeWithShapeCue();
      }}
    >
      <form
        onSubmit={handleSubmit}
        className="dialog-surface relative w-full max-w-[600px] rounded-[4px] p-9"
      >
        <button
          type="button"
          aria-label="Close create folder"
          onClick={closeWithShapeCue}
          className={[
            "dialog-icon-button absolute right-4 top-4 grid h-8 w-8 place-items-center border-2 border-[var(--accent)]",
            "transition-[border-radius,background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)]",
            "active:scale-95",
            closing ? "rounded-md" : "rounded-none"
          ].join(" ")}
        >
          <X size={18} weight="regular" />
        </button>

        <h2 className="mono text-[30px] font-medium uppercase leading-none tracking-normal">CREATE NEW FOLDER</h2>

        <label className="mt-8 block">
          <span className="sr-only">Folder name</span>
          <input
            value={name}
            onChange={(event) => setName(event.target.value.slice(0, 30))}
            autoFocus
            placeholder="Enter folder name"
            className="dialog-field h-[54px] w-full px-5 text-lg outline-none"
          />
        </label>

        <div className="my-7 border-t border-[var(--line)]" />

        <button
          type="submit"
          disabled={!canCreate}
          className={[
            "dialog-primary-button mono h-[54px] w-full rounded-[3px] text-lg font-semibold",
            "transition-[background-color,transform] duration-200 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.99]",
            canCreate ? "" : "cursor-not-allowed"
          ].join(" ")}
        >
          Create Folder
        </button>
      </form>
    </div>
  );
}
