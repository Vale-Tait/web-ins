"use client";

import Link from "next/link";
import { ArrowUpRight, ImageSquare, Trash, UploadSimple, X } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import type { RefObject } from "react";
import { useApp } from "@/components/AppProvider";
import { PreviewArt } from "@/components/PreviewArt";
import type { LinkItem } from "@/lib/types";

export function LinkTile({ link, folderId = "all" }: { link: LinkItem; folderId?: string }) {
  const detailHref = `/links/${link.id}?folder=${folderId}`;
  const { dispatch } = useApp();
  const [menuOpen, setMenuOpen] = useState(false);
  const [replaceOpen, setReplaceOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const menuRef = useRef<HTMLDivElement | null>(null);
  const editButtonRef = useRef<HTMLButtonElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const canReplace = folderId !== "all";

  useEffect(() => {
    if (!menuOpen) return;

    function onPointerDown(event: PointerEvent) {
      const target = event.target as Node;
      if (menuRef.current?.contains(target) || editButtonRef.current?.contains(target)) return;
      setMenuOpen(false);
    }

    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [menuOpen]);

  return (
    <div className="group relative min-w-0">
      <div className="relative aspect-[16/10] overflow-hidden border border-[var(--line)] bg-[var(--muted-panel)]">
        <Link href={detailHref} className="block h-full w-full">
          <PreviewArt domain={link.domain} />
        </Link>
      </div>
      <button
        ref={editButtonRef}
        type="button"
        onClick={() => setMenuOpen((open) => !open)}
        aria-expanded={menuOpen}
        aria-label={`Edit ${link.domain}`}
        style={{
          transitionProperty: "opacity, translate, transform, background-color",
          transitionDuration: "180ms, 180ms, 180ms, 180ms",
          transitionTimingFunction:
            "cubic-bezier(0.23, 1, 0.32, 1), cubic-bezier(0.23, 1, 0.32, 1), cubic-bezier(0.23, 1, 0.32, 1), ease",
          backdropFilter: "blur(18px) saturate(120%)",
          WebkitBackdropFilter: "blur(18px) saturate(120%)"
        }}
        className={`edit-float-button absolute right-3 top-3 z-20 inline-flex h-12 cursor-pointer items-center gap-3 rounded-[7px] px-4 mono text-base transition-[opacity,transform,background-color] duration-180 ease-[cubic-bezier(0.23,1,0.32,1)] active:scale-[0.98] ${
          menuOpen
            ? "pointer-events-auto translate-y-0 opacity-100"
            : "pointer-events-none -translate-y-0.5 opacity-0 group-hover:pointer-events-auto group-hover:translate-y-0 group-hover:opacity-100"
        }`}
      >
        <ThinPencilIcon />
        Edit
      </button>
      {menuOpen ? (
        <div
          ref={menuRef}
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.62)",
            borderColor: "rgba(255, 255, 255, 0.14)",
            backdropFilter: "blur(18px) saturate(125%)",
            WebkitBackdropFilter: "blur(18px) saturate(125%)"
          }}
          className="floating-menu-surface absolute right-3 top-[72px] z-30 w-[360px] rounded-[4px] p-2"
        >
          {canReplace ? (
            <>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  setSelectedFile(null);
                  setReplaceOpen(true);
                }}
                className="floating-menu-item flex h-14 w-full items-center gap-4 rounded-[3px] px-4 mono text-base transition"
              >
                <ImageSquare size={24} weight="regular" />
                Replace screenshot
              </button>
              <div className="my-2 h-px bg-[rgba(17,24,39,0.1)]" />
            </>
          ) : null}
          <button
            type="button"
            onClick={() => {
              setMenuOpen(false);
              setDeleteOpen(true);
            }}
            className="floating-menu-danger relative flex h-14 w-full items-center gap-4 rounded-[3px] px-4 mono text-base text-[#ff3b3b] transition"
          >
            <Trash size={24} weight="regular" />
            Delete link
          </button>
        </div>
      ) : null}
      <div className="mt-3 flex items-center justify-between gap-3">
        <p className="mono min-w-0 truncate text-sm text-[var(--muted)] transition group-hover:text-[#171717]">{link.url}</p>
        <div className="relative h-7 w-9 shrink-0">
          <span className="mono absolute right-0 top-1/2 -translate-y-1/2 rounded bg-[var(--muted-panel)] px-2 py-1 text-[11px] font-bold uppercase text-[var(--text)] opacity-100 transition group-hover:opacity-0">
            Link
          </span>
          <a
            href={link.url}
            target="_blank"
            rel="noreferrer"
            aria-label={`Open ${link.domain}`}
            className="absolute right-0 top-1/2 grid h-7 w-7 -translate-y-1/2 place-items-center rounded-[3px] text-[var(--muted)] opacity-0 transition hover:text-[#171717] group-hover:opacity-100"
          >
            <ArrowUpRight size={22} weight="regular" />
          </a>
        </div>
      </div>

      {replaceOpen ? (
        <ReplaceScreenshotDialog
          link={link}
          selectedFile={selectedFile}
          fileInputRef={fileInputRef}
          onFileChange={setSelectedFile}
          onClose={() => {
            setSelectedFile(null);
            setReplaceOpen(false);
          }}
        />
      ) : null}

      {deleteOpen ? (
        <DeleteLinkDialog
          link={link}
          folderId={folderId}
          onCancel={() => setDeleteOpen(false)}
          onConfirm={() => {
            dispatch({ type: "delete-link", id: link.id, folderId });
            setDeleteOpen(false);
          }}
        />
      ) : null}
    </div>
  );
}

