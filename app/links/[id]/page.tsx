"use client";

import Link from "next/link";
import { useParams, useSearchParams } from "next/navigation";
import { ArrowSquareOut, BookmarkSimple, CaretDown, Check, MagnifyingGlass, Plus } from "@phosphor-icons/react";
import { useEffect, useRef, useState } from "react";
import { PreviewArt } from "@/components/PreviewArt";
import { useApp } from "@/components/AppProvider";
import type { Folder, LinkItem } from "@/lib/types";

function LinkDetailContent() {
  const params = useParams<{ id: string }>();
  const searchParams = useSearchParams();
  const { findLink, findFolder, folders, dispatch } = useApp();
  const link = findLink(params.id);

  if (!link) {
    return (
      <>
        <div className="px-10 py-12 mono">Link not found.</div>
      </>
    );
  }

  const sourceFolderId = searchParams.get("folder") ?? "all";
  const sourceFolderName = sourceFolderId === "all" ? "All Items" : findFolder(sourceFolderId);
  const isAllItems = sourceFolderId === "all";

  return (
    <>
      <section className="border-b border-[var(--line)] px-7 py-5 md:px-10">
        <p className="mono text-sm">
          <Link className="breadcrumb-item" href="/collections">Home</Link>
          <span className="mx-3 text-[var(--muted)]">/</span>
          <Link className="breadcrumb-item" href={`/collections/${sourceFolderId}`}>{sourceFolderName}</Link>
          <span className="mx-3 text-[var(--muted)]">/</span>
          <span className="text-[var(--text)]">{link.domain}</span>
        </p>
      </section>
      <section className="grid min-h-[calc(100dvh-151px)] grid-cols-1 lg:h-[calc(100dvh-151px)] lg:overflow-hidden lg:grid-cols-[58%_42%]">
        <div className="border-r border-[var(--line)] px-7 py-10 md:px-10">
          <div className="aspect-[16/9] overflow-hidden rounded-md border border-[var(--line)]">
            <PreviewArt domain={link.domain} url={link.url} screenshotUrl={link.screenshotUrl} dark />
          </div>
        </div>
        <aside className="px-7 py-16 md:px-12">
          <div className="mb-5 flex items-center justify-between">
            <h1 className="mono flex items-center gap-2 text-3xl font-semibold">
              {link.domain}
              <a
                href={link.url}
                target="_blank"
                rel="noreferrer"
                aria-label={`Open ${link.domain}`}
                className="grid h-8 w-8 place-items-center rounded-[3px] text-[var(--muted)] transition hover:bg-[var(--muted-panel)] hover:text-[var(--text)]"
              >
                <ArrowSquareOut size={20} />
              </a>
            </h1>
            <SavedFoldersControl link={link} folders={folders} dispatch={dispatch} />
          </div>
          {!isAllItems ? (
            <div className="mb-16 grid gap-10">
              <FolderNoteEditor folderName={sourceFolderName} />
              <div className="grid grid-cols-[150px_1fr] items-start gap-6">
                <dt className="mono text-xs uppercase text-[var(--muted)]">Custom Tags</dt>
                <dd className="mono text-sm font-semibold">
                  <CustomTagsEditor />
                </dd>
              </div>
            </div>
          ) : null}
          <dl className="grid gap-12">
            <div className="grid grid-cols-[150px_1fr] items-start gap-6">
              <dt className="mono text-xs uppercase text-[var(--muted)]">Framework</dt>
              <dd className="mono text-sm font-semibold">{link.analysis.techStack.join(" / ")}</dd>
            </div>
            <div className="grid grid-cols-[150px_1fr] items-start gap-6">
              <dt className="mono text-xs uppercase text-[var(--muted)]">Animation</dt>
              <dd className="mono text-sm font-semibold">{link.analysis.animations.join(" / ")}</dd>
            </div>
            <div className="grid grid-cols-[150px_1fr] items-start gap-6">
              <dt className="mono text-xs uppercase text-[var(--muted)]">Fonts</dt>
              <dd className="mono text-sm font-semibold">{link.analysis.fonts.join(" / ")}</dd>
            </div>
          </dl>
        </aside>
      </section>
    </>
  );
}

