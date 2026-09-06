"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { CaretLeft, Trash, X } from "@phosphor-icons/react";
import { useState } from "react";
import { LinkTile } from "@/components/LinkTile";
import { useApp } from "@/components/AppProvider";
import type { Folder } from "@/lib/types";

function FolderDetailContent() {
  const params = useParams<{ folderId: string }>();
  const { folders, links, dispatch } = useApp();
  const folder = folders.find((item) => item.id === params.folderId) ?? folders[0];
  const folderLinks = folder
    ? folder.id === "all"
      ? links
      : links.filter((link) => link.folderIds.includes(folder.id))
    : [];
  const [editing, setEditing] = useState(false);

  if (!folder) {
    return (
      <section className="border-b border-[var(--line)] px-7 py-4 md:px-10">
        <div className="grid grid-cols-[80px_1fr_80px] items-center">
          <Link href="/collections" className="grid h-10 w-10 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--muted-panel)]">
            <CaretLeft size={20} />
          </Link>
          <div className="text-center">
            <div className="mx-auto h-5 w-24 bg-[var(--muted-panel)]" />
            <div className="mx-auto mt-2 h-4 w-20 bg-[var(--muted-panel)]" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <>
      <section className="border-b border-[var(--line)] px-7 py-4 md:px-10">
        <div className="grid grid-cols-[80px_1fr_80px] items-center">
          <Link href="/collections" className="grid h-10 w-10 place-items-center rounded-md text-[var(--muted)] hover:bg-[var(--muted-panel)]">
            <CaretLeft size={20} />
          </Link>
          <FolderHeader folder={folder} count={folderLinks.length} onEdit={() => setEditing(true)} />
        </div>
      </section>
      {folder.description ? (
        <section className="px-7 pb-3 pt-6 md:px-10">
          <p className="mono mx-auto max-w-[660px] text-center text-base leading-relaxed text-[var(--muted)]">{folder.description}</p>
        </section>
      ) : null}
      <section className={`grid grid-cols-1 gap-8 px-7 md:grid-cols-2 md:px-10 lg:grid-cols-4 ${folder.description ? "py-6" : "py-10"}`}>
        {folderLinks.map((link) => (
          <LinkTile key={link.id} link={link} folderId={params.folderId} />
        ))}
      </section>
      {editing ? (
        <EditFolderDialog
          folder={folder}
          onClose={() => setEditing(false)}
          onSave={(name, description) => {
            dispatch({ type: "update-folder", id: folder.id, name, description });
            setEditing(false);
          }}
        />
      ) : null}
    </>
  );
}

function FolderHeader({ folder, count, onEdit }: { folder: Folder; count: number; onEdit: () => void }) {
  if (folder.id === "all") {
    return (
      <div className="text-center">
        <h1 className="mono text-xl font-semibold">{folder.name}</h1>
        <p className="mono mt-1 text-sm text-[var(--muted)]">{count} items total</p>
      </div>
    );
  }

  return (
    <div className="inline-flex flex-col items-center justify-center">
      <div className="flex items-center gap-1">
        <h1 className="mono text-xl font-semibold">{folder.name}</h1>
        <button
          type="button"
          onClick={onEdit}
          aria-label={`Edit ${folder.name}`}
          className="folder-title-edit-button grid h-8 w-8 cursor-pointer place-items-center rounded-[3px] transition"
          style={{ color: "var(--text)" }}
        >
          <ThinPencilIcon />
        </button>
      </div>
      <p className="mono mt-1 text-sm text-[var(--muted)]">{count} items 1d</p>
    </div>
  );
}

function ThinPencilIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path d="M3.15 14.7 4.25 11.25 12.85 2.65C13.35 2.15 14.16 2.15 14.66 2.65L15.35 3.34C15.85 3.84 15.85 4.65 15.35 5.15L6.75 13.75 3.15 14.7Z" stroke="var(--text)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M11.7 3.8 14.2 6.3" stroke="var(--text)" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}

function EditFolderDialog({
  folder,
  onClose,
  onSave
}: {
  folder: Folder;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
}) {
  const [name, setName] = useState(folder.name);
  const [description, setDescription] = useState(folder.description ?? "");
  const canSave = name.trim().length > 0;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <form
        onSubmit={(event) => {
          event.preventDefault();
          if (canSave) onSave(name.trim(), description.trim());
        }}
        className="dialog-surface w-full max-w-[768px] rounded-[4px] p-9"
      >
        <div className="mb-9 flex items-center justify-between">
          <h2 className="mono text-[30px] font-semibold">Edit Folder</h2>
          <button type="button" onClick={onClose} className="dialog-icon-button grid h-12 w-12 place-items-center rounded-[3px]">
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
            className="dialog-field h-[54px] w-full px-5 mono text-lg outline-none"
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
          <button type="button" className="dialog-danger-button flex h-[54px] items-center gap-3 rounded-md px-6 mono text-lg font-semibold">
            <Trash size={25} />
            Delete
          </button>
          <div className="flex gap-3">
            <button type="button" onClick={onClose} className="dialog-secondary-button h-[54px] rounded-md px-8 mono text-lg transition">
              Cancel
            </button>
            <button disabled={!canSave} className="dialog-primary-button h-[54px] rounded-md px-8 mono text-lg font-semibold">
              Save Changes
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default function FolderDetailPage() {
  return <FolderDetailContent />;
}
