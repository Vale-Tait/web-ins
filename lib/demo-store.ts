"use client";

import { createAnalysisFixture, createScreenshotPlaceholder } from "@/lib/analysis";
import { canvasDeviceSizes, canvasMaxZoom, canvasMinZoom, defaultCanvasViewport, defaultWebsiteFrameScale } from "@/lib/canvas-defaults";
import { seedData } from "@/lib/fixtures";
import type { AppData, CanvasNodeData, CanvasViewport, DeviceView, Folder, InspirationCanvas, LinkItem, ThemeName } from "@/lib/types";
import { getDomain, normalizeUrl } from "@/lib/url";

const dataKey = "wim:data:v1";
const themeKey = "wim:theme:v1";
export { canvasDeviceSizes, canvasMaxZoom, canvasMinZoom, defaultCanvasViewport, defaultWebsiteFrameScale };
const legacyFolderDescriptions = new Set([
  "Every saved website",
  "Links without a working folder",
  "Studio and agency references",
  "Personal portfolio patterns",
  "Animation-heavy sites"
]);
const legacyDemoLinkIds = new Set(["link-studionuts"]);

function cloneSeed(): AppData {
  return normalizeAppData(JSON.parse(JSON.stringify(seedData)) as AppData);
}

function withoutLegacyFolderDescriptions(data: AppData): AppData {
  return {
    ...data,
    folders: data.folders.map((folder) =>
      folder.description && legacyFolderDescriptions.has(folder.description) ? { ...folder, description: null } : folder
    )
  };
}

function cloneViewport(viewport: CanvasViewport = defaultCanvasViewport): CanvasViewport {
  return {
    pan: { x: viewport.pan.x, y: viewport.pan.y },
    zoom: viewport.zoom,
    size: { width: viewport.size.width, height: viewport.size.height }
  };
}

function normalizeViewport(viewport?: Partial<CanvasViewport> | null): CanvasViewport {
  const source = viewport ?? defaultCanvasViewport;
  const size = source.size ?? defaultCanvasViewport.size;
  const isLegacyDefaultZoom =
    source.zoom === 1 &&
    source.pan?.x === defaultCanvasViewport.pan.x &&
    source.pan?.y === defaultCanvasViewport.pan.y;
  return {
    pan: {
      x: Number.isFinite(source.pan?.x) ? Number(source.pan?.x) : defaultCanvasViewport.pan.x,
      y: Number.isFinite(source.pan?.y) ? Number(source.pan?.y) : defaultCanvasViewport.pan.y
    },
    zoom: isLegacyDefaultZoom
      ? defaultCanvasViewport.zoom
      : Number.isFinite(source.zoom)
      ? Math.min(canvasMaxZoom, Math.max(canvasMinZoom, Number(source.zoom)))
      : defaultCanvasViewport.zoom,
    size: {
      width: Number.isFinite(size.width) && Number(size.width) > 0 ? Number(size.width) : defaultCanvasViewport.size.width,
      height: Number.isFinite(size.height) && Number(size.height) > 0 ? Number(size.height) : defaultCanvasViewport.size.height
    }
  };
}

function defaultFolderForLink(linkId: string | null | undefined, data: AppData) {
  const link = linkId ? data.links.find((item) => item.id === linkId) : undefined;
  return link?.folderIds.find((folderId) => folderId !== "all") ?? "unsorted";
}

function matchesDimension(value: number | undefined, expected: number) {
  return Number.isFinite(value) && Math.abs(Number(value) - expected) <= 1;
}

function isLegacyDefaultWebsiteFrame(node: CanvasNodeData, deviceView: DeviceView) {
  if (node.type !== "website" || deviceView !== "desktop") return false;
  const scale = Number(node.scale);
  const wasPreviousDefault = matchesDimension(node.width, 871) && matchesDimension(node.height, 544) && (!Number.isFinite(scale) || Math.abs(scale - 0.5) < 0.001);
  const wasMvpDefault = matchesDimension(node.width, 403) && matchesDimension(node.height, 252) && (!Number.isFinite(scale) || Math.abs(scale - 0.28) < 0.001);
  return wasPreviousDefault || wasMvpDefault;
}

