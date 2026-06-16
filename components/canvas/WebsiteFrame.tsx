"use client";

import { CanvasPreviewArt, buildIframeSrc, getNodeSize, getWebsiteFrameChromeHeight } from "@/components/canvas/canvasUtils";
import styles from "@/components/canvas/canvas.module.css";
import { useRef } from "react";
import type { MouseEvent, PointerEvent as ReactPointerEvent } from "react";
import type { CanvasNodeData, DeviceView, Folder, LinkItem } from "@/lib/types";

const devices: DeviceView[] = ["desktop", "tablet", "mobile"];

export function WebsiteFrame({
  node,
  link,
  sourceFolder,
  selected,
  isTop,
  onSelect,
  onStartDrag,
  onStartResize,
  onDelete,
  onRefresh,
  onDevice,
  onFrameError,
  onPreviewMode
}: {
  node: CanvasNodeData;
  link?: LinkItem;
  sourceFolder?: Folder;
  selected: boolean;
  isTop: boolean;
  onSelect: () => void;
  onStartDrag: (event: MouseEvent) => void;
  onStartResize: (event: MouseEvent | ReactPointerEvent) => void;
  onDelete: () => void;
  onRefresh: () => void;
  onDevice: (device: DeviceView) => void;
  onFrameError: () => void;
  onPreviewMode: (mode: "canvas" | "preview") => void;
}) {
  const size = getNodeSize(node);
  const chromeHeight = getWebsiteFrameChromeHeight();
  const status = node.status ?? "screenshot";
  const mode = node.interactionMode ?? "canvas";
  const canLive = status === "live" || status === "loading";
  const previewClickMemoryRef = useRef(0);
  const nodeStyle = {
    left: node.x,
    top: node.y,
    width: size.width,
    height: size.height + chromeHeight,
    zIndex: node.zIndex ?? 1
  };

  function enterPreview(event: MouseEvent<HTMLElement> | ReactPointerEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    previewClickMemoryRef.current = 0;
    onPreviewMode("preview");
  }

  function handlePreviewPointerDown(event: ReactPointerEvent<HTMLButtonElement>) {
    const at = Date.now();
    if (at - previewClickMemoryRef.current < 420) {
      enterPreview(event);
      return;
    }
    previewClickMemoryRef.current = at;
  }

  function handlePreviewClick(event: MouseEvent<HTMLButtonElement>) {
    if (event.detail < 2) return;
    enterPreview(event);
  }

  return (
    <div
      className={`${styles.node} ${selected ? styles.nodeSelected : ""}`}
      style={nodeStyle}
      onMouseDown={(event) => {
        if (event.button !== 0) return;
        if ((event.target as Element).closest("button, input, textarea")) return;
        onSelect();
      }}
    >
      <div className={styles.frameShell}>
        <div className={styles.frameMain}>
          <div
            className={styles.frameBar}
            onMouseDown={(event) => {
              if (event.button !== 0) return;
              if ((event.target as Element).closest("button")) return;
              event.preventDefault();
              event.stopPropagation();
              onStartDrag(event);
            }}
          >
            <div className={styles.frameLeftActions}>
              <button
                className={styles.refreshButton}
                type="button"
                disabled={status !== "live"}
                title="Refresh preview"
                onClick={(event) => {
                  event.stopPropagation();
                  onRefresh();
                }}
              >
                {"\u21bb"}
              </button>
              <button
                type="button"
                className={styles.frameDeleteButton}
                title="Delete preview"
                aria-label="Delete preview"
                onClick={(event) => {
                  event.stopPropagation();
                  onDelete();
                }}
              >
                <span aria-hidden="true" />
              </button>
              <span className={styles.statusPill}>{status}</span>
            </div>
            <span className={styles.frameSource}>{sourceFolder?.name || "Folder"}</span>
            <div className={styles.frameActions}>
              <div className={styles.deviceTabs}>
                {devices.map((device) => (
                  <button
                    key={device}
                    type="button"
                    className={node.deviceView === device ? styles.deviceActive : ""}
                    onClick={(event) => {
                      event.stopPropagation();
                      onDevice(device);
                    }}
                  >
                    {device}
                  </button>
                ))}
              </div>
            </div>
          </div>
          <div
            className={`${styles.frameViewport} ${mode === "canvas" ? styles.frameViewportCanvas : ""}`}
            style={{ width: size.width, height: size.height }}
            onMouseDown={(event) => {
              if (event.button !== 0) return;
              onSelect();
            }}
            onDoubleClick={(event) => {
              enterPreview(event);
            }}
          >
            {canLive && link ? <iframe src={buildIframeSrc(link, node)} title={link.title} loading="lazy" onErrorCapture={onFrameError} /> : null}
            {!canLive ? (
              <div className={styles.screenshotFallback}>
                <CanvasPreviewArt link={link} className={styles.previewArt} />
              </div>
            ) : null}
            {mode === "canvas" ? (
              <>
                <button
                  className={styles.previewHitbox}
                  type="button"
                  aria-label="Enter preview"
                  onPointerDown={handlePreviewPointerDown}
                  onClick={handlePreviewClick}
                  onDoubleClick={(event) => enterPreview(event)}
                />
                <div className={styles.previewHint}>Double click to preview</div>
              </>
            ) : null}
          </div>
        </div>
        {mode === "preview" ? (
          <button
            className={styles.exitPreview}
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              onPreviewMode("canvas");
            }}
          >
            Exit Preview
          </button>
        ) : null}
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
    </div>
  );
}
