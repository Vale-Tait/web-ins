"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CanvasCreateIcon, ThinPencilIcon, TrashIcon } from "@/components/canvas/CanvasIcons";
import { CanvasThumbnail } from "@/components/canvas/CanvasThumbnail";
import { CreateCanvasDialog, DeleteCanvasDialog, RenameCanvasDialog } from "@/components/canvas/CanvasDialogs";
import { cloneData, createCanvasRecord, formatEditedTime } from "@/components/canvas/canvasUtils";
import { canvasCardGlassStyle, canvasGlassStyle } from "@/components/canvas/canvasStyles";
import { saveData } from "@/lib/demo-store";
import styles from "@/components/canvas/canvas.module.css";
import type { AppData, InspirationCanvas } from "@/lib/types";

export function CanvasListShell({
  data,
  onDataChange,
  onOpenCanvas
}: {
  data: AppData;
  onDataChange: (data: AppData) => void;
  onOpenCanvas?: (canvasId: string) => void;
}) {
  const [createOpen, setCreateOpen] = useState(false);
  const [menuCanvasId, setMenuCanvasId] = useState<string | null>(null);
  const [renameCanvas, setRenameCanvas] = useState<InspirationCanvas | null>(null);
  const [deleteCanvas, setDeleteCanvas] = useState<InspirationCanvas | null>(null);

  useEffect(() => {
    if (!menuCanvasId) return;
    function close() {
      setMenuCanvasId(null);
    }
    window.addEventListener("pointerdown", close);
    return () => window.removeEventListener("pointerdown", close);
  }, [menuCanvasId]);

  function createCanvas(name: string) {
    const canvas = createCanvasRecord(name);
    const draft = cloneData(data);
    draft.canvases.unshift(canvas);
    onDataChange(draft);
    saveData(draft);
    window.sessionStorage.setItem(`wim:canvas-open-import:${canvas.id}`, "1");
    setCreateOpen(false);
    onOpenCanvas?.(canvas.id);
  }

  function renameCurrentCanvas(name: string) {
    if (!renameCanvas) return;
    const draft = cloneData(data);
    draft.canvases = draft.canvases.map((canvas) => (canvas.id === renameCanvas.id ? { ...canvas, name, updatedAt: new Date().toISOString() } : canvas));
    onDataChange(draft);
    setRenameCanvas(null);
  }

  function deleteCurrentCanvas() {
    if (!deleteCanvas) return;
    const draft = cloneData(data);
    draft.canvases = draft.canvases.filter((canvas) => canvas.id !== deleteCanvas.id);
    onDataChange(draft);
    setDeleteCanvas(null);
  }

  return (
    <div className={styles.canvasRoot}>
      <section className={styles.listPage}>
        <div className={styles.canvasGrid}>
          {data.canvases.length ? data.canvases.map((canvas) => {
            const menuOpen = menuCanvasId === canvas.id;
            return (
              <div key={canvas.id} className={styles.canvasCardShell}>
                <Link href={`/canvas/${canvas.id}`} className={styles.canvasCard}>
                  <CanvasThumbnail canvas={canvas} links={data.links} />
                  <div className={styles.canvasInfo}>
                    <span className={styles.canvasCopy}>
                      <h2 className={styles.canvasTitle}>{canvas.name}</h2>
                      <span className={styles.canvasEdited}>Edited {formatEditedTime(canvas.updatedAt || canvas.createdAt)}</span>
                    </span>
                  </div>
                </Link>
                <button
                  type="button"
                  className={`${styles.canvasCardEditButton} ${menuOpen ? styles.canvasCardEditButtonOpen : ""}`}
                  style={canvasCardGlassStyle}
                  aria-expanded={menuOpen}
                  aria-label={`Edit ${canvas.name}`}
                  onPointerDown={(event) => event.stopPropagation()}
                  onClick={(event) => {
                    event.preventDefault();
                    event.stopPropagation();
                    setMenuCanvasId(menuOpen ? null : canvas.id);
                  }}
                >
                  <ThinPencilIcon />
                  Edit
                </button>
                {menuOpen ? (
                  <div className={styles.canvasCardMenu} style={canvasGlassStyle} onPointerDown={(event) => event.stopPropagation()}>
                    <button
                      className={styles.canvasCardMenuItem}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        setRenameCanvas(canvas);
                        setMenuCanvasId(null);
                      }}
                    >
                      <ThinPencilIcon />
                      Rename canvas
                    </button>
                    <div className={styles.canvasCardMenuDivider} />
                    <button
                      className={`${styles.canvasCardMenuItem} ${styles.canvasCardMenuDanger}`}
                      type="button"
                      onClick={(event) => {
                        event.preventDefault();
                        setDeleteCanvas(canvas);
                        setMenuCanvasId(null);
                      }}
                    >
                      <TrashIcon />
                      Delete canvas
                    </button>
                  </div>
                ) : null}
              </div>
            );
          }) : <div className={styles.emptyState}>No canvases yet.</div>}
        </div>
        <button className={styles.bottomCreateCanvas} type="button" aria-label="Create canvas" onClick={() => setCreateOpen(true)}>
          <CanvasCreateIcon className={styles.bottomCreateIcon} />
        </button>
      </section>
      {createOpen ? <CreateCanvasDialog onClose={() => setCreateOpen(false)} onCreate={createCanvas} /> : null}
      {renameCanvas ? <RenameCanvasDialog canvas={renameCanvas} onClose={() => setRenameCanvas(null)} onRename={renameCurrentCanvas} /> : null}
      {deleteCanvas ? <DeleteCanvasDialog canvas={deleteCanvas} onClose={() => setDeleteCanvas(null)} onDelete={deleteCurrentCanvas} /> : null}
    </div>
  );
}
