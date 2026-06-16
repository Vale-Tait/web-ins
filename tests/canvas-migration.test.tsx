import { readFileSync } from "node:fs";
import { join } from "node:path";
import { createEvent, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { useState } from "react";
import { describe, expect, it } from "vitest";
import { CanvasListShell } from "@/components/canvas/CanvasListShell";
import { CanvasWorkspaceShell } from "@/components/canvas/CanvasWorkspaceShell";
import { THUMBNAIL_VIEW, getWebsiteFrameChromeHeight } from "@/components/canvas/canvasUtils";
import { normalizeAppData } from "@/lib/demo-store";
import { seedData } from "@/lib/fixtures";
import type { AppData, CanvasNodeData, Folder, InspirationCanvas, LinkItem } from "@/lib/types";

const now = "2026-06-03T09:00:00.000Z";
const defaultCanvasZoom = 0.5;
const defaultWebsiteFrameScale = 1;
const defaultWebsiteFrameWidth = 1742;
const defaultWebsiteFrameHeight = 1088;
const defaultWebsiteFrameVisibleWidth = 871;
const defaultWebsiteFrameVisibleHeight = 544;
const defaultWebsiteFrameChromeHeight = 40;

function makeFolder(id: string, name: string): Folder {
  return { id, name, description: null, isDefault: id === "all" || id === "unsorted", createdAt: now, updatedAt: now };
}

function makeLink(id: string, domain: string, folderIds: string[]): LinkItem {
  return {
    id,
    url: `https://${domain}/`,
    domain,
    title: domain,
    description: "",
    screenshotUrl: "",
    note: "",
    status: "ready",
    folderIds,
    tags: [],
    analysis: {
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

function makeCanvas(overrides: Partial<InspirationCanvas> = {}): InspirationCanvas {
  return {
    id: "canvas-agency-research",
    name: "Agency Research",
    thumbnailUrl: null,
    viewport: { pan: { x: 220, y: 120 }, zoom: defaultCanvasZoom, size: { width: 1200, height: 800 } },
    nodes: [],
    createdAt: now,
    updatedAt: now,
    ...overrides
  };
}

function makeData(canvas = makeCanvas()): AppData {
  return {
    folders: [makeFolder("all", "All Items"), makeFolder("unsorted", "Unsorted"), makeFolder("agency", "Agency")],
    links: [makeLink("link-makemepulse", "makemepulse.com", ["agency"])],
    canvases: [canvas]
  };
}

function installVisibleCanvasAreaRect() {
  const originalRect = HTMLElement.prototype.getBoundingClientRect;
  HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
    if (typeof this.className === "string" && this.className.includes("canvasArea")) {
      return {
        x: 0,
        y: 0,
        left: 0,
        top: 0,
        right: 2000,
        bottom: 1200,
        width: 2000,
        height: 1200,
        toJSON: () => ({})
      } as DOMRect;
    }
    return originalRect.call(this);
  };
  return () => {
    HTMLElement.prototype.getBoundingClientRect = originalRect;
  };
}

function WorkspaceHarness({ initialData }: { initialData: AppData }) {
  const [data, setData] = useState(initialData);
  return <CanvasWorkspaceShell canvasId="canvas-agency-research" data={data} onDataChange={setData} />;
}

describe("canvas migration", () => {
  it("keeps the product seed data at the same mock-data scale as the Canvas MVP", () => {
    const seedCanvas = seedData.canvases[0];
    const seedWebsiteNode = seedCanvas.nodes.find((node) => node.id === "node-makemepulse");

    expect(seedData.folders.filter((folder) => folder.id !== "all")).toHaveLength(14);
    expect(seedData.links).toHaveLength(16);
    expect(seedData.links.filter((link) => link.folderIds.includes("agency"))).toHaveLength(9);
    expect(seedCanvas.viewport.zoom).toBe(defaultCanvasZoom);
    expect(seedWebsiteNode).toMatchObject({
      scale: defaultWebsiteFrameScale,
      width: defaultWebsiteFrameWidth,
      height: defaultWebsiteFrameHeight
    });
    expect(seedWebsiteNode!.width * seedCanvas.viewport.zoom).toBe(defaultWebsiteFrameVisibleWidth);
    expect(seedWebsiteNode!.height * seedCanvas.viewport.zoom).toBe(defaultWebsiteFrameVisibleHeight);
    expect(seedData.links.map((link) => link.domain)).toEqual([
      "makemepulse.com",
      "pinterest.com",
      "studiofreight.com",
      "northstar.studio",
      "matterworks.co",
      "indexsupply.io",
      "futureformat.com",
      "lineartype.net",
      "signalcraft.design",
      "isadeburgh.com",
      "visualindex.co",
      "motionlab.dev",
      "scroll.studio",
      "example.com",
      "saasboards.io",
      "commercegrid.co"
    ]);
  });

  it("merges missing MVP seed data into old localStorage data and restores seed frame size", () => {
    const oldData = makeData(
      makeCanvas({
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
            width: 1160,
            height: 725,
            scale: 0.805,
            deviceView: "desktop",
            status: "live",
            interactionMode: "canvas",
            iframeKey: 0,
            zIndex: 1,
            createdAt: now,
            updatedAt: now
          }
        ]
      })
    );

    const normalized = normalizeAppData(oldData);
    const seedNode = normalized.canvases[0].nodes.find((node) => node.id === "node-makemepulse");

    expect(normalized.folders.filter((folder) => folder.id !== "all")).toHaveLength(14);
    expect(normalized.links).toHaveLength(16);
    expect(normalized.canvases[0].viewport.zoom).toBe(defaultCanvasZoom);
    expect(seedNode?.scale).toBe(defaultWebsiteFrameScale);
    expect(seedNode?.width).toBe(defaultWebsiteFrameWidth);
    expect(seedNode?.height).toBe(defaultWebsiteFrameHeight);
  });

  it("normalizes legacy canvas data with MVP viewport and node fields", () => {
    const legacy = makeData({
      id: "canvas-legacy",
      name: "Legacy Canvas",
      thumbnailUrl: null,
      nodes: [
        {
          id: "node-legacy",
          canvasId: "canvas-legacy",
          type: "website",
          linkId: "link-makemepulse",
          content: "makemepulse.com",
          x: 120,
          y: 140,
          width: 360,
          height: 240,
          deviceView: "desktop",
          createdAt: now,
          updatedAt: now
        }
      ],
      createdAt: now,
      updatedAt: now
    } as InspirationCanvas);

    const normalized = normalizeAppData(legacy);
    const canvas = normalized.canvases[0];
    const node = canvas.nodes[0];

    expect(canvas.viewport).toEqual({ pan: { x: 220, y: 120 }, zoom: defaultCanvasZoom, size: { width: 1200, height: 800 } });
    expect(node.zIndex).toBe(1);
    expect(node.sourceFolderId).toBe("agency");
    expect(node.scale).toBeCloseTo(360 / 1742, 4);
    expect(node.status).toBe("live");
    expect(node.interactionMode).toBe("canvas");
    expect(node.iframeKey).toBe(0);
  });

  it("migrates previously imported default website frames to the screen 50 percent size", () => {
    const normalized = normalizeAppData(
      makeData(
        makeCanvas({
          nodes: [
            {
              id: "node-old-default-import",
              canvasId: "canvas-agency-research",
              type: "website",
              linkId: "link-makemepulse",
              sourceFolderId: "agency",
              content: "makemepulse.com",
              x: 120,
              y: 140,
              width: 871,
              height: 544,
              scale: 0.5,
              deviceView: "desktop",
              status: "live",
              interactionMode: "canvas",
              iframeKey: 0,
              zIndex: 1,
              createdAt: now,
              updatedAt: now
            }
          ]
        })
      )
    );

    expect(normalized.canvases[0].nodes[0]).toMatchObject({
      scale: defaultWebsiteFrameScale,
      width: defaultWebsiteFrameWidth,
      height: defaultWebsiteFrameHeight
    });
  });

  it("normalizes duplicate canvas node z-index values into a stable stack", () => {
    const normalized = normalizeAppData(
      makeData(
        makeCanvas({
          nodes: [
            {
              id: "node-a",
              canvasId: "canvas-agency-research",
              type: "note",
              linkId: null,
              sourceFolderId: null,
              content: "A",
              x: 0,
              y: 0,
              width: 260,
              height: 150,
              scale: null,
              deviceView: "desktop",
              zIndex: 8,
              createdAt: now,
              updatedAt: now
            },
            {
              id: "node-b",
              canvasId: "canvas-agency-research",
              type: "note",
              linkId: null,
              sourceFolderId: null,
              content: "B",
              x: 0,
              y: 0,
              width: 260,
              height: 150,
              scale: null,
              deviceView: "desktop",
              zIndex: 8,
              createdAt: now,
              updatedAt: now
            }
          ]
        })
      )
    );

    expect(normalized.canvases[0].nodes.map((node) => node.zIndex)).toEqual([1, 2]);
  });

  it("renders the canvas list content without the MVP title block and links cards to the workspace", () => {
    render(<CanvasListShell data={makeData()} onDataChange={() => undefined} />);

    expect(screen.queryByText("Standalone HTML prototype")).not.toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Agency Research" })).toBeInTheDocument();
    expect(screen.getByRole("link", { name: /Agency Research/ })).toHaveAttribute("href", "/canvas/canvas-agency-research");
    const createCanvasButton = screen.getByRole("button", { name: "Create canvas" });
    expect(createCanvasButton).toBeInTheDocument();
    expect(createCanvasButton.querySelector("svg")?.getAttribute("viewBox")).toBe("0 0 1024 1024");
    expect(createCanvasButton.querySelector("svg")?.className.baseVal).toContain("bottomCreateIcon");
    expect(createCanvasButton.querySelector("path")?.getAttribute("d")).not.toContain("M2.35 6.55");
  });

  it("uses the exact product top navigation component on the canvas list page", () => {
    const css = readFileSync(join(process.cwd(), "components/canvas/canvas.module.css"), "utf8");
    const page = readFileSync(join(process.cwd(), "app/canvas/page.tsx"), "utf8");
    const productShell = readFileSync(join(process.cwd(), "components/ProductShell.tsx"), "utf8");
    const productTopNav = readFileSync(join(process.cwd(), "components/ProductTopNav.tsx"), "utf8");
    const canvasTopNav = readFileSync(join(process.cwd(), "components/canvas/CanvasTopNav.tsx"), "utf8");
    const scaleRootBlock = css.match(/\.canvasListScaleRoot\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const scrollRootBlock = css.match(/\.canvasListScrollRoot\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";

    expect(page).toContain('import { ProductShell } from "@/components/ProductShell"');
    expect(page).toContain("<ProductShell>");
    expect(page).not.toContain("app-scale-root");
    expect(page).not.toContain("canvasListScaleRoot");
    expect(page).not.toContain("canvasListScrollRoot");
    expect(page).not.toContain('import { ProductTopNav } from "@/components/ProductTopNav"');
    expect(page).not.toContain('import { ThemeRail } from "@/components/ThemeRail"');
    expect(page).not.toContain("<ThemeRail />");
    expect(page).not.toContain("<ProductTopNav />");
    expect(page).not.toContain("<main className={styles.canvasListScrollRoot}>");
    expect(productShell).toContain('import { ProductTopNav } from "@/components/ProductTopNav"');
    expect(productShell).toContain("<ProductTopNav />");
    expect(productShell).toContain('style={{ overflow: "hidden" }}');
    expect(productShell).toContain("h-full min-w-0 overflow-x-hidden overflow-y-auto");
    expect(canvasTopNav).toContain('import { ProductTopNav } from "@/components/ProductTopNav"');
    expect(canvasTopNav).not.toContain("CanvasIcons");
    expect(canvasTopNav).not.toContain("canvas.module.css");
    expect(scaleRootBlock).toContain("width: calc(100vw / var(--app-scale))");
    expect(scaleRootBlock).toContain("height: calc(100dvh / var(--app-scale))");
    expect(scaleRootBlock).toContain("overflow: hidden");
    expect(scrollRootBlock).toContain("height: 100%");
    expect(scrollRootBlock).toContain("overflow-y: auto");
    expect(productTopNav).toContain("fixed left-[84px] right-0 top-0");
    expect(productTopNav).toContain("h-[90px]");
    expect(productTopNav).toContain("analyze-nav-link");
    expect(productTopNav).toContain("h-11");
    expect(productTopNav).toContain("group-hover:bg-white/10");
  });

  it("lets the product shell own the canvas list sidebar and theme tokens", () => {
    const css = readFileSync(join(process.cwd(), "components/canvas/canvas.module.css"), "utf8");
    const canvasRootBlock = css.match(/\.canvasRoot\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";

    expect(canvasRootBlock).not.toContain("--bg: #ffffff");
    expect(canvasRootBlock).not.toContain("--panel: #ffffff");
    expect(canvasRootBlock).not.toContain("--text: #111827");
    expect(canvasRootBlock).not.toContain("--muted: #7b8494");
  });

  it("uses theme-aware canvas workspace chrome in non-light themes", () => {
    const css = readFileSync(join(process.cwd(), "components/canvas/canvas.module.css"), "utf8");
    const icons = readFileSync(join(process.cwd(), "components/canvas/CanvasIcons.tsx"), "utf8");
    const canvasRootBlock = css.match(/\.canvasRoot\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const workspaceTopbarBlock = css.match(/\.workspaceTopbar\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const bottomToolbarBlock = css.match(/\.bottomToolbar\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const panelBlock = css.match(/\.panel\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const toolButtonBlock = css.match(/\.toolButton\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const folderRowSelectedBlock = css.match(/\.folderRow:hover,\s*\n\.folderRowSelected\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const statusPillBlock = css.match(/\.statusPill\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const searchIconBlock = css.match(/\.searchIcon\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const searchIconAfterBlock = css.match(/\.searchIcon::after\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";

    expect(canvasRootBlock).toContain("--canvas-glass-bg");
    expect(workspaceTopbarBlock).toContain("background: var(--canvas-glass-bg)");
    expect(workspaceTopbarBlock).toContain("border-bottom: 1px solid var(--canvas-glass-border)");
    expect(workspaceTopbarBlock).toContain("box-shadow: none");
    expect(bottomToolbarBlock).toContain("background: var(--canvas-glass-bg)");
    expect(bottomToolbarBlock).toContain("border: 1px solid var(--canvas-glass-border)");
    expect(panelBlock).toContain("background: var(--canvas-glass-bg)");
    expect(panelBlock).toContain("border: 1px solid var(--canvas-glass-border)");
    expect(toolButtonBlock).toContain("background: var(--panel)");
    expect(toolButtonBlock).not.toContain("rgba(255, 255, 255");
    expect(folderRowSelectedBlock).toContain("background: var(--muted-panel)");
    expect(folderRowSelectedBlock).toContain("color: var(--text)");
    expect(statusPillBlock).toContain("color: var(--text)");
    expect(searchIconBlock).toContain("border: 1.7px solid var(--muted)");
    expect(searchIconAfterBlock).toContain("background: var(--muted)");
    expect(icons).toContain('fill="currentColor"');
    expect(icons).not.toContain('fill="#ffffff"');
  });

  it("aligns the canvas list cards with the collections card spacing and scroll model", () => {
    const css = readFileSync(join(process.cwd(), "components/canvas/canvas.module.css"), "utf8");
    const listPageBlock = css.match(/\.listPage\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const canvasGridBlock = css.match(/\.canvasGrid\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const cardShellBlock = css.match(/\.canvasCardShell\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const cardBlock = css.match(/\.canvasCard\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const thumbBlock = css.match(/\.canvasThumb\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const infoBlock = css.match(/\.canvasInfo\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";

    expect(listPageBlock).toContain("padding: 60px 72px 128px");
    expect(canvasGridBlock).toContain("grid-template-columns: repeat(auto-fill, 453px)");
    expect(canvasGridBlock).toContain("gap: 40px");
    expect(canvasGridBlock).toContain("align-items: start");
    expect(cardShellBlock).toContain("width: 453px");
    expect(cardBlock).toContain("width: 453px");
    expect(cardBlock).toContain("height: 360px");
    expect(thumbBlock).toContain("height: 270px");
    expect(infoBlock).toContain("height: 90px");
    expect(THUMBNAIL_VIEW).toEqual({ width: 453, height: 270 });
    expect(css).not.toContain(".canvasThumb::before");
    expect(css).not.toContain("radial-gradient(circle at 50% 18%");
  });

  it("removes rounded popup shadows from canvas floating surfaces", () => {
    const css = readFileSync(join(process.cwd(), "components/canvas/canvas.module.css"), "utf8");
    const popupSelectors = [".createCanvasDialog", ".canvasCardMenu", ".bottomToolbar", ".panel", ".contextMenu"];

    for (const selector of popupSelectors) {
      const escaped = selector.replace(".", "\\.");
      const block = css.match(new RegExp(`${escaped}\\s*\\{(?<body>[^}]+)\\}`))?.groups?.body ?? "";
      expect(block).toContain("box-shadow: none");
      expect(block).not.toContain("box-shadow: 0 12px 32px");
      expect(block).not.toContain("box-shadow: 0 32px 80px");
    }
  });

  it("opens the create dialog and creates a new canvas from the list", () => {
    let nextData = makeData();
    render(<CanvasListShell data={nextData} onDataChange={(value) => (nextData = value)} />);

    fireEvent.click(screen.getByRole("button", { name: "Create canvas" }));
    const closeButton = screen.getByRole("button", { name: "Close" });
    expect(closeButton.querySelector("svg")).not.toBeInTheDocument();
    expect(closeButton.querySelector("span")).toBeInTheDocument();
    expect(closeButton.className).toContain("dialogShapeClose");

    const createButton = screen.getByRole("button", { name: "Create Canvas" });
    expect(createButton).toBeDisabled();

    fireEvent.change(screen.getByPlaceholderText("Enter canvas name"), { target: { value: "SaaS Landing Inspiration" } });
    expect(createButton).toBeEnabled();
    fireEvent.click(createButton);

    expect(nextData.canvases[0].name).toBe("SaaS Landing Inspiration");
    expect(nextData.canvases[0].viewport).toEqual({ pan: { x: 220, y: 120 }, zoom: defaultCanvasZoom, size: { width: 1200, height: 800 } });
  });

  it("matches the MVP canvas card edit menu rename and delete flows", () => {
    let nextData = makeData();
    const { rerender } = render(<CanvasListShell data={nextData} onDataChange={(value) => (nextData = value)} />);

    fireEvent.click(screen.getByRole("button", { name: "Edit Agency Research" }));
    fireEvent.click(screen.getByRole("button", { name: "Rename canvas" }));
    fireEvent.change(screen.getByLabelText("Canvas Name"), { target: { value: "Updated Canvas" } });
    fireEvent.click(screen.getByRole("button", { name: "Save Changes" }));
    expect(nextData.canvases[0].name).toBe("Updated Canvas");

    rerender(<CanvasListShell data={nextData} onDataChange={(value) => (nextData = value)} />);
    fireEvent.click(screen.getByRole("button", { name: "Edit Updated Canvas" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete canvas" }));
    fireEvent.click(screen.getByRole("button", { name: "Delete canvas" }));
    expect(nextData.canvases).toHaveLength(0);
  });

  it("renders the workspace without the formal navigation and supports adding a note", () => {
    let nextData = makeData(makeCanvas({ name: "SaaS Landing Inspiration" }));
    render(
      <CanvasWorkspaceShell
        canvasId="canvas-agency-research"
        data={nextData}
        onDataChange={(value) => {
          nextData = value;
        }}
      />
    );

    expect(screen.queryByRole("navigation", { name: "Primary" })).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Back" })).toBeInTheDocument();
    expect(screen.getByText("SaaS Landing Inspiration")).toBeInTheDocument();
    expect(screen.getByText("Saved")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Add Note" }));

    expect(nextData.canvases[0].nodes[0]).toMatchObject({ type: "note", content: "", width: 260, height: 150 });
  });

  it("uses the framework scale root for the workspace route without breaking MVP canvas math", () => {
    const page = readFileSync(join(process.cwd(), "app/canvas/[id]/page.tsx"), "utf8");
    const css = readFileSync(join(process.cwd(), "components/canvas/canvas.module.css"), "utf8");
    const workspaceScaleBlock = css.match(/\.canvasWorkspaceScaleRoot\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";

    expect(page).toContain("app-scale-root");
    expect(page).toContain("canvasWorkspaceScaleRoot");
    expect(workspaceScaleBlock).toContain("width: calc(100vw / var(--app-scale))");
    expect(workspaceScaleBlock).toContain("height: calc(100dvh / var(--app-scale))");
  });

  it("compensates the framework app scale so 50 percent canvas zoom renders as screen 50 percent", async () => {
    const previousAppScale = document.documentElement.style.getPropertyValue("--app-scale");
    document.documentElement.style.setProperty("--app-scale", "0.75");
    try {
      const { container } = render(
        <CanvasWorkspaceShell
          canvasId="canvas-agency-research"
          data={makeData(
            makeCanvas({
              nodes: [
                {
                  id: "node-website-1",
                  canvasId: "canvas-agency-research",
                  type: "website",
                  linkId: "link-makemepulse",
                  sourceFolderId: "agency",
                  content: "makemepulse.com",
                  x: 120,
                  y: 140,
                  width: defaultWebsiteFrameWidth,
                  height: defaultWebsiteFrameHeight,
                  scale: defaultWebsiteFrameScale,
                  deviceView: "desktop",
                  status: "live",
                  interactionMode: "canvas",
                  iframeKey: 0,
                  zIndex: 1,
                  createdAt: now,
                  updatedAt: now
                }
              ]
            })
          )}
          rootClassName="app-scale-root"
          onDataChange={() => undefined}
        />
      );
      const world = container.querySelector("[class*='canvasWorld']") as HTMLElement;
      const area = container.querySelector("[class*='canvasArea']") as HTMLElement;

      await waitFor(() => expect(world.style.transform).toContain("scale(0.666"));
      expect(world.style.transform).toContain("translate(293.333");
      expect(area.style.getPropertyValue("--grid-size")).toBe("32px");
    } finally {
      if (previousAppScale) document.documentElement.style.setProperty("--app-scale", previousAppScale);
      else document.documentElement.style.removeProperty("--app-scale");
    }
  });

  it("uses the MVP website frame chrome scale behavior inside the canvas world", () => {
    const { container } = render(
      <CanvasWorkspaceShell
        canvasId="canvas-agency-research"
        data={makeData(
          makeCanvas({
            nodes: [
              {
                id: "node-website-1",
                canvasId: "canvas-agency-research",
                type: "website",
                linkId: "link-makemepulse",
                sourceFolderId: "agency",
                content: "makemepulse.com",
                x: 120,
                y: 140,
                width: defaultWebsiteFrameWidth,
                height: defaultWebsiteFrameHeight,
                scale: defaultWebsiteFrameScale,
                deviceView: "desktop",
                status: "live",
                interactionMode: "canvas",
                iframeKey: 0,
                zIndex: 1,
                createdAt: now,
                updatedAt: now
              }
            ]
          })
        )}
        onDataChange={() => undefined}
      />
    );
    const node = container.querySelector("[class*='node']") as HTMLElement;

    expect(getWebsiteFrameChromeHeight(defaultCanvasZoom)).toBe(defaultWebsiteFrameChromeHeight);
    expect(getWebsiteFrameChromeHeight(1)).toBe(defaultWebsiteFrameChromeHeight);
    expect(getWebsiteFrameChromeHeight(defaultCanvasZoom)).toBe(defaultWebsiteFrameChromeHeight);
    expect(node.style.getPropertyValue("--frame-bar-height")).toBe("");
    expect(node.style.getPropertyValue("--frame-control-size")).toBe("");
    expect(container.querySelector("[class*='refreshGlyph']")).not.toBeInTheDocument();
    expect(container.querySelector("[class*='refreshButton']")?.textContent).toBe("\u21bb");
    expect(node.style.height).toBe(`${defaultWebsiteFrameHeight + defaultWebsiteFrameChromeHeight}px`);
  });

  it("compensates pointer movement for the framework scaled workspace root", async () => {
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    const originalOffsetWidth = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetWidth");
    const originalOffsetHeight = Object.getOwnPropertyDescriptor(HTMLElement.prototype, "offsetHeight");
    Object.defineProperty(HTMLElement.prototype, "offsetWidth", {
      configurable: true,
      get() {
        return typeof this.className === "string" && this.className.includes("canvasArea") ? 1600 : 0;
      }
    });
    Object.defineProperty(HTMLElement.prototype, "offsetHeight", {
      configurable: true,
      get() {
        return typeof this.className === "string" && this.className.includes("canvasArea") ? 1000 : 0;
      }
    });
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (typeof this.className === "string" && this.className.includes("canvasArea")) {
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 1200,
          bottom: 750,
          width: 1200,
          height: 750,
          toJSON: () => ({})
        } as DOMRect;
      }
      return originalRect.call(this);
    };

    try {
      const canvas = makeCanvas({ viewport: { pan: { x: 220, y: 120 }, zoom: 1, size: { width: 1600, height: 1000 } } });
      let nextData = makeData(canvas);
      const { container } = render(
        <CanvasWorkspaceShell
          canvasId="canvas-agency-research"
          data={nextData}
          onDataChange={(value) => {
            nextData = value;
          }}
        />
      );
      const area = container.querySelector("[class*='canvasArea']")!;

      fireEvent.mouseDown(area, { button: 1, clientX: 300, clientY: 260 });
      fireEvent.mouseMove(window, { clientX: 360, clientY: 290 });
      fireEvent.mouseUp(window, { clientX: 360, clientY: 290 });

    await waitFor(() => expect(nextData.canvases[0].viewport.pan).toEqual({ x: 280, y: 150 }));
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
      if (originalOffsetWidth) Object.defineProperty(HTMLElement.prototype, "offsetWidth", originalOffsetWidth);
      if (originalOffsetHeight) Object.defineProperty(HTMLElement.prototype, "offsetHeight", originalOffsetHeight);
    }
  });

  it("persists the MVP middle-mouse pan viewport", async () => {
    const canvas = makeCanvas({ viewport: { pan: { x: 220, y: 120 }, zoom: 1, size: { width: 1200, height: 800 } } });
    let nextData = makeData(canvas);
    const { container } = render(
      <CanvasWorkspaceShell
        canvasId="canvas-agency-research"
        data={nextData}
        onDataChange={(value) => {
          nextData = value;
        }}
      />
    );
    const area = container.querySelector("[class*='canvasArea']")!;

    fireEvent.mouseDown(area, { button: 1, clientX: 300, clientY: 260 });
    fireEvent.mouseMove(window, { clientX: 360, clientY: 290 });
    fireEvent.mouseUp(window, { clientX: 360, clientY: 290 });

    await waitFor(() => expect(nextData.canvases[0].viewport.pan).toEqual({ x: 280, y: 150 }));
  });

  it("matches the MVP toolbar undo and redo flow for added notes", async () => {
    render(<WorkspaceHarness initialData={makeData(makeCanvas({ name: "SaaS Landing Inspiration" }))} />);

    fireEvent.click(screen.getByRole("button", { name: "Add Note" }));
    const noteEditor = await screen.findByPlaceholderText("Write a note...");
    expect(noteEditor).toBeInTheDocument();
    await waitFor(() => expect(noteEditor).toHaveFocus());

    fireEvent.change(noteEditor, { target: { value: "Draft note" } });
    expect(screen.getByText("10 chars")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Undo" }));
    await waitFor(() => expect(screen.queryByPlaceholderText("Write a note...")).not.toBeInTheDocument());

    fireEvent.click(screen.getByRole("button", { name: "Redo" }));
    expect(await screen.findByDisplayValue("Draft note")).toBeInTheDocument();
  });

  it("imports a website from the MVP-style right-click context menu", async () => {
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (typeof this.className === "string" && this.className.includes("canvasArea")) {
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 2000,
          bottom: 1200,
          width: 2000,
          height: 1200,
          toJSON: () => ({})
        } as DOMRect;
      }
      return originalRect.call(this);
    };
    try {
      let nextData = makeData(makeCanvas({ name: "SaaS Landing Inspiration" }));
      const { container } = render(
        <CanvasWorkspaceShell
          canvasId="canvas-agency-research"
          data={nextData}
          onDataChange={(value) => {
            nextData = value;
          }}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Import Website" }));
      const websiteCard = await waitFor(() => container.querySelector("[class*='websiteCard']"));
      fireEvent.contextMenu(websiteCard!, { clientX: 240, clientY: 260 });
      fireEvent.click(screen.getByRole("button", { name: "Import to Canvas" }));

      await waitFor(() => expect(nextData.canvases[0].nodes).toHaveLength(1));
      expect(nextData.canvases[0].nodes[0]).toMatchObject({
        scale: defaultWebsiteFrameScale,
        width: defaultWebsiteFrameWidth,
        height: defaultWebsiteFrameHeight,
        status: "live"
      });
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
    }
  });

  it("imports a dragged website at the dropped canvas coordinates", async () => {
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (typeof this.className === "string" && this.className.includes("canvasArea")) {
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 2000,
          bottom: 1200,
          width: 2000,
          height: 1200,
          toJSON: () => ({})
        } as DOMRect;
      }
      return originalRect.call(this);
    };
    try {
      const { container } = render(<WorkspaceHarness initialData={makeData(makeCanvas({ name: "SaaS Landing Inspiration" }))} />);
      const area = container.querySelector("[class*='canvasArea']")!;

      const drop = createEvent.drop(area);
      Object.defineProperty(drop, "clientX", { value: 1000 });
      Object.defineProperty(drop, "clientY", { value: 600 });
      Object.defineProperty(drop, "dataTransfer", {
        value: {
          getData: (type: string) => (type === "text/plain" ? "link-makemepulse" : "")
        }
      });
      fireEvent(area, drop);

      await waitFor(() => expect(container.querySelectorAll("[class*='frameMain']")).toHaveLength(1));
      const node = container.querySelector("[class*='node']") as HTMLElement;
      expect(node.style.left).toBe("1560px");
      expect(node.style.top).toBe("960px");
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
    }
  });

  it("registers the MVP ctrl-wheel zoom handler as a non-passive native listener", () => {
    const originalAddEventListener = HTMLElement.prototype.addEventListener;
    const wheelOptions: AddEventListenerOptions[] = [];
    HTMLElement.prototype.addEventListener = function addEventListener(type: string, listener: EventListenerOrEventListenerObject, options?: boolean | AddEventListenerOptions) {
      if (type === "wheel" && typeof options === "object" && options) wheelOptions.push(options);
      return originalAddEventListener.call(this, type, listener, options);
    };

    try {
      render(<WorkspaceHarness initialData={makeData(makeCanvas({ name: "SaaS Landing Inspiration" }))} />);
    } finally {
      HTMLElement.prototype.addEventListener = originalAddEventListener;
    }

    expect(wheelOptions.some((options) => options.passive === false)).toBe(true);
  });

  it("clamps ctrl-wheel canvas zoom symmetrically around the default 50 percent zoom", async () => {
    const restoreRect = installVisibleCanvasAreaRect();
    let nextData = makeData(makeCanvas());
    const { container } = render(
      <CanvasWorkspaceShell
        canvasId="canvas-agency-research"
        data={nextData}
        onDataChange={(value) => {
          nextData = value;
        }}
      />
    );
    const area = container.querySelector("[class*='canvasArea']")!;

    try {
      for (let index = 0; index < 40; index += 1) {
        fireEvent.wheel(area, { ctrlKey: true, deltaY: -100, clientX: 800, clientY: 500 });
      }
      await waitFor(() => expect(nextData.canvases[0].viewport.zoom).toBe(1));

      for (let index = 0; index < 80; index += 1) {
        fireEvent.wheel(area, { ctrlKey: true, deltaY: 100, clientX: 800, clientY: 500 });
      }
      await waitFor(() => expect(nextData.canvases[0].viewport.zoom).toBe(0.25));
    } finally {
      restoreRect();
    }
  });

  it("keeps the resize handle above the activation shield so non-top frames can still be enlarged", () => {
    const css = readFileSync(join(process.cwd(), "components/canvas/canvas.module.css"), "utf8");
    const resizeBlock = css.match(/\.resizeHandle\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const shieldBlock = css.match(/\.nodeActivationShield\s*\{(?<body>[^}]+)\}/)?.groups?.body ?? "";
    const resizeZ = Number(resizeBlock.match(/z-index:\s*(\d+)/)?.[1]);
    const shieldZ = Number(shieldBlock.match(/z-index:\s*(\d+)/)?.[1]);

    expect(resizeZ).toBeGreaterThan(shieldZ);
  });

  it("resizes a website frame from its handle even when another node is above it", async () => {
    const canvas = makeCanvas({
      nodes: [
        {
          id: "node-website-1",
          canvasId: "canvas-agency-research",
          type: "website",
          linkId: "link-makemepulse",
          sourceFolderId: "agency",
          content: "makemepulse.com",
          x: 120,
          y: 140,
          width: 403,
          height: 252,
          scale: 0.28,
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
          content: "Top note",
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
    });
    let nextData = makeData(canvas);
    const { container } = render(
      <CanvasWorkspaceShell
        canvasId="canvas-agency-research"
        data={nextData}
        onDataChange={(value) => {
          nextData = value;
        }}
      />
    );
    const handle = container.querySelector("[class*='resizeHandle']")!;

    fireEvent.pointerDown(handle, { button: 0, clientX: 520, clientY: 430 });
    fireEvent.pointerMove(window, { clientX: 760, clientY: 450 });
    fireEvent.pointerUp(window, { clientX: 760, clientY: 450 });

    await waitFor(() => expect(nextData.canvases[0].nodes[0].width).toBeGreaterThan(403));
    expect(nextData.canvases[0].nodes[0].height).toBeGreaterThan(252);
  });

  it("refreshes live iframes only after device changes or completed resize", async () => {
    const restoreRect = installVisibleCanvasAreaRect();
    const canvas = makeCanvas({
      nodes: [
        {
          id: "node-website-1",
          canvasId: "canvas-agency-research",
          type: "website",
          linkId: "link-makemepulse",
          sourceFolderId: "agency",
          content: "makemepulse.com",
          x: 120,
          y: 140,
          width: 403,
          height: 252,
          scale: 0.28,
          deviceView: "desktop",
          status: "live",
          interactionMode: "canvas",
          iframeKey: 0,
          zIndex: 1,
          createdAt: now,
          updatedAt: now
        }
      ]
    });
    let nextData = makeData(canvas);
    try {
      const { container } = render(
        <CanvasWorkspaceShell
          canvasId="canvas-agency-research"
          data={nextData}
          onDataChange={(value) => {
            nextData = value;
          }}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Add Note" }));
      await waitFor(() => expect(nextData.canvases[0].nodes).toHaveLength(2));
      expect(nextData.canvases[0].nodes[0].iframeKey).toBe(0);

      fireEvent.click(screen.getByRole("button", { name: "Undo" }));
      await waitFor(() => expect(nextData.canvases[0].nodes).toHaveLength(1));
      expect(nextData.canvases[0].nodes[0].iframeKey).toBe(0);

      fireEvent.click(screen.getByRole("button", { name: "Redo" }));
      await waitFor(() => expect(nextData.canvases[0].nodes).toHaveLength(2));
      expect(nextData.canvases[0].nodes[0].iframeKey).toBe(0);

      fireEvent.click(screen.getByRole("button", { name: "tablet" }));
      await waitFor(() => expect(nextData.canvases[0].nodes[0].iframeKey).toBe(1));

      const handle = container.querySelector("[class*='resizeHandle']")!;
      fireEvent.pointerDown(handle, { button: 0, clientX: 520, clientY: 430 });
      fireEvent.pointerMove(window, { clientX: 660, clientY: 450 });
      fireEvent.pointerUp(window, { clientX: 660, clientY: 450 });

      await waitFor(() => expect(nextData.canvases[0].nodes[0].iframeKey).toBe(2));
      expect(nextData.canvases[0].nodes[0].width).toBeGreaterThan(287);
    } finally {
      restoreRect();
    }
  });

  it("does not refresh live iframes for import searches or unrelated deletes", async () => {
    const restoreRect = installVisibleCanvasAreaRect();
    const canvas = makeCanvas({
      nodes: [
        {
          id: "node-website-keep",
          canvasId: "canvas-agency-research",
          type: "website",
          linkId: "link-makemepulse",
          sourceFolderId: "agency",
          content: "makemepulse.com",
          x: 120,
          y: 140,
          width: 403,
          height: 252,
          scale: 0.28,
          deviceView: "desktop",
          status: "live",
          interactionMode: "canvas",
          iframeKey: 0,
          zIndex: 1,
          createdAt: now,
          updatedAt: now
        },
        {
          id: "node-website-delete",
          canvasId: "canvas-agency-research",
          type: "website",
          linkId: "link-studionuts",
          sourceFolderId: "agency",
          content: "studionuts.com.br",
          x: 560,
          y: 140,
          width: 403,
          height: 252,
          scale: 0.28,
          deviceView: "desktop",
          status: "live",
          interactionMode: "canvas",
          iframeKey: 0,
          zIndex: 2,
          createdAt: now,
          updatedAt: now
        },
        {
          id: "node-note-delete",
          canvasId: "canvas-agency-research",
          type: "note",
          linkId: null,
          sourceFolderId: null,
          content: "Delete me",
          x: 980,
          y: 140,
          width: 260,
          height: 150,
          scale: null,
          deviceView: "desktop",
          zIndex: 3,
          createdAt: now,
          updatedAt: now
        }
      ]
    });
    let nextData = makeData(canvas);
    nextData = {
      ...nextData,
      folders: [...nextData.folders, makeFolder("portfolio", "Portfolio")],
      links: [...nextData.links, makeLink("link-studionuts", "studionuts.com.br", ["agency"])]
    };
    const keepNode = () => nextData.canvases[0].nodes.find((node) => node.id === "node-website-keep")!;

    try {
      const { container } = render(
        <CanvasWorkspaceShell
          canvasId="canvas-agency-research"
          data={nextData}
          onDataChange={(value) => {
            nextData = value;
          }}
        />
      );

      fireEvent.click(screen.getByRole("button", { name: "Import Website" }));
      fireEvent.change(screen.getByPlaceholderText("Search folders..."), { target: { value: "port" } });
      expect(keepNode().iframeKey).toBe(0);

      fireEvent.change(screen.getByPlaceholderText("Search websites..."), { target: { value: "studio" } });
      expect(keepNode().iframeKey).toBe(0);

      fireEvent.change(screen.getByPlaceholderText("Search folders..."), { target: { value: "" } });
      await waitFor(() => expect(screen.getByRole("button", { name: /Portfolio/ })).toBeInTheDocument());
      fireEvent.click(screen.getByRole("button", { name: /Portfolio/ }));
      expect(keepNode().iframeKey).toBe(0);

      fireEvent.click(screen.getByRole("button", { name: "Delete note" }));
      await waitFor(() => expect(nextData.canvases[0].nodes.some((node) => node.id === "node-note-delete")).toBe(false));
      expect(keepNode().iframeKey).toBe(0);

      const deletePreviewButtons = container.querySelectorAll("button[aria-label='Delete preview']");
      fireEvent.click(deletePreviewButtons[1]);
      await waitFor(() => expect(nextData.canvases[0].nodes.some((node) => node.id === "node-website-delete")).toBe(false));
      expect(keepNode().iframeKey).toBe(0);
    } finally {
      restoreRect();
    }
  });

  it("applies the MVP glass blur at runtime on the workspace topbar and toolbar", () => {
    const { container } = render(<WorkspaceHarness initialData={makeData(makeCanvas({ name: "SaaS Landing Inspiration" }))} />);
    const topbar = container.querySelector("header") as HTMLElement;
    const toolbar = screen.getByRole("button", { name: "Import Website" }).parentElement as HTMLElement;

    expect(topbar.style.backdropFilter).toBe("blur(18px) saturate(125%)");
    expect(toolbar.style.backdropFilter).toBe("blur(18px) saturate(125%)");
  });

  it("clears the selected node when the canvas world background is clicked", () => {
    const canvas = makeCanvas({
      nodes: [
        {
          id: "node-note-1",
          canvasId: "canvas-agency-research",
          type: "note",
          linkId: null,
          sourceFolderId: null,
          content: "Keep me",
          x: 120,
          y: 140,
          width: 260,
          height: 150,
          scale: null,
          deviceView: "desktop",
          zIndex: 1,
          createdAt: now,
          updatedAt: now
        }
      ]
    });
    let nextData = makeData(canvas);
    const { container } = render(
      <CanvasWorkspaceShell
        canvasId="canvas-agency-research"
        data={nextData}
        onDataChange={(value) => {
          nextData = value;
        }}
      />
    );

    fireEvent.mouseDown(container.querySelector("[class*='noteShell']")!, { button: 0 });
    fireEvent.mouseDown(container.querySelector("[class*='canvasWorld']")!, { button: 0 });
    fireEvent.keyDown(window, { key: "Delete" });

    expect(nextData.canvases[0].nodes).toHaveLength(1);
    expect(nextData.canvases[0].nodes[0].content).toBe("Keep me");
  });

  it("promotes a screenshot website frame to live when entering preview", () => {
    const restoreRect = installVisibleCanvasAreaRect();
    const canvas = makeCanvas({
      nodes: [
        {
          id: "node-website-1",
          canvasId: "canvas-agency-research",
          type: "website",
          linkId: "link-makemepulse",
          sourceFolderId: "agency",
          content: "makemepulse.com",
          x: 120,
          y: 140,
          width: 403,
          height: 252,
          scale: 0.28,
          deviceView: "desktop",
          status: "screenshot",
          interactionMode: "canvas",
          iframeKey: 0,
          zIndex: 1,
          createdAt: now,
          updatedAt: now
        }
      ]
    });
    let nextData = makeData(canvas);
    try {
      const { container } = render(
        <CanvasWorkspaceShell
          canvasId="canvas-agency-research"
          data={nextData}
          onDataChange={(value) => {
            nextData = value;
          }}
        />
      );

      fireEvent.doubleClick(container.querySelector("[class*='previewHitbox']")!);

      expect(nextData.canvases[0].nodes[0]).toMatchObject({
        status: "live",
        interactionMode: "preview"
      });
    } finally {
      restoreRect();
    }
  });

  it("keeps at most five visible website frames live", async () => {
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (typeof this.className === "string" && this.className.includes("canvasArea")) {
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 2000,
          bottom: 1200,
          width: 2000,
          height: 1200,
          toJSON: () => ({})
        } as DOMRect;
      }
      return originalRect.call(this);
    };

    const canvas = makeCanvas({
      nodes: Array.from({ length: 6 }, (_, index) => ({
        id: `node-website-${index}`,
        canvasId: "canvas-agency-research",
        type: "website" as const,
        linkId: "link-makemepulse",
        sourceFolderId: "agency",
        content: "makemepulse.com",
        x: 20 + index * 20,
        y: 40 + index * 20,
        width: 403,
        height: 252,
        scale: 0.28,
        deviceView: "desktop" as const,
        status: "live" as const,
        interactionMode: "canvas" as const,
        iframeKey: 0,
        zIndex: index + 1,
        createdAt: now,
        updatedAt: now
      }))
    });
    let nextData = makeData(canvas);

    try {
      render(
        <CanvasWorkspaceShell
          canvasId="canvas-agency-research"
          data={nextData}
          onDataChange={(value) => {
            nextData = value;
          }}
        />
      );

      await waitFor(() => {
        expect(nextData.canvases[0].nodes.filter((node) => node.status === "live")).toHaveLength(5);
      });
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
    }
  });

  it("falls back to screenshot mode when a live iframe reports an error", () => {
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (typeof this.className === "string" && this.className.includes("canvasArea")) {
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 2000,
          bottom: 1200,
          width: 2000,
          height: 1200,
          toJSON: () => ({})
        } as DOMRect;
      }
      return originalRect.call(this);
    };
    const canvas = makeCanvas({
      nodes: [
        {
          id: "node-website-1",
          canvasId: "canvas-agency-research",
          type: "website",
          linkId: "link-makemepulse",
          sourceFolderId: "agency",
          content: "makemepulse.com",
          x: 120,
          y: 140,
          width: 403,
          height: 252,
          scale: 0.28,
          deviceView: "desktop",
          status: "live",
          interactionMode: "preview",
          iframeKey: 0,
          zIndex: 1,
          createdAt: now,
          updatedAt: now
        }
      ]
    });
    let nextData = makeData(canvas);
    try {
      const { container } = render(
        <CanvasWorkspaceShell
          canvasId="canvas-agency-research"
          data={nextData}
          onDataChange={(value) => {
            nextData = value;
          }}
        />
      );

      fireEvent.error(container.querySelector("iframe")!);

      expect(nextData.canvases[0].nodes[0]).toMatchObject({
        status: "screenshot",
        interactionMode: "canvas"
      });
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
    }
  });

  it("does not auto-promote screenshot frames that failed to load", async () => {
    const originalRect = HTMLElement.prototype.getBoundingClientRect;
    HTMLElement.prototype.getBoundingClientRect = function getBoundingClientRect() {
      if (typeof this.className === "string" && this.className.includes("canvasArea")) {
        return {
          x: 0,
          y: 0,
          left: 0,
          top: 0,
          right: 2000,
          bottom: 1200,
          width: 2000,
          height: 1200,
          toJSON: () => ({})
        } as DOMRect;
      }
      return originalRect.call(this);
    };
    const canvas = makeCanvas({
      nodes: [
        {
          id: "node-website-1",
          canvasId: "canvas-agency-research",
          type: "website",
          linkId: "link-makemepulse",
          sourceFolderId: "agency",
          content: "makemepulse.com",
          x: 120,
          y: 140,
          width: 403,
          height: 252,
          scale: 0.28,
          deviceView: "desktop",
          status: "screenshot",
          interactionMode: "canvas",
          iframeKey: 0,
          loadFailed: true,
          zIndex: 1,
          createdAt: now,
          updatedAt: now
        } as CanvasNodeData
      ]
    });
    let nextData = makeData(canvas);
    try {
      render(
        <CanvasWorkspaceShell
          canvasId="canvas-agency-research"
          data={nextData}
          onDataChange={(value) => {
            nextData = value;
          }}
        />
      );

      await new Promise((resolve) => window.setTimeout(resolve, 0));

      expect(nextData.canvases[0].nodes[0]).toMatchObject({
        status: "screenshot",
        loadFailed: true
      });
    } finally {
      HTMLElement.prototype.getBoundingClientRect = originalRect;
    }
  });
});
