import { defaultCanvasViewport } from "@/lib/canvas-defaults";
import { dedupeLinksByUrl } from "@/lib/link-dedupe";
import type {
  AnalysisResult,
  CanvasInteractionMode,
  CanvasNodeData,
  CanvasNodeKind,
  CanvasNodeStatus,
  CanvasViewport,
  DeviceView,
  Folder,
  InspirationCanvas,
  LinkItem
} from "@/lib/types";

export type FolderRow = {
  id: string;
  name: string;
  description: string | null;
  is_default: boolean;
  created_at: string;
  updated_at: string;
};

export type CanvasNodeRow = {
  id: string;
  canvas_id: string;
  type: string;
  link_id: string | null;
  source_folder_id?: string | null;
  content: string;
  x: number | string;
  y: number | string;
  width: number | string;
  height: number | string;
  scale?: number | string | null;
  device_view: string;
  status?: string | null;
  interaction_mode?: string | null;
  iframe_key?: number | null;
  load_failed?: boolean | null;
  z_index?: number | null;
  created_at: string;
  updated_at: string;
};

export type CanvasRow = {
  id: string;
  name: string;
  thumbnail_url: string | null;
  viewport?: unknown;
  created_at: string;
  updated_at: string;
  canvas_nodes?: CanvasNodeRow[] | null;
};

export type AnalysisResultRow = {
  id: string;
  link_id: string;
  fonts: unknown;
  animations: unknown;
  tech_stack: unknown;
  colors: unknown;
  created_at: string;
  updated_at: string;
};

export type LinkRow = {
  id: string;
  url: string;
  domain: string;
  title: string;
  description: string;
  screenshot_url: string;
  note: string;
  status: string;
  created_at: string;
  updated_at: string;
  link_folders?: { folder_id: string }[] | null;
  link_tags?: { tags: { name: string } | { name: string }[] | null }[] | null;
  analysis_results?: AnalysisResultRow | AnalysisResultRow[] | null;
};

export type FolderIdMap = {
  appToDb: Record<string, string>;
  dbToApp: Record<string, string>;
  unsortedDbId: string | null;
};

const deviceViews = new Set<DeviceView>(["desktop", "tablet", "mobile"]);
const canvasNodeKinds = new Set<CanvasNodeKind>(["website", "note"]);
const nodeStatuses = new Set<CanvasNodeStatus>(["live", "loading", "screenshot"]);
const interactionModes = new Set<CanvasInteractionMode>(["canvas", "preview"]);
const linkStatuses = new Set<LinkItem["status"]>(["ready", "analyzing", "failed"]);

