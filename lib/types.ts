export type ThemeName = "light" | "dark" | "dawn" | "dusk" | "system";

export type DeviceView = "desktop" | "tablet" | "mobile";
export type CanvasNodeStatus = "live" | "loading" | "screenshot";
export type CanvasInteractionMode = "canvas" | "preview";

export type CanvasViewport = {
  pan: { x: number; y: number };
  zoom: number;
  size: { width: number; height: number };
};

export type Folder = {
  id: string;
  name: string;
  description?: string | null;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
};

export type AnalysisResult = {
  id: string;
  linkId: string;
  fonts: string[];
  animations: string[];
  techStack: string[];
  colors: string[];
  createdAt: string;
  updatedAt: string;
};

export type LinkItem = {
  id: string;
  url: string;
  domain: string;
  title: string;
  description: string;
  screenshotUrl: string;
  note: string;
  status: "ready" | "analyzing" | "failed";
  folderIds: string[];
  tags: string[];
  analysis: AnalysisResult;
  createdAt: string;
  updatedAt: string;
};

export type CanvasNodeKind = "website" | "note";

export type CanvasNodeData = {
  id: string;
  canvasId: string;
  type: CanvasNodeKind;
  linkId?: string | null;
  sourceFolderId?: string | null;
  content: string;
  x: number;
  y: number;
  width: number;
  height: number;
  scale?: number | null;
  deviceView: DeviceView;
  status?: CanvasNodeStatus;
  interactionMode?: CanvasInteractionMode;
  iframeKey?: number;
  loadFailed?: boolean;
  zIndex?: number;
  createdAt: string;
  updatedAt: string;
};

export type InspirationCanvas = {
  id: string;
  name: string;
  thumbnailUrl?: string | null;
  viewport: CanvasViewport;
  nodes: CanvasNodeData[];
  createdAt: string;
  updatedAt: string;
};

export type AppData = {
  folders: Folder[];
  links: LinkItem[];
  canvases: InspirationCanvas[];
};