function SavedFoldersControl({
  link,
  folders,
  dispatch
}: {
  link: LinkItem;
  folders: Folder[];
  dispatch: ReturnType<typeof useApp>["dispatch"];
}) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [creating, setCreating] = useState(false);
  const [newFolderName, setNewFolderName] = useState("");
  const rootRef = useRef<HTMLDivElement | null>(null);
  const visibleFolders = folders.filter((folder) => folder.id !== "all" && folder.name.toLowerCase().includes(query.toLowerCase()));

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setCreating(false);
        setNewFolderName("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [open]);

  function toggleFolder(folderId: string) {
    const nextFolderIds = link.folderIds.includes(folderId)
      ? link.folderIds.filter((id) => id !== folderId)
      : [...link.folderIds, folderId];
    dispatch({ type: "update-link", id: link.id, patch: { folderIds: nextFolderIds.length ? nextFolderIds : ["unsorted"] } });
  }

  function createAndAssign(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const name = newFolderName.trim();
    if (!name) return;
    dispatch({ type: "add-folder-to-link", name, linkId: link.id });
    setNewFolderName("");
    setCreating(false);
    setQuery("");
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        onClick={() => setOpen((current) => !current)}
        className="group mono flex h-11 items-center gap-2 rounded-md border border-[var(--line)] px-5 text-sm text-[var(--muted)] transition hover:bg-[var(--muted-panel)] hover:text-[var(--text)]"
      >
        Saved in {link.folderIds.length} folders
        <span className="relative h-4 w-4">
          <CaretDown
            size={16}
            className={`absolute inset-0 transition duration-180 ${open ? "rotate-180 opacity-0" : "group-hover:rotate-180 group-hover:opacity-0"}`}
          />
          <BookmarkSimple
            size={16}
            className={`absolute inset-0 transition duration-180 ${
              open ? "rotate-0 opacity-100" : "rotate-180 opacity-0 group-hover:rotate-0 group-hover:opacity-100"
            }`}
          />
        </span>
      </button>
      {open ? (
        <div className="dialog-surface absolute right-0 top-14 z-30 w-[360px] overflow-hidden rounded-md">
          <div className="mono border-b border-[var(--line)] px-5 py-4 text-xl text-[var(--text)]">Save to.</div>
          <div className="p-3">
            <div className="flex h-12 items-center gap-2 rounded-md bg-[var(--muted-panel)] px-3">
              <MagnifyingGlass size={22} className="text-[var(--muted)]" />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search folders..."
                className="h-full flex-1 border-0 bg-transparent text-base outline-none placeholder:text-[var(--muted)]"
              />
            </div>
          </div>
          <div className="soft-scrollbar max-h-56 overflow-auto px-2 pb-2">
            {visibleFolders.map((folder) => {
              const selected = link.folderIds.includes(folder.id);
              return (
                <button
                  key={folder.id}
                  type="button"
                  onClick={() => toggleFolder(folder.id)}
                  className="mono flex h-11 w-full items-center justify-between rounded-[3px] px-3 text-left text-base text-[var(--muted)] transition hover:bg-[var(--muted-panel)] hover:text-[var(--text)]"
                >
                  <span>{folder.name}</span>
                  {selected ? <Check size={19} /> : null}
                </button>
              );
            })}
          </div>
          <div className="border-t border-[var(--line)] p-2">
            {creating ? (
              <form onSubmit={createAndAssign} className="grid grid-cols-[1fr_70px] gap-2 px-2 py-1">
                <input
                  value={newFolderName}
                  onChange={(event) => setNewFolderName(event.target.value)}
                  autoFocus
                  placeholder="Folder name"
                  className="dialog-field h-12 px-3 mono text-base outline-none"
                />
                <button disabled={!newFolderName.trim()} className="dialog-primary-button h-12 rounded-md mono text-base font-semibold">
                  Add
                </button>
              </form>
            ) : (
              <button
                type="button"
                onClick={() => setCreating(true)}
                className="mono flex h-11 w-full items-center gap-3 rounded-[3px] px-3 text-base text-[var(--text)] transition hover:bg-[var(--muted-panel)]"
              >
                <Plus size={20} />
                Create new folder
              </button>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}

function CustomTagsEditor() {
  const [tags, setTags] = useState<string[]>([]);
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (adding) inputRef.current?.focus();
  }, [adding]);

  useEffect(() => {
    if (!adding) return;

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setAdding(false);
        setDraft("");
      }
    }

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, [adding]);

  function commitTag() {
    const next = draft.trim();
    if (!next) return;
    setTags((current) => (current.includes(next) ? current : [...current, next]));
    setDraft("");
  }

  return (
    <div ref={rootRef} className="flex min-h-7 flex-wrap items-center gap-x-3 gap-y-2">
      {tags.map((tag, index) => (
        <span key={tag} className="group relative inline-flex items-center">
          <span className="text-[var(--text)]">{tag}</span>
          <button
            type="button"
            aria-label={`Delete ${tag}`}
            onClick={() => setTags((current) => current.filter((item) => item !== tag))}
            className="absolute -right-3 -top-3 hidden h-5 w-5 place-items-center rounded-full bg-[var(--muted-panel)] text-xs text-[var(--muted)] group-hover:grid hover:text-[var(--text)]"
          >
            ×
          </button>
          {index < tags.length - 1 ? <span className="ml-3 text-[var(--muted)]">/</span> : null}
        </span>
      ))}
      {adding ? (
        <span className="inline-flex items-center gap-1">
          {tags.length ? <span className="text-[var(--muted)]">/</span> : null}
          <input
            ref={inputRef}
            value={draft}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitTag();
              }
              if (event.key === "Escape") {
                setAdding(false);
                setDraft("");
              }
            }}
            placeholder="Tag"
            className="w-24 border-0 bg-transparent text-[var(--text)] outline-none placeholder:text-[var(--muted)]"
          />
        </span>
      ) : (
        <button type="button" onClick={() => setAdding(true)} className="text-[var(--muted)] hover:text-[var(--text)]">
          {tags.length ? "/ " : ""}
          + Add
        </button>
      )}
    </div>
  );
}

