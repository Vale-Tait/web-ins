"use client";

import styles from "@/components/canvas/canvas.module.css";
import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";
import type { CanvasNodeData } from "@/lib/types";

export function CanvasNote({
  node,
  selected,
  isTop,
  onSelect,
  onEditSelect,
  onStartDrag,
  onStartResize,
  onChange,
  onDelete
}: {
  node: CanvasNodeData;
  selected: boolean;
  isTop: boolean;
  onSelect: () => void;
  onEditSelect: () => void;
  onStartDrag: (event: MouseEvent) => void;
  onStartResize: (event: MouseEvent | ReactPointerEvent) => void;
  onChange: (content: string) => void;
  onDelete: () => void;
}) {
  return (
    <div
      className={`${styles.node} ${selected ? styles.nodeSelected : ""}`}
      style={{ left: node.x, top: node.y, width: node.width, height: node.height, zIndex: node.zIndex ?? 1 }}
      onMouseDown={(event) => {
        if (event.button !== 0) return;
        if ((event.target as Element).closest("button, input, textarea")) return;
        onSelect();
      }}
    >
      <div className={styles.noteShell} style={{ width: node.width, height: node.height }}>
        <div
          className={styles.noteHeader}
          onMouseDown={(event) => {
            if (event.button !== 0) return;
            if ((event.target as Element).closest("button")) return;
            event.preventDefault();
            event.stopPropagation();
            onStartDrag(event);
          }}
        >
          <span>Note</span>
          <div className={styles.noteHeaderActions}>
            <span className={styles.noteCharCount}>{Math.max(0, node.content.length)} chars</span>
            <button
              type="button"
              className={styles.noteDeleteButton}
              title="Delete note"
              aria-label="Delete note"
              onClick={(event) => {
                event.stopPropagation();
                onDelete();
              }}
            >
              <span aria-hidden="true" />
            </button>
          </div>
        </div>
        <textarea
          data-note-id={node.id}
          className={styles.noteEditor}
          value={node.content}
          placeholder="Write a note..."
          onMouseDown={(event) => {
            if (event.button !== 0) return;
            onEditSelect();
          }}
          onChange={(event) => onChange(event.target.value)}
        />
      </div>
      <span
        className={styles.resizeHandle}
        onPointerDown={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onStartResize(event);
        }}
      />
      {!isTop ? (
        <button
          type="button"
          className={styles.nodeActivationShield}
          aria-label="Bring window to front"
          onMouseDown={(event) => {
            event.preventDefault();
            event.stopPropagation();
            onSelect();
          }}
        />
      ) : null}
    </div>
  );
}