function mergeById<T extends { id: string }>(seedItems: T[], savedItems: T[], options: { dropIds?: Set<string> } = {}) {
  const savedById = new Map(savedItems.map((item) => [item.id, item]));
  const seedIds = new Set(seedItems.map((item) => item.id));
  return [
    ...seedItems.map((item) => ({ ...savedById.get(item.id), ...item, id: item.id })),
    ...savedItems.filter((item) => !seedIds.has(item.id) && !options.dropIds?.has(item.id))
  ];
}

function appendMissingSeedsById<T extends { id: string }>(seedItems: T[], savedItems: T[]) {
  const seedById = new Map(seedItems.map((item) => [item.id, item]));
  const savedIds = new Set(savedItems.map((item) => item.id));
  return [
    ...savedItems.map((item) => (seedById.has(item.id) ? { ...seedById.get(item.id), ...item, id: item.id } : item)),
    ...seedItems.filter((item) => !savedIds.has(item.id))
  ];
}

function withMergedSeedData(data: AppData): AppData {
  return {
    ...data,
    folders: mergeById(seedData.folders, data.folders),
    links: mergeById(seedData.links, data.links, { dropIds: legacyDemoLinkIds }),
    canvases: appendMissingSeedsById(seedData.canvases, data.canvases)
  };
}

function normalizeCanvasNode(node: CanvasNodeData, index: number, data: AppData): CanvasNodeData {
  const deviceView = canvasDeviceSizes[node.deviceView] ? node.deviceView : "desktop";
  const base = canvasDeviceSizes[deviceView];
  const isSeedWebsiteFrame = node.id === "node-makemepulse";
  const shouldUseDefaultWebsiteFrame = isSeedWebsiteFrame || isLegacyDefaultWebsiteFrame(node, deviceView);
  const scale =
    node.type === "website"
      ? shouldUseDefaultWebsiteFrame
        ? defaultWebsiteFrameScale
        : Number.isFinite(node.scale) && Number(node.scale) > 0
        ? Number(node.scale)
        : Math.max(0.01, Number(node.width || base.width * defaultWebsiteFrameScale) / base.width)
      : node.scale ?? null;

  return {
    ...node,
    sourceFolderId: node.sourceFolderId ?? (node.type === "website" ? defaultFolderForLink(node.linkId, data) : null),
    width:
      node.type === "website" && shouldUseDefaultWebsiteFrame
        ? Math.round(base.width * Number(scale))
        : Number.isFinite(node.width) && node.width > 0
        ? node.width
        : node.type === "website"
        ? Math.round(base.width * Number(scale))
        : 260,
    height:
      node.type === "website" && shouldUseDefaultWebsiteFrame
        ? Math.round(base.height * Number(scale))
        : Number.isFinite(node.height) && node.height > 0
        ? node.height
        : node.type === "website"
        ? Math.round(base.height * Number(scale))
        : 150,
    scale,
    deviceView,
    status: node.type === "website" ? node.status ?? "live" : node.status,
    interactionMode: node.type === "website" ? node.interactionMode ?? "canvas" : node.interactionMode,
    iframeKey: node.type === "website" ? node.iframeKey ?? 0 : node.iframeKey,
    loadFailed: node.type === "website" ? node.loadFailed ?? false : node.loadFailed,
    zIndex: Number.isFinite(node.zIndex) ? node.zIndex : index + 1
  };
}

function normalizeCanvasNodeStack(nodes: CanvasNodeData[]): CanvasNodeData[] {
  const normalized = [...nodes];
  normalized
    .map((node, index) => ({ node, index, zIndex: Number.isFinite(node.zIndex) ? Number(node.zIndex) : index + 1 }))
    .sort((a, b) => a.zIndex - b.zIndex || a.index - b.index)
    .forEach(({ node }, index) => {
      node.zIndex = index + 1;
    });
  return normalized;
}