function DeleteLinkDialog({
  link,
  folderId,
  onCancel,
  onConfirm
}: {
  link: LinkItem;
  folderId: string;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const body =
    folderId === "all"
      ? `Are you sure you want to delete this link to "${link.url}"? This action cannot be undone.`
      : `Are you sure you want to delete this link to "${link.url}"? This action cannot be undone. The link will be removed from this folder.`;

  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
      >
      <div className="dialog-surface w-full max-w-[520px] rounded-[4px] p-7">
        <div className="mb-3 flex items-start justify-between gap-6">
          <h2 className="text-[24px] font-semibold tracking-[-0.01em]">Delete link</h2>
          <button type="button" onClick={onCancel} className="dialog-icon-button grid h-8 w-8 place-items-center rounded-[3px]">
            <X size={20} />
          </button>
        </div>
        <p className="max-w-[440px] text-base leading-relaxed text-[var(--muted)]">{body}</p>
        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="dialog-secondary-button h-11 rounded-[4px] px-7 mono text-sm transition"
          >
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className="h-11 rounded-[4px] bg-[#ff4545] px-7 mono text-sm font-semibold text-white">
            Delete link
          </button>
        </div>
      </div>
    </div>
  );
}

function ReplaceScreenshotDialog({
  link,
  selectedFile,
  fileInputRef,
  onFileChange,
  onClose
}: {
  link: LinkItem;
  selectedFile: File | null;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onFileChange: (file: File | null) => void;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-black/50 px-4"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <div className="dialog-surface w-full max-w-2xl p-8">
        <div className="mb-7 flex items-start justify-between gap-6">
          <div>
            <h2 className="mono text-[25px] font-semibold uppercase">Replace screenshot for:</h2>
            <p className="mono mt-7 text-base font-semibold text-[var(--muted)]">{link.url}</p>
          </div>
          <button type="button" onClick={onClose} className="dialog-icon-button grid h-8 w-8 place-items-center rounded-[3px]">
            <X size={20} />
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="hidden"
          onChange={(event) => onFileChange(event.target.files?.[0] ?? null)}
        />
        <div className="flex min-h-[292px] w-full flex-col items-center justify-center border-2 border-dashed border-[var(--line)] p-8 text-center transition hover:border-[var(--accent)]">
          <span className="grid h-16 w-16 place-items-center border border-[var(--line)] text-[var(--text)]">
            <UploadSimple size={30} weight="regular" />
          </span>
          <span className="mono mt-8 text-lg uppercase text-[var(--text)]">Drop image here or</span>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="dialog-secondary-button mono mt-4 rounded-[4px] px-6 py-3 text-base transition"
          >
            Browse Files
          </button>
          <span className="mt-5 text-sm leading-relaxed text-[var(--muted)]">
            <strong>Tip:</strong> Press Ctrl+V (Cmd+V) to paste from clipboard
            <br />
            Supports JPG, PNG, WebP, GIF · Max 10MB
          </span>
          {selectedFile ? <span className="mono mt-3 text-sm text-[var(--text)]">{selectedFile.name}</span> : null}
        </div>

        <div className="mt-7 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            className="dialog-secondary-button h-12 rounded-[4px] px-7 mono text-base transition"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={!selectedFile}
            onClick={selectedFile ? onClose : undefined}
            className="dialog-primary-button h-12 rounded-[4px] px-7 mono text-base font-semibold transition"
          >
            Save Screenshot
          </button>
        </div>
      </div>
    </div>
  );
}

function ThinPencilIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 18 18" fill="none" aria-hidden="true">
      <path
        d="M3.15 14.7 4.25 11.25 12.85 2.65C13.35 2.15 14.16 2.15 14.66 2.65L15.35 3.34C15.85 3.84 15.85 4.65 15.35 5.15L6.75 13.75 3.15 14.7Z"
        stroke="currentColor"
        strokeWidth="1.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M11.7 3.8 14.2 6.3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
    </svg>
  );
}
