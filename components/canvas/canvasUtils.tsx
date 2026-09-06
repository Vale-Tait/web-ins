"use client";

import { canvasDeviceSizes, defaultCanvasViewport, defaultWebsiteFrameScale } from "@/lib/demo-store";
import { ScreenshotPreview } from "@/components/ScreenshotPreview";
import type { AppData, CanvasNodeData, CanvasViewport, DeviceView, Folder, InspirationCanvas, LinkItem } from "@/lib/types";

export const MAX_LIVE_IFRAMES = 5;
export const WEBSITE_FRAME_BASE_CHROME_HEIGHT = 40;
export const WEBSITE_FRAME_MIN_WIDTH = 190;
export const WEBSITE_FRAME_MAX_WIDTH = 2600;
export const THUMBNAIL_VIEW = { width: 453, height: 270 };

export function createId(prefix: string) {
  void prefix;
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return Math.random().toString(36).slice(2, 10);
}

export function now() {
  return new Date().toISOString();
}

export function cloneData(data: AppData): AppData {
  return JSON.parse(JSON.stringify(data)) as AppData;
}

export function cloneViewport(viewport: CanvasViewport = defaultCanvasViewport): CanvasViewport {
  return {
    pan: { x: viewport.pan.x, y: viewport.pan.y },
    zoom: viewport.zoom,
    size: { width: viewport.size.width, height: viewport.size.height }
  };
}

export function createCanvasRecord(name: string): InspirationCanvas {
  const timestamp = now();
  return {
    id: createId("canvas"),
    name: name.trim(),
    thumbnailUrl: null,
    viewport: cloneViewport(defaultCanvasViewport),
    nodes: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function getNodeSize(node: CanvasNodeData) {
  if (node.type === "note") return { width: node.width, height: node.height };
  const base = canvasDeviceSizes[node.deviceView] ?? canvasDeviceSizes.desktop;
  const scale = node.scale ?? defaultWebsiteFrameScale;
  return {
    width: Math.round(base.width * scale),
    height: Math.round(base.height * scale)
  };
}

export function getWebsiteFrameChromeHeight(_canvasZoom?: number) {
  return WEBSITE_FRAME_BASE_CHROME_HEIGHT;
}

export function getNextNodeZIndex(canvas: InspirationCanvas) {
  return canvas.nodes.reduce((max, node) => Math.max(max, node.zIndex ?? 1), 0) + 1;
}

export function createWebsiteNode(canvas: InspirationCanvas, link: LinkItem, sourceFolderId: string, x: number, y: number): CanvasNodeData {
  const timestamp = now();
  const scale = defaultWebsiteFrameScale;
  const base = canvasDeviceSizes.desktop;
  return {
    id: createId("node"),
    canvasId: canvas.id,
    type: "website",
    linkId: link.id,
    sourceFolderId,
    content: link.domain,
    x: Math.round(x),
    y: Math.round(y),
    width: Math.round(base.width * scale),
    height: Math.round(base.height * scale),
    scale,
    deviceView: "desktop",
    status: "live",
    interactionMode: "canvas",
    iframeKey: 0,
    loadFailed: false,
    zIndex: getNextNodeZIndex(canvas),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function createNoteNode(canvas: InspirationCanvas, x: number, y: number): CanvasNodeData {
  const timestamp = now();
  return {
    id: createId("note"),
    canvasId: canvas.id,
    type: "note",
    linkId: null,
    sourceFolderId: null,
    content: "",
    x: Math.round(x),
    y: Math.round(y),
    width: 260,
    height: 150,
    scale: null,
    deviceView: "desktop",
    zIndex: getNextNodeZIndex(canvas),
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

export function replaceCanvas(data: AppData, canvasId: string, updater: (canvas: InspirationCanvas, draft: AppData) => void): AppData {
  const draft = cloneData(data);
  const canvas = draft.canvases.find((item) => item.id === canvasId);
  if (!canvas) return data;
  updater(canvas, draft);
  canvas.updatedAt = now();
  return draft;
}

export function findInitialFolder(folders: Folder[]) {
  return folders.find((folder) => folder.id === "agency")?.id ?? folders.find((folder) => folder.id !== "all")?.id ?? folders[0]?.id ?? "unsorted";
}

export function getCanvasContentBounds(nodes: CanvasNodeData[]) {
  if (!nodes.length) return null;
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;

  for (const node of nodes) {
    const size = getNodeSize(node);
    const height = node.type === "website" ? size.height + getWebsiteFrameChromeHeight() : size.height;
    if (![node.x, node.y, size.width, height].every(Number.isFinite)) continue;
    minX = Math.min(minX, node.x);
    minY = Math.min(minY, node.y);
    maxX = Math.max(maxX, node.x + size.width);
    maxY = Math.max(maxY, node.y + height);
  }

  if (![minX, minY, maxX, maxY].every(Number.isFinite)) return null;
  return { minX, minY, maxX, maxY };
}

export function getCanvasThumbnailTransform(bounds: ReturnType<typeof getCanvasContentBounds>) {
  if (!bounds) return { scale: 1, offsetX: 0, offsetY: 0 };
  const padding = 34;
  const contentWidth = Math.max(1, bounds.maxX - bounds.minX);
  const contentHeight = Math.max(1, bounds.maxY - bounds.minY);
  const scale = clamp(
    Math.min((THUMBNAIL_VIEW.width - padding * 2) / contentWidth, (THUMBNAIL_VIEW.height - padding * 2) / contentHeight),
    0.025,
    0.52
  );

  return {
    scale,
    offsetX: (THUMBNAIL_VIEW.width - contentWidth * scale) / 2 - bounds.minX * scale,
    offsetY: (THUMBNAIL_VIEW.height - contentHeight * scale) / 2 - bounds.minY * scale
  };
}

export function buildIframeSrc(link: LinkItem, node: CanvasNodeData) {
  const separator = link.url.includes("?") ? "&" : "?";
  return `${link.url}${separator}canvasReload=${node.iframeKey ?? 0}`;
}

export function formatEditedTime(value: string) {
  const timestamp = Date.parse(value);
  if (!Number.isFinite(timestamp)) return "just now";
  const diff = Date.now() - timestamp;
  if (diff < 60_000) return "just now";
  const minutes = Math.floor(diff / 60_000);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(timestamp).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
}

export function CanvasPreviewArt({ link, className }: { link?: LinkItem | null; className?: string }) {
  return <ScreenshotPreview link={link ?? null} className={className} sizes="(max-width: 768px) 100vw, 420px" />;
}


export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
