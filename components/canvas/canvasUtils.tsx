"use client";

import { canvasDeviceSizes, defaultCanvasViewport, defaultWebsiteFrameScale } from "@/lib/demo-store";
import type { AppData, CanvasNodeData, CanvasViewport, DeviceView, Folder, InspirationCanvas, LinkItem } from "@/lib/types";

export const MAX_LIVE_IFRAMES = 5;
export const WEBSITE_FRAME_BASE_CHROME_HEIGHT = 40;
export const WEBSITE_FRAME_MIN_WIDTH = 190;
export const WEBSITE_FRAME_MAX_WIDTH = 2600;
export const THUMBNAIL_VIEW = { width: 453, height: 270 };

export function createId(prefix: string) {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return `${prefix}-${crypto.randomUUID()}`;
  return `${prefix}-${Math.random().toString(36).slice(2, 10)}`;
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

export function inferPreviewKind(link?: LinkItem | null) {
  const domain = link?.domain.toLowerCase() ?? "";
  const title = link?.title.toLowerCase() ?? "";
  if (domain.includes("makemepulse")) return "makemepulse";
  if (domain.includes("pinterest")) return "pinterest";
  if (domain.includes("isa")) return "isa";
  if (domain.includes("studio") || domain.includes("nuts") || title.includes("studio")) return "studio";
  if (domain.includes("index") || domain.includes("visual")) return "editorial";
  if (domain.includes("matter") || domain.includes("scroll")) return "dark-alt";
  return "dark";
}

export function CanvasPreviewArt({ link, className }: { link?: LinkItem | null; className?: string }) {
  const kind = inferPreviewKind(link);
  const domain = link?.domain ?? "website";
  const title = link?.title || domain;
  const color = "#27313d";

  if (kind === "makemepulse") {
    return (
      <svg className={className} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#111111" />
        <text x="78" y="78" fill="#8aa0b7" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="34" fontWeight="600">
          makemepulse.
        </text>
        <text x="1016" y="82" fill="#f7f7f5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="19">
          home
        </text>
        <text x="1126" y="82" fill="#f7f7f5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="19">
          case studies
        </text>
        <text x="1310" y="82" fill="#f7f7f5" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="19">
          what we do
        </text>
        <text x="760" y="306" textAnchor="middle" fill="#ffffff" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="132" fontWeight="300">
          global
        </text>
        <text x="870" y="470" textAnchor="middle" fill="#ffffff" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="132" fontWeight="300">
          creative
        </text>
        <text x="1080" y="648" textAnchor="middle" fill="#ffffff" fontFamily="Helvetica Neue, Arial, sans-serif" fontSize="132" fontWeight="300">
          studio.
        </text>
        <text x="716" y="344" fill="#ffffff" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="17">
          we turn aesthetics into experiences
        </text>
        <text x="862" y="584" fill="#ffffff" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="17">
          tech that&apos;s light as air
        </text>
        <circle cx="86" cy="620" r="8" fill="#ffffff" />
        <circle cx="114" cy="620" r="8" fill="#ffffff" opacity="0.76" />
        <circle cx="142" cy="620" r="8" fill="#ffffff" opacity="0.44" />
        <rect x="284" y="760" width="1040" height="320" fill="#a9ada2" />
        <rect x="284" y="760" width="1040" height="320" fill="#ffffff" opacity="0.18" />
      </svg>
    );
  }

  if (kind === "pinterest") {
    return (
      <svg className={className} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#ffffff" />
        <text x="84" y="86" fill="#e60023" fontFamily="Arial, sans-serif" fontSize="33" fontWeight="800">
          Pinterest
        </text>
        <text x="238" y="86" fill="#111111" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700">
          Explore
        </text>
        <text x="338" y="86" fill="#111111" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700">
          Shop
        </text>
        <text x="1290" y="86" fill="#111111" fontFamily="Arial, sans-serif" fontSize="20" fontWeight="700">
          About
        </text>
        <rect x="1420" y="52" width="86" height="52" rx="26" fill="#e60023" />
        <text x="1463" y="86" textAnchor="middle" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="800">
          Log in
        </text>
        <text x="204" y="262" fill="#111111" fontFamily="Arial, sans-serif" fontSize="64" fontWeight="900">
          Create the life you love
        </text>
        <text x="204" y="334" fill="#111111" fontFamily="Arial, sans-serif" fontSize="64" fontWeight="900">
          on Pinterest
        </text>
        <rect x="204" y="388" width="214" height="54" rx="27" fill="#e60023" />
        <text x="311" y="422" textAnchor="middle" fill="#ffffff" fontFamily="Arial, sans-serif" fontSize="19" fontWeight="800">
          Join Pinterest for free
        </text>
        <rect x="438" y="388" width="224" height="54" rx="27" fill="#e8e8e8" />
        <text x="550" y="422" textAnchor="middle" fill="#111111" fontFamily="Arial, sans-serif" fontSize="19" fontWeight="800">
          I already have an account
        </text>
        <rect x="982" y="120" width="196" height="236" rx="30" fill="#efc65f" />
        <rect x="1150" y="184" width="260" height="286" rx="34" fill="#71b9d7" />
        <rect x="1274" y="250" width="218" height="294" rx="36" fill="#dd6758" />
        <rect x="1014" y="356" width="188" height="230" rx="36" fill="#afbd7c" />
        <rect x="1392" y="460" width="190" height="150" rx="34" fill="#e4843d" />
        <rect x="0" y="642" width="1600" height="358" fill="#f5f3f0" />
        <text x="800" y="808" textAnchor="middle" fill="#111111" fontFamily="Arial, sans-serif" fontSize="47" fontWeight="900">
          Step into soccer season
        </text>
        <text x="800" y="864" textAnchor="middle" fill="#111111" fontFamily="Arial, sans-serif" fontSize="22">
          Flex your fandom and score fresh inspiration for every match.
        </text>
      </svg>
    );
  }

  if (kind === "isa") {
    return (
      <svg className={className} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#ffffff" />
        <text x="110" y="150" fill="#050505" fontFamily="Arial, sans-serif" fontSize="92" fontWeight="900">
          ISA DE BURGH
        </text>
        <text x="110" y="410" fill="#050505" fontFamily="Georgia, serif" fontSize="48">
          Brand Architecture
        </text>
        <text x="110" y="482" fill="#050505" fontFamily="Georgia, serif" fontSize="48">
          Creative Content
        </text>
        <text x="110" y="554" fill="#050505" fontFamily="Georgia, serif" fontSize="48">
          Storytelling
        </text>
        <text x="110" y="626" fill="#050505" fontFamily="Georgia, serif" fontSize="48">
          Art Direction
        </text>
        <circle cx="1200" cy="594" r="368" fill="#eeeeee" />
        <circle cx="1200" cy="594" r="250" fill="#d7d7d7" />
        <circle cx="1200" cy="594" r="118" fill="#b7b7b7" />
      </svg>
    );
  }

  if (kind === "studio") {
    return (
      <svg className={className} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#ffffff" />
        <text x="80" y="106" fill="#111111" fontFamily="Georgia, serif" fontSize="46" fontWeight="800">
          {domain}
        </text>
        <text x="600" y="106" fill="#111111" fontFamily="Georgia, serif" fontSize="26">
          Home
        </text>
        <text x="1120" y="106" fill="#111111" fontFamily="Georgia, serif" fontSize="26">
          Work, Info, News
        </text>
        <text x="1450" y="106" fill="#111111" fontFamily="Georgia, serif" fontSize="26">
          Contact
        </text>
        <rect x="92" y="250" width="386" height="180" fill="#d84e19" />
        <rect x="498" y="250" width="386" height="180" fill="#d7ff00" />
        <rect x="904" y="250" width="386" height="180" fill="#111111" />
        <rect x="1310" y="210" width="210" height="220" fill="#d5d5d5" />
        <text x="800" y="588" textAnchor="middle" fill="#111111" fontFamily="Georgia, serif" fontSize="70">
          Moving Missions Forward
        </text>
        <rect x="92" y="690" width="286" height="154" fill="#a94321" />
        <rect x="398" y="690" width="286" height="154" fill="#151515" />
        <rect x="704" y="690" width="286" height="154" fill="#567083" />
        <rect x="1010" y="690" width="286" height="154" fill="#e9e9e9" />
        <text x="92" y="940" fill="#111111" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="30">
          IG / LI
        </text>
        <text x="760" y="940" fill="#111111" fontFamily="Georgia, serif" fontSize="30" fontWeight="800">
          {title}
        </text>
      </svg>
    );
  }

  if (kind === "dark" || kind === "dark-alt") {
    const accent = kind === "dark" ? "#d7ff00" : "#ff552e";
    const accentSoft = kind === "dark" ? "#d84e19" : "#99a5b3";
    return (
      <svg className={className} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#111418" />
        <text x="78" y="94" fill="#d7dde6" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="34">
          {domain}
        </text>
        <text x="1110" y="94" fill="#ffffff" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="22">
          Index
        </text>
        <text x="1240" y="94" fill="#ffffff" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="22">
          Work
        </text>
        <text x="1370" y="94" fill="#ffffff" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="22">
          Contact
        </text>
        <text x="96" y="326" fill="#ffffff" fontFamily="Georgia, serif" fontSize="112" fontWeight="700">
          {title}
        </text>
        <text x="96" y="434" fill="#ffffff" fontFamily="Georgia, serif" fontSize="82">
          digital reference
        </text>
        <rect x="96" y="560" width="322" height="250" fill={accentSoft} />
        <rect x="450" y="560" width="322" height="250" fill={accent} />
        <rect x="804" y="560" width="322" height="250" fill="#f5f5f5" />
        <rect x="1158" y="560" width="322" height="250" fill="#333a44" />
        <circle cx="1300" cy="342" r="132" fill={accent} opacity="0.9" />
        <rect x="1246" y="288" width="108" height="108" fill="#ffffff" opacity="0.82" />
      </svg>
    );
  }

  if (kind === "editorial") {
    return (
      <svg className={className} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
        <rect width="1600" height="1000" fill="#f6f6f4" />
        <rect x="80" y="80" width="1440" height="140" fill="#111111" />
        <text x="122" y="168" fill="#ffffff" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="36">
          {domain}
        </text>
        <rect x="82" y="300" width="410" height="500" fill="#dedbd3" />
        <rect x="550" y="300" width="390" height="220" fill="#1f2937" />
        <rect x="550" y="580" width="390" height="220" fill="#aeb5bd" />
        <rect x="1000" y="300" width="520" height="500" fill="#ffffff" stroke="#111111" strokeWidth="3" />
        <text x="1048" y="434" fill="#111111" fontFamily="Georgia, serif" fontSize="84">
          {title}
        </text>
        <text x="1048" y="518" fill="#111111" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="28">
          Selected website reference
        </text>
      </svg>
    );
  }

  return (
    <svg className={className} viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice" aria-hidden="true">
      <rect width="1600" height="1000" fill={color} />
      <text x="88" y="104" fill="#ffffff" fontFamily="ui-monospace, SFMono-Regular, Menlo, monospace" fontSize="36">
        {domain}
      </text>
      <text x="92" y="350" fill="#ffffff" fontFamily="Georgia, serif" fontSize="120">
        {title}
      </text>
      <rect x="100" y="540" width="350" height="270" fill="#ffffff" opacity="0.22" />
      <rect x="500" y="540" width="350" height="270" fill="#ffffff" opacity="0.36" />
      <rect x="900" y="540" width="350" height="270" fill="#ffffff" opacity="0.14" />
      <circle cx="1280" cy="342" r="150" fill="#ffffff" opacity="0.28" />
    </svg>
  );
}

export function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}