function numberValue(value: number | string | null | undefined, fallback: number) {
  const parsed = typeof value === "number" ? value : Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function mapDefaultFolderId(row: FolderRow) {
  return row.is_default ? "unsorted" : row.id;
}

export function buildFolderIdMap(rows: FolderRow[]): FolderIdMap {
  const appToDb: Record<string, string> = {};
  const dbToApp: Record<string, string> = {};
  let unsortedDbId: string | null = null;

  for (const row of rows) {
    const appId = mapDefaultFolderId(row);
    appToDb[appId] = row.id;
    dbToApp[row.id] = appId;
    if (row.is_default) unsortedDbId = row.id;
  }

  return { appToDb, dbToApp, unsortedDbId };
}

export function mapFolderRowsToApp(rows: FolderRow[]): Folder[] {
  const mapped = rows.map((row) => ({
    id: mapDefaultFolderId(row),
    name: row.name,
    description: row.description,
    isDefault: row.is_default,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));

  const firstTimestamp = rows[0]?.created_at ?? new Date(0).toISOString();
  const allFolder: Folder = {
    id: "all",
    name: "All Items",
    description: null,
    isDefault: true,
    createdAt: firstTimestamp,
    updatedAt: firstTimestamp
  };

  return [allFolder, ...mapped];
}

export function mapFolderIdsToDatabase(folderIds: string[], idMap: FolderIdMap): string[] {
  const ids = folderIds
    .filter((id) => id !== "all")
    .map((id) => idMap.appToDb[id] ?? id)
    .filter(Boolean);
  return Array.from(new Set(ids));
}

function stringArray(value: unknown): string[] {
  return Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : [];
}

function firstAnalysis(row: LinkRow): AnalysisResultRow | null {
  if (!row.analysis_results) return null;
  return Array.isArray(row.analysis_results) ? row.analysis_results[0] ?? null : row.analysis_results;
}

export function mapLinkRowsToApp(rows: LinkRow[], dbFolderIdToAppId: Record<string, string>): LinkItem[] {
  return dedupeLinksByUrl(rows.map((row) => {
    const analysis = firstAnalysis(row);
    const status = linkStatuses.has(row.status as LinkItem["status"]) ? (row.status as LinkItem["status"]) : "ready";
    const tags = (row.link_tags ?? [])
      .flatMap((item) => (Array.isArray(item.tags) ? item.tags : item.tags ? [item.tags] : []))
      .map((tag) => tag.name)
      .filter(Boolean);

    return {
      id: row.id,
      url: row.url,
      domain: row.domain,
      title: row.title,
      description: row.description,
      screenshotUrl: row.screenshot_url,
      note: row.note,
      status,
      folderIds: (row.link_folders ?? []).map((item) => dbFolderIdToAppId[item.folder_id] ?? item.folder_id),
      tags,
      analysis: {
        id: analysis?.id ?? `analysis-${row.id}`,
        linkId: analysis?.link_id ?? row.id,
        fonts: stringArray(analysis?.fonts),
        animations: stringArray(analysis?.animations),
        techStack: stringArray(analysis?.tech_stack),
        colors: stringArray(analysis?.colors),
        createdAt: analysis?.created_at ?? row.created_at,
        updatedAt: analysis?.updated_at ?? row.updated_at
      },
      createdAt: row.created_at,
      updatedAt: row.updated_at
    };
  }));
}

export function analysisToRow(analysis: AnalysisResult) {
  return {
    id: analysis.id,
    link_id: analysis.linkId,
    fonts: analysis.fonts,
    animations: analysis.animations,
    tech_stack: analysis.techStack,
    colors: analysis.colors
  };
}

export function canvasNodeToRow(node: CanvasNodeData, appFolderIdToDbId: Record<string, string>) {
  return {
    id: node.id,
    canvas_id: node.canvasId,
    type: node.type,
    link_id: node.linkId ?? null,
    source_folder_id: node.sourceFolderId ? appFolderIdToDbId[node.sourceFolderId] ?? node.sourceFolderId : null,
    content: node.content,
    x: node.x,
    y: node.y,
    width: node.width,
    height: node.height,
    scale: node.scale ?? null,
    device_view: node.deviceView,
    status: node.status ?? null,
    interaction_mode: node.interactionMode ?? null,
    iframe_key: node.iframeKey ?? 0,
    load_failed: node.loadFailed ?? false,
    z_index: node.zIndex ?? 1
  };
}

function mapViewport(value: unknown): CanvasViewport {
  if (!value || typeof value !== "object") return defaultCanvasViewport;
  const source = value as Partial<CanvasViewport>;
  return {
    pan: {
      x: numberValue(source.pan?.x, defaultCanvasViewport.pan.x),
      y: numberValue(source.pan?.y, defaultCanvasViewport.pan.y)
    },
    zoom: numberValue(source.zoom, defaultCanvasViewport.zoom),
    size: {
      width: numberValue(source.size?.width, defaultCanvasViewport.size.width),
      height: numberValue(source.size?.height, defaultCanvasViewport.size.height)
    }
  };
}

function mapCanvasNodeRowToApp(row: CanvasNodeRow, dbFolderIdToAppId: Record<string, string>, fallbackZIndex: number): CanvasNodeData {
  const type = canvasNodeKinds.has(row.type as CanvasNodeKind) ? (row.type as CanvasNodeKind) : "note";
  const deviceView = deviceViews.has(row.device_view as DeviceView) ? (row.device_view as DeviceView) : "desktop";
  const status = row.status && nodeStatuses.has(row.status as CanvasNodeStatus) ? (row.status as CanvasNodeStatus) : undefined;
  const interactionMode =
    row.interaction_mode && interactionModes.has(row.interaction_mode as CanvasInteractionMode)
      ? (row.interaction_mode as CanvasInteractionMode)
      : undefined;
  const sourceFolderId = row.source_folder_id ? dbFolderIdToAppId[row.source_folder_id] ?? row.source_folder_id : null;

  return {
    id: row.id,
    canvasId: row.canvas_id,
    type,
    linkId: row.link_id,
    sourceFolderId,
    content: row.content,
    x: numberValue(row.x, 0),
    y: numberValue(row.y, 0),
    width: numberValue(row.width, 320),
    height: numberValue(row.height, 200),
    scale: row.scale === undefined ? null : row.scale === null ? null : numberValue(row.scale, 1),
    deviceView,
    status,
    interactionMode,
    iframeKey: row.iframe_key ?? undefined,
    loadFailed: row.load_failed ?? undefined,
    zIndex: row.z_index ?? fallbackZIndex,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

export function mapCanvasRowsToApp(rows: CanvasRow[], dbFolderIdToAppId: Record<string, string>): InspirationCanvas[] {
  return rows.map((row) => ({
    id: row.id,
    name: row.name,
    thumbnailUrl: row.thumbnail_url,
    viewport: mapViewport(row.viewport),
    nodes: (row.canvas_nodes ?? [])
      .map((node, index) => mapCanvasNodeRowToApp(node, dbFolderIdToAppId, index + 1))
      .sort((a, b) => (a.zIndex ?? 1) - (b.zIndex ?? 1)),
    createdAt: row.created_at,
    updatedAt: row.updated_at
  }));
}
