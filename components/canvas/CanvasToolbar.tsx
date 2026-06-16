"use client";

import styles from "@/components/canvas/canvas.module.css";
import { canvasGlassStyle } from "@/components/canvas/canvasStyles";

export function CanvasToolbar({
  canUndo,
  canRedo,
  onImport,
  onAddNote,
  onUndo,
  onRedo
}: {
  canUndo: boolean;
  canRedo: boolean;
  onImport: () => void;
  onAddNote: () => void;
  onUndo: () => void;
  onRedo: () => void;
}) {
  return (
    <div className={styles.bottomToolbar} style={canvasGlassStyle}>
      <button className={styles.toolButton} type="button" onClick={onImport}>
        Import Website
      </button>
      <button className={styles.toolButton} type="button" onClick={onAddNote}>
        Add Note
      </button>
      <button className={styles.toolButton} type="button" onClick={onUndo} disabled={!canUndo}>
        Undo
      </button>
      <button className={styles.toolButton} type="button" onClick={onRedo} disabled={!canRedo}>
        Redo
      </button>
    </div>
  );
}