function FolderNoteEditor({ folderName }: { folderName: string }) {
  const [mode, setMode] = useState<"empty" | "editing" | "saved">("empty");
  const [draft, setDraft] = useState("");
  const [note, setNote] = useState("");
  const maxLength = 150;

  function saveDraft() {
    const trimmed = draft.trim();
    if (!trimmed) {
      setMode("empty");
      return;
    }
    setNote(trimmed);
    setMode("saved");
  }

  if (mode === "empty") {
    return (
      <button
        type="button"
        onClick={() => setMode("editing")}
        className="mono ml-5 inline-flex rounded-[3px] px-2 py-2 text-left text-sm text-[var(--muted)] transition hover:bg-[var(--muted-panel)]"
      >
        Add note
      </button>
    );
  }

  if (mode === "editing") {
    return (
      <div className="mono">
        <p className="mb-4 text-sm uppercase text-[var(--muted)]">Note for: {folderName}</p>
        <textarea
          value={draft}
          maxLength={maxLength}
          onChange={(event) => setDraft(event.target.value)}
          onBlur={saveDraft}
          onKeyDown={(event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === "Enter") {
              event.currentTarget.blur();
            }
          }}
          autoFocus
          placeholder={'e.g. "Files for project ABC.."'}
          className="h-28 w-full resize-none border-0 bg-[var(--muted-panel)] px-4 py-5 text-lg leading-8 outline-none placeholder:text-[var(--muted)]"
        />
        <div className="mt-4 flex items-center justify-end text-base text-[var(--muted)]">
          <span>
            {draft.length}/{maxLength}
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="mono">
      <div className="min-h-24 bg-[var(--muted-panel)] px-4 py-5 text-lg leading-8 text-[var(--text)]">{note}</div>
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={() => {
            setDraft("");
            setNote("");
            setMode("empty");
          }}
          className="rounded-[3px] px-3 py-2 text-base text-[var(--muted)] transition hover:bg-[var(--muted-panel)] hover:text-[var(--text)]"
        >
          Delete
        </button>
      </div>
    </div>
  );
}

export default function LinkDetailPage() {
  return <LinkDetailContent />;
}
