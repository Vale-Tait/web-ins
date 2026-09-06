import { createAnalysisFixture, createScreenshotPlaceholder } from "@/lib/analysis";
import { canvasDeviceSizes, defaultCanvasViewport, defaultWebsiteFrameScale } from "@/lib/canvas-defaults";
import type { AppData, Folder, InspirationCanvas, LinkItem } from "@/lib/types";

const now = new Date("2026-06-03T09:00:00.000Z").toISOString();

export const seedFolders: Folder[] = [
  { id: "all", name: "All Items", description: null, isDefault: true, createdAt: now, updatedAt: now },
  { id: "unsorted", name: "Unsorted", description: null, isDefault: true, createdAt: now, updatedAt: now },
  { id: "agency", name: "Agency", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "portfolio", name: "Portfolio", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "motion", name: "Motion", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "saas", name: "SaaS", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "ecommerce", name: "Ecommerce", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "editorial", name: "Editorial", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "branding", name: "Branding", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "webgl", name: "WebGL", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "typography", name: "Typography", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "mobile", name: "Mobile", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "minimal", name: "Minimal", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "archive", name: "Archive", description: null, isDefault: false, createdAt: now, updatedAt: now },
  { id: "experiments", name: "Experiments", description: null, isDefault: false, createdAt: now, updatedAt: now }
];

const linksBase = [
  {
    id: "link-makemepulse",
    url: "https://makemepulse.com",
    domain: "makemepulse.com",
    title: "MakeMePulse",
    description: "Global creative studio reference.",
    note: "",
    folderIds: ["agency"],
    tags: ["Agency", "Motion", "Typography"]
  },
  {
    id: "link-pinterest",
    url: "https://www.pinterest.com",
    domain: "pinterest.com",
    title: "Pinterest",
    description: "Pinterest landing reference.",
    note: "",
    folderIds: ["agency"],
    tags: ["Agency"]
  },
  {
    id: "link-studiofreight",
    url: "https://studiofreight.com",
    domain: "studiofreight.com",
    title: "Studio Freight",
    description: "Minimal studio site reference.",
    note: "",
    folderIds: ["agency"],
    tags: ["Minimal", "Studio"]
  },
  {
    id: "link-northstar",
    url: "https://northstar.studio",
    domain: "northstar.studio",
    title: "Northstar Studio",
    description: "Dark studio reference.",
    note: "",
    folderIds: ["agency"],
    tags: ["Agency"]
  },
  {
    id: "link-matterworks",
    url: "https://matterworks.co",
    domain: "matterworks.co",
    title: "Matter Works",
    description: "Digital reference system.",
    note: "",
    folderIds: ["agency"],
    tags: ["Agency"]
  },
  {
    id: "link-indexsupply",
    url: "https://indexsupply.io",
    domain: "indexsupply.io",
    title: "Index Supply",
    description: "Editorial supply reference.",
    note: "",
    folderIds: ["agency"],
    tags: ["Agency", "Editorial"]
  },
  {
    id: "link-futureformat",
    url: "https://futureformat.com",
    domain: "futureformat.com",
    title: "Future Format",
    description: "Agency format reference.",
    note: "",
    folderIds: ["agency"],
    tags: ["Agency"]
  },
  {
    id: "link-lineartype",
    url: "https://lineartype.net",
    domain: "lineartype.net",
    title: "Linear Type",
    description: "Type-led studio reference.",
    note: "",
    folderIds: ["agency"],
    tags: ["Typography"]
  },
  {
    id: "link-signalcraft",
    url: "https://signalcraft.design",
    domain: "signalcraft.design",
    title: "Signal Craft",
    description: "Signal and craft reference.",
    note: "",
    folderIds: ["agency"],
    tags: ["Agency"]
  },
  {
    id: "link-isadeburgh",
    url: "https://isadeburgh.com",
    domain: "isadeburgh.com",
    title: "Isa de Burgh",
    description: "Editorial portfolio reference with quiet asymmetry.",
    note: "",
    folderIds: ["portfolio"],
    tags: ["Portfolio", "Editorial"]
  },
  {
    id: "link-visualindex",
    url: "https://example.com",
    domain: "visualindex.co",
    title: "Visual Index",
    description: "Portfolio visual index reference.",
    note: "",
    folderIds: ["portfolio"],
    tags: ["Portfolio"]
  },
  {
    id: "link-motionlab",
    url: "https://example.com",
    domain: "motionlab.dev",
    title: "Motion Lab",
    description: "Motion reference.",
    note: "",
    folderIds: ["motion"],
    tags: ["Motion"]
  },
  {
    id: "link-scrollstudio",
    url: "https://example.com",
    domain: "scroll.studio",
    title: "Scroll Studio",
    description: "Scroll-led studio reference.",
    note: "",
    folderIds: ["motion"],
    tags: ["Motion"]
  },
  {
    id: "link-untitled-reference",
    url: "https://example.com",
    domain: "example.com",
    title: "Untitled Reference",
    description: "Unsorted reference.",
    note: "",
    folderIds: ["unsorted"],
    tags: ["Unsorted"]
  },
  {
    id: "link-saasboards",
    url: "https://saasboards.io",
    domain: "saasboards.io",
    title: "SaaS Boards",
    description: "SaaS board reference.",
    note: "",
    folderIds: ["saas"],
    tags: ["SaaS"]
  },
  {
    id: "link-commercegrid",
    url: "https://commercegrid.co",
    domain: "commercegrid.co",
    title: "Commerce Grid",
    description: "Ecommerce grid reference.",
    note: "",
    folderIds: ["ecommerce"],
    tags: ["Ecommerce"]
  }
];

export const seedLinks: LinkItem[] = linksBase.map((item) => ({
  ...item,
  screenshotUrl: createScreenshotPlaceholder(item.url),
  status: "ready",
  analysis: createAnalysisFixture(item.url, item.id),
  createdAt: now,
  updatedAt: now
}));

export const seedCanvases: InspirationCanvas[] = [
  {
    id: "canvas-agency-research",
    name: "Agency Research",
    thumbnailUrl: null,
    viewport: {
      pan: { ...defaultCanvasViewport.pan },
      zoom: defaultCanvasViewport.zoom,
      size: { ...defaultCanvasViewport.size }
    },
    createdAt: now,
    updatedAt: now,
    nodes: [
      {
        id: "node-makemepulse",
        canvasId: "canvas-agency-research",
        type: "website",
        linkId: "link-makemepulse",
        sourceFolderId: "agency",
        content: "makemepulse.com",
        x: 120,
        y: 120,
        width: Math.round(canvasDeviceSizes.desktop.width * defaultWebsiteFrameScale),
        height: Math.round(canvasDeviceSizes.desktop.height * defaultWebsiteFrameScale),
        scale: defaultWebsiteFrameScale,
        deviceView: "desktop",
        status: "live",
        interactionMode: "canvas",
        iframeKey: 0,
        zIndex: 1,
        createdAt: now,
        updatedAt: now
      },
      {
        id: "node-note-1",
        canvasId: "canvas-agency-research",
        type: "note",
        linkId: null,
        sourceFolderId: null,
        content: "Strong hero type, but navigation stays utilitarian.",
        x: 560,
        y: 180,
        width: 260,
        height: 150,
        scale: null,
        deviceView: "desktop",
        zIndex: 2,
        createdAt: now,
        updatedAt: now
      }
    ]
  }
];

export const seedData: AppData = {
  folders: seedFolders,
  links: seedLinks,
  canvases: seedCanvases
};
