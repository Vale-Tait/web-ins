"use client";

import { CanvasPreviewArt, getCanvasContentBounds, getCanvasThumbnailTransform, getNodeSize } from "@/components/canvas/canvasUtils";
import styles from "@/components/canvas/canvas.module.css";
import { memo, useMemo, type CSSProperties } from "react";
import type { InspirationCanvas, LinkItem } from "@/lib/types";

function cssNumber(value: number) {
  return Number.isFinite(value) ? Number(value.toFixed(3)) : 0;
}

export const CanvasThumbnail = memo(function CanvasThumbnail({ canvas, links }: { canvas: InspirationCanvas; links: LinkItem[] }) {
  const linksById = useMemo(() => new Map(links.map((link) => [link.id, link])), [links]);
  const bounds = getCanvasContentBounds(canvas.nodes);
  const transform = getCanvasThumbnailTransform(bounds);
  const gridSize = bounds ? Math.min(22, Math.max(7, 48 * transform.scale)) : 20;
  const gridX = bounds ? transform.offsetX % gridSize : 0;
  const gridY = bounds ? transform.offsetY % gridSize : 0;

  return (
    <div
      className={styles.canvasThumb}
      style={
        {
          "--thumb-grid-size": `${cssNumber(gridSize)}px`,
          "--thumb-grid-x": `${cssNumber(gridX)}px`,
          "--thumb-grid-y": `${cssNumber(gridY)}px`
        } as CSSProperties
      }
    >
      {[...canvas.nodes]
        .sort((a, b) => (a.zIndex ?? 0) - (b.zIndex ?? 0))
        .map((node) => {
          const size = getNodeSize(node);
          const height = node.type === "website" ? size.height + 40 : size.height;
          const screenX = transform.offsetX + node.x * transform.scale;
          const screenY = transform.offsetY + node.y * transform.scale;
          const screenWidth = size.width * transform.scale;
          const screenHeight = height * transform.scale;

          return (
            <span
              key={node.id}
              className={`${styles.canvasThumbNode} ${node.type === "note" ? styles.thumbNote : ""}`}
              style={{
                left: `${cssNumber(screenX)}px`,
                top: `${cssNumber(screenY)}px`,
                width: `${cssNumber(Math.max(3, screenWidth))}px`,
                height: `${cssNumber(Math.max(3, screenHeight))}px`
              }}
            >
              {node.type === "note" ? (
                <>
                  <span className={styles.thumbNoteHeader} />
                  <span className={styles.thumbNoteLine}>{node.content.trim() || "Note"}</span>
                </>
              ) : (
                <>
                  <span className={styles.thumbWebsiteBar} />
                  <span className={styles.thumbWebsiteBody}>
                    <CanvasPreviewArt link={node.linkId ? linksById.get(node.linkId) : undefined} className={styles.previewArt} />
                  </span>
                </>
              )}
            </span>
          );
        })}
    </div>
  );
});
