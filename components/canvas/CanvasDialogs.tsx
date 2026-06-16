"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import styles from "@/components/canvas/canvas.module.css";
import type { InspirationCanvas } from "@/lib/types";

export function CreateCanvasDialog({ onClose, onCreate }: { onClose: () => void; onCreate: (name: string) => void }) {
  const [name, setName] = useState("");
  const [closing, setClosing] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const closeTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => inputRef.current?.focus(), 20);
    return () => window.clearTimeout(id);
  }, []);

  useEffect(() => {
    return () => {
      if (closeTimerRef.current !== null) window.clearTimeout(closeTimerRef.current);
    };
  }, []);

  function closeWithShapeCue() {
    if (closeTimerRef.current !== null) return;
    setClosing(true);
    closeTimerRef.current = window.setTimeout(() => {
      closeTimerRef.current = null;
      onClose();
    }, 120);
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    onCreate(name.trim());
  }

  const canSubmit = name.trim().length > 0;

  return (
    <div className={styles.modalBackdrop} onMouseDown={(event) => event.target === event.currentTarget && closeWithShapeCue()}>
      <form className={styles.createCanvasDialog} onSubmit={submit}>
        <div className={styles.dialogTitleRow}>
          <h2>CREATE NEW CANVAS</h2>
          <button className={`${styles.dialogClose} ${styles.dialogShapeClose} ${closing ? styles.dialogClosing : ""}`} type="button" onClick={closeWithShapeCue} aria-label="Close">
            <span aria-hidden="true" />
          </button>
        </div>
        <input ref={inputRef} className={styles.dialogInput} value={name} onChange={(event) => setName(event.target.value)} placeholder="Enter canvas name" />
        <div className={styles.dialogDivider} />
        <button className={styles.dialogSubmit} type="submit" disabled={!canSubmit}>
          Create Canvas
        </button>
      </form>
    </div>
  );
}

export function RenameCanvasDialog({
  canvas,
  onClose,
  onRename
}: {
  canvas: InspirationCanvas;
  onClose: () => void;
  onRename: (name: string) => void;
}) {
  const [name, setName] = useState(canvas.name);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const id = window.setTimeout(() => {
      inputRef.current?.focus();
      inputRef.current?.select();
    }, 20);
    return () => window.clearTimeout(id);
  }, []);

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!name.trim()) return;
    onRename(name.trim());
  }

  return (
    <div className={styles.modalBackdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <form className={styles.createCanvasDialog} onSubmit={submit}>
        <div className={styles.dialogTitleRow}>
          <h2>Rename Canvas</h2>
          <button className={styles.dialogClose} type="button" onClick={onClose} aria-label="Close">
            <span aria-hidden="true" />
          </button>
        </div>
        <label className={styles.dialogLabel} htmlFor="rename-canvas-input">
          Canvas Name
        </label>
        <input id="rename-canvas-input" ref={inputRef} className={styles.dialogInput} value={name} maxLength={60} onChange={(event) => setName(event.target.value)} placeholder="Enter canvas name" />
        <div className={styles.dialogDivider} />
        <button className={styles.dialogSubmit} type="submit">
          Save Changes
        </button>
      </form>
    </div>
  );
}

export function DeleteCanvasDialog({
  canvas,
  onClose,
  onDelete
}: {
  canvas: InspirationCanvas;
  onClose: () => void;
  onDelete: () => void;
}) {
  return (
    <div className={styles.modalBackdrop} onMouseDown={(event) => event.target === event.currentTarget && onClose()}>
      <div className={styles.createCanvasDialog} role="dialog" aria-modal="true" aria-labelledby="delete-canvas-title">
        <div className={styles.dialogTitleRow}>
          <h2 id="delete-canvas-title">Delete Canvas</h2>
          <button className={styles.dialogClose} type="button" onClick={onClose} aria-label="Close">
            <span aria-hidden="true" />
          </button>
        </div>
        <p className={styles.dialogBody}>Are you sure you want to delete &quot;{canvas.name}&quot;? This action cannot be undone.</p>
        <div className={styles.dialogActionRow}>
          <button className={styles.dialogSecondarySubmit} type="button" onClick={onClose}>
            Cancel
          </button>
          <button className={styles.dialogDangerSubmit} type="button" onClick={onDelete}>
            Delete canvas
          </button>
        </div>
      </div>
    </div>
  );
}
