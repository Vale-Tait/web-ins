"use client";

import { CanvasPreviewArt } from "@/components/canvas/canvasUtils";
import styles from "@/components/canvas/canvas.module.css";
import type { MouseEvent } from "react";
import type { LinkItem } from "@/lib/types";

export function CanvasWebsiteCard({ link, onContextMenu }: { link: LinkItem; onContextMenu: (event: MouseEvent, linkId: string) => void }) {
  return (
    <button
      className={styles.websiteCard}
      type="button"
      draggable
      onDragStart={(event) => {
        event.dataTransfer.setData("text/plain", link.id);
        event.dataTransfer.effectAllowed = "copy";
      }}
      onContextMenu={(event) => onContextMenu(event, link.id)}
    >
      <div className={styles.sitePreview}>
        <CanvasPreviewArt link={link} className={styles.previewArt} />
      </div>
      <div className={styles.websiteCardFooter}>
        <span className={styles.websiteCardUrl}>{link.url}</span>
      </div>
    </button>
  );
}