export function normalizeAppData(input: AppData): AppData {
  const withoutLegacy = withMergedSeedData(withoutLegacyFolderDescriptions(input));
  return {
    ...withoutLegacy,
    canvases: withoutLegacy.canvases.map((canvas) => ({
      ...canvas,
      viewport: normalizeViewport(canvas.viewport),
      nodes: normalizeCanvasNodeStack(canvas.nodes.map((node, index) => normalizeCanvasNode(node, index, withoutLegacy)))
    }))
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return cloneSeed();
  const saved = window.localStorage.getItem(dataKey);
  if (!saved) return cloneSeed();
  try {
    return normalizeAppData(JSON.parse(saved) as AppData);
  } catch {
    return cloneSeed();
  }
}

export function saveData(data: AppData) {
  window.localStorage.setItem(dataKey, JSON.stringify(data));
}

export function loadTheme(): ThemeName {
  if (typeof window === "undefined") return "system";
  return (window.localStorage.getItem(themeKey) as ThemeName | null) ?? "system";
}

export function saveTheme(theme: ThemeName) {
  window.localStorage.setItem(themeKey, theme);
}

export function createFolder(name: string): Folder {
  const now = new Date().toISOString();
  return {
    id: `folder-${crypto.randomUUID()}`,
    name: name.trim(),
    description: null,
    isDefault: false,
    createdAt: now,
    updatedAt: now
  };
}

export function createLink(
  urlInput: string,
  folderIds: string[],
  tagsInput: string[],
  note = "",
  includeAnalysis = true,
  analysis?: Partial<LinkItem["analysis"]>
): LinkItem {
  const url = normalizeUrl(urlInput);
  const domain = getDomain(url);
  const id = `link-${crypto.randomUUID()}`;
  const now = new Date().toISOString();
  return {
    id,
    url,
    domain,
    title: domain,
    description: `Saved reference from ${domain}`,
    screenshotUrl: createScreenshotPlaceholder(url),
    note,
    status: "ready",
    folderIds: folderIds.length ? folderIds : ["unsorted"],
    tags: tagsInput.map((tag) => tag.trim()).filter(Boolean),
    analysis: includeAnalysis
      ? analysis
        ? {
            id: `analysis-${id}`,
            linkId: id,
            fonts: analysis.fonts ?? [],
            animations: analysis.animations ?? [],
            techStack: analysis.techStack ?? [],
            colors: analysis.colors ?? [],
            createdAt: analysis.createdAt ?? now,
            updatedAt: now
          }
        : createAnalysisFixture(url, id)
      : {
          id: `analysis-${id}`,
          linkId: id,
          fonts: [],
          animations: [],
          techStack: [],
          colors: [],
          createdAt: now,
          updatedAt: now
        },
    createdAt: now,
    updatedAt: now
  };
}

export function createCanvas(name: string): InspirationCanvas {
  const now = new Date().toISOString();
  return {
    id: `canvas-${crypto.randomUUID()}`,
    name: name.trim(),
    thumbnailUrl: null,
    viewport: cloneViewport(defaultCanvasViewport),
    nodes: [],
    createdAt: now,
    updatedAt: now
  };
}

export function createCanvasNode(
  canvasId: string,
  type: CanvasNodeData["type"],
  content: string,
  linkId?: string,
  patch: Partial<CanvasNodeData> = {}
): CanvasNodeData {
  const now = new Date().toISOString();
  const deviceView = patch.deviceView ?? "desktop";
  const base = canvasDeviceSizes[deviceView];
  const scale = patch.scale ?? (type === "website" ? defaultWebsiteFrameScale : null);
  return {
    id: `node-${crypto.randomUUID()}`,
    canvasId,
    type,
    linkId: linkId ?? null,
    sourceFolderId: patch.sourceFolderId ?? null,
    content,
    x: patch.x ?? 160 + Math.round(Math.random() * 180),
    y: patch.y ?? 120 + Math.round(Math.random() * 140),
    width: patch.width ?? (type === "website" ? Math.round(base.width * Number(scale)) : 260),
    height: patch.height ?? (type === "website" ? Math.round(base.height * Number(scale)) : 150),
    scale,
    deviceView,
    status: type === "website" ? patch.status ?? "live" : patch.status,
    interactionMode: type === "website" ? patch.interactionMode ?? "canvas" : patch.interactionMode,
    iframeKey: type === "website" ? patch.iframeKey ?? 0 : patch.iframeKey,
    loadFailed: type === "website" ? patch.loadFailed ?? false : patch.loadFailed,
    zIndex: patch.zIndex ?? 1,
    createdAt: now,
    updatedAt: now,
    ...patch
  };
}
